/* 알림함: 같은 상황의 알림은 한 번만, 수정안은 알림 하나에만 연결. 알림 설정·방해금지 시간. */
(function (root) {
  'use strict';

  var P = root.Planner;
  var ui = P.ui;
  var St = P.store;

  var TYPE_LABEL = {
    overspend: '생활비 초과',
    missedPayment: '약정 납입 미달',
    cumulativeShortfall: '저축 누적 미달',
    emergencyLow: '비상금 부족',
    incomeDrop: '실수령 감소'
  };

  function settingsCard(c) {
    var n = (c.state.settings && c.state.settings.notify) || {};
    var types = n.types || {};
    var q = n.quiet || { enabled: false, start: '22:00', end: '08:00' };
    return '<section class="card" aria-labelledby="ns-h"><h2 id="ns-h">알림 설정</h2><form data-submit="save-notify">' +
      '<fieldset><legend>받을 알림</legend>' + Object.keys(TYPE_LABEL).map(function (k) {
        return '<label class="choice"><input type="checkbox" name="type-' + k + '"' + (types[k] !== false ? ' checked' : '') + '>' + TYPE_LABEL[k] + '</label>';
      }).join('') + '</fieldset>' +
      '<fieldset><legend>방해금지 시간</legend><label class="choice"><input type="checkbox" name="quiet"' + (q.enabled ? ' checked' : '') + '>이 시간에는 화면 알림을 띄우지 않기</label>' +
      '<div class="grid-2"><div class="field"><label for="q-s">시작</label><input id="q-s" name="start" type="time" value="' + ui.esc(q.start) + '"></div>' +
      '<div class="field"><label for="q-e">끝</label><input id="q-e" name="end" type="time" value="' + ui.esc(q.end) + '"></div></div></fieldset>' +
      '<p class="small muted">이 앱은 서버가 없어 휴대폰 푸시를 보내지 않아요. 앱을 열면 알림함에 쌓여 있어요. 알림을 꺼도 알림함 기록은 남아요.</p>' +
      '<button class="btn btn-block" type="submit">저장</button></form></section>';
  }

  /* ---------- 알림 예시: 석 달 치 가상 기록을 넣어 실제로 알림이 생기는 모습을 보여 준다 ---------- */
  var DEMO_BACKUP_KEY = 'jaemu-planner-app-before-alert-demo';
  var demoBackup = null;

  function sampleState(cur) {
    var s = JSON.parse(JSON.stringify(cur));
    var base = s.plans.filter(function (p) { return p.id === s.activePlanId; })[0] || {};
    var start = base.startMonth || '2026-11';
    var m1 = start, m2 = P.dates.addMonths(start, 1), m3 = P.dates.addMonths(start, 2);
    var res = P.engine.runPlan(s, s.activePlanId);
    var row = function (m) { return P.engine.rowAt(res, m) || {}; };
    var debtOf = function (r) { return (r.interest || 0) + (r.principal || 0); };
    var r1 = row(m1), r2 = row(m2), r3 = row(m3);
    var ess = base.essential || 0, opt = base.optional || 0;
    // 기록은 서로 맞게 만든다: 계획보다 더 쓴 만큼 주거 → 비상금 적립에서 빠진다(통장 잔액과 기록이 어긋나지 않게)
    var saved = function (r, extra) {
      var ho = Math.max(0, (r.housingIn || 0) - extra);
      var left = Math.max(0, extra - (r.housingIn || 0));
      return { housing: ho, emergency: Math.max(0, (r.emergencyIn || 0) - left) };
    };
    var a1 = saved(r1, 10), a2 = saved(r2, 10);
    s.records = [
      // 1달째: 경조사로 생활비 +10(아직 1개월이라 경보 없음)
      { month: m1, status: '확정', income: r1.income, debt: debtOf(r1), emergency: a1.emergency, housing: a1.housing, pension: base.pensionMonthly || 0, essential: ess + 3, optional: opt + 7 },
      // 2달째: 연말 모임으로 또 +10 → 2개월 연속 생활비 초과 경보 + 수정안
      { month: m2, status: '확정', income: r2.income, debt: debtOf(r2), emergency: a2.emergency, housing: a2.housing, pension: base.pensionMonthly || 0, essential: ess + 2, optional: opt + 8 },
      // 3달째: 실수령이 12.5% 줄어 비상금·주거 적립을 못 함 → 소득 감소·누적 저축 미달 경보
      { month: m3, status: '확정', income: Math.round(r3.income * 0.875), debt: debtOf(r3), emergency: 0, housing: 0, pension: base.pensionMonthly || 0, essential: ess, optional: opt }
    ];
    s.alerts = [];
    s.proposals = (s.proposals || []).filter(function (p) { return p.type !== '수정안'; });
    s.demoToday = P.dates.addMonths(start, 3) + '-03';
    s.alertDemo = { startedAt: cur.demoToday || null, months: [m1, m2, m3] };
    return s;
  }

  ui.alertDemoBanner = function (c) {
    if (!c.state.alertDemo) return '';
    return '<section class="card demo-banner" role="status"><div class="card-head"><h2>알림 예시를 보고 있어요</h2>' + ui.badge('예시', 'warn') + '</div>' +
      '<p class="small">' + c.state.alertDemo.months.join(', ') + ' 석 달 치 가상 기록을 넣고, 오늘을 ' + ui.esc(c.state.demoToday) + '로 옮긴 상태예요. 알림 · 홈 · 내 계획(수정안) · 기록 탭을 둘러보세요.</p>' +
      '<div class="btn-row"><button class="btn btn-primary" data-action="alert-demo-end">예시 끝내고 원래대로 돌아가기</button></div></section>';
  };

  function demoIntro(c) {
    if (c.state.alertDemo) return '';
    return '<section class="card" aria-labelledby="al-demo-h"><h2 id="al-demo-h">알림은 언제 오나요?</h2>' +
      '<ul class="rows small">' +
      '<li><div class="row-main"><div class="t">생활비 초과</div><div class="s">계획보다 많이 쓴 달이 2개월 연속이면 → 다음 석 달 선택 지출을 나눠 줄이는 수정안이 함께 와요</div></div></li>' +
      '<li><div class="row-main"><div class="t">실수령 감소</div><div class="s">월급이 계획보다 10% 넘게 줄면 → 설계사와 생활비·연금 납입을 점검해요</div></div></li>' +
      '<li><div class="row-main"><div class="t">저축 누적 미달 · 납입 미달</div><div class="s">납입일 + 유예기간이 지나도 계획만큼 모으지 못했으면</div></div></li>' +
      '<li><div class="row-main"><div class="t">비상금 부족</div><div class="s">비상금을 다 채운 뒤 필수생활비 5개월분 밑으로 내려가면</div></div></li></ul>' +
      '<p class="small muted">아직 기록이 없어서 알림이 없어요. 석 달 치 가상 기록으로 실제 알림이 생기는 모습을 볼 수 있어요. 지금 정보는 따로 보관했다가 그대로 되돌립니다.</p>' +
      '<div class="btn-row"><button class="btn btn-primary btn-block" data-action="alert-demo-start">알림 예시로 보기</button></div></section>';
  }

  ui.screens.alerts = function (c) {
    var list = (c.state.alerts || []).slice();
    var rank = { '새 알림': 0, '읽음': 1, '해소': 2 };
    list.sort(function (a, b) { return (rank[a.status] - rank[b.status]) || (a.createdAt < b.createdAt ? 1 : -1); });
    var active = list.filter(function (a) { return a.status !== '해소'; });
    var resolved = list.filter(function (a) { return a.status === '해소'; });
    var item = function (a) {
      var prop = a.proposalId ? St.findProposal(c.state, a.proposalId) : null;
      return '<li style="display:block"><div class="option-head"><div class="t"><strong>' + ui.esc(a.title) + '</strong></div>' + ui.badge(a.severity) + '</div>' +
        '<p class="small">' + ui.esc(a.message) + '</p>' +
        '<div class="small muted">' + ui.esc(TYPE_LABEL[a.type] || '') + ' · ' + ui.esc(a.createdAt || '') + ' · ' + ui.badge(a.status) + '</div>' +
        '<div class="btn-row">' +
        (prop && prop.status !== '적용됨' ? '<button class="btn btn-sm btn-primary" data-action="alert-open" data-id="' + ui.esc(a.id) + '">연결된 수정안 보기</button>' : '') +
        (prop && prop.status === '적용됨' ? ui.badge('수정안 적용됨', 'ok') : '') +
        (a.type === 'cumulativeShortfall' || a.type === 'missedPayment' ? '<button class="btn btn-sm" data-action="alert-record" data-id="' + ui.esc(a.id) + '">기록 확인하기</button>' : '') +
        (a.status === '새 알림' ? '<button class="btn btn-sm" data-action="alert-read" data-id="' + ui.esc(a.id) + '">읽음으로 표시</button>' : '') +
        '</div></li>';
    };
    return ui.alertDemoBanner(c) + '<section class="card" aria-labelledby="al-h"><div class="card-head"><h2 id="al-h">알림함</h2>' +
      (c.d.newAlerts ? ui.badge('새 알림 ' + c.d.newAlerts + '건', '새 알림') : '') + '</div>' +
      (active.length ? '<ul class="rows">' + active.map(item).join('') + '</ul>' : ui.empty('지금 확인할 알림이 없어요.')) +
      (resolved.length ? ui.fold('해소된 알림 ' + resolved.length + '건', '<ul class="rows">' + resolved.map(item).join('') + '</ul>') : '') +
      '<p class="small muted">같은 상황의 알림은 한 번만 만들고, 상황이 사라지면 해소로 옮겨요.</p></section>' + demoIntro(c) + settingsCard(c);
  };

  Object.assign(ui.actions, {
    'alert-demo-start': function (c) {
      demoBackup = JSON.parse(JSON.stringify(c.state));
      try { root.localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(c.state)); } catch (e) { /* 메모리 사본으로 되돌린다 */ }
      ui.commit(sampleState(c.state), '알림 예시를 만들었어요. 새 알림을 확인해 보세요.');
    },
    'alert-demo-end': function () {
      var back = demoBackup;
      if (!back) { try { back = JSON.parse(root.localStorage.getItem(DEMO_BACKUP_KEY) || 'null'); } catch (e) { back = null; } }
      if (!back) {
        var s = JSON.parse(JSON.stringify(ui.app.state));
        delete s.alertDemo; s.records = []; s.alerts = []; s.demoToday = (s.intake && s.intake.savedAt) || s.demoToday;
        back = s;
      }
      demoBackup = null;
      try { root.localStorage.removeItem(DEMO_BACKUP_KEY); } catch (e) { /* 무시 */ }
      ui.commit(back, '알림 예시를 끝내고 원래 정보로 돌아왔어요.');
    },
    'alert-read': function (c, el) { ui.commit(P.alerts.markRead(c.state, el.getAttribute('data-id'))); },
    'alert-open': function (c, el) {
      var s = P.alerts.markRead(c.state, el.getAttribute('data-id'));
      ui.app.state = s;
      ui.app.store.save(s);
      ui.app.d = null;
      ui.setView({ tab: 'plan' });
    },
    'alert-record': function (c, el) {
      var a = (c.state.alerts || []).filter(function (x) { return x.id === el.getAttribute('data-id'); })[0];
      var s = P.alerts.markRead(c.state, a.id);
      ui.app.state = s;
      ui.app.store.save(s);
      ui.app.d = null;
      var m = a.data && a.data.missingMonths && a.data.missingMonths[0] || a.month;
      ui.setView({ tab: 'record', recordMonth: m });
    },
    'save-notify': function (c, form, fd) {
      var types = {};
      ['overspend', 'missedPayment', 'cumulativeShortfall', 'emergencyLow', 'incomeDrop'].forEach(function (k) { types[k] = fd.get('type-' + k) === 'on'; });
      var notify = { types: types, quiet: { enabled: fd.get('quiet') === 'on', start: fd.get('start') || '22:00', end: fd.get('end') || '08:00' } };
      ui.commit(St.updateSettings(c.state, { notify: notify }, '고객', '알림 설정'), '알림 설정을 저장했어요.');
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
