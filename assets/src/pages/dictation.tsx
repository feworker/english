import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  CircleHelp,
  Download,
  Headphones,
  Info,
  Moon,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Sun,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { read, store, useDictation } from "@/hooks/use-dictation";
import type { Options } from "@/types";
import { locale, number, t } from "../../js/dictation-i18n.js";

function SettingSelect({
  id,
  label,
  value,
  disabled,
  items,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} data-value={value}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              data-value={item.value}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function SettingCheck({
  id,
  children,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  children: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Label htmlFor={id} data-touch className="flex min-h-8 cursor-pointer items-center gap-2 leading-5">
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(value) => onChange(value === true)} />
      <span>{children}</span>
    </Label>
  );
}

export function DictationPage() {
  const library = window.LIBRARY;
  const practice = useDictation(library);
  const { options, phase } = practice;
  const [dark, setDark] = useState(() => read("english-theme") === "dark");
  const exerciseRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    store("english-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t("app.title");
  }, []);
  useEffect(() => {
    if (phase === "results") {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({ block: "nearest" });
    } else if (phase === "running")
      exerciseRef.current?.scrollIntoView({ block: "nearest" });
  }, [phase]);
  const pool =
    library?.words.filter(
      (word) => !options.topic || word.topic === options.topic,
    ) || [];
  const count =
    options.amount === "all"
      ? pool.length
      : Math.min(pool.length, Number(options.amount));
  const update = <K extends keyof Options>(key: K, value: Options[K]) =>
    practice.setOptions({ ...options, [key]: value });
  const selectProps = (key: keyof Options) => ({
    id: key === "chineseSpeech" ? "chinese-speech" : key,
    value: String(options[key]),
    onChange: (value: string) =>
      update(
        key,
        typeof options[key] === "number" ? Number(value) : (value as never),
      ),
    disabled: practice.active,
  });
  const choices = (values: number[], key: string) =>
    values.map((value) => ({
      value: String(value),
      label: t(key, { count: value }),
    }));
  const current = practice.words[practice.position];
  const topicName = practice.retryRound
    ? t("exercise.mistakes")
    : library?.topics.find((topic) => topic.id === options.topic)?.name ||
      t("settings.all");
  const correct = practice.rows.filter((row) => row.correct).length;
  const mistakes = practice.rows.filter((row) => !row.correct);
  const score = practice.rows.length
    ? Math.round((correct / practice.rows.length) * 100)
    : 0;
  const canLoad = Boolean(library?.words?.length && library?.topics?.length);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3"
      >
        {t("app.skip")}
      </a>
      <header className="print-hidden border-b bg-canvas-top">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
          <a
            className="flex min-h-9 items-center gap-3 font-medium"
            href="./index.html"
            data-touch
          >
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
            <span>
              {t("app.brand")}
              <small className="mt-1 block text-xs font-normal text-muted-foreground">
                {t("app.subtitle")}
              </small>
            </span>
          </a>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="./index.html" data-touch>
                <ArrowLeft aria-hidden="true" />
                {t("button.back")}
              </a>
            </Button>
            <Button
              id="theme"
              variant="outline"
              size="icon"
              aria-label={t(dark ? "theme.light" : "theme.dark")}
              aria-pressed={dark}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="w-full space-y-4 px-4 py-4 md:px-6 lg:px-8">
        <nav
          className="d-nav print-hidden flex gap-4 border-b"
          aria-label={t("nav.label")}
        >
          {[
            ["./index.html", "nav.words"],
            ["./index.html#lessons", "nav.course"],
            ["./dictation.html", "nav.dictation"],
          ].map(([href, key]) => (
            <a
              key={key}
              data-touch
              className={cn(
                "flex min-h-9 items-center border-b-2 px-1 text-sm",
                key === "nav.dictation"
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              href={href}
              aria-current={key === "nav.dictation" ? "page" : undefined}
            >
              {t(key)}
            </a>
          ))}
        </nav>
        <div className="print-hidden flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("app.heading")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("app.intro")}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("settings.total", {
              words: number(library?.words.length || 0),
              topics: number(library?.topics.length || 0),
            })}
          </p>
        </div>
        {!canLoad ? (
          <Alert variant="destructive" id="load-error">
            <Info aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              {t("error.load")}
              <Button variant="outline" onClick={() => location.reload()}>
                {t("error.reload")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div data-print-layout className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <Card
              className={cn(
                "print-hidden",
                phase !== "setup" && "hidden lg:block",
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  {t("settings.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <fieldset
                  disabled={practice.active}
                  id="settings"
                  className="min-w-0 space-y-3"
                >
                  <legend className="sr-only">{t("settings.title")}</legend>
                  <div>
                    <SettingSelect
                      {...selectProps("topic")}
                      value={options.topic || "all"}
                      onChange={(value) =>
                        update("topic", value === "all" ? "" : value)
                      }
                      label={t("settings.topic")}
                      items={[
                        { value: "all", label: t("settings.all") },
                        ...library!.topics.map((topic) => ({
                          value: topic.id,
                          label: topic.name,
                        })),
                      ]}
                    />
                    <p
                      className="mt-2 text-xs text-muted-foreground"
                      id="pool-count"
                    >
                      {t("settings.pool", {
                        pool: number(pool.length),
                        count: number(count),
                      })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SettingSelect
                      {...selectProps("amount")}
                      label={t("settings.amount")}
                      items={[
                        ...choices([10, 20, 50], "settings.amountOption"),
                        { value: "all", label: t("settings.allAmount") },
                      ]}
                    />
                    <SettingSelect
                      {...selectProps("order")}
                      label={t("settings.order")}
                      items={[
                        { value: "random", label: t("settings.orderRandom") },
                        {
                          value: "original",
                          label: t("settings.orderOriginal"),
                        },
                      ]}
                    />
                  </div>
                  <SettingSelect
                    {...selectProps("mode")}
                    label={t("settings.mode")}
                    items={[
                      { value: "chinese", label: t("settings.modeChinese") },
                      { value: "audio", label: t("settings.modeAudio") },
                    ]}
                  />
                  {options.mode === "chinese" && (
                    <SettingCheck
                      id="chinese-speech"
                      checked={options.chineseSpeech}
                      disabled={practice.active}
                      onChange={(value) => update("chineseSpeech", value)}
                    >
                      {t("settings.chineseSpeech")}
                    </SettingCheck>
                  )}
                  <div className="space-y-3 border-t pt-3">
                    <SettingCheck
                      id="auto"
                      checked={options.auto}
                      disabled={practice.active}
                      onChange={(value) => update("auto", value)}
                    >
                      {t("settings.auto")}
                    </SettingCheck>
                    <div className="grid grid-cols-2 gap-3">
                      <SettingSelect
                        {...selectProps("interval")}
                        disabled={practice.active || !options.auto}
                        label={t("settings.interval")}
                        items={choices(
                          [3, 5, 8, 10, 15, 20, 30],
                          "settings.seconds",
                        )}
                      />
                      <SettingSelect
                        {...selectProps("repeat")}
                        disabled={practice.active || !practice.hasSpeech}
                        label={t("settings.repeat")}
                        items={choices([1, 2, 3], "settings.repeatOption")}
                      />
                    </div>
                    <SettingSelect
                      {...selectProps("rate")}
                      disabled={practice.active || !practice.hasSpeech}
                      label={t("settings.rate")}
                      items={[
                        { value: "0.8", label: t("settings.rateSlow") },
                        { value: "1", label: t("settings.rateNormal") },
                        { value: "1.2", label: t("settings.rateFast") },
                      ]}
                    />
                  </div>
                </fieldset>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("settings.hint")}
                </p>
                <Button
                  id="start"
                  className="w-full"
                  disabled={practice.active || !pool.length}
                  onClick={() => practice.begin()}
                >
                  <Play aria-hidden="true" />
                  {t(practice.active ? "button.startBusy" : "button.start")}
                </Button>
                <p id="speech-source" className="text-xs text-muted-foreground">
                  {t(
                    window.ENGLISH_TTS_ENDPOINT
                      ? "speech.microsoft"
                      : "speech.browser",
                  )}
                </p>
              </CardContent>
            </Card>
            <div className="min-w-0 space-y-3">
              {phase === "setup" && (
                <Card id="welcome" className="print-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <NotebookPen
                        className="size-5 text-primary"
                        aria-hidden="true"
                      />
                      {t("empty.title")}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t("empty.body")}
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-4 border-t pt-4 md:grid-cols-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="space-y-2">
                        <span className="text-xs font-medium text-primary">
                          {number(step)}
                        </span>
                        <h2 className="font-medium">
                          {t(`empty.step${step}`)}
                        </h2>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {t(`empty.step${step}body`)}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {practice.active && (
                <Card
                  ref={exerciseRef}
                  id="exercise"
                  className="print-hidden"
                  aria-labelledby="exercise-title"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          id="round-topic"
                          className="mb-1 text-xs text-muted-foreground"
                        >
                          {topicName}
                        </p>
                        <CardTitle id="exercise-title" className="text-lg">
                          {t(
                            options.mode === "audio"
                              ? "exercise.audio"
                              : "exercise.chinese",
                          )}
                        </CardTitle>
                      </div>
                      <span
                        id="position"
                        className="text-sm tabular-nums text-primary"
                      >
                        {t("exercise.count", {
                          current: practice.position + 1,
                          total: practice.words.length,
                        })}
                      </span>
                    </div>
                    <Progress
                      id="progress"
                      value={practice.position}
                      max={practice.words.length}
                      aria-label={t("exercise.progress")}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md bg-secondary p-6 text-center">
                      <p
                        id="prompt-label"
                        className="text-xs text-muted-foreground"
                      >
                        {t(
                          options.mode === "audio"
                            ? "exercise.audioLabel"
                            : "exercise.chineseLabel",
                        )}
                      </p>
                      <div
                        id="prompt"
                        className="my-4 flex min-h-9 items-center justify-center text-3xl font-semibold text-primary"
                      >
                        {options.mode === "audio" ? (
                          <Headphones className="size-8" aria-hidden="true" />
                        ) : (
                          current?.cn
                        )}
                      </div>
                      <p
                        id="prompt-tip"
                        className="text-xs text-muted-foreground"
                      >
                        {t(
                          options.mode === "audio"
                            ? "exercise.audioTip"
                            : "exercise.chineseTip",
                        )}
                      </p>
                    </div>
                    <form
                      id="answer-form"
                      className="space-y-3"
                      autoComplete="off"
                      onSubmit={(event) => {
                        event.preventDefault();
                        practice.advance();
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="answer">{t("answer.label")}</Label>
                        <Input
                          id="answer"
                          ref={practice.inputRef}
                          variant="answer"
                          value={practice.answer}
                          onChange={(event) =>
                            practice.updateAnswer(event.target.value)
                          }
                          placeholder={t("answer.placeholder")}
                          autoCapitalize="off"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          aria-describedby="answer-hint"
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              event.nativeEvent.isComposing
                            )
                              event.preventDefault();
                          }}
                        />
                        <p
                          id="answer-hint"
                          className="text-xs text-muted-foreground"
                        >
                          {t("answer.hint")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          id="replay"
                          type="button"
                          variant="outline"
                          disabled={!practice.hasSpeech}
                          onClick={practice.play}
                        >
                          <RotateCcw aria-hidden="true" />
                          {t("button.replay")}
                        </Button>
                        <Button
                          id="pause"
                          type="button"
                          variant="outline"
                          aria-pressed={phase === "paused"}
                          onClick={
                            phase === "paused" ? practice.play : practice.pause
                          }
                        >
                          {phase === "paused" ? (
                            <Play aria-hidden="true" />
                          ) : (
                            <Pause aria-hidden="true" />
                          )}
                          {t(
                            phase === "paused"
                              ? "button.resume"
                              : "button.pause",
                          )}
                        </Button>
                        <Button id="next" type="submit" className="ms-auto">
                          {t(
                            practice.position === practice.words.length - 1
                              ? "button.finish"
                              : "button.next",
                          )}
                          <ArrowRight aria-hidden="true" />
                        </Button>
                      </div>
                    </form>
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          id="timer-text"
                          className="text-xs text-muted-foreground"
                        >
                          {practice.timerText}
                        </span>
                        <Button
                          id="finish"
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={practice.finish}
                        >
                          {t("button.finish")}
                        </Button>
                      </div>
                      <Progress
                        value={practice.remaining * 100}
                        size="compact"
                        aria-label={practice.timerText}
                      />
                    </div>
                    <p
                      id="playback-status"
                      className="min-h-8 text-xs text-muted-foreground"
                      role="status"
                      aria-live="polite"
                    >
                      {practice.status}
                    </p>
                  </CardContent>
                </Card>
              )}
              {phase === "results" && (
                <Card
                  id="results"
                  data-print-results
                  aria-labelledby="results-title"
                >
                  <CardHeader>
                    <h2
                      id="results-title"
                      ref={resultRef}
                      tabIndex={-1}
                      className="text-lg font-semibold"
                    >
                      {t("result.title")}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 border-y py-3">
                      <strong
                        id="score"
                        className="text-3xl font-semibold tabular-nums text-primary"
                      >
                        {number(score)}%
                      </strong>
                      <p
                        id="score-detail"
                        className="text-sm text-muted-foreground"
                      >
                        {t("result.grade", {
                          correct,
                          total: practice.rows.length,
                          wrong: mistakes.length,
                        })}
                      </p>
                    </div>
                    {practice.rows.length < practice.words.length && (
                      <p className="text-xs text-muted-foreground">
                        {t("result.early", {
                          remaining:
                            practice.words.length - practice.rows.length,
                        })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("result.hint")}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="print-hidden flex flex-wrap gap-2">
                      <Button
                        id="retry"
                        disabled={!mistakes.length}
                        onClick={() =>
                          practice.begin(mistakes.map((row) => row.word))
                        }
                      >
                        <RotateCcw aria-hidden="true" />
                        {t(mistakes.length ? "result.retry" : "result.full", {
                          count: mistakes.length,
                        })}
                      </Button>
                      <Button
                        id="reset"
                        variant="outline"
                        onClick={practice.reset}
                      >
                        {t("result.reset")}
                      </Button>
                      <Button
                        id="download"
                        variant="outline"
                        onClick={practice.download}
                      >
                        <Download aria-hidden="true" />
                        {t("result.download")}
                      </Button>
                    </div>
                    <Table scrollLabel={t("result.caption")}>
                      <caption className="sr-only">
                        {t("result.caption")}
                      </caption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-2/5">
                            {t("result.prompt")}
                          </TableHead>
                          <TableHead className="w-2/5">
                            {t("result.mine")}
                          </TableHead>
                          <TableHead>{t("result.status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody id="result-rows">
                        {practice.rows.map((row, index) => (
                          <TableRow key={row.word.id + index}>
                            <TableCell>
                              <strong className="block font-medium text-primary">
                                {row.word.spell}
                              </strong>
                              <span className="text-xs text-muted-foreground">
                                {row.word.cn}
                              </span>
                            </TableCell>
                            <TableCell className="break-words">
                              {row.answer.trim() || t("result.blank")}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "flex items-center gap-1 whitespace-nowrap text-xs",
                                  row.correct
                                    ? "text-primary"
                                    : "text-destructive",
                                )}
                              >
                                {row.correct ? (
                                  <CircleCheck
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                ) : row.answer.trim() ? (
                                  <X className="size-4" aria-hidden="true" />
                                ) : (
                                  <CircleHelp
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                )}
                                {t(
                                  row.correct
                                    ? "result.correct"
                                    : row.answer.trim()
                                      ? "result.wrong"
                                      : "result.blank",
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p
                      role="status"
                      className="print-hidden text-xs text-muted-foreground"
                    >
                      {practice.status}
                    </p>
                  </CardContent>
                </Card>
              )}
              <p className="print-hidden flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("notice.hidden")}
              </p>
            </div>
          </div>
        )}
      </main>
      <footer className="print-hidden mx-4 border-t py-4 text-xs text-muted-foreground md:mx-6 lg:mx-8">
        {t("app.footer")}
      </footer>
    </div>
  );
}
