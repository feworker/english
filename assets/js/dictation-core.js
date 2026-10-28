// Pure helpers shared by the page and the regression tests.
export function normalizeAnswer(value) {
  return value.normalize('NFKC').trim().toLowerCase()
    .replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
}

export function selectWords(words, { topic = '', amount = '20', order = 'random' }, random = Math.random) {
  const pool = words.filter(word => !topic || word.topic === topic);
  if (order === 'random') {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  const count = amount === 'all' ? pool.length : Math.max(1, Number(amount) || 20);
  return pool.slice(0, count);
}

export function gradeAnswers(words, answers) {
  return words.map((word, index) => {
    const answer = answers[index] || '';
    return { word, answer, correct: normalizeAnswer(answer) === normalizeAnswer(word.spell) };
  });
}
