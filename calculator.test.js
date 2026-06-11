"use strict";

const assert = require("node:assert/strict");
const calculator = require("./calculator.js");

function test(name, callback) {
  try {
    callback();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

test("ケース1: 11回に必要な最小石数は1150石", () => {
  assert.equal(calculator.minStonesForDraws(11, 150, 1000), 1150);
});

test("ケース2: 10回に必要な最小石数は1000石", () => {
  assert.equal(calculator.minStonesForDraws(10, 100, 1200), 1000);
});

test("ケース3: 指定値では500石不足して天井到達不可", () => {
  const result = calculator.ceilingStatus({
    ceiling: 30,
    currentPity: 0,
    tickets: 10,
    drawsPerTicket: 1,
    stones: 1500,
    singleCost: 100,
    tenCost: 1000,
  });

  assert.equal(result.stoneDrawsNeeded, 20);
  assert.equal(result.stonesNeeded, 2000);
  assert.equal(result.reachable, false);
  assert.equal(result.stoneShortage, 500);
});

test("ケース3の境界値: 石2000個なら天井到達可能", () => {
  const result = calculator.ceilingStatus({
    ceiling: 30,
    currentPity: 0,
    tickets: 10,
    drawsPerTicket: 1,
    stones: 2000,
    singleCost: 100,
    tenCost: 1000,
  });

  assert.equal(result.reachable, true);
  assert.equal(result.stoneShortage, 0);
});

test("ケース4: 終了日時を過ぎている場合は残り日数0", () => {
  assert.equal(
    calculator.remainingEarningDays(
      "2026-06-11T23:59",
      true,
      "2026-06-12T12:00"
    ),
    0
  );
});

test("今日分オフでは明日から終了日までを数える", () => {
  assert.equal(
    calculator.remainingEarningDays(
      "2026-06-14T23:59",
      false,
      "2026-06-12T12:00"
    ),
    2
  );
});

test("今日分オンでは今日から終了日までを数える", () => {
  assert.equal(
    calculator.remainingEarningDays(
      "2026-06-14T23:59",
      true,
      "2026-06-12T12:00"
    ),
    3
  );
});

test("10連が割安なら所持石から最大回数を求める", () => {
  assert.equal(calculator.maxDrawsFromStones(1150, 150, 1000), 11);
});

test("1連が割安なら所持石から最大回数を求める", () => {
  assert.equal(calculator.maxDrawsFromStones(1200, 100, 1200), 12);
});

test("交換ポイントは引いた回数を加算して複数交換数を求める", () => {
  const result = calculator.exchangePointStatus({
    exchangeCost: 300,
    currentPoints: 300,
    tickets: 10,
    drawsPerTicket: 1,
    stones: 29000,
    singleCost: 100,
    tenCost: 1000,
  });

  assert.equal(result.pointsAfterDraws, 600);
  assert.equal(result.exchangeableAfterDraws, 2);
  assert.equal(result.remainingPointsAfterExchange, 0);
  assert.equal(result.pointsToNextExchange, 300);
});

test("排出率1%を100回引く期待値は1体", () => {
  const result = calculator.probabilityStats(100, 1);
  assert.equal(result.expectedHits, 1);
  assert.ok(result.atLeastOneProbability > 0.63);
  assert.ok(result.atLeastOneProbability < 0.64);
});

test("資源使用プランは割安な10連を優先して残石も返す", () => {
  const result = calculator.optimalStonePlan(1150, 150, 1000);
  assert.deepEqual(result, {
    draws: 11,
    tenPulls: 1,
    singlePulls: 1,
    spentStones: 1150,
    remainingStones: 0,
  });
});

test("固定乱数でガチャ結果を再現できる", () => {
  const values = [0.01, 0.8, 0.04, 0.9];
  let index = 0;
  const hits = calculator.simulateHits(4, 5, () => values[index++]);
  assert.equal(hits, 2);
});

test("レア度別ガチャ抽選を確率帯に割り当てる", () => {
  const values = [0.005, 0.05, 0.3, 0.8];
  let index = 0;
  const result = calculator.simulateRarities(
    4,
    { star5: 1, star4: 9, star3: 40, star2: 50 },
    () => values[index++]
  );

  assert.deepEqual(result, {
    star5: 1,
    star4: 1,
    star3: 1,
    star2: 1,
    other: 0,
  });
});

test("各試行のレア度別合計は必ずガチャ回数と一致する", () => {
  const values = [
    0.005, 0.05, 0.3, 0.8,
    0.7, 0.2, 0.02, 0.95,
  ];
  let index = 0;
  const random = () => values[index++ % values.length];
  const rates = { star5: 1, star4: 9, star3: 40, star2: 50 };

  for (let trial = 0; trial < 20; trial += 1) {
    const result = calculator.simulateRarities(8, rates, random);
    const total =
      result.star5 + result.star4 + result.star3 + result.star2;
    assert.equal(total, 8);
    assert.equal(result.other, 0);
  }
});

test("排出率の合計が100%でない抽選は拒否する", () => {
  assert.throws(
    () =>
      calculator.simulateRarities(10, {
        star5: 1,
        star4: 9,
        star3: 40,
        star2: 49,
      }),
    /100%/
  );
});

test("統計シミュレーションは平均・最小・最大・分位点を返す", () => {
  const values = [0.005, 0.05, 0.3, 0.8];
  let index = 0;
  const result = calculator.simulateRarityTrials(
    4,
    { star5: 1, star4: 9, star3: 40, star2: 50 },
    10,
    () => values[index++ % values.length]
  );

  assert.equal(result.statistics.star5.average, 1);
  assert.equal(result.statistics.star5.min, 1);
  assert.equal(result.statistics.star5.max, 1);
  assert.equal(result.star5Probabilities.zero, 0);
  assert.equal(result.star5Probabilities.atLeast1, 1);
});

test("狙いの★5とその他★5を分けても抽選合計はガチャ回数と一致する", () => {
  const values = [0.001, 0.005, 0.02, 0.2, 0.8];
  let index = 0;
  const result = calculator.simulateRarities(
    5,
    { target5: 0.3, star5Other: 0.7, star4: 9, star3: 40, star2: 50 },
    () => values[index++]
  );

  assert.deepEqual(result, {
    target5: 1,
    star5Other: 1,
    star4: 1,
    star3: 1,
    star2: 1,
    other: 0,
  });
});

test("分割した★5も統計上は合算して★5確率を求める", () => {
  const values = [0.001, 0.005, 0.2, 0.8];
  let index = 0;
  const result = calculator.simulateRarityTrials(
    4,
    { target5: 0.3, star5Other: 0.7, star4: 9, star3: 40, star2: 50 },
    5,
    () => values[index++ % values.length]
  );

  assert.equal(result.statistics.target5.average, 1);
  assert.equal(result.statistics.star5Other.average, 1);
  assert.equal(result.star5Probabilities.zero, 0);
  assert.equal(result.star5Probabilities.atLeast1, 1);
});

test("ソフト天井は天井回数で★5排出率を100%にする", () => {
  assert.equal(calculator.star5RateForDraw(0.6, 89, 74, 90), 100);
  assert.equal(calculator.star5RateForDraw(0.6, 0, 74, 90), 0.6);
  assert.ok(calculator.star5RateForDraw(0.6, 80, 74, 90) > 0.6);
});

test("すり抜け後の次の★5は狙い確定になる", () => {
  const values = [
    0, 0.9,
    0, 0.9,
  ];
  let index = 0;
  const result = calculator.simulateFeaturedPityRarities(
    2,
    { target5: 50, star5Other: 50, star4: 0, star3: 0, star2: 0 },
    {
      currentPity: 0,
      softPityStart: 0,
      hardPity: 1,
      guaranteeAfterMiss: true,
      featuredGuaranteed: false,
    },
    () => values[index++]
  );

  assert.equal(result.star5Other, 1);
  assert.equal(result.target5, 1);
});
