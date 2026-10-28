import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(new URL('../config/package.json', import.meta.url))('playwright');
const base = process.env.DICTATION_TEST_URL || 'http://localhost:8765/';
async function select(page,id,value) { await page.locator('#'+id).click(); await page.locator('[role=option][data-value="'+value+'"]').click(); }
async function checked(page,id,value) { const node=page.locator('#'+id); if((await node.getAttribute('aria-checked'))!==String(value)) await node.click(); }
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  try {
  const context = await browser.newContext({ viewport: {width:1440,height:1000} });
  const errors=[];
  const checks=[];
  async function pageWithSpeech() {
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(() => {
      window.__speech={calls:[], active:0, maxActive:0, delay:500, fail:false, timers:new Set()};
      window.SpeechSynthesisUtterance=class { constructor(text){this.text=text;} };
      Object.defineProperty(window,'speechSynthesis',{value:{
        getVoices:()=>[{lang:'en-US'},{lang:'zh-CN'}],
        cancel(){ for(const timer of __speech.timers) clearTimeout(timer); __speech.timers.clear(); __speech.active=0; },
        speak(u){__speech.calls.push({text:u.text,lang:u.lang,rate:u.rate});__speech.active++;__speech.maxActive=Math.max(__speech.maxActive,__speech.active);const timer=setTimeout(()=>{__speech.timers.delete(timer);__speech.active--;if(__speech.fail)u.onerror?.({error:'not-allowed'});else u.onend?.();},__speech.delay);__speech.timers.add(timer);}
      }});
    });
    await page.goto(base+'dictation.html');
    await page.locator('#pool-count').waitFor();
    await page.clock.install();
    return page;
  }
  const nav=await context.newPage();nav.on('pageerror',e=>errors.push(e.message));
  await nav.goto(base+'index.html?topic=08');
  await nav.locator('#dictation-link').click();
  await nav.locator('#pool-count').waitFor();
  assert.equal(await nav.locator('#topic').getAttribute('data-value'),'08');
  await nav.locator('.d-nav a').filter({hasText:'句式课程'}).click();
  await nav.getByRole('tab',{name:'句式练习'}).waitFor();
  await nav.locator('[role=tab][aria-selected=true]').filter({hasText:'句式练习'}).waitFor();
  await nav.goto(base+encodeURI('assets/pages/S01-介绍自己.html'));
  await nav.locator('#dictation-link').waitFor();
  await nav.locator('h1').filter({hasText:'介绍自己'}).waitFor();
  const lessonFiles = await nav.evaluate(() => window.LIBRARY.lessons.map(lesson => lesson.file));
  const badResponses = [];
  nav.on('response', response => { if (response.status() >= 400) badResponses.push(response.url()); });
  for (const file of lessonFiles) {
    await nav.goto(base + encodeURI(file));
    await nav.locator('[data-slot=accordion]').waitFor();
    assert.equal(await nav.locator('#dictation-link').evaluate(link => link.href), base + 'dictation.html');
    assert.equal(await nav.evaluate(() => new URL('index.html', document.baseURI).href), base + 'index.html');
  }
  await nav.locator('#lesson').click();
  await nav.getByRole('option').filter({hasText:'01 · 介绍自己'}).click();
  await nav.locator('h1').filter({hasText:'介绍自己'}).waitFor();
  assert.ok(decodeURI(nav.url()).endsWith('assets/pages/S01-介绍自己.html'));
  await nav.getByRole('link',{name:'返回学习首页'}).click();
  await nav.getByRole('tab',{name:'全部词汇'}).waitFor();
  assert.deepEqual(badResponses, []);
  checks.push('Homepage topic handoff and lesson navigation');
  checks.push('All 12 relocated lessons load; switching and returning preserve project-relative paths');
  await nav.close();

  const page=await pageWithSpeech();
  await select(page,'topic','01');await select(page,'amount','10');await select(page,'order','original');
  await checked(page,'chinese-speech',false);await checked(page,'auto',false);await page.locator('#start').click();
  assert.equal(await page.locator('#prompt').innerText(),'零');
  await page.locator('#answer').fill(' ZERO ');await page.locator('#answer').press('Enter');
  assert.equal(await page.locator('#position').innerText(),'2 / 10');await page.locator('#answer').fill('wrong');await page.locator('#finish').click();
  assert.equal(await page.locator('#score').innerText(),'50%');assert.equal(await page.locator('#result-rows tr').count(),2);
  await page.locator('#retry').click();assert.equal(await page.locator('#position').innerText(),'1 / 1');assert.equal(await page.locator('#prompt').innerText(),'一');
  await page.locator('#answer').fill('ONE');await page.locator('#next').click();assert.equal(await page.locator('#score').innerText(),'100%');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download').click()]);assert.equal(download.suggestedFilename(),'单词听写结果.txt');
  checks.push('Chinese manual answers, early finish, grading, mistake retry, result export');
  await page.locator('#reset').click();await checked(page,'auto',true);await select(page,'interval','3');await page.locator('#start').click();
  await page.locator('#answer').fill('zero');await page.clock.runFor(3100);assert.equal(await page.locator('#position').innerText(),'2 / 10');
  await page.locator('#pause').click();await page.locator('#answer').fill('one');await page.clock.runFor(10000);assert.equal(await page.locator('#position').innerText(),'2 / 10');
  await page.locator('#pause').click();await page.clock.runFor(3100);assert.equal(await page.locator('#position').innerText(),'3 / 10');
  await page.locator('#finish').click();assert.equal(await page.locator('#result-rows tr').count(),3);assert.equal(await page.locator('#result-rows tr').nth(1).locator('td').nth(1).innerText(),'one');
  checks.push('Silent Chinese auto countdown and pause/resume preserve input');await page.close();

  const audio=await pageWithSpeech();
  await select(audio,'mode','audio');await select(audio,'topic','01');await select(audio,'amount','10');await select(audio,'order','original');await checked(audio,'auto',true);await select(audio,'interval','3');await select(audio,'repeat','2');await audio.locator('#start').click();
  assert.equal(await audio.locator('#prompt svg').count(),1);assert.equal(await audio.locator('#exercise').innerText().then(t=>t.includes('zero')||t.includes('零')),false);
  await audio.clock.runFor(1400);assert.equal(await audio.locator('#position').innerText(),'1 / 10');
  assert.equal(await audio.evaluate(()=>__speech.calls.length),2);
  await audio.clock.runFor(2100);assert.equal(await audio.locator('#position').innerText(),'1 / 10');
  await audio.clock.runFor(1200);assert.equal(await audio.locator('#position').innerText(),'2 / 10');
  assert.equal(await audio.evaluate(()=>__speech.maxActive),1);
  await audio.locator('#pause').click();await audio.clock.runFor(10000);assert.equal(await audio.locator('#position').innerText(),'2 / 10');
  await audio.locator('#replay').click();await audio.clock.runFor(300);await audio.locator('#replay').click();await audio.clock.runFor(1700);
  assert.equal(await audio.evaluate(()=>__speech.maxActive),1);assert.equal(await audio.locator('#position').innerText(),'2 / 10');
  await audio.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await audio.locator('#pause').innerText(),'继续');await audio.clock.runFor(10000);assert.equal(await audio.locator('#position').innerText(),'2 / 10');
  checks.push('Audio hides answers; repeats finish before countdown; replay cancellation and page hiding');
  await audio.locator('#finish').click();await audio.locator('#reset').click();
  await audio.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});__speech.fail=true;});
  await select(audio,'repeat','1');await audio.locator('#start').click();await audio.clock.runFor(600);
  assert.equal(await audio.locator('#pause').innerText(),'继续');assert.match(await audio.locator('#playback-status').innerText(),/阻止/);
  await audio.clock.runFor(10000);assert.equal(await audio.locator('#position').innerText(),'1 / 10');
  await audio.evaluate(()=>__speech.fail=false);await audio.locator('#replay').click();await audio.clock.runFor(3600);assert.equal(await audio.locator('#position').innerText(),'2 / 10');
  checks.push('Speech failure pauses instead of skipping words and recovers on replay');await audio.close();

  const mobile=await pageWithSpeech();await mobile.setViewportSize({width:390,height:844});
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);

  await mobile.locator('#theme').click();assert.equal(await mobile.locator('html').getAttribute('class'),'dark');
  await select(mobile,'mode','chinese');await checked(mobile,'chinese-speech',false);await mobile.locator('#start').click();
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);

  checks.push('Mobile welcome/exercise layout and dark theme');await mobile.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({checks,consoleErrors:errors},null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
