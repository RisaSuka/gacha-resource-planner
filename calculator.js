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

  function targetExchangeStatus(options) {
    const targetCopies = Math.max(1, toNonNegativeInteger(options.targetCopies));
    const exchangeCost = Math.max(
      1,
      toNonNegativeInteger(options.exchangeCost)
    );
    const currentPoints = toNonNegativeInteger(options.currentPoints);
    const drawsFromTickets = ticketDraws(
      options.tickets,
      options.drawsPerTicket
    );
    const requiredPoints = targetCopies * exchangeCost;
    const pointsNeeded = Math.max(0, requiredPoints - currentPoints);
    const stoneDrawsNeeded = Math.max(0, pointsNeeded - drawsFromTickets);
    const stonesNeeded = minStonesForDraws(
      stoneDrawsNeeded,
      options.singleCost,
      options.tenCost
    );
    const stones = toNonNegativeInteger(options.stones);

    return {
      targetCopies,
      requiredPoints,
      pointsNeeded,
      drawsFromTickets,
      stoneDrawsNeeded,
      stonesNeeded,
      stoneShortage: Math.max(0, stonesNeeded - stones),
      reachable: stones >= stonesNeeded,
    };
  }

  function targetPityStatus(options) {
    const targetCopies = Math.max(1, toNonNegativeInteger(options.targetCopies));
    const hardPity = Math.max(1, toNonNegativeInteger(options.hardPity));
    const currentPity = Math.min(
      hardPity,
      toNonNegativeInteger(options.currentPity)
    );
    const featuredGuaranteed = Boolean(options.featuredGuaranteed);
    const guaranteeAfterMiss = Boolean(options.guaranteeAfterMiss);
    const targetAlwaysOnStar5 = Boolean(options.targetAlwaysOnStar5);
    const drawsFromTickets = ticketDraws(
      options.tickets,
      options.drawsPerTicket
    );
    let guaranteedDrawsNeeded = 0;

    if (targetAlwaysOnStar5) {
      guaranteedDrawsNeeded =
        Math.max(0, hardPity - currentPity) +
        Math.max(0, targetCopies - 1) * hardPity;
    } else if (featuredGuaranteed) {
      guaranteedDrawsNeeded = Math.max(0, hardPity - currentPity);
      if (targetCopies > 1) {
        if (!guaranteeAfterMiss) {
          guaranteedDrawsNeeded = null;
        } else {
          guaranteedDrawsNeeded += (targetCopies - 1) * hardPity * 2;
        }
      }
    } else if (guaranteeAfterMiss) {
      guaranteedDrawsNeeded =
        Math.max(0, hardPity - currentPity) +
        (targetCopies * 2 - 1) * hardPity;
    } else {
      guaranteedDrawsNeeded = null;
    }

    if (guaranteedDrawsNeeded === null) {
      return {
        targetCopies,
        guaranteed: false,
        guaranteedDrawsNeeded: null,
        drawsFromTickets,
        stoneDrawsNeeded: null,
        stonesNeeded: null,
        stoneShortage: null,
        reachable: false,
      };
    }

    const stoneDrawsNeeded = Math.max(0, guaranteedDrawsNeeded - drawsFromTickets);
    const stonesNeeded = minStonesForDraws(
      stoneDrawsNeeded,
      options.singleCost,
      options.tenCost
    );
    const stones = toNonNegativeInteger(options.stones);

    return {
      targetCopies,
      guaranteed: true,
      guaranteedDrawsNeeded,
      drawsFromTickets,
      stoneDrawsNeeded,
      stonesNeeded,
      stoneShortage: Math.max(0, stonesNeeded - stones),
      reachable: stones >= stonesNeeded,
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

  function star5RateForDraw(baseRatePercent, pityCount, softPityStart, hardPity) {
    const baseRate = probabilityStats(1, baseRatePercent).ratePercent;
    const currentPity = toNonNegativeInteger(pityCount);
    const softStart = toNonNegativeInteger(softPityStart);
    const hard = toNonNegativeInteger(hardPity);
    const nextDrawCount = currentPity + 1;

    if (hard > 0 && nextDrawCount >= hard) {
      return 100;
    }
    if (softStart < 1 || hard <= softStart || nextDrawCount <= softStart) {
      return baseRate;
    }

    const progress = (nextDrawCount - softStart) / (hard - softStart);
    return Math.min(100, baseRate + (100 - baseRate) * progress);
  }

  function simulateFeaturedPityRarities(draws, rates, options, random) {
    const drawCount = toNonNegativeInteger(draws);
    const randomValue = typeof random === "function" ? random : Math.random;
    const baseStar5Rate = probabilityStats(
      1,
      rates.star5 ?? Number(rates.target5 || 0) + Number(rates.star5Other || 0)
    ).ratePercent;
    const targetRate = probabilityStats(1, rates.target5).ratePercent;
    const normalFeaturedChance =
      baseStar5Rate > 0 ? Math.min(1, targetRate / baseStar5Rate) : 0;
    const nonStarRates = {
      star4: probabilityStats(1, rates.star4).ratePercent,
      star3: probabilityStats(1, rates.star3).ratePercent,
      star2: probabilityStats(1, rates.star2).ratePercent,
    };
    const baseTotal =
      baseStar5Rate +
      nonStarRates.star4 +
      nonStarRates.star3 +
      nonStarRates.star2;
    if (Math.abs(baseTotal - 100) >= 0.000001) {
      throw new RangeError("排出率の合計は100%にしてください。");
    }

    const results = {
      target5: 0,
      star5Other: 0,
      star4: 0,
      star3: 0,
      star2: 0,
      other: 0,
    };
    let pityCount = toNonNegativeInteger(options?.currentPity);
    let featuredGuaranteed = Boolean(options?.featuredGuaranteed);
    const guaranteeAfterMiss = Boolean(options?.guaranteeAfterMiss);
    const softPityStart = toNonNegativeInteger(options?.softPityStart);
    const hardPity = toNonNegativeInteger(options?.hardPity);

    for (let drawIndex = 0; drawIndex < drawCount; drawIndex += 1) {
      const star5Rate =
        star5RateForDraw(
          baseStar5Rate,
          pityCount,
          softPityStart,
          hardPity
        ) / 100;
      const roll = randomValue();

      if (roll < star5Rate) {
        const isTarget =
          featuredGuaranteed || randomValue() < normalFeaturedChance;
        if (isTarget) {
          results.target5 += 1;
          featuredGuaranteed = false;
        } else {
          results.star5Other += 1;
          featuredGuaranteed = guaranteeAfterMiss;
        }
        pityCount = 0;
        continue;
      }

      const nonStarRoll = randomValue();
      const nonStarTotal = Math.max(Number.EPSILON, 100 - baseStar5Rate);
      const star4Threshold = nonStarRates.star4 / nonStarTotal;
      const star3Threshold =
        (nonStarRates.star4 + nonStarRates.star3) / nonStarTotal;

      if (nonStarRoll < star4Threshold) {
        results.star4 += 1;
      } else if (nonStarRoll < star3Threshold) {
        results.star3 += 1;
      } else {
        results.star2 += 1;
      }
      pityCount += 1;
    }

    return results;
  }

  function featuredPityProbabilityStats(draws, rates, options) {
    const drawCount = toNonNegativeInteger(draws);
    const baseStar5Rate = probabilityStats(
      1,
      rates.star5 ?? Number(rates.target5 || 0) + Number(rates.star5Other || 0)
    ).ratePercent;
    const targetRate = probabilityStats(1, rates.target5).ratePercent;
    const normalFeaturedChance =
      baseStar5Rate > 0 ? Math.min(1, targetRate / baseStar5Rate) : 0;
    const nonStarRates = {
      star4: probabilityStats(1, rates.star4).ratePercent,
      star3: probabilityStats(1, rates.star3).ratePercent,
      star2: probabilityStats(1, rates.star2).ratePercent,
    };
    const baseTotal =
      baseStar5Rate +
      nonStarRates.star4 +
      nonStarRates.star3 +
      nonStarRates.star2;
    if (Math.abs(baseTotal - 100) >= 0.000001) {
      throw new RangeError("排出率の合計は100%にしてください。");
    }

    const keys = ["target5", "star5Other", "star4", "star3", "star2"];
    const keyBits = Object.fromEntries(keys.map((key, index) => [key, 1 << index]));
    const expected = Object.fromEntries(keys.map((key) => [key, 0]));
    const softPityStart = toNonNegativeInteger(options?.softPityStart);
    const hardPity = toNonNegativeInteger(options?.hardPity);
    const guaranteeAfterMiss = Boolean(options?.guaranteeAfterMiss);
    const initialPity = toNonNegativeInteger(options?.currentPity);
    const initialFeaturedGuaranteed = Boolean(options?.featuredGuaranteed);
    let states = new Map([
      [`${initialPity}|${initialFeaturedGuaranteed ? 1 : 0}|0`, 1],
    ]);

    function addState(map, pityCount, featuredGuaranteed, mask, probability) {
      if (probability <= 0) {
        return;
      }
      const key = `${pityCount}|${featuredGuaranteed ? 1 : 0}|${mask}`;
      map.set(key, (map.get(key) || 0) + probability);
    }

    function addHit(map, rarity, probability, nextPity, nextGuaranteed, mask) {
      expected[rarity] += probability;
      addState(
        map,
        nextPity,
        nextGuaranteed,
        mask | keyBits[rarity],
        probability
      );
    }

    for (let drawIndex = 0; drawIndex < drawCount; drawIndex += 1) {
      const nextStates = new Map();
      for (const [stateKey, stateProbability] of states) {
        const [pityPart, guaranteedPart, maskPart] = stateKey.split("|");
        const pityCount = Number(pityPart);
        const featuredGuaranteed = guaranteedPart === "1";
        const mask = Number(maskPart);
        const star5Probability =
          star5RateForDraw(
            baseStar5Rate,
            pityCount,
            softPityStart,
            hardPity
          ) / 100;
        const targetProbability = featuredGuaranteed
          ? star5Probability
          : star5Probability * normalFeaturedChance;
        const otherStar5Probability = featuredGuaranteed
          ? 0
          : star5Probability * (1 - normalFeaturedChance);
        const nonStarProbability = Math.max(0, 1 - star5Probability);
        const nonStarTotal = Math.max(Number.EPSILON, 100 - baseStar5Rate);

        addHit(nextStates, "target5", stateProbability * targetProbability, 0, false, mask);
        addHit(
          nextStates,
          "star5Other",
          stateProbability * otherStar5Probability,
          0,
          guaranteeAfterMiss,
          mask
        );
        addHit(
          nextStates,
          "star4",
          stateProbability * nonStarProbability * (nonStarRates.star4 / nonStarTotal),
          pityCount + 1,
          featuredGuaranteed,
          mask
        );
        addHit(
          nextStates,
          "star3",
          stateProbability * nonStarProbability * (nonStarRates.star3 / nonStarTotal),
          pityCount + 1,
          featuredGuaranteed,
          mask
        );
        addHit(
          nextStates,
          "star2",
          stateProbability * nonStarProbability * (nonStarRates.star2 / nonStarTotal),
          pityCount + 1,
          featuredGuaranteed,
          mask
        );
      }
      states = nextStates;
    }

    const atLeastOne = Object.fromEntries(keys.map((key) => [key, 0]));
    for (const [stateKey, probability] of states) {
      const mask = Number(stateKey.split("|")[2]);
      for (const key of keys) {
        if (mask & keyBits[key]) {
          atLeastOne[key] += probability;
        }
      }
    }

    return Object.fromEntries(
      keys.map((key) => [
        key,
        {
          expectedHits: expected[key],
          atLeastOneProbability: atLeastOne[key],
          ratePercent: 0,
        },
      ])
    );
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

  function simulateRarityTrials(draws, rates, trialCount, random, options) {
    const trials = Math.max(1, toNonNegativeInteger(trialCount));
    const rarityKeys = Object.keys(rates);
    const samples = Object.fromEntries(
      rarityKeys.map((rarity) => [rarity, []])
    );

    for (let trialIndex = 0; trialIndex < trials; trialIndex += 1) {
      const result = options?.featuredPity
        ? simulateFeaturedPityRarities(
            draws,
            rates,
            options.featuredPity,
            random
          )
        : simulateRarities(draws, rates, random);
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
    const star5Values = samples.star5
      ? samples.star5
      : samples.target5 && samples.star5Other
        ? samples.target5.map(
            (value, index) => value + samples.star5Other[index]
          )
        : [];
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

    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(endDateValue));
    const endDate = new Date(
      dateOnly ? `${endDateValue}T23:59:59` : endDateValue
    );
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
    targetExchangeStatus,
    targetPityStatus,
    probabilityStats,
    simulateHits,
    simulateRarities,
    star5RateForDraw,
    simulateFeaturedPityRarities,
    featuredPityProbabilityStats,
    simulateRarityTrials,
    remainingEarningDays,
  };

  global.GachaCalculator = calculator;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = calculator;
  }
})(typeof window !== "undefined" ? window : globalThis);
