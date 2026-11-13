/*
 * 첫 화면(시작 화면).
 *  ① 어떤 데이터로 볼지: 사례 적용 버전(보고서 가상 고객 B안) / 직접 입력 버전(빈 상태, 고객 자가진단부터)
 *  ② 어느 화면으로 들어갈지: 고객 화면 / 설계사 화면
 * 직접 입력 버전에서 고객 화면을 고르면 자가진단(고객 파트)부터 시작하고, 저장하면 고객 홈으로 간다.
 * 직접 입력 버전에서 자가진단 전에 설계사 화면을 고르면 '고객 자가진단 대기' 화면을 보여 준다.
 * 저장된 정보를 다른 버전으로 바꿀 때는 지우지 않고 백업 키에 남긴다(되돌리기 가능).
 */
(function (root) {
  'use strict';

  var P = root.Planner;
  var ui = P.ui;
  var I = P.intake;
  var fmt = P.format;
  var esc = function (s) { return ui.esc(s); };
  var PREV_KEY = 'jaemu-planner-app-previous';

  function app() { return ui.app; }

  /** 지금 저장된 데이터의 종류: 'case' | 'manual' | null */
  function currentKind() {
    var s = app().state;
    if (!s) return null;
    return s.customer && s.customer.isExample ? 'case' : 'manual';
  }

  function chosenMode() {
    var v = app().view;
    return v.startMode || currentKind() || 'case';
  }

  function backupCurrent() {
    var a = app();
    if (!a.state) return true;
    try {
      root.localStorage.setItem(PREV_KEY, JSON.stringify({ savedAt: new Date().toISOString(), state: a.state }));
      return true;
    } catch (e) { return false; }
  }

  function caseState() {
    var b = I.buildState(I.exampleValues(), 'example');
    if (!b.ok) return null;
    var s = P.store.migrate ? P.store.migrate(b.state) : b.state;
    return P.alerts.syncAlerts(s).state;
  }

  function goMain(role, msg) {
    var a = app();
    a.view.screen = 'main';
    a.view.role = role;
    if (role === 'customer') { a.view.tab = 'home'; a.view.more = null; }
    else a.view.plannerPage = 'overview';
    ui.render();
    if (root.scrollTo) root.scrollTo(0, 0);
    if (msg) ui.toast(msg);
  }

  function savedLine() {
    var a = app();
    var s = a.state;
    if (!s) return '<p class="small muted">이 기기에는 아직 저장된 정보가 없어요.</p>';
    var k = s.customer || {};
    return '<p class="small">이 기기에 저장된 정보: <strong>' + esc(k.name || '이름 미입력') + '</strong> ' +
      (k.isExample ? ui.badge('사례 적용 버전', 'info') : ui.badge('직접 입력', 'ok')) +
      (s.alertDemo ? ' ' + ui.badge('알림 예시 보는 중', 'warn') : '') + '</p>';
  }

  function modeCard(mode, on, title, tag, lines, note) {
    return '<button type="button" class="mode-card' + (on ? ' on' : '') + '" data-action="start-mode" data-mode="' + mode + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<span class="mc-top"><span class="mc-radio" aria-hidden="true"></span><span class="mc-title">' + title + '</span>' + (tag ? '<span class="mc-tag">' + tag + '</span>' : '') + '</span>' +
      '<span class="mc-lines">' + lines.map(function (l) { return '<span>' + l + '</span>'; }).join('') + '</span>' +
      (note ? '<span class="mc-note">' + note + '</span>' : '') + '</button>';
  }

  ui.startScreen = function () {
    var a = app();
    var mode = chosenMode();
    var kind = currentKind();
    var switching = kind && mode !== kind;
    var caseNote = kind === 'manual' && mode === 'case' ? '지금 저장된 직접 입력 정보는 지우지 않고 백업해 둬요.' : '';
    var manualNote = kind === 'case' && mode === 'manual' ? '사례 정보는 백업해 두고, 고객 화면의 자가진단부터 새로 시작해요.' : kind === 'manual' ? '저장된 고객 정보로 이어서 볼 수 있어요.' : '';
    var prev = ui.prevBackup ? ui.prevBackup() : null;

    return '<header class="topbar"><div class="topbar-inner"><div class="brand">재무플래너</div></div>' +
      '<div class="demo-note">가상 고객으로 만든 교육용 사례예요. 실제 금융정보를 입력하지 마세요.</div></header>' +
      '<main class="choose-main start-main" id="main">' + (ui.importConfirm ? ui.importConfirm() : '') +
      '<section class="card start-hero"><h1 tabindex="-1">재무플래너</h1>' +
      '<p>설계사가 세운 재무계획을 고객이 매달 실행·점검하는 앱이에요. 29세 중소기업 재직자가 대출을 갚고 2029년 10월 부천 신혼전세를 준비하는 사례로 만들었어요.</p>' +
      savedLine() + '</section>' +

      '<section class="card"><h2><span class="step-n">1</span>어떤 데이터로 볼까요?</h2>' +
      '<div class="mode-grid">' +
      modeCard('case', mode === 'case', '사례 적용 버전', '심사·시연 추천',
        ['보고서의 가상 고객 B안과 설계안이 채워져 있어요.', '진단 · 설계 근거 · 지급일 자금표 · 경보 예시를 바로 볼 수 있어요.'], caseNote) +
      modeCard('manual', mode === 'manual', '직접 입력 버전', '',
        ['빈 상태에서 시작해요.', '고객 화면에서 자가진단(소득·지출·자산·부채·목표)을 입력하면 설계사 화면에서 진단과 설계를 시작해요.'], manualNote) +
      '</div></section>' +

      '<section class="card"><h2><span class="step-n">2</span>어느 화면으로 들어갈까요?</h2>' +
      '<div class="choose-grid">' +
      '<div class="choose-card"><span class="cc-tag">고객용 · 휴대폰</span><span class="cc-h">고객 화면</span>' +
      '<span class="cc-d">' + (mode === 'manual' && kind !== 'manual' ? '자가진단부터 시작해요. 그다음 이번 달 할 일, 저축 진행, 알림과 수정안을 확인해요.' : '이번 달 할 일, 목표 진행, 이사 날 지급 후 남는 돈, 알림과 수정안 확인') + '</span>' +
      '<button class="btn btn-primary btn-block" data-action="start-go" data-role="customer">' + (mode === 'manual' && kind !== 'manual' ? '고객 자가진단 시작하기' : '고객 화면으로 들어가기') + '</button></div>' +
      '<div class="choose-card"><span class="cc-tag">설계사용 · PC</span><span class="cc-h">설계사 화면</span>' +
      '<span class="cc-d">재무설계 6단계 순서: 상담 → 정보 → 진단 → 설계 → 실행 → 점검. 설계 근거, 충격 시나리오, 계산 검증</span>' +
      '<button class="btn btn-primary btn-block" data-action="start-go" data-role="planner">설계사 화면으로 들어가기</button></div>' +
      '</div>' +
      (switching ? '<p class="small muted">들어가는 순간 ' + (mode === 'case' ? '사례 적용 버전으로 바뀌어요.' : '직접 입력 버전으로 바뀌어요.') + ' 지금 정보는 백업해 두어 [이전 정보로 되돌리기]로 복원할 수 있어요.</p>' : '') +
      '<p class="small muted">두 화면은 로그인이 아니라 같은 정보를 보는 방식만 다른 것이에요. 위쪽 [고객용 | 설계사용] 버튼으로 언제든 바꿀 수 있어요.</p></section>' +

      (a.state ? ui.fold('데이터 관리(내보내기·불러오기·되돌리기)', dataBox(prev)) : ui.fold('저장해 둔 파일 불러오기(JSON)', importBox())) +
      '</main>';
  };

  function importBox() {
    return '<div class="btn-row"><label class="btn" for="import-file-start">불러오기(JSON)</label>' +
      '<input id="import-file-start" class="sr-only" type="file" accept=".json,application/json" data-change="import-json"></div>';
  }
  function dataBox(prev) {
    return '<p class="small">정보는 이 기기의 브라우저에만 저장돼요. 다른 기기로 옮길 때는 내보낸 파일을 보내 불러오기 하세요.</p>' +
      '<div class="btn-row"><button class="btn" data-action="export-json">내보내기(JSON)</button>' +
      '<label class="btn" for="import-file-start">불러오기(JSON)</label><input id="import-file-start" class="sr-only" type="file" accept=".json,application/json" data-change="import-json">' +
      (prev && prev.state ? '<button class="btn" data-action="restore-prev-confirm">이전 정보로 되돌리기</button>' : '') +
      '<button class="btn" data-action="edit-info">고객정보 수정</button>' +
      '<button class="btn btn-danger" data-action="start-over-confirm">모두 지우기</button></div>' +
      (app().view.confirm === 'restore-prev' ? '<div class="notice warn" role="alert"><div><p><strong>이전 정보(' + esc(((prev && prev.state && prev.state.customer) || {}).name || '') + ')로 되돌릴까요?</strong> 지금 정보는 백업으로 바꿔 둡니다.</p>' +
        '<div class="btn-row"><button class="btn btn-danger" data-action="restore-prev">되돌리기</button><button class="btn" data-action="cancel-confirm">취소</button></div></div></div>' : '') +
      (app().view.confirm === 'start-over' ? '<div class="notice warn" role="alert"><div><p><strong>모든 데이터를 지울까요?</strong> 기록·계획 버전·설정이 지워져요(이 브라우저에 백업 1개를 남깁니다).</p>' +
        '<div class="btn-row"><button class="btn btn-danger" data-action="start-over">지우기</button><button class="btn" data-action="cancel-confirm">취소</button></div></div></div>' : '');
  }

  /** 직접 입력 버전에서 자가진단 전에 설계사 화면을 고른 경우 */
  ui.waitScreen = function () {
    return '<header class="topbar"><div class="topbar-inner"><div class="brand">재무플래너</div>' +
      '<div class="topbar-actions"><button class="btn btn-sm" data-action="go-choose">처음 화면</button></div></div></header>' +
      '<main class="choose-main" id="main"><section class="card"><span class="cc-tag">설계사 화면</span><h1 tabindex="-1">고객 자가진단을 기다리고 있어요</h1>' +
      '<ol class="flow">' +
      '<li class="now"><span class="fdot" aria-hidden="true">1</span><div><div class="ft">고객 자가진단 <span class="small" style="color:var(--accent)">지금 단계</span></div><div class="fs">고객이 소득·지출·자산·부채·목표를 입력해요(약 5분)</div></div></li>' +
      '<li class="todo"><span class="fdot" aria-hidden="true">2</span><div><div class="ft">재무상태 진단</div><div class="fs">입력이 저장되면 이 화면에서 지표와 목표 판정이 열려요</div></div></li>' +
      '<li class="todo"><span class="fdot" aria-hidden="true">3</span><div><div class="ft">설계안 작성 · 고객 선택 · 실행 점검</div><div class="fs">설계사가 계획을 만들어 제시하고, 고객이 고른 계획만 실행 기준이 돼요</div></div></li></ol>' +
      '<p class="small muted">서버가 없는 앱이라 같은 기기에서 고객 화면으로 바꿔 입력하거나, 고객이 내보낸 파일을 불러오면 돼요.</p>' +
      '<div class="btn-row"><button class="btn btn-primary" data-action="start-go" data-role="customer" data-force="manual">고객 화면에서 자가진단 시작</button>' +
      '<label class="btn" for="import-file-wait">고객 파일 불러오기(JSON)</label><input id="import-file-wait" class="sr-only" type="file" accept=".json,application/json" data-change="import-json">' +
      '<button class="btn" data-action="start-go" data-role="planner" data-force="case">사례 적용 버전으로 보기</button></div></section></main>';
  };

  Object.assign(ui.actions, {
    'start-mode': function (c, el) {
      var a = app();
      a.view.startMode = el.getAttribute('data-mode');
      a.view.confirm = null;
      ui.render();
    },
    'start-go': function (c, el) {
      var a = app();
      var role = el.getAttribute('data-role');
      var mode = el.getAttribute('data-force') || chosenMode();
      a.view.startMode = mode;
      var kind = currentKind();
      if (mode === 'case') {
        if (kind === 'case') { goMain(role); return; }
        if (!backupCurrent()) { ui.toast('지금 정보를 백업하지 못해 바꾸지 않았어요.'); return; }
        var s = caseState();
        if (!s) { ui.toast('사례 데이터를 만들지 못했어요.'); return; }
        var saved = a.store.save(s);
        if (!saved.ok) { ui.toast('이 브라우저에 저장하지 못해 이번 창에서만 보여요.'); }
        a.state = s; a.d = null; a.staleDemo = false;
        goMain(role, kind === 'manual' ? '사례 적용 버전으로 열었어요. 직접 입력한 정보는 백업해 두었어요.' : '사례 적용 버전(가상 고객 B안)으로 열었어요.');
        return;
      }
      // 직접 입력 버전
      if (kind === 'manual') { goMain(role); return; }
      if (role === 'planner') {
        a.view.screen = 'wait';
        ui.render();
        if (root.scrollTo) root.scrollTo(0, 0);
        return;
      }
      // 고객 자가진단(고객 파트)부터. 저장하면 고객 홈으로 간다.
      a.view.intakeAfter = { screen: 'main', role: 'customer', tab: 'home' };
      a.view.role = 'customer';
      ui.openIntake('new');
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
