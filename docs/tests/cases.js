/*
 * 정답 테스트 입력·기대값(명세 7절). Node 테스트와 화면의 '계산 검증' 탭이 함께 쓴다.
 * 기대값은 사용자 허락 없이 바꾸지 않는다(명세 0절 5).
 * 허용 오차 ±0.05만원. 2026-09가 m=1.
 */
(function (root) {
  'use strict';

  var TOLERANCE = 0.05;

  // 필드 이름 → 화면 표시 이름
  var FIELD_LABELS = {
    income: '소득',
    interest: '이자',
    principal: '원금 상환',
    debtTotal: '부채 잔액',
    debtHigh: '고금리 부채 잔액',
    debtLow: '저금리 부채 잔액(조건 제외)',
    productPay: '상품 납입',
    productBalance: '상품 잔액',
    productMaturity: '상품 만기 지급',
    depositReturn: '보증금 반환',
    emergency: '비상금',
    housing: '주거자금',
    investment: '투자자산',
    usable: '사용 가능 주거자금',
    verdict: '판정',
    payoffHigh: '고금리 부채 상환 완료월',
    judgeStatus: '목표 판정',
    judgeLabel: '목표 판정(미충족 항목)',
    shortDebt: '부채 조건 부족액',
    shortEmergency: '비상금 조건 부족액',
    shortHousing: '주거 조건 부족액',
    emergencyIn: '비상금 적립',
    debtTotalNow: '부채 잔액',
    paydayUsable: '마지막 월 납입 제외 재원',
    reachMonth: '목표 도달월',
    pension: '연금 잔액',
    surplus: '잉여',
    essential: '필수생활비'
  };

  // R 그룹(보고서 가상 고객 B안) 공통 조건
  var B_MODEL = { excludeBankProducts: true, assumptionOverrides: { housingRate: 0.02, rateBasis: 'effective' } };
  var A_MODEL = { excludeBankProducts: true, assumptionOverrides: { housingRate: 0 } };

  var CASES = [
    // A. 호환 모드(legacy) — 원본 앱 재현
    { id: 'A1', group: 'A', title: '설계 후, 2026-09', plan: 'after-v1', debtRule: 'legacy', month: '2026-09',
      expect: { interest: 7.8, principal: 57.2, debtTotal: 2042.8, emergency: 658.5, housing: 802.0, investment: 401.3 } },
    { id: 'A2', group: 'A', title: '설계 후, 2026-12', plan: 'after-v1', debtRule: 'legacy', month: '2026-12',
      expect: { productPay: 30, productBalance: 31.8, emergency: 800.0, housing: 812.9 } },
    { id: 'A3', group: 'A', title: '설계 후, 2028-08 보증금 반환', plan: 'after-v1', debtRule: 'legacy', month: '2028-08',
      expect: { depositReturn: 1000, housing: 2366.7 } },
    { id: 'A4', group: 'A', title: '설계 후, 2028-10 신용대출 완제', plan: 'after-v1', debtRule: 'legacy', month: '2028-10',
      expect: { principal: 64.0, debtTotal: 525.8 } },
    { id: 'A5', group: 'A', title: '설계 후, 2028-11 감면 종료', plan: 'after-v1', debtRule: 'legacy', month: '2028-11',
      expect: { income: 281, interest: 0.7, principal: 29.3, debtTotal: 496.5 } },
    { id: 'A6', group: 'A', title: '설계 후, 2029-12 목표월', plan: 'after-v1', debtRule: 'legacy', month: '2029-12',
      expect: { productMaturity: 1144.8, debtTotal: 112.4, emergency: 875.2, housing: 4323.4, investment: 457.0, usable: 4780.4, verdict: '미달' } },
    { id: 'A7', group: 'A', title: '설계 후, 정책상품 제외', plan: 'after-v1', debtRule: 'legacy', excludeProducts: true, month: '2029-12',
      expect: { usable: 4767.0 } },
    { id: 'A8', group: 'A', title: '설계 전, 2029-08', plan: 'before-v1', debtRule: 'legacy', month: '2029-08',
      expect: { debtTotal: 463.9, emergency: 864.4, usable: 3605.8 } },

    // B. 기본 모드(고금리 부채 규칙, 기준 연 4%)
    { id: 'B1', group: 'B', title: '설계 후, 2026-09 (A1과 같음)', plan: 'after-v1', debtRule: 'default', month: '2026-09',
      expect: { interest: 7.8, principal: 57.2, debtTotal: 2042.8, emergency: 658.5, housing: 802.0, investment: 401.3 } },
    { id: 'B2', group: 'B', title: '설계 후, 2029-12 목표월', plan: 'after-v1', debtRule: 'default', month: '2029-12',
      expect: { debtHigh: 0, payoffHigh: '2028-10', debtLow: 335.6, emergency: 875.2, housing: 4548.3, usable: 5005.2,
        judgeStatus: '미달', judgeLabel: '미달(주거)', shortDebt: 0, shortEmergency: 0, shortHousing: 194.8 } },
    { id: 'B3', group: 'B', title: '설계 후, 정책상품 제외', plan: 'after-v1', debtRule: 'default', excludeProducts: true, month: '2029-12',
      expect: { usable: 4991.8 } },

    // R. 재무설계 사례 보고서(가상 고객 B안, 최종 수정 2026-11-10) — 기대값은 보고서 본문 수치(표 14·15·16·24). 이자 제외 원금 기준.
    { id: 'R1', group: 'R', demo: 'report', title: '보고서 표 14: 2026-11 대출 원금 100·이자 1.8·비상금 8.2·주거 5', plan: 'after-v1', month: '2026-11',
      expect: { principal: 100, interest: 1.8, emergencyIn: 8.2, housing: 5 } },
    { id: 'R2', group: 'R', demo: 'report', title: '보고서 표 14·15: 2027-01 대출 완제(이자 0.6·비상금 526.4·주거 누계 15)', plan: 'after-v1', month: '2027-01',
      expect: { principal: 100, interest: 0.6, emergencyIn: 9.4, debtTotal: 0, emergency: 526.4, housing: 15 } },
    { id: 'R3', group: 'R', demo: 'report', title: '보고서 표 15: 2027-06 비상금 990 완성, 주거 누계 126.4', plan: 'after-v1', month: '2027-06',
      expect: { emergency: 990, housing: 126.4 } },
    { id: 'R4', group: 'R', demo: 'report', title: '보고서 표 2·15: 2029-10 본인 주거재원 4,311.4(원금 기준), 마지막 달 적립 전 4,203.4', plan: 'after-v1', month: '2029-10', opts: A_MODEL,
      expect: { usable: 4311.4, paydayUsable: 4203.4, judgeStatus: '전체 목표 달성' } },
    { id: 'R5', group: 'R', demo: 'report', title: '보고서 표 15: 2028-10 주거 적립누계 1,966.4(원금 기준)', plan: 'after-v1', month: '2028-10', opts: A_MODEL,
      expect: { housing: 1966.4, emergency: 990 } },
    { id: 'R6', group: 'R', demo: 'report', title: '보고서 표 16: 자유적금 월 80·21개월 만기금(기본금리 3.85%, 세후 이자 50.2)', plan: 'after-v1', month: '2029-04', opts: { assumptionOverrides: { housingRate: 0, bankInterestInGoal: true } },
      expect: { productMaturity: 1730.16 } },
    { id: 'R7', group: 'R', demo: 'report', title: '보고서 표 14: 2029-06 감면 종료 후 실수령 313', plan: 'after-v1', month: '2029-06', opts: A_MODEL,
      expect: { income: 313 } },
    { id: 'R8', group: 'R', demo: 'report', title: '보고서 표 24: 생활비 전체 연 2.3% 상승(13·25개월 차) → 약 4,148.7', plan: 'after-v1', month: '2029-10',
      opts: { excludeBankProducts: true, assumptionOverrides: { housingRate: 0, livingGrowth: 0.023 } },
      expect: { usable: 4148.7 } },
    { id: 'R9', group: 'R', demo: 'report', title: '보고서 표 15: 2029-09 주거재원 4,203.4(기존 보증금 포함 기준, 반환 전 3,203.4)', plan: 'after-v1', month: '2029-09', opts: A_MODEL,
      expect: { housing: 3203.4 } },
    { id: 'R10', group: 'R', demo: 'report', title: '보고서 표 24: 2027-11~2028-01 실직(생활비 165, 연금·주거 중지) → 3,471.4, 약 43개월(2030-05)', plan: 'after-v1', month: '2029-10', opts: A_MODEL,
      scenarios: [{ type: 'jobLoss', start: '2027-11', months: 3, value: 0, living: 165, pausePension: true }],
      expect: { usable: 3471.4, reachMonth: '2030-05' } },
    { id: 'R11', group: 'R', demo: 'report', title: '보고서 표 24: 2027-11부터 6개월 소득 20% 감소(생활비 185) → 3,987.4', plan: 'after-v1', month: '2029-10', opts: A_MODEL,
      scenarios: [{ type: 'incomeDrop', start: '2027-11', months: 6, value: 0.2, living: 185 }],
      expect: { usable: 3987.4 } },

    // C. 독립 검산(가상 고객 C, 보고서와 무관) — 기대값은 엔진 코드를 쓰지 않고 엑셀 수식으로 계산한 검산표 값.
    { id: 'C1', group: 'C', demo: 'verify', title: '독립 검산: 2026-12 첫 달(초기 상환 200 후 카드론 이자·원금, 비상금 이자)', plan: 'verify-v1', month: '2026-12',
      expect: { interest: 4.0, principal: 43.0, debtHigh: 167.3, emergency: 378.3, housing: 611.0 } },
    { id: 'C2', group: 'C', demo: 'verify', title: '독립 검산: 2027-05 카드론 완제, 남은 상환 예산은 잉여로', plan: 'verify-v1', month: '2027-05',
      expect: { payoffHigh: '2027-05', principal: 43.1, surplus: 9.9, debtLow: 1138.0 } },
    { id: 'C3', group: 'C', demo: 'verify', title: '독립 검산: 2028-01 감면 종료(−5)·생활비 2.3% 상승', plan: 'verify-v1', month: '2028-01',
      expect: { income: 255, essential: 122.8, surplus: 34.1 } },
    { id: 'C4', group: 'C', demo: 'verify', title: '독립 검산: 2028-03 적금 만기(단리, 세후 이자 포함)·비상금 목표 도달', plan: 'verify-v1', month: '2028-03',
      expect: { productMaturity: 365.8, emergency: 720.0, housing: 1190.0 } },
    { id: 'C5', group: 'C', demo: 'verify', title: '독립 검산: 2028-09 보증금 800 반환', plan: 'verify-v1', month: '2028-09',
      expect: { depositReturn: 800, housing: 2388.1 } },
    { id: 'C6', group: 'C', demo: 'verify', title: '독립 검산: 2028-11 목표월 판정(주거 250.7 부족 → 미달)', plan: 'verify-v1', month: '2028-11',
      expect: { usable: 2849.3, emergency: 724.8, debtLow: 948.7, judgeStatus: '미달', shortHousing: 250.7 } }
  ];

  function getActual(field, row, result) {
    var j = result.judgement;
    var cond = function (key) {
      for (var i = 0; i < j.conditions.length; i++) if (j.conditions[i].key === key) return j.conditions[i].shortfall;
      return undefined;
    };
    switch (field) {
      case 'payoffHigh': return result.payoff.high;
      case 'judgeStatus': return j.status;
      case 'judgeLabel': return j.label;
      case 'shortDebt': return cond('debt');
      case 'shortEmergency': return cond('emergency');
      case 'shortHousing': return cond('housing');
      case 'paydayUsable': return row ? row.usable - Math.max(0, row.housingIn) : undefined;
      case 'reachMonth': return result.reachMonth;
      default: return row ? row[field] : undefined;
    }
  }

  /**
   * 사례 하나 실행.
   * @param {object} c 사례
   * @param {object} P { engine, demo } (Node: require 결과, 브라우저: window.Planner)
   * @returns {{id, title, pass, checks:[{field,label,expected,actual,pass}]}}
   */
  function runCase(c, P) {
    var state = c.demo === 'report' ? P.demo.getDemo() : c.demo === 'verify' ? P.demo.getVerifyDemo() : P.demo.getLegacyDemo();
    var opts = Object.assign({ debtRule: c.debtRule, excludeProducts: !!c.excludeProducts }, c.opts || {});
    if (c.scenarios) opts = P.scenarios.withScenarios(state, c.scenarios, opts);
    var result = P.engine.runPlan(state, c.plan, opts);
    if (c.expect.reachMonth !== undefined) {
      // 목표월 이후로 계산을 늘려 처음으로 목표 금액(보증금+부대비용)에 닿는 달
      var ext = P.engine.runPlan(state, c.plan, Object.assign({}, opts, { endMonth: P.dates.addMonths(result.input.targetMonth, 24) }));
      var goal = ext.input.goal, need = Number(goal.depositTarget) + Number(goal.movingCost);
      var hit = ext.rows.filter(function (r) { return r.month >= result.input.targetMonth && r.usable >= need - 1e-9; })[0];
      result.reachMonth = hit ? hit.month : '도달 안 함';
    }
    var row = P.engine.rowAt(result, c.month);
    var checks = Object.keys(c.expect).map(function (field) {
      var expected = c.expect[field];
      var actual = getActual(field, row, result);
      var pass = typeof expected === 'number'
        ? typeof actual === 'number' && Math.abs(actual - expected) <= TOLERANCE
        : actual === expected;
      return { field: field, label: FIELD_LABELS[field] || field, expected: expected, actual: actual, pass: pass };
    });
    return {
      id: c.id,
      group: c.group,
      title: c.title,
      pass: checks.every(function (x) { return x.pass; }),
      checks: checks
    };
  }

  function runAll(P) {
    return CASES.map(function (c) { return runCase(c, P); });
  }

  var api = { TOLERANCE: TOLERANCE, FIELD_LABELS: FIELD_LABELS, CASES: CASES, runCase: runCase, runAll: runAll };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Planner = root.Planner || {};
    root.Planner.cases = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
