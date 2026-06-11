(function (global) {
  "use strict";

  function toNonNegativeInteger(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
      return 0;
    }
    return Math.floor(number);
  }

  function validateCosts(singleCost, tenCost) {
    const single = toNonNegativeInteger(singleCost);
    const ten = toNonNegativeInteger(tenCost);

    if (single < 1 || ten < 1) {
      throw new RangeError("1連と10連の必要石数は1以上にしてください。");
    }

    return { single, ten };
  }

  function maxDrawsFromStones(stones, singleCost, tenCost) {
    const budget = toNonNegativeInteger(stones);
    const { single, ten } = validateCosts(singleCost, tenCost);

    if (ten >= single * 10) {
      return Math.floor(budget / single);
    }

    const tenDraws = Math.floor(budget / ten);
    const remainder = budget - tenDraws * ten;
    return tenDraws * 10 + Math.floor(remainder / single);
  }

  function optimalStonePlan(stones, singleCost, tenCost) {
    const budget = toNonNegativeInteger(stones);
    const { single, ten } = validateCosts(singleCost, tenCost);
    let tenPulls = 0;
    let singlePulls = 0;

    if (ten < single * 10) {
      tenPulls = Math.floor(budget / ten);
      singlePulls = Math.floor((budget - tenPulls * ten) / single);
    } else {
      singlePulls = Math.floor(budget / single);
    }

    const spentStones = tenPulls * ten + singlePulls * single;
    return {
      draws: tenPulls * 10 + singlePulls,
      tenPulls,
      singlePulls,
      spentStones,
      remainingStones: budget - spentStones,
    };
  }

  function minStonesForDraws(draws, singleCost, tenCost) {
    const targetDraws = toNonNegativeInteger(draws);
    const { single, ten } = validateCosts(singleCost, tenCost);

    if (ten >= single * 10) {
      return targetDraws * single;
    }

    const tenDraws = Math.floor(targetDraws / 10);
    const remainingSingles = targetDraws % 10;
    return tenDraws * ten + remainingSingles * single;
  }

  function ticketDraws(ticketCount, drawsPerTicket) {
    return (
      toNonNegativeInteger(ticketCount) *
      toNonNegativeInteger(drawsPerTicket)
    );
  }

  function ceilingStatus(options) {
    const remainingDraws = Math.max(
      0,
      toNonNegativeInteger(options.ceiling) -
        toNonNegativeInteger(options.currentPity)
    );
    const drawsFromTickets = ticketDraws(
      options.tickets,
      options.drawsPerTicket
    );
    const stoneDrawsNeeded = Math.max(0, remainingDraws - drawsFromTickets);
    const stonesNeeded = minStonesForDraws(
      stoneDrawsNeeded,
      options.singleCost,
      options.tenCost
    );
    const stones = toNonNegativeInteger(options.stones);

    return {
      remainingDraws,
      drawsFromTickets,
      stoneDrawsNeeded,
      stonesNeeded,
      stoneShortage: Math.max(0, stonesNeeded - stones),
      reachable: stones >= stonesNeeded,
    };
  }

  function exchangePointStatus(options) {
    const exchangeCost = Math.max(
      1,
      toNonNegativeInteger(options.exchangeCost)
    );
    const currentPoints = toNonNegativeInteger(options.currentPoints);
    const availableDraws =
      ticketDraws(options.tickets, options.drawsPerTicket) +
      maxDrawsFromStones(
        options.stones,
        options.singleCost,
        options.tenCost
      );
    const pointsNeeded = Math.max(0, exchangeCost - currentPoints);
    const pointsAfterDraws = currentPoints + availableDraws;

    return {
      exchangeCost,
      currentPoints,
      pointsNeeded,
      availableDraws,
      pointsAfterDraws,
      pointsShortageAfterDraws: Math.max(0, exchangeCost - pointsAfterDraws),
      exchangeableNow: Math.floor(currentPoints / exchangeCost),
      exchangeableAfterDraws: Math.floor(pointsAfterDraws / exchangeCost),
      remainingPointsAfterExchange: pointsAfterDraws % exchangeCost,
      pointsToNextExchange:
        exchangeCost - (pointsAfterDraws % exchangeCost),
      reachable: pointsAfterDraws >= exchangeCost,
    };
  }

  function probabilityStats(draws, ratePercent) {
    const drawCount = toNonNegativeInteger(draws);
    const numericRate = Number(ratePercent);
    const boundedRate = Number.isFinite(numericRate)
      ? Math.min(100, Math.max(0, numericRate))
      : 0;
    const probability = boundedRate / 100;

    return {
      draws: drawCount,
      ratePercent: boundedRate,
      expectedHits: drawCount * probability,
      atLeastOneProbability:
        drawCount === 0 ? 0 : 1 - Math.pow(1 - probability, drawCount),
    };
  }

  function simulateHits(draws, ratePercent, random) {
    const drawCount = toNonNegativeInteger(draws);
    const probability = probabilityStats(1, ratePercent).ratePercent / 100;
    const randomValue = typeof random === "function" ? random : Math.random;
    if (drawCount > 100000) {
      const mean = drawCount * probability;
      const deviation = Math.sqrt(drawCount * probability * (1 - probability));
      const first = Math.max(Number.EPSILON, randomValue());
      const second = randomValue();
      const normal =
        Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
      return Math.max(
        0,
        Math.min(drawCount, Math.round(mean + deviation * normal))
      );
    }

    let hits = 0;

    for (let index = 0; index < drawCount; index += 1) {
      if (randomValue() < probability) {
        hits += 1;
      }
    }

    return hits;
  }

  function simulateRarities(draws, rates, random) {
    const drawCount = toNonNegativeInteger(draws);
    const randomValue = typeof random === "function" ? random : Math.random;
    const entries = Object.entries(rates).map(([rarity, rate]) => [
      rarity,
      probabilityStats(1, rate).ratePercent / 100,
    ]);
    const rateTotal = entries.reduce(
      (sum, entry) => sum + entry[1],
      0
    );
    if (Math.abs(rateTotal - 1) >= 0.000000001) {
      throw new RangeError("排出率の合計は100%にしてください。");
    }
    const results = Object.fromEntries(
      entries.map(([rarity]) => [rarity, 0])
    );
    results.other = 0;

    for (let drawIndex = 0; drawIndex < drawCount; drawIndex += 1) {
      const roll = randomValue();
      let threshold = 0;
      let matched = false;

      for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
        const [rarity, probability] = entries[entryIndex];
        threshold += probability;
        if (roll < threshold || entryIndex === entries.length - 1) {
          results[rarity] += 1;
          matched = true;
          break;
        }
      }

      if (!matched) {
        results.other += 1;
      }
    }

    return results;
  }

  function percentile(sortedValues, probability) {
    if (sortedValues.length === 0) {
      return 0;
    }
    const index = Math.min(
      sortedValues.length - 1,
      Math.max(0, Math.ceil(sortedValues.length * probability) - 1)
    );
    return sortedValues[index];
  }

  function simulateRarityTrials(draws, rates, trialCount, random) {
    const trials = Math.max(1, toNonNegativeInteger(trialCount));
    const rarityKeys = Object.keys(rates);
    const samples = Object.fromEntries(
      rarityKeys.map((rarity) => [rarity, []])
    );

    for (let trialIndex = 0; trialIndex < trials; trialIndex += 1) {
      const result = simulateRarities(draws, rates, random);
      const resultTotal = rarityKeys.reduce(
        (sum, rarity) => sum + result[rarity],
        0
      );
      if (resultTotal !== toNonNegativeInteger(draws)) {
        throw new Error("抽選結果の合計がガチャ回数と一致しません。");
      }
      for (const rarity of rarityKeys) {
        samples[rarity].push(result[rarity]);
      }
    }

    const statistics = Object.fromEntries(
      rarityKeys.map((rarity) => {
        const values = samples[rarity];
        const sorted = [...values].sort((a, b) => a - b);
        return [
          rarity,
          {
            average:
              values.reduce((sum, value) => sum + value, 0) / trials,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            lower10: percentile(sorted, 0.1),
            upper10: percentile(sorted, 0.9),
          },
        ];
      })
    );
    const star5Values = samples.star5 || [];
    const thresholdProbability = (threshold) =>
      star5Values.filter((value) => value >= threshold).length / trials;

    return {
      draws: toNonNegativeInteger(draws),
      trials,
      statistics,
      star5Probabilities: {
        zero:
          star5Values.filter((value) => value === 0).length / trials,
        atLeast1: thresholdProbability(1),
        atLeast3: thresholdProbability(3),
        atLeast5: thresholdProbability(5),
      },
    };
  }

  function localDayNumber(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function remainingEarningDays(endDateValue, includeToday, nowValue) {
    if (!endDateValue) {
      return null;
    }

    const endDate = new Date(endDateValue);
    const now = nowValue ? new Date(nowValue) : new Date();

    if (
      Number.isNaN(endDate.getTime()) ||
      Number.isNaN(now.getTime()) ||
      endDate.getTime() <= now.getTime()
    ) {
      return 0;
    }

    const dayDifference = Math.round(
      (localDayNumber(endDate) - localDayNumber(now)) / 86400000
    );
    return Math.max(0, dayDifference + (includeToday ? 1 : 0));
  }

  const calculator = {
    toNonNegativeInteger,
    maxDrawsFromStones,
    optimalStonePlan,
    minStonesForDraws,
    ticketDraws,
    ceilingStatus,
    exchangePointStatus,
    probabilityStats,
    simulateHits,
    simulateRarities,
    simulateRarityTrials,
    remainingEarningDays,
  };

  global.GachaCalculator = calculator;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = calculator;
  }
})(typeof window !== "undefined" ? window : globalThis);
