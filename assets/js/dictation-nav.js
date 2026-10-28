import { t } from './dictation-i18n.js';
import { icon } from './dictation-nav-icon.js';
// The upstream repo ships a compiled React bundle without its source. Add the
// entry point alongside that bundle, keeping the original learning UI intact.
let pendingLessons = location.hash === '#lessons';
const observer = new MutationObserver(attach);
observer.observe(document.getElementById('root'), { childList: true, subtree: true });

function attach() {
  const actions = document.querySelector('header .flex.gap-2');
  if (!actions) return;
  if (!document.getElementById('dictation-link')) {
    const link = document.createElement('a');
    link.id = 'dictation-link';
    link.className = 'dictation-link';
    link.innerHTML = icon;
    const label = document.createElement('span');
    label.textContent = t('nav.dictation');
    link.append(label);
    link.href = './dictation.html' + (new URLSearchParams(location.search).has('topic') ? '?topic=' + encodeURIComponent(new URLSearchParams(location.search).get('topic')) : '');
    actions.prepend(link);
  }
  if (pendingLessons) {
    const tab = [...document.querySelectorAll('[role="tab"]')].find(node => node.textContent.includes('句式'));
    if (!tab) return; // The header may mount before the lesson tabs load.
    if (tab.getAttribute('aria-selected') !== 'true') {
      // Radix automatically selects the tab when it receives focus.
      tab.focus({ preventScroll: true });
    }
    pendingLessons = false;
  }
  // Only the initial React mount needs observing. Navigation below updates the
  // topic parameter at click time, including filters changed after mount.
  const lesson = window.LIBRARY?.lessons.find(item => decodeURIComponent(location.pathname).endsWith(item.file));
  document.title = lesson ? t('app.courseTitle', { course: lesson.name }) : t('app.libraryTitle');
  observer.disconnect();
}
attach();
window.addEventListener('hashchange', () => { pendingLessons = location.hash === '#lessons'; attach(); });
document.addEventListener('click', event => {
  const link = event.target.closest('#dictation-link');
  if (link) {
    const topic = new URLSearchParams(location.search).get('topic');
    link.href = './dictation.html' + (topic && topic !== 'all' ? '?topic=' + encodeURIComponent(topic) : '');
  }
});
