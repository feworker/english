import { useEffect, useRef, useState } from "react";
import { selectWords, gradeAnswers } from "../../js/dictation-core.js";
import { DictationSpeaker } from "../../js/dictation-speech.js";
import { t } from "../../js/dictation-i18n.js";
import type { Library, Options, Row, Word } from "../types";

export function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
export const defaultOptions: Options = {
  topic: "",
  amount: "20",
  order: "random",
  mode: "chinese",
  chineseSpeech: true,
  auto: true,
  interval: 8,
  repeat: 2,
  rate: 1,
};
function initialOptions(library?: Library): Options {
  const result = { ...defaultOptions };
  try {
    const saved = JSON.parse(read("english-dictation-settings") || "{}");
    for (const [key, allowed] of Object.entries({
      amount: ["10", "20", "50", "all"],
      order: ["random", "original"],
      mode: ["chinese", "audio"],
      interval: [3, 5, 8, 10, 15, 20, 30],
      repeat: [1, 2, 3],
      rate: [0.8, 1, 1.2],
    })) {
      const candidate = ["interval", "repeat", "rate"].includes(key)
        ? Number(saved[key])
        : saved[key];
      if ((allowed as (string | number)[]).includes(candidate))
        Object.assign(result, { [key]: candidate });
    }
    for (const key of ["auto", "chineseSpeech"] as const) {
      const candidate = saved[key] ?? (key === "chineseSpeech" ? saved["chinese-speech"] : undefined);
      if (typeof candidate === "boolean") result[key] = candidate;
    }
    if (library?.topics.some((topic) => topic.id === saved.topic))
      result.topic = saved.topic;
  } catch {}
  const topic = new URLSearchParams(location.search).get("topic");
  if (library?.topics.some((item) => item.id === topic)) result.topic = topic!;
  return result;
}

type Phase = "setup" | "running" | "paused" | "results";
export function useDictation(library?: Library) {
  const [options, setOptions] = useState(() => initialOptions(library));
  const [phase, setPhase] = useState<Phase>("setup");
  const [words, setWords] = useState<Word[]>([]);
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [timerText, setTimerText] = useState("");
  const [remaining, setRemaining] = useState(1);
  const [retryRound, setRetryRound] = useState(false);
  const phaseRef = useRef<Phase>("setup");
  const round = useRef({
    words: [] as Word[],
    answers: [] as string[],
    position: 0,
    options,
  });
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const speaker = useRef<DictationSpeaker>();
  const inputRef = useRef<HTMLInputElement>(null);
  if (!speaker.current) speaker.current = new DictationSpeaker(setStatus);
  const active = phase === "running" || phase === "paused";
  const changePhase = (value: Phase) => {
    phaseRef.current = value;
    setPhase(value);
  };
  function cancel() {
    generation.current++;
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
    speaker.current!.stop();
  }
  function updateAnswer(value: string) {
    round.current.answers[round.current.position] = value;
    setAnswer(value);
  }
  function focus() {
    requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true }),
    );
  }
  function hasSpeech() {
    return (
      round.current.options.mode === "audio" ||
      round.current.options.chineseSpeech
    );
  }
  function pause() {
    if (phaseRef.current !== "running") return;
    cancel();
    changePhase("paused");
    setTimerText(t("state.pauseTimer"));
    setStatus(t("state.paused"));
  }
  function finish() {
    if (!["running", "paused"].includes(phaseRef.current)) return;
    cancel();
    const current = round.current;
    setRows(
      gradeAnswers(
        current.words.slice(0, current.position + 1),
        current.answers,
      ) as Row[],
    );
    changePhase("results");
  }
  function advance() {
    if (!["running", "paused"].includes(phaseRef.current)) return;
    cancel();
    if (round.current.position === round.current.words.length - 1) {
      finish();
      return;
    }
    round.current.position++;
    present();
  }
  function countdown() {
    const current = round.current;
    if (!current.options.auto) {
      setTimerText(t("state.manualTimer"));
      return;
    }
    const total = current.options.interval * 1000;
    const deadline = performance.now() + total;
    const tick = () => {
      const time = Math.max(0, deadline - performance.now());
      setRemaining(time / total);
      setTimerText(
        t(
          current.position === current.words.length - 1
            ? "state.finishTimer"
            : "state.nextTimer",
          { seconds: Math.ceil(time / 1000) },
        ),
      );
      if (!time) advance();
    };
    timer.current = setInterval(tick, 100);
    tick();
  }
  async function play() {
    cancel();
    const currentGeneration = generation.current;
    changePhase("running");
    setRemaining(1);
    setTimerText(t(hasSpeech() ? "state.playing" : "state.ready"));
    try {
      const current = round.current;
      if (hasSpeech())
        await speaker.current!.speak(
          current.options.mode === "audio"
            ? current.words[current.position].spell
            : current.words[current.position].cn,
          current.options,
        );
      if (
        currentGeneration !== generation.current ||
        phaseRef.current !== "running"
      )
        return;
      setStatus(t(hasSpeech() ? "speech.done" : "speech.noSpeech"));
      countdown();
    } catch (error) {
      if (currentGeneration !== generation.current) return;
      pause();
      setStatus(
        t("speech.errorPaused", {
          message:
            error instanceof Error ? error.message : t("speech.genericError"),
        }),
      );
    }
  }
  function present() {
    cancel();
    setPosition(round.current.position);
    setAnswer(round.current.answers[round.current.position]);
    setStatus("");
    focus();
    void play();
  }
  function begin(selected?: Word[]) {
    cancel();
    const selectedWords =
      selected || selectWords(library?.words || [], options);
    if (!selectedWords.length) {
      setStatus(t("error.none"));
      return;
    }
    round.current = {
      words: selectedWords,
      answers: selectedWords.map(() => ""),
      position: 0,
      options: { ...options },
    };
    setWords(selectedWords);
    setRows([]);
    setRetryRound(Boolean(selected));
    present();
  }
  function reset() {
    cancel();
    changePhase("setup");
    setRows([]);
    setStatus("");
  }
  function download() {
    const lines = [
      t("result.exportTitle"),
      ...rows.map((row, index) =>
        t("result.exportRow", {
          number: index + 1,
          chinese: row.word.cn,
          english: row.word.spell,
          answer: row.answer || t("result.blank"),
          result: t(row.correct ? "result.correct" : "result.wrong"),
        }),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + lines.join("\n")], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = t("result.filename");
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(t("result.downloaded"));
  }
  useEffect(() => {
    store("english-dictation-settings", JSON.stringify(options));
  }, [options]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) pause();
    };
    const leave = () => {
      pause();
      cancel();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    window.addEventListener("beforeprint", pause);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("beforeprint", pause);
      cancel();
    };
  }, []);
  return {
    options,
    setOptions,
    phase,
    active,
    words,
    position,
    answer,
    updateAnswer,
    rows,
    status,
    timerText,
    remaining,
    retryRound,
    inputRef,
    begin,
    finish,
    advance,
    pause,
    play: () => {
      focus();
      void play();
    },
    reset,
    download,
    hasSpeech: options.mode === "audio" || options.chineseSpeech,
  };
}
