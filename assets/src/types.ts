export type Word = {
  id: string;
  topic: string;
  spell: string;
  cn: string;
  search: string;
  html: string;
};
export type Library = {
  words: Word[];
  topics: { id: string; name: string; count: number }[];
  lessons: { name: string; file: string; number: string }[];
};
export type Options = {
  topic: string;
  amount: string;
  order: string;
  mode: string;
  chineseSpeech: boolean;
  auto: boolean;
  interval: number;
  repeat: number;
  rate: number;
};
export type Row = { word: Word; answer: string; correct: boolean };
declare global {
  interface Window {
    LIBRARY?: Library;
    ENGLISH_TTS_ENDPOINT?: string;
    MicrosoftTTS: {
      synthesize(
        text: string,
        signal?: AbortSignal,
        voice?: string,
      ): Promise<Blob>;
    };
  }
}
