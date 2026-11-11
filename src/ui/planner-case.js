/*
 * 사례 보고서(가상 고객 B안)의 6단계 내용을 설계사 화면에 붙인다.
 * 보고서 최종 수정본(2026-11-10) 기준 표 번호:
 *  1 상담: 관계 정립(표 3)   2 정보: 목표·배우자·주거목표·확인 질문(표 4~9)   3 진단: 보고서 지표(표 11)
 *  4 설계: 설계 근거 — 상환 대안(표 12)·생활비 조정(표 13)·상품(표 16·17)·정책 적합성(표 22·23)
 *  5 실행: 지급일 자금표(표 18~21·25)·실행 일정(표 26)   6 점검: 점검 주기·경보 기준(표 27)
 * 숫자는 가능한 한 고객정보와 계획에서 다시 계산한다(엔진은 건드리지 않는다).
 * 글로만 된 내용(범위·질문·일정)은 설계 예시 고객일 때만 보여 준다.
 */
(function (root) {
  'use strict';

  var P = root.Planner;
  var ui = P.ui;
  var fmt = P.format;
  var pages = (ui.plannerPages = ui.plannerPages || {});

  // 보고서의 가구 단위 설정(추가 가상 설정과 실행 가정). 본인 몫은 엔진 계산값을 쓴다.
  var HH = {
    jeonse: 22200,            // 2029년 전세보증금 계획액
    basePrice: 20000, growth: 0.036, months: 35,
    spouseInit: 1400, spouseMonthly: 50, spouseNet: 210, spouseGross: 2800,
    loan: 15000,              // 신혼부부전용 전세대출(조건부)
    contractMonth: '2029-07', contractRate: 0.1,
    buffer: 100,              // 최소 이사 완충자금(이 사례에서 정한 실행 기준)
    mgmtFee: 20
  };
  ui.caseHousehold = HH;

  function num(x) { var n = Number(x); return Number.isFinite(n) ? n : 0; }
  function isCase(c) { return !!(c.state.customer && c.state.customer.isExample); }
  function n1(x) { return ui.n1(x); }
  function plain(rows, heads, cap) { return ui.table(heads, rows, { caption: cap }); }
  function notCase(what) {
    return '<section class="card"><p class="small muted">' + what + '은(는) 사례 보고서(설계 예시)에 맞춘 내용이에요. 새 고객은 상담에서 확인한 내용으로 설계사가 따로 정리합니다.</p></section>';
  }
  function src(t) { return '<p class="small muted">출처: 재무설계 사례 보고서 ' + t + ' · 가상 사례이며 실제 상담·동의·가입은 이루어지지 않았습니다.</p>'; }

  /* ---------- 1. 관계 정립(표 3) — 상담 범위 화면을 보고서 내용으로 ---------- */
  var baseScope = pages.scope;
  pages.scope = function (c) {
    if (!isCase(c)) return baseScope(c);
    return ui.pageHead('상담 범위(관계 정립)', '1단계 — 무엇을 다루고, 누가 무엇을 책임지는지') +
      '<section class="cols-2"><div class="card"><h2>' + ui.badge('이번 범위', 'ok') + '</h2><ul class="rows">' +
      '<li>36개월 현금흐름</li><li>대출 상환</li><li>비상금</li><li>본인 주거재원</li><li>보험·연금 점검(해지·신규 가입 판단은 자료 확인 뒤)</li><li>개인 저축계획과 가구 전체 전세자금 조달을 연결해 검토</li></ul></div>' +
      '<div class="card"><h2>' + ui.badge('범위 밖', 'muted') + '</h2><ul class="rows">' +
      '<li>금융상품 판매·계약 대행</li><li>세무·법률 사항의 확정 판단(전문가 확인 권고)</li><li>은퇴 충분성 판단(국민연금·퇴직연금 자료 없음)</li></ul>' +
      '<p class="small muted">혼인·이사 직전에 가구 기준으로 다시 설계하고, 입주 후 3개월 안에 확정 예산으로 재설계합니다.</p></div></section>' +
      '<section class="card"><h2>관계 정립 항목</h2>' + plain([
        ['비용', '가상 사례의 고객에게 상담료·판매수수료를 부과하지 않는 것으로 가정'],
        ['역할과 책임', '고객: 자료 제공, 선호와 제약 설명, 최종 선택 / 설계 담당자: 분석·설명·실행 지원·점검 / 실제 계약·거래: 금융기관 등 해당 주체'],
        ['정보 수집·관리', '수집 목적, 접근 범위, 보관 기간, 폐기 방법을 안내하고 동의를 받음. 별도 동의 없이 제3자에게 제공하지 않음'],
        ['이해상충', '특정 금융회사와의 제휴나 판매 보상이 생기면 사전에 설명하고, 고객이 이해한 뒤 진행 여부를 결정'],
        ['점검·변경·종료', '월별 현금흐름, 분기별 목표 전망, 반기별 시세·대출조건 점검. 혼인·이사 직전 가구 기준 재설계, 입주 후 3개월 내 확정 예산 재설계']
      ], ['항목', '내용'], '관계 정립 항목') + src('표 3') + '</section>' +
      '<section class="card"><h2>진행 방식</h2><p>설계사가 계획을 세워 제시하고, 고객이 선택한 계획만 실행 기준이 됩니다. 이후 고객이 매달 실행을 기록하고, 앱이 계획과 비교해 경보와 수정안을 만듭니다.</p>' +
      '<p class="small muted">모든 계산은 결정론적 월별 계산이며 확률(성공 확률 등)로 표현하지 않습니다. 충격 시나리오는 "이 충격이 오면"의 조건부 결과입니다.</p></section>';
  };

  /* ---------- 2. 목표 우선순위·확인 질문(표 4·5) ---------- */
  pages.goals = function (c) {
    var k = c.state.customer;
    var g = k.goal || {};
    var cur = c.d.current;
    var ev = function (t) { var e = (cur.events || []).filter(function (x) { return x.type === t; })[0]; return e ? e.month : '—'; };
    var need = num(g.depositTarget) + num(g.movingCost);
    var plan = c.d.plan || {};
    var rows = [
      ['1', '이자 높은 대출 상환', '잔액 0', cur.payoff && cur.payoff.high ? cur.payoff.high : '—', '결혼 직전까지 신규 신용대출 추가 없음'],
      ['2', '비상금 확보', fmt.short(num(g.emergencyTarget)), ev('emergencyReached'), plan.essential ? '필수생활비 ' + fmt.short(plan.essential) + ' × ' + fmt.num1(num(g.emergencyTarget) / plan.essential) + '개월' : ''],
      ['3', '본인 주거목표', fmt.short(need), plan.targetMonth || '—', '보증금 분담 ' + fmt.short(num(g.depositTarget)) + ' + 부대비용 예산 ' + fmt.short(num(g.movingCost)) + ', 결혼비용 제외']
    ];
    if (num(plan.pensionMonthly) > 0) rows.push(['4', '장기 준비 습관', '연금저축 월 ' + fmt.short(plan.pensionMonthly), '설계 기간', '납입 습관 유지. 은퇴 충분성은 별도 산정']);
    var head = ui.pageHead('목표·확인 질문', '2단계 — 목표의 금액·기한·우선순위와, 면담에서 확인할 것') +
      '<section class="card"><h2>재무목표와 우선순위</h2>' + plain(rows, ['순위', '목표', '금액(만원)', '기한(계획상 달성월)', '성공 기준·비고'], '재무목표') +
      '<p class="small muted">기한은 실행 기준 계획의 계산 결과입니다. 순서는 대출 → 비상금 → 주거이며 같은 돈을 두 목표에 겹쳐 세지 않습니다.</p></section>';
    if (!isCase(c)) return head + notCase('정보의 구분과 확인 질문');
    var sp36 = HH.spouseInit + HH.spouseMonthly * 36;
    var est = HH.basePrice * Math.pow(1 + HH.growth, HH.months / 12);
    var own = num(g.depositTarget);
    return head +
      '<section class="card"><h2>두 가지 목표를 구분합니다</h2><div class="kpis">' +
      ui.kpi('저축목표(본인)', ui.money(need), '보증금 분담 ' + fmt.short(own) + ' + 부대비용 ' + fmt.short(num(g.movingCost))) +
      ui.kpi('실행 기준(가구)', '<span class="num">' + fmt.short(HH.buffer) + '<small>만원 이상</small></span>', '계약비용을 모두 낸 뒤 비상금과 별도로 남길 돈') + '</div>' +
      '<p class="small muted">목표액에 도달했다는 사실만으로 바로 계약하지 않도록, 지급 후 완충자금 ' + HH.buffer + '을 실행 기준으로 따로 둡니다. ' + HH.buffer + '은 법정 기준이 아니라 이 사례에서 정한 최소 기준입니다.</p></section>' +
      '<section class="card"><h2>정보의 구분</h2>' + plain([
        ['원안의 고객 설정', '본인 총급여 4,500·실수령 320, 총자산 2,300, 신용대출 1,000, 기존 월 지출 235, 부모 지원·건강 지출 유지, 주거자금 원금손실 회피'],
        ['추가한 가상 설정', '배우자 소득·초기자금·월 저축액, 2024.05.01 감면대상 취업과 2029.05 말 감면 종료, 종료 후 월 실수령 7 감소'],
        ['공식 자료로 확인한 사실', '현재 적금 상품 조건, 현재 전세대출 요건과 신청인 단독소득 예외, ISA 의무가입기간과 원금 인출 규정, 중개보수 상한요율'],
        ['실행계획을 위한 가정', '계약일·잔금일 예시, 2029년 전세가격, 부대비용 예산 150, 최소 완충자금 100']
      ], ['구분', '포함한 내용'], '정보의 구분') + src('표 4') + '</section>' +
      '<section class="card"><h2>배우자 정보(추가 가상 설정)</h2>' + plain([
        ['현재 월 실수령(총급여 연 ' + fmt.short(HH.spouseGross) + ')', n1(HH.spouseNet), '급여 자료'],
        ['초기 주거자금', n1(HH.spouseInit), '실제 사용 가능한 자산인지'],
        ['월 주거저축', n1(HH.spouseMonthly), '36개월 지속 가능성'],
        ['저축 후 남는 월 소득', n1(HH.spouseNet - HH.spouseMonthly), '생활비·부채상환·결혼비용 적립을 감당하는지'],
        ['2029년 10월 적립 전 주거자금', n1(sp36 - HH.spouseMonthly), '마지막 달 납입 제외'],
        ['마지막 달 적립 완료 후', n1(sp36), '월 ' + HH.spouseMonthly + ' 입금 확인 필요']
      ], ['배우자 항목', '설정값(만원)', '검증할 내용'], '배우자 정보') +
      '<p class="small muted">결혼식·혼수·여행 비용은 별도 설계 대상이며, 본인 주거재원과 배우자 ' + fmt.short(sp36) + '에서 그 비용을 빼지 않는다는 조건입니다. 별도 재원이 확인되지 않으면 주거계획을 다시 계산합니다.</p>' + src('표 5') + '</section>' +
      '<section class="card"><h2>주거목표 — 부천시 소사구 괴안동 전세(전용 56.67㎡ 저층)</h2>' +
      '<p>2026년 6월·8월 저층 신규계약 두 건의 보증금 ' + fmt.short(HH.basePrice) + '에서 출발해, 세 기관의 2026년 전세가격 전망 평균 연 ' + (HH.growth * 100).toFixed(1) + '%를 ' + HH.months + '개월 적용하면 <strong class="num">' + fmt.num1(est) + '</strong> → 100 단위로 올려 계획액 <strong>' + fmt.short(HH.jeonse) + '만원</strong>입니다.</p>' +
      plain([
        ['기본 주거계획', n1(HH.basePrice), '연 3.6%, 35개월', { html: '<span class="num">' + fmt.num1(est) + '</span> → 계획 ' + fmt.short(HH.jeonse) }],
        ['단지 중위값 출발', n1(21000), '같은 상승률·기간', n1(21000 * Math.pow(1 + HH.growth, HH.months / 12))],
        ['계획액 대비 10% 상승(스트레스 조건)', n1(HH.jeonse), '추가 가격충격 10%', n1(HH.jeonse * 1.1)]
      ], ['시나리오', '출발가격', '적용 가정', '2029년 추정 또는 계획액'], '주거가격 시나리오') +
      '<p class="small muted">6·8월 거래가격을 기준가격 대용으로 쓴 것이며 11월 실거래 시세가 아닙니다. 2026년 한 해 전망을 35개월 연장한 것은 이 설계의 가정이지 2029년 공식 전망이 아닙니다.</p>' + src('표 7') + '</section>' +
      '<section class="card"><h2>2029년 전세보증금 조달 계획(조건부)</h2>' + plain([
        ['본인 보증금 분담', n1(own), '기존 보증금 반환 1,000 + 주거 적립 ' + fmt.short(own - 1000)],
        ['배우자 분담', n1(sp36), '초기 ' + fmt.short(HH.spouseInit) + ' + 월 ' + HH.spouseMonthly + ' × 36개월'],
        ['신혼부부전용 전세대출', n1(HH.loan), { html: fmt.short(HH.jeonse) + ' − ' + fmt.short(own + sp36) + ', 보증금의 ' + fmt.num1(HH.loan / HH.jeonse * 100) + '%. ' + ui.badge('승인 전에는 확정 재원 아님', 'warn') }],
        [{ html: '<strong>전세보증금 합계</strong>' }, n1(own + sp36 + HH.loan), '본인 부대비용 예산 ' + fmt.short(num(g.movingCost)) + '은 별도']
      ], ['조달 항목', '금액(만원)', '근거'], '전세보증금 조달 계획') +
      '<p class="small muted">대출금은 소득이나 순자산 증가로 세지 않습니다. 본인 저축목표 판정에는 본인 몫만 씁니다.</p>' + src('표 9') + '</section>' +
      '<section class="card"><h2>후보 주거지의 고객 적합성</h2>' + plain([
        ['통근', '두 사람의 직장 위치는 원안에 없음', '확인할 질문: 수용할 수 있는 편도 통근시간 상한'],
        ['면적', '전용 56.67㎡를 2인 신혼가구 주거로 수용', '추가 가상 설정: 자녀 계획 시 면적 재검토'],
        ['저층', '저층(1~3층) 계약을 수용', '추가 가상 설정: 저층 선호 여부와 고층 대안 수용 범위'],
        ['주택 상태', '1990년 준공 단지', '확인할 질문: 누수·결로·수리 상태, 등기상 선순위 권리, 반환보증 가입 가능 여부']
      ], ['검토 항목', '현재 설정', '구분과 확인할 내용'], '고객 적합성') + src('표 8') + '</section>' +
      '<section class="card"><h2>면담에서 확인할 질문</h2><ol>' +
      ['부모 지원과 건강·자기계발비를 유지하려는 이유는 무엇인가?', '월 40의 지출 절감을 36개월 유지할 수 있는가?', '결혼일과 이사일은 반드시 일치해야 하는가?',
        '전세가격이 오르면 지역·면적·시점·대출 중 무엇을 조정할 수 있는가?', '결혼비용의 총액과 분담, 재원은 무엇인가?', '기존 보증금 반환이 잔금보다 늦으면 어떻게 대응할 것인가?']
        .map(function (q) { return '<li>' + ui.esc(q) + '</li>'; }).join('') + '</ol>' +
      '<p class="small muted">이 사례에서는 질문에 대한 고객의 답변을 가정하지 않습니다.</p></section>';
  };

  /* ---------- 3. 보고서 기준 초기 지표(표 7) — 진단 화면 아래에 붙인다 ---------- */
  function reportMetrics(c) {
    var k = c.state.customer;
    var g = k.goal || {};
    var after = c.d.plan || {};
    var ess = num(after.essential) || num((c.d.beforePlan || {}).essential);
    var cash = num(k.cash);
    var assets = cash + num(k.savings) + num(k.emergency) + num(k.housing) + num(k.investment) + num(k.pension) + num(k.depositReturn && k.depositReturn.amount);
    var debt = (k.debts || []).reduce(function (s, d) { return s + num(d.balance); }, 0);
    var sav = num(k.existingSaving && k.existingSaving.monthly);
    var need = num(g.depositTarget) + num(g.movingCost);
    var dep = num(k.depositReturn && k.depositReturn.amount);
    var rows = [
      ['즉시 현금 보유기간', '입출금 현금 ' + fmt.short(cash) + ' ÷ 필수생활비 ' + fmt.short(ess), ess ? fmt.num1(cash / ess) + '개월' : '—', '소득이 끊겼을 때 버틸 수 있는 기간'],
      ['부채/총자산', fmt.short(debt) + ' ÷ ' + fmt.short(assets), assets ? fmt.num1((debt / assets) * 100) + '%' : '—', '총자산 대비 부채 부담'],
      ['정기 저축·투자율', fmt.short(sav) + ' ÷ ' + fmt.short(num(k.netMonthly)), num(k.netMonthly) ? fmt.num1((sav / num(k.netMonthly)) * 100) + '%' : '—', '지금 매달 저축·투자하는 비율'],
      ['주거 추가 필요액', fmt.short(need) + ' − 돌려받을 보증금 ' + fmt.short(dep), fmt.num1(need - dep), '반환 보증금을 전부 다시 쓴다는 전제'],
      ['현재 비상금 부족액', fmt.short(num(g.emergencyTarget)) + ' − ' + fmt.short(cash), fmt.num1(Math.max(0, num(g.emergencyTarget) - cash)), '주거자금보다 먼저 채울 금액']
    ];
    return '<section class="card"><h2>상담 시작 시점의 지표(보고서 기준)</h2>' + plain(rows, ['지표', '산식', '결과', '해석'], '보고서 기준 지표') +
      '<p class="small muted">위 「진단 지표」 표는 용도를 정한 돈만 비상금·주거자금으로 세기 때문에 설계 전 비상자금이 0개월로 나옵니다. 이 표는 보고서 표 11과 같은 방식으로, 입출금 현금 전체를 조정 후 필수생활비로 나눈 값입니다. 두 표는 정의가 다를 뿐 같은 자료입니다.</p></section>';
  }
  var baseDiag = pages.diagnosis;
  pages.diagnosis = function (c) {
    var html = baseDiag(c);
    return c.d.beforePlan ? html + reportMetrics(c) : html;
  };

  /* ---------- 4. 설계 근거(표 8·9·13·14·16) ---------- */
  function debtOptions(c) {
    var k = c.state.customer;
    var d = (k.debts || []).slice().sort(function (a, b) { return num(b.rate) - num(a.rate); })[0];
    if (!d || num(d.balance) <= 0) return '';
    var plan = c.d.plan || {};
    var pool = num(k.cash) + num(k.savings) + num(k.investment);
    var ess = num(plan.essential);
    var bal = num(d.balance), r = num(d.rate);
    var baseP = num(d.monthlyPrincipal) || (num(d.remainingMonths) ? bal / num(d.remainingMonths) : 0);
    var ov = (plan.debtOverrides || {})[d.name] || {};
    // 원금균등 가정의 남은 이자 합계
    var interest = function (b, p) { var s = 0, guard = 0; while (b > 1e-9 && p > 0 && guard++ < 1200) { s += b * r / 12; b -= Math.min(p, b); } return s; };
    var chosen = Math.min(num((plan.initial || {}).repayFromCash), bal, pool);
    var opts = [
      ['대출 유지', 0, baseP],
      ['전액 상환', Math.min(bal, pool), baseP],
      ['부분 상환', chosen, num(ov.monthlyPrincipal) || baseP]
    ];
    var rows = opts.map(function (o) {
      var left = bal - o[1];
      return [{ html: ui.esc(o[0]) + (o[0] === '부분 상환' && chosen > 0 && chosen < bal ? ' ' + ui.badge('채택', 'ok') : '') }, n1(o[1]), n1(pool - o[1]), n1(left), n1(interest(left, o[2])), ess ? fmt.num1((pool - o[1]) / ess) + '개월' : '—'];
    });
    return '<section class="card"><h2>대출 상환 대안 비교 — ' + ui.esc(d.name) + ' 연 ' + fmt.num1(r * 100) + '%</h2>' +
      '<p>바로 쓸 수 있는 돈은 현금 ' + fmt.short(num(k.cash)) + ' + 예·적금 ' + fmt.short(num(k.savings)) + ' + 투자자산 ' + fmt.short(num(k.investment)) + ' = <strong>' + fmt.short(pool) + '만원</strong>입니다. 이 돈으로 대출을 얼마나 갚느냐에 따라 남는 현금과 이자가 달라집니다.</p>' +
      plain(rows, ['대안', '즉시 상환', '남는 현금', '남는 대출', '이후 이자 합계', '남는 현금 ÷ 필수생활비'], '상환 대안 비교') +
      '<p class="small muted">이자는 원금균등 상환이 그대로 이어진다는 조건의 계산이며 중도상환수수료·미수이자는 넣지 않았습니다. 필수생활비는 설계안 기준 ' + fmt.short(ess) + '만원입니다.</p>' +
      (isCase(c) ? '<p>부분 상환을 채택한 이유: 전액 상환보다 현금 300을 더 들고 시작하면서 남은 대출 300을 3개월 안에 갚습니다. 추가로 내는 이자 3.6은 초기 유동성을 확보하는 비용입니다. ETF 처분은 시장 하락 예상 때문이 아니라, 약 3년 뒤 쓸 주거자금이라는 기간·원금손실을 피하려는 고객 선호·연 7.2% 이자 부담을 함께 본 적합성 판단입니다.</p>' + src('표 12') : '') + '</section>';
  }

  function livingTable(c) {
    var k = c.state.customer;
    var plan = c.d.plan || {};
    var items = k.livingItems || [];
    if (!items.length) return '';
    var adj = {};
    (plan.livingAdjust || []).forEach(function (a) { adj[a[0]] = a[2]; });
    var how = { '월세·관리비': '현재 계약 유지', '교통비': '통근 유지', '식비·생필품': '배달·외식 상한 설정, 장보기 계획', '통신·구독': '미사용 구독 정리', '보험료': '보장 내용 확인 전 유지', '부모 지원': '고객이 유지하려는 가치 지출', '건강·자기계발': '고객이 유지하려는 가치 지출', '여가·쇼핑': '주간 여가예산 관리(1차 17 + 추가 5)', '비정기 적립': '경조사·수리 등 대비' };
    var tb = 0, ta = 0;
    var rows = items.filter(function (i) { return num(i.amount) > 0 || adj[i.label] !== undefined; }).map(function (i) {
      var b = num(i.amount), a = adj[i.label] !== undefined ? num(adj[i.label]) : b;
      tb += b; ta += a;
      return [i.label, n1(b), n1(a), a === b ? '0' : { html: '<strong class="num">' + fmt.num1(b - a) + '</strong>' }, isCase(c) ? (how[i.label] || '') : (a === b ? '유지' : '조정')];
    });
    rows.push([{ html: '<strong>합계</strong>' }, n1(tb), n1(ta), { html: '<strong class="num">' + fmt.num1(tb - ta) + '</strong>' }, '']);
    var match = Math.abs(ta - (num(plan.essential) + num(plan.optional))) < 0.05;
    return '<section class="card"><h2>생활비 조정안</h2>' + plain(rows, ['항목', '기존', '조정', '절감', '실행 방법'], '생활비 조정안') +
      '<p class="small muted">단위 만원/월. ' + (match ? '조정 합계 ' + fmt.short(ta) + '은 실행 기준 계획의 생활비(필수 ' + fmt.short(plan.essential) + ' + 선택 ' + fmt.short(plan.optional) + ')와 같습니다.' : '실행 기준 계획의 생활비는 필수 ' + fmt.short(plan.essential) + ' + 선택 ' + fmt.short(plan.optional) + '입니다.') + '</p>' +
      (isCase(c) ? '<p class="small muted">필수생활비 165 = 조정 생활비 195 − 여가·쇼핑 20 − 비정기 적립 10. 여가 절감 22는 1차 17 + 추가 5이며, 추가 절감 5는 주거 완충저축으로 자동이체합니다. 월 40 절감을 36개월 유지할 수 있는지는 면담 질문 2로 확인해야 하는 핵심 가정입니다.</p>' + src('표 13') : '') + '</section>';
  }

  function productSplit(c) {
    var plan = c.d.plan || {};
    var p = (plan.products || []).filter(function (x) { return x.type === 'bank'; })[0];
    if (!p) return '';
    var n = num(p.months), A = num(p.monthly);
    var first = num(plan.housingFirstMonthly);
    var total = num(c.state.customer.netMonthly) - num(plan.essential) - num(plan.optional) - num(plan.pensionMonthly);
    var after = function (rate) { return A * rate * n * (n + 1) / 24 * (1 - 0.154); };
    var cands = isCase(c) ? [
      ['카카오뱅크 자유적금', 0.0385, 0.0405, '자동이체 우대조건과 만기 일치', '2026-11-10'],
      ['케이뱅크 주거래우대 자유적금', 0.037, 0.043, '급여·통신비 및 체크카드 실적 충족 여부', '2026-11-10'],
      ['KB내맘대로적금 자유적립식', 0.025, 0.031, '선택한 우대조건의 실제 충족 여부', '2026-11-03']
    ] : [[p.name, num(p.rate), num(p.prefRate) || num(p.rate), '', '']];
    var rows = cands.map(function (x) {
      return [x[0], (x[1] * 100).toFixed(2) + '%', (x[2] * 100).toFixed(2) + '%', n1(after(x[1])), n1(after(x[2])), x[3], x[4]];
    });
    return '<section class="card"><h2>주거적립 ' + fmt.short(total) + '의 배치 — 적금 ' + fmt.short(A) + ' / 유동자금 ' + fmt.short(total - A - first) + (first ? ' / 완충저축 ' + fmt.short(first) : '') + '</h2>' +
      '<p>' + ui.esc(p.start) + '부터 월 주거적립 ' + fmt.short(total) + '을 <strong>' + n + '개월 적금 ' + fmt.short(A) + ' + 수시입출금 유동자금 ' + fmt.short(total - A - first) + (first ? ' + 주거 완충저축 ' + fmt.short(first) : '') + '</strong>으로 나눕니다. 전부 적금에 묶으면 만기 전에 계약금이나 일정 변화에 대응할 돈이 없기 때문입니다.</p>' +
      '<h3>월 ' + fmt.short(A) + '·' + n + '개월 적금 비교</h3>' +
      plain(rows, ['상품', '기본금리', '최대 우대', '세후 이자(기본)', '세후 이자(최대 우대)', '판단할 사항', '조회일'], '적금 비교') +
      '<p class="small muted">세후 이자 ≈ ' + fmt.short(A) + ' × 금리 × ' + n + ' × ' + (n + 1) + ' ÷ 24 × (1 − 0.154). 월 단위 근사이며 실제 지급액은 납입일별 일수에 따라 달라집니다. 금리는 조회 시점의 공시이며 가입할 때의 금리를 보장하지 않습니다.</p>' +
      (isCase(c) ? '<p>다른 은행의 우대조건 충족 여부가 확인되지 않아, 기본금리와 자동이체 조건이 명확한 상품을 계산 예시로 둡니다(추천이 아닙니다). 최대 우대끼리의 세후 이자 차이는 약 <strong>' + fmt.num1(after(0.043) - after(0.0405)) + '만원</strong>으로, 이 차이 때문에 소비나 거래 구조를 바꿀 필요는 크지 않습니다. 추가 소비를 만들어 우대금리를 받는 방식은 채택하지 않습니다. 목표 판정은 이자를 뺀 <strong>원금 기준</strong>으로 합니다.</p>' + src('표 16') : '') + '</section>' +
      (isCase(c) ? '<section class="card"><h2>비상금 보관 계좌 비교</h2>' + plain([
        ['유동성', '수시 입출금', '즉시 사용'],
        ['연결계좌 이동 절차', '연결된 입출금계좌로 이체 후 사용', '이동 절차 없음'],
        ['잔액별 금리', '2026.11.03 조사 연 1.8%, 한도·구간은 가입일 재확인', '가입일 공시 확인'],
        ['보호한도', '해당 은행 예금 합산 1억 원', '해당 은행 예금 합산 1억 원']
      ], ['비교 기준', '카카오뱅크 세이프박스', '급여 입출금계좌(기존 거래은행)'], '비상금 보관 계좌') +
        '<p class="small muted">비상금은 금리보다 이동의 단순성과 원금 보호가 먼저입니다. 예금자보호는 계좌별이 아니라 금융회사별 합산이므로 비상금과 주거자금을 같은 은행에 두면 합산액을 점검합니다.</p>' + src('표 17') + '</section>' : '');
  }

  function suitability(c) {
    if (!isCase(c)) return '';
    var k = c.state.customer;
    var g3 = function (x) { return x * Math.pow(1.01, 3); };
    var me = num(k.grossPrevYear), sp = HH.spouseGross;
    return '<section class="card"><h2>신혼부부 전세대출 — 가구 단위 차입금(조건부)</h2>' +
      '<p>전세대출은 개인 저축을 대신하는 수익이 아니라 차입금입니다. 판단 순서: ① 기본 합산소득 기준 → ② 초과 시 신청인 단독소득 예외 → ③ 신청인과 임차인 명의 일치 → ④ 부부합산 자산·무주택·대상주택·신용·보증심사 → ⑤ 2029년 실제 규정과 승인금액 재확인.</p>' +
      plain([
        ['본인', n1(me), n1(g3(me)), { html: g3(me) <= 5000 ? ui.badge('신청인 단독소득 5,000 이하', 'ok') : ui.badge('5,000 초과', 'bad') }],
        ['배우자', n1(sp), n1(g3(sp)), ''],
        [{ html: '<strong>합계</strong>' }, n1(me + sp), n1(g3(me + sp)), { html: g3(me + sp) > 7500 ? ui.badge('합산 기본기준 7,500 초과 — 심사 경로 재확인', 'warn') : ui.badge('합산 기준 이내', 'ok') }]
      ], ['구분', '현재 총급여', '연 1% 상승 시 3년 후', '판단'], '임금상승 시 연소득') +
      '<p class="small muted">급여 추정은 민감도 계산이며 실제 심사소득은 당시 인정자료로 판단합니다. 대출 ' + fmt.short(HH.loan) + '은 보증금의 ' + fmt.num1(HH.loan / HH.jeonse * 100) + '%로 80% 한도 안이지만 승인 전에는 조건부 재원입니다.</p>' + src('표 22') + '</section>' +
      '<section class="card"><h2>정책상품·보험·연금 적합성 판단</h2>' + plain([
        ['ISA', '의무가입기간 3년, 납입원금 범위 내 중도인출 가능', '기본안은 지급일 관리와 구조의 단순성을 위해 일반 예·적금을 씁니다. 기존 ISA가 있거나 인출 조건이 맞으면 대안으로 다시 비교합니다.'],
        ['청년미래적금', '3년 만기, 월 최대 50', { html: ui.badge('기본 재원에서 제외', 'warn') + ' 가입하더라도 만기가 2029년 10월 이후입니다.' }],
        ['재직자 우대 저축공제', '기업지원 20% 또는 40%, 기업 참여 필요', { html: ui.badge('제외', 'warn') + ' 회사 참여·지원비율 미확인.' }],
        ['소득세 감면', '청년 5년간 90%, 연 200 한도', '2024.05.01 취업 가정으로 2029.05 종료. 이후 월 실수령 7 감소를 계산에 반영했습니다.'],
        ['보험', '보험료 월 8(실손 3 + 정액 질병 5, 사례 가정)', '보장기간·갱신·자기부담·단체보험 중복을 확인하기 전에는 해지하지 않습니다.'],
        ['연금저축', '잔액 100, 월 10', '세액공제와 노후 준비 습관을 위해 유지. 비상시에는 해지가 아닌 납입 일시 조정을 검토. 미확정 세액공제 환급은 주거재원에 넣지 않습니다.']
      ], ['구분', '확인한 내용', '이 사례의 판단'], '적합성 판단') + src('표 23') + '</section>';
  }

  pages.basis = function (c) {
    var body = debtOptions(c) + livingTable(c) + productSplit(c) + suitability(c);
    return ui.pageHead('설계 근거', '4단계 — 왜 이 설계안인지: 상환 대안, 생활비 조정, 상품 배치, 대출·정책 적합성') +
      (body || '<section class="card">' + ui.empty('설계안이 아직 없어 근거를 보여 줄 수 없어요.') + '</section>');
  };

  /* ---------- 5. 지급일 자금표(표 18~21·25) — 본인 몫은 원금 기준 엔진 결과에서 계산 ---------- */
  function payment(c) {
    var k = c.state.customer, g = k.goal || {};
    var planId = c.state.activePlanId;
    var res = P.engine.runPlan(c.state, planId, { excludeBankProducts: true, assumptionOverrides: { housingRate: 0 } });
    var tm = res.input.targetMonth;
    var at = function (m) { return P.engine.rowAt(res, m); };
    var last = at(tm), cm = at(HH.contractMonth);
    if (!last || !cm) return null;
    var dep = num(k.depositReturn && k.depositReturn.amount);
    var own = num(g.depositTarget), cost = num(g.movingCost);
    var down = HH.jeonse * HH.contractRate;
    var sp = HH.spouseInit + HH.spouseMonthly * 36;
    var lastIn = Math.max(0, last.housingIn);
    var rows = [];
    var bal = cm.usable;
    rows.push([HH.contractMonth + ' 적립 완료, 계약금 지급 전', n1(bal), '기존 보증금 ' + fmt.short(dep) + '은 아직 미반환']);
    bal -= down; rows.push(['계약금 ' + fmt.short(down) + ' 지급 후', n1(bal), '계약금은 이미 지급한 주거자금']);
    var m = HH.contractMonth;
    while (m < tm) { m = P.dates.addMonths(m, 1); var rw = at(m); bal += Math.max(0, rw.housingIn); rows.push([m + ' 적립 후', n1(bal), '월 ' + fmt.short(Math.max(0, rw.housingIn)) + ' 적립']); }
    bal += dep; rows.push(['기존 보증금 ' + fmt.short(dep) + ' 반환 후', n1(bal), '실제 입금 확인']);
    var ownRest = own - down;
    bal -= ownRest; rows.push(['본인 잔금 분담 ' + fmt.short(ownRest) + ' 지급 후', n1(bal), '배우자 ' + fmt.short(sp) + '·대출 ' + fmt.short(HH.loan) + ' 별도 투입']);
    var beforeCost = bal;
    bal -= cost; rows.push([{ html: '<strong>부대비용 ' + fmt.short(cost) + ' 지급 후</strong>' }, { html: '<strong class="num">' + fmt.num1(bal) + '</strong>' }, '비상금 ' + fmt.short(num(g.emergencyTarget)) + '과 별도']);
    return { rows: rows, left: bal, beforeCost: beforeCost, lastIn: lastIn, down: down, sp: sp, own: own, cost: cost, total: last.usable, early: bal - lastIn - HH.spouseMonthly, tm: tm };
  }

  /** 고객 화면용: 이사 날 지급 후 남는 돈(가구 조달 포함, 사례 고객만) */
  ui.paydayCard = function (c) {
    if (!isCase(c)) return '';
    var x = payment(c);
    if (!x) return '';
    var ok = x.left >= HH.buffer, okEarly = x.early >= HH.buffer;
    return '<section class="card" aria-labelledby="payday-h"><div class="card-head"><h2 id="payday-h">이사 날, 돈을 다 내고 나면?</h2>' + ui.badge(ok ? '충족' : '미달', ok ? 'ok' : 'bad') + '</div>' +
      '<p class="conclusion' + (ok ? ' ok' : '') + '">계약금·잔금·부대비용을 모두 내고 <strong>' + fmt.short(Math.round(x.left)) + '만원</strong>이 남아요. 비상금과는 별도예요.</p>' +
      '<ul class="rows"><li><div class="row-main"><div class="t">전세보증금 ' + fmt.short(HH.jeonse) + '만원</div><div class="s">내 몫 ' + fmt.short(x.own) + ' + 배우자 ' + fmt.short(x.sp) + ' + 전세대출 ' + fmt.short(HH.loan) + '(승인 전에는 확정 아님)</div></div></li>' +
      '<li><div class="row-main"><div class="t">남겨야 하는 돈 ' + HH.buffer + '만원 이상</div><div class="s">이사 직후 예상 못 한 비용에 대비하는 최소 완충자금</div></div></li></ul>' +
      (okEarly ? '' : '<p class="notice warn"><span aria-hidden="true">!</span><span>두 사람의 10월 저축이 들어오기 전에 잔금을 치르면 <strong>' + fmt.num1(x.early) + '만원</strong>만 남아요. 잔금일을 10월 월급·저축 뒤로 잡을 수 있는지 꼭 확인하세요.</span></p>') +
      '<p class="small muted">배우자 자금과 대출은 보고서의 가상 설정·조건부 재원이에요. 자세한 날짜별 표는 설계사 화면 → 지급일 자금표에 있어요.</p></section>';
  };

  pages.payday = function (c) {
    var head = ui.pageHead('지급일 자금표', '5단계 — 저축 원금이 충분해도 지급일에 돈이 없으면 계약할 수 없습니다');
    if (!isCase(c)) return head + notCase('지급일 자금표(가구 조달·계약 일정)');
    var x = payment(c);
    if (!x) return head + '<section class="card">' + ui.empty('계획 기간에 계약월이 없어 계산할 수 없어요.') + '</section>';
    var ok = x.left >= HH.buffer, okEarly = x.early >= HH.buffer;
    var house = x.total + x.sp + HH.loan;
    return head +
      '<section class="card"><div class="card-head"><h2>최종 판단 요약</h2>' + ui.badge(ok ? '실행 기준 충족' : '실행 기준 미달', ok ? 'ok' : 'bad') + '</div>' +
      '<p class="conclusion' + (ok ? ' ok' : '') + '">모든 지급을 마치면 <strong>' + fmt.num1(x.left) + '만원</strong>이 남아요. 최소 완충자금 ' + HH.buffer + '을 ' + (ok ? '넘습니다.' : '채우지 못합니다.') + '</p>' +
      '<div class="kpis">' +
      ui.kpi('본인 주거재원(원금)', ui.money(x.total), '기존 보증금 반환 포함') +
      ui.kpi('가구 전체 조달액', ui.money(house), '본인 + 배우자 ' + fmt.short(x.sp) + ' + 조건부 대출 ' + fmt.short(HH.loan)) +
      ui.kpi('전세보증금 + 부대비용', ui.money(HH.jeonse + x.cost), fmt.short(HH.jeonse) + ' + ' + fmt.short(x.cost)) +
      ui.kpi('완충자금 확보 후 추가 여유', ui.money(x.left - HH.buffer), fmt.num1(x.left) + ' − ' + HH.buffer) + '</div>' +
      '<p class="notice ' + (okEarly ? 'info' : 'warn') + '"><span aria-hidden="true">!</span><span>두 사람 모두 마지막 달 적립(본인 ' + fmt.short(x.lastIn) + ', 배우자 ' + HH.spouseMonthly + ') 전에 잔금을 치르면 남는 돈은 <strong>' + fmt.num1(x.early) + '만원</strong>' + (okEarly ? '입니다.' : '으로 완충자금 기준에 못 미칩니다. 조기 잔금이 불가피하면 최소 ' + fmt.num1(HH.buffer - x.early) + '만원의 확정 재원이나 같은 규모의 비용 감소가 필요하고, 확인되지 않으면 잔금일을 조정합니다. 미확정 환급금·부모 지원·대출 증액은 재원으로 자동 반영하지 않습니다.') + '</span></p>' + src('표 2') + '</section>' +
      '<section class="card"><h2>가상 실행일정</h2>' + plain([
        ['적금 가입·만기', '2027.07.30 가입 → 2029.04.30 만기'],
        ['전세계약·계약금', '2029.07.30, 계약금 ' + fmt.short(x.down) + '(보증금의 10% 가정)'],
        ['결혼예정일', '2029.10.27'],
        ['두 사람의 마지막 달 급여', '2029.10.25 입금 가정'],
        ['마지막 달 주거적립', '2029.10.26 완료 가정'],
        ['기존 보증금 반환·대출 실행·잔금', '2029.10.30, 지급 순서 확인 조건']
      ], ['항목', '가상 실행일정'], '가상 실행일정') +
      '<p class="small muted">실제 계약이 체결됐다는 뜻이 아닙니다. 계약 전에는 사전상담으로 가능성을 점검하고, 계약 후 정식 심사·승인이 진행된다는 점을 구분합니다. 계약서에는 대출 불승인 시 처리 특약을 검토합니다.</p>' + src('표 18') + '</section>' +
      '<section class="card"><h2>본인 계좌의 지급일 원금 흐름</h2>' + plain(x.rows, ['시점·거래', '본인 주거 현금잔액', '별도로 구분할 금액'], '지급일 원금 흐름') +
      '<p class="small muted">잔금 ' + fmt.short(HH.jeonse - x.down) + ' = 본인 ' + fmt.short(x.own - x.down) + ' + 배우자 ' + fmt.short(x.sp) + ' + 대출 ' + fmt.short(HH.loan) + '. 계약금은 지급 시점에 잔액에서 빠지므로 최종 잔액에 다시 넣지 않습니다. 이자 제외 원금 기준이며 엔진의 월별 계산에서 가져온 값입니다.</p>' + src('표 19') + '</section>' +
      '<section class="card"><h2>부대비용이 늘면</h2>' + plain([150, 200, 250].map(function (v) {
        var left = x.beforeCost - v;
        return [n1(v), n1(left), { html: ui.badge(left >= HH.buffer ? '충족' : '미달', left >= HH.buffer ? 'ok' : 'bad') }];
      }), ['부대비용 합계', '모든 지급 후 남는 돈', '최소 완충자금 ' + HH.buffer], '부대비용 민감도') +
      '<p>부대비용이 <strong>' + fmt.num1(x.beforeCost - HH.buffer) + '만원</strong>을 넘으면 완충자금 ' + HH.buffer + '을 유지할 수 없습니다. 이 기준을 계약 전 점검표에 넣습니다.</p>' +
      '<p class="small muted">부대비용 150은 검증된 비용이 아니라 초기 예산입니다. 중개보수는 보증금 ' + fmt.short(HH.jeonse) + ' × 상한요율 0.3% = ' + fmt.num1(HH.jeonse * 0.003) + ', 부가세 10% 포함 ' + (HH.jeonse * 0.0033).toFixed(2) + '(상한이며 실제는 협의액). 이사·청소, 대출·보증 비용, 정산 비용은 실제 견적으로 채웁니다.</p>' + src('표 20·21') + '</section>' +
      '<section class="card"><h2>입주 후 월 주거비(대출 ' + fmt.short(HH.loan) + ')</h2>' + plain([[0.033, '참고값'], [0.043, '시험 조건'], [0.053, '시험 조건']].map(function (v) {
        var it = HH.loan * v[0] / 12;
        return [(v[0] * 100).toFixed(1) + '% ' + v[1], { html: '<span class="num">' + it.toFixed(2) + '</span>' }, { html: '<span class="num">' + (it + HH.mgmtFee).toFixed(2) + '</span>' }];
      }), ['적용금리', '월 이자', '관리비 가정 ' + HH.mgmtFee + ' 포함'], '대출금리별 월 주거비') +
      '<p class="small muted">가구 전체 생활비가 아니며 원금상환·보증비용은 별도입니다. 결혼 후에는 본인 313 + 배우자 ' + HH.spouseNet + ' = ' + (313 + HH.spouseNet) + '을 출발점으로 가구 예산을 새로 작성합니다.</p>' + src('표 25') + '</section>';
  };

  /* ---------- 5. 실행 일정(표 26) ---------- */
  pages.schedule = function (c) {
    var head = ui.pageHead('실행 일정', '5단계 — 언제, 무엇을 하고, 어떤 자료로 완료를 확인하는지');
    if (!isCase(c)) return head + notCase('실행 일정표');
    return head + '<section class="card"><h2>실행 일정과 확인 자료</h2>' + plain([
      ['실행 직전', '예·적금·ETF 현금화, 대출 700 상환', '순매도대금·수수료·대출 잔액'],
      ['매월 급여일 다음 날', '생활비 195, 연금 10, 비상금·주거 적립 자동이체(완충저축 5 포함)', '자동이체 내역'],
      ['2026.11~2027.01', '잔여대출 원금 월 100과 이자 상환', '완제 확인'],
      ['2027.06', '비상금 990 완성, 주거 91.4 적립', '월말 잔액'],
      ['2027.07.30', '적금 가입(월 80, 21회), 유동자금 월 30', '가입내역·우대조건'],
      ['2028 하반기부터', '반기별 단지 실거래·대출요건 점검', '실거래 자료·기금 공지'],
      ['2029.04.30', '적금 만기금을 유동계좌로 이동', '만기 입금 내역'],
      ['2029.04~07', '매물 선정, 대출 사전상담, 권리관계·대출 불승인 특약 확인', '상담 기록·등기사항'],
      ['2029.07.30', '전세계약, 계약금 2,220 지급', '계약서·영수증'],
      ['계약 후~2029.10', '정식 대출 접수·승인, 배우자 3,200 확보 전망, 보증금 반환일 확정', '승인서·잔액 확인'],
      ['2029.10.25~30', '두 사람의 급여·마지막 적립 확인 후 보증금 반환·대출 실행·잔금·부대비용 지급', '입금·지급 내역']
    ], ['시점', '실행할 일', '확인 자료'], '실행 일정') + src('표 26') + '</section>' +
      '<section class="card"><p>지급일별 잔액은 <button class="btn btn-sm" data-action="planner-page" data-page="payday">지급일 자금표</button>에서 계산합니다.</p></section>';
  };

  /* ---------- 6. 점검 주기·경보 기준(표 27) ---------- */
  pages.cadence = function (c) {
    var head = ui.pageHead('점검 주기·기준', '6단계 — 달성률보다 「지급 후 남는 돈」을 중심으로 봅니다');
    if (!isCase(c)) return head + notCase('점검 주기와 조치 기준');
    var x = payment(c);
    return head + '<section class="card"><h2>점검 주기</h2>' + plain([
      ['매월', '고객 → 설계 담당자', '현금흐름: 잔액·납입내역 기록(앱의 이번 달 기록), 담당자가 검토'],
      ['분기', '설계 담당자', '목표 달성 전망 다시 계산'],
      ['반기', '설계 담당자', '단지 실거래 시세·전세대출 조건 점검'],
      ['혼인·이사 직전', '고객·배우자·설계 담당자', '가구 기준 재설계'],
      ['입주 후 3개월 안', '고객·배우자·설계 담당자', '확정 예산으로 가구 비상금·보험·연금·대출 관리 계획 재설계']
    ], ['주기', '누가', '무엇을'], '점검 주기') + '</section>' +
      '<section class="card"><h2>경보와 조치 기준</h2>' + plain([
        ['생활비', '195 초과가 2개월 연속', '지출 원인과 향후 적립 가능액 재계산', '앱 경보'],
        ['보완저축', '월 5 미납', '누적 부족액과 복구 일정 설정', '앱 경보(누적 저축 미달)'],
        ['비상금', '완성 후 825 미만', '주거적립 조정, 990 복구 우선', '앱 경보'],
        ['급여·세액감면', '종료일 또는 실제 소득감소가 가정과 다름', '남은 기간 적립액 재산정', '앱 경보(실수령 10% 이상 감소)'],
        ['배우자 자금', '지급일까지 3,200 확보 전망 미달', '배우자 현금흐름·분담액 재검토', '사람이 확인'],
        ['지급일', '마지막 달 적립·보증금 반환·대출 실행이 잔금보다 늦음', '날짜 조정 또는 확정 재원 확보', '지급일 자금표'],
        ['부대비용', '기본 조건에서 합계 ' + (x ? fmt.num1(x.beforeCost - HH.buffer) : '211.4') + ' 초과', '비용·주거조건·추가 재원 조정', '지급일 자금표'],
        ['실행 후 잔액', '비상금 외 완충자금 100 미만', '계약 조건 재조정', '지급일 자금표'],
        ['대출', '기본요건·예외요건·보증심사에 변화', '신청 경로와 조달표 재작성', '사람이 확인'],
        ['결혼비용', '주거자금에서 지출할 필요 발생', '개인·가구 목표를 함께 재설계', '사람이 확인']
      ], ['점검 항목', '경보 기준', '조치', '앱에서'], '경보와 조치 기준') +
      '<p class="small muted">개인 목표를 달성해도 지급일에 완충자금 100을 남기지 못하면 계약을 실행하지 않습니다. 숫자 기준은 「경보 기준」 화면에서 바꿀 수 있습니다.</p>' + src('표 27') + '</section>';
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
