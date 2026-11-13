// 앱 파일 구성 점검: index.html의 스크립트가 모두 있고, 서비스 워커가 모두 미리 받으며, ES 모듈을 쓰지 않는다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1].replace(/\?.*$/, "")); // ?v= 캐시 번호는 떼고 파일만

test('index.html의 스크립트 파일이 모두 있다', () => {
  assert.ok(scripts.length > 20);
  for (const s of scripts) assert.ok(fs.existsSync(path.join(ROOT, s)), s);
});

test('ES 모듈·외부 주소를 쓰지 않는다(file://로 열 수 있게)', () => {
  assert.ok(!/type="module"/.test(html));
  assert.ok(!/src="https?:/.test(html));
  for (const s of scripts) {
    const src = fs.readFileSync(path.join(ROOT, s), 'utf8');
    assert.ok(!/^\s*(import|export)\s/m.test(src), s);
  }
});

test('서비스 워커가 앱 파일을 모두 미리 받는다', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  for (const f of ['index.html', 'style.css', 'manifest.webmanifest', ...scripts]) {
    assert.ok(sw.includes("'./" + f + "'"), f + ' 누락');
  }
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  for (const i of man.icons) {
    assert.ok(fs.existsSync(path.join(ROOT, i.src)), i.src);
    assert.ok(sw.includes("'./" + i.src + "'"), i.src + ' 누락');
  }
});

// 모든 화면을 실제로 그려 보고(브라우저 없이 최소 DOM 흉내) 개발용 값이 글자로 노출되지 않는지 확인한다.
function bootApp() {
  const vm = require('node:vm');
  const target = { innerHTML: '', className: '' };
  const toast = { innerHTML: '' };
  const store = new Map();
  const ctx = {
    console,
    document: {
      readyState: 'complete',
      getElementById: (id) => (id === 'app' ? target : id === 'toast' ? toast : null),
      addEventListener() {},
      createElement: () => ({ click() {}, remove() {} }),
      body: { appendChild() {} }
    },
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    location: { protocol: 'file:' },
    navigator: {},
    scrollTo() {},
    setTimeout,
    clearTimeout
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(ROOT, s), 'utf8'), ctx, { filename: s });
  return { P: ctx.Planner, target };
}

const BAD = /undefined|NaN|\[object Object\]|Infinity/;
function text(html) { return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' '); }

test('처음 실행하면 첫 화면에서 사례/직접 입력을 고르고, 직접 입력 + 고객 화면이면 자가진단부터 나온다', () => {
  const { P, target } = bootApp();
  assert.match(target.innerHTML, /사례 적용 버전/);
  assert.match(target.innerHTML, /직접 입력 버전/);
  assert.match(target.innerHTML, /고객 화면으로 들어가기/);
  assert.match(target.innerHTML, /설계사 화면으로 들어가기/);
  assert.ok(!/intake-form/.test(target.innerHTML));
  const el = (attrs) => ({ getAttribute: (k) => (k in attrs ? attrs[k] : null) });
  // 직접 입력 + 설계사 화면: 자가진단 대기 화면
  P.ui.actions['start-mode'](null, el({ 'data-mode': 'manual' }));
  P.ui.actions['start-go'](null, el({ 'data-role': 'planner' }));
  assert.match(target.innerHTML, /고객 자가진단을 기다리고 있어요/);
  // 직접 입력 + 고객 화면: 고객 파트의 자가진단
  P.ui.actions['start-go'](null, el({ 'data-role': 'customer', 'data-force': 'manual' }));
  assert.match(target.className, /intake-view/);
  assert.match(target.innerHTML, /나의 재무상태 자가진단/);
  assert.match(target.innerHTML, /고객 화면 · 1단계/);
  assert.match(target.innerHTML, /설계 예시 불러오기/);
  assert.match(target.innerHTML, /자가진단 완료하고 설계사에게 보내기/);
  assert.match(target.innerHTML, /공식 투자성향 진단이 아니며/);
  for (const sec of ['기본정보', '소득·지출', '자산·부채', '재무목표', '선호·자가진단']) assert.ok(target.innerHTML.includes(sec), sec);
  assert.ok(!BAD.test(text(target.innerHTML)));
  // 사례 적용 + 설계사 화면: 가상 고객 B안이 바로 열린다
  P.ui.actions['start-go'](null, el({ 'data-role': 'planner', 'data-force': 'case' }));
  assert.equal(P.ui.app.view.screen, 'main');
  assert.equal(P.ui.app.view.role, 'planner');
  assert.ok(P.ui.app.state.customer.isExample);
});

test('모든 고객·설계사 화면을 그려도 오류 화면이 없고 개발용 값이 노출되지 않는다', () => {
  const { P, target } = bootApp();
  const ui = P.ui;
  // 설계 예시로 입력을 마친 상태에서 화면 선택 → 각 화면
  ui.app.state = P.alerts.syncAlerts(P.intake.buildState(P.intake.exampleValues(), 'example').state).state;
  ui.app.d = null;
  ui.setView({ screen: 'choose' });
  assert.match(target.innerHTML, /어떤 데이터로 볼까요/);
  assert.match(target.innerHTML, /고객 화면으로 들어가기/);
  assert.match(target.innerHTML, /설계사 화면으로 들어가기/);
  assert.match(target.innerHTML, /사례 적용 버전/);
  assert.ok(!/intake-form/.test(target.innerHTML)); // 별도 화면
  ui.app.view.screen = 'main';
  // 고객정보 수정 화면(같은 입력 화면)
  ui.openIntake('edit');
  assert.match(target.innerHTML, /고객정보 수정/);
  assert.match(target.innerHTML, /value="320"/);
  ui.app.view.screen = 'main';
  const views = [];
  for (const tab of ['home', 'record', 'plan', 'alerts']) views.push({ role: 'customer', tab });
  for (const more of [null, 'info', 'risk', 'products', 'data', 'install']) views.push({ role: 'customer', tab: 'more', more });
  for (const page of Object.keys(ui.plannerPages)) {
    if (page === 'tools') for (const tool of ['solver', 'scenario', 'income', 'policy', 'products']) views.push({ role: 'planner', plannerPage: page, tool });
    else views.push({ role: 'planner', plannerPage: page });
  }
  for (let i = 0; i < 4; i++) views.push({ role: 'customer', tab: 'home', tour: i });
  for (const v of views) {
    ui.setView(Object.assign({ tour: null, more: null }, v));
    const label = JSON.stringify(v);
    assert.ok(target.innerHTML.length > 500, label + ' 빈 화면');
    assert.ok(!target.innerHTML.includes('문제가 생겼어요'), label + ' 오류 화면');
    const t = text(target.innerHTML);
    const m = t.match(BAD);
    assert.ok(!m, label + ' 노출: …' + (m ? t.slice(Math.max(0, m.index - 40), m.index + 20) : ''));
  }
});
