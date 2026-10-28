import { t } from './dictation-i18n.js';
// Cancellation covers synthesis, playback and repeat gaps. No prompt text is
// exposed to the page's live region, so audio-only questions stay audio-only.
export class DictationSpeaker {
  constructor(onStatus) {
    this.onStatus = onStatus;
    this.generation = 0;
    this.audio = new Audio();
    this.url = '';
    this.cancelPending = null;
    this.controller = null;
  }

  stop() {
    this.generation++;
    this.controller?.abort();
    this.controller = null;
    this.cancelPending?.();
    this.cancelPending = null;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = '';
    window.speechSynthesis?.cancel();
  }

  waitFor(register, timeout = 30000) {
    return new Promise((resolve, reject) => {
      let cleanup = () => {};
      let timer;
      let settled = false;
      const done = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        this.cancelPending = null;
        error ? reject(error) : resolve();
      };
      this.cancelPending = () => done(new DOMException('Cancelled', 'AbortError'));
      timer = setTimeout(() => done(new Error(t('speech.timeout'))), timeout);
      try {
        cleanup = register(done) || cleanup;
        if (settled) cleanup();
      } catch (error) { done(error); }
    });
  }

  async browserSpeech(text, language, rate) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      throw new Error(t('speech.unsupported'));
    }
    await this.waitFor(done => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = rate;
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.toLowerCase() === language.toLowerCase())
        || voices.find(v => v.lang.toLowerCase().startsWith(language.slice(0, 2)));
      if (voice) utterance.voice = voice;
      utterance.onend = () => done();
      utterance.onerror = event => done(new Error(event.error === 'not-allowed'
        ? t('speech.blocked')
        : t('speech.browserError')));
      speechSynthesis.speak(utterance);
      return () => { utterance.onend = null; utterance.onerror = null; };
    });
  }

  async microsoftSpeech(text, voice, rate) {
    this.controller = new AbortController();
    const controller = this.controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    let blob;
    try { blob = await window.MicrosoftTTS.synthesize(text, controller.signal, voice); }
    finally { clearTimeout(timeout); }
    if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const url = URL.createObjectURL(blob);
    this.url = url;
    this.audio.src = url;
    this.audio.playbackRate = rate;
    try {
      await this.waitFor(done => {
        this.audio.onended = () => done();
        this.audio.onerror = () => done(new Error(t('speech.playError')));
        this.audio.play().catch(done);
        return () => { this.audio.onended = null; this.audio.onerror = null; };
      });
    } finally {
      URL.revokeObjectURL(url);
      if (this.url === url) this.url = '';
    }
  }

  async speak(text, { mode, rate, repeat }) {
    this.stop();
    const generation = this.generation;
    const language = mode === 'chinese' ? 'zh-CN' : 'en-US';
    const voice = mode === 'chinese' ? 'zh-CN-XiaoxiaoNeural' : 'en-US-JennyNeural';
    for (let i = 0; i < repeat; i++) {
      if (generation !== this.generation) throw new DOMException('Cancelled', 'AbortError');
      this.onStatus(t('speech.repeat', { current: i + 1, total: repeat }));
      if (window.ENGLISH_TTS_ENDPOINT) {
        try { await this.microsoftSpeech(text, voice, rate); }
        catch (error) {
          if (generation !== this.generation) throw error;
          this.onStatus(t('speech.fallback'));
          await this.browserSpeech(text, language, rate);
        }
      } else { await this.browserSpeech(text, language, rate); }
      if (generation !== this.generation) throw new DOMException('Cancelled', 'AbortError');
      if (i + 1 < repeat) await this.waitFor(done => {
        const timer = setTimeout(() => done(), 600);
        return () => clearTimeout(timer);
      });
    }
  }
}
