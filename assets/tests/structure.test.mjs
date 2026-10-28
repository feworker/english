import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const context = { window: {} };
vm.runInNewContext(readFileSync(new URL('assets/js/library.js', root), 'utf8'), context);

test('only entry pages remain at the project root and audio packages are classified', () => {
  assert.deepEqual(readdirSync(root).filter(name => !name.startsWith('.')).sort(), ['assets', 'audio', 'dictation.html', 'index.html']);
  assert.equal(readdirSync(new URL('audio/', root)).length, 15);
  assert.ok(readdirSync(new URL('audio/', root)).every(name => /^audio-\d{2}\.json$/.test(name)));
});

test('all entry and lesson page asset links resolve inside the project', () => {
  for (const file of ['index.html', 'dictation.html', ...context.window.LIBRARY.lessons.map(lesson => lesson.file)]) {
    const pageURL = new URL(file, root);
    assert.ok(existsSync(pageURL), file);
    const html = readFileSync(pageURL, 'utf8');
    const base = html.match(/<base href="([^"]+)"/);
    const baseURL = base ? new URL(base[1], pageURL) : pageURL;
    for (const match of html.replace(/<base[^>]*>/g, '').matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = new URL(match[1], baseURL);
      assert.ok(url.href.startsWith(root.href), `${file}: ${match[1]}`);
      url.search = ''; url.hash = '';
      assert.ok(existsSync(url), `${file}: missing ${url.pathname}`);
    }
  }
});

test('compiled course data path and ES module imports follow the new structure', () => {
  const bundle = readFileSync(new URL('assets/js/index-BJzZLJbn.js', root), 'utf8');
  assert.ok(bundle.includes('fetch("assets/data/lessons.json")'));
  assert.ok(!bundle.includes('fetch("lessons.json")'));
  assert.equal(Object.keys(JSON.parse(readFileSync(new URL('assets/data/lessons.json', root), 'utf8'))).length, 12);
  for (const file of ['dictation-ui.js', 'dictation-core.js', 'dictation-speech.js']) {
    const url = new URL(`assets/js/${file}`, root);
    for (const match of readFileSync(url, 'utf8').matchAll(/from '([^']+)'/g)) {
      assert.ok(existsSync(new URL(match[1], url)), `${file}: ${match[1]}`);
    }
  }
});
