import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { normalizeAnswer, selectWords, gradeAnswers } from '../js/dictation-core.js';

const context = { window: {} };
vm.runInNewContext(readFileSync(new URL('../js/library.js', import.meta.url), 'utf8'), context);
const library = context.window.LIBRARY;

test('all existing themes and phrases remain available; theme counts are bounded', () => {
  assert.equal(library.words.length, 1134);
  assert.equal(library.topics.length, 27);
  for (const topic of library.topics) {
    const round = selectWords(library.words, { topic: topic.id, amount: 'all', order: 'original' });
    assert.equal(round.length, topic.count);
    assert.ok(round.every(word => word.topic === topic.id));
  }
  assert.ok(selectWords(library.words, { amount: 'all' }).some(word => word.spell === 'ice cream'));
  assert.equal(selectWords(library.words, { topic: '02', amount: '50' }).length, 22);
  assert.equal(selectWords(library.words, { topic: 'missing' }).length, 0);
});

test('shuffling does not mutate the source or repeat entries in a round', () => {
  const original = library.words.map(word => word.id);
  const round = selectWords(library.words, { amount: '50' }, () => 0.3);
  assert.equal(round.length, 50);
  assert.equal(new Set(round.map(word => word.id)).size, 50);
  assert.deepEqual(library.words.map(word => word.id), original);
  assert.notDeepEqual(round.map(word => word.id), original.slice(0, 50));
});

test('grading tolerates case and input typography while preserving spelling and phrase boundaries', () => {
  assert.equal(normalizeAnswer('  ICE   Cream  '), 'ice cream');
  const words = ["Children's Day", 'ice cream', 'Mid-Autumn Festival', 'apple', 'zero'].map(spell => ({ spell }));
  const grades = gradeAnswers(words, [" children’s day ", 'icecream', 'mid autumn festival', 'aple']);
  assert.deepEqual(grades.map(row => row.correct), [true, false, false, false, false]);
  assert.equal(gradeAnswers([{ spell: 'ice cream' }], [' ICE   CREAM '])[0].correct, true);
});

test('mistake retry uses the original word entries and retains blank answers for review', () => {
  const words = selectWords(library.words, { topic: '01', amount: '10', order: 'original' });
  const grades = gradeAnswers(words, ['zero', 'wrong', 'two']);
  const mistakes = grades.filter(row => !row.correct).map(row => row.word);
  assert.equal(mistakes.length, 8);
  assert.equal(mistakes[0], words[1]);
  assert.equal(grades[3].answer, '');
});

test('Microsoft speech preserves English default and passes Chinese voice and abort signal', async () => {
  const requests = [];
  const ttsContext = { window: { ENGLISH_TTS_ENDPOINT: 'https://example.test/tts' }, fetch: async (url, options) => {
    requests.push({ url, ...options });
    return { ok: true, blob: async () => new Blob(['test'], { type: 'audio/mpeg' }) };
  } };
  vm.runInNewContext(readFileSync(new URL('../js/tts.js', import.meta.url), 'utf8'), ttsContext);
  const controller = new AbortController();
  await ttsContext.window.MicrosoftTTS.synthesize('zero', controller.signal);
  await ttsContext.window.MicrosoftTTS.synthesize('零', controller.signal, 'zh-CN-XiaoxiaoNeural');
  assert.equal(JSON.parse(requests[0].body).voice, 'en-US-JennyNeural');
  assert.equal(JSON.parse(requests[1].body).voice, 'zh-CN-XiaoxiaoNeural');
  assert.equal(requests[1].signal, controller.signal);
  ttsContext.fetch = async () => ({ ok: true, blob: async () => new Blob(['error'], { type: 'text/html' }) });
  await assert.rejects(ttsContext.window.MicrosoftTTS.synthesize('zero'), /有效音频/);
});
