export interface RetirementModelInputs {
  initialSalary: number;
  salaryGrowthMean: number;
  contributionRate: number;
  returnMean: number;
  returnVolatility: number;
  seed: number;
}

export interface RetirementModelResult {
  meanNominal: number;
  meanReal: number;
  medianNominal: number;
  lowerNominal: number;
  upperNominal: number;
  successRate: number;
  meanWithdrawal: number;
  targetIncome: number;
  yearlyMean: number[];
  distribution: Array<{ lower: number; upper: number; count: number }>;
}

export const retirementModelConstants = {
  horizon: 25,
  trials: 5000,
  salaryGrowthVolatility: 0.005,
  inflation: 0.02,
  withdrawalRate: 0.04,
  targetToday: 125000,
} as const;

export const retirementModelBaseline: RetirementModelInputs = {
  initialSalary: 95000,
  salaryGrowthMean: 0.028,
  contributionRate: 0.075,
  returnMean: 0.0612,
  returnVolatility: 0.1,
  seed: 7052025,
};

function createRandom(seed: number) {
  let state = Math.trunc(seed) >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createNormal(random: () => number) {
  let spare: number | undefined;
  return (mean: number, standardDeviation: number) => {
    if (standardDeviation === 0) return mean;
    if (spare !== undefined) {
      const value = spare;
      spare = undefined;
      return mean + value * standardDeviation;
    }

    let first = 0;
    let second = 0;
    while (first <= Number.EPSILON) first = random();
    while (second <= Number.EPSILON) second = random();
    const magnitude = Math.sqrt(-2 * Math.log(first));
    const angle = 2 * Math.PI * second;
    spare = magnitude * Math.sin(angle);
    return mean + magnitude * Math.cos(angle) * standardDeviation;
  };
}

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function quantile(sorted: number[], probability: number) {
  const position = (sorted.length - 1) * probability;
  const lowerIndex = Math.floor(position);
  const fraction = position - lowerIndex;
  const lower = sorted[lowerIndex] ?? 0;
  const upper = sorted[lowerIndex + 1] ?? lower;
  return lower + (upper - lower) * fraction;
}

function createDistribution(values: number[], binCount = 12) {
  const lowerBound = Math.min(...values);
  const upperBound = Math.max(...values);
  const width = Math.max((upperBound - lowerBound) / binCount, 1);
  const bins = Array.from({ length: binCount }, (_, index) => ({
    lower: lowerBound + index * width,
    upper: lowerBound + (index + 1) * width,
    count: 0,
  }));

  values.forEach((value) => {
    const index = Math.min(Math.floor((value - lowerBound) / width), binCount - 1);
    const bin = bins[index];
    if (bin) bin.count += 1;
  });

  return bins;
}

export function runRetirementModel(
  inputs: RetirementModelInputs,
): RetirementModelResult {
  const random = createRandom(inputs.seed);
  const normal = createNormal(random);
  const terminalNominal: number[] = [];
  const yearlyTotals = Array.from(
    { length: retirementModelConstants.horizon },
    () => 0,
  );
  const inflationIndex =
    (1 + retirementModelConstants.inflation) ** retirementModelConstants.horizon;
  const targetIncome = retirementModelConstants.targetToday * inflationIndex;
  let successes = 0;

  for (let trial = 0; trial < retirementModelConstants.trials; trial += 1) {
    let salary = inputs.initialSalary;
    let balance = 0;

    for (let year = 0; year < retirementModelConstants.horizon; year += 1) {
      if (year > 0) {
        salary *=
          1 +
          normal(
            inputs.salaryGrowthMean,
            retirementModelConstants.salaryGrowthVolatility,
          );
      }
      const contribution = salary * inputs.contributionRate;
      const annualReturn = normal(inputs.returnMean, inputs.returnVolatility);
      balance = balance * (1 + annualReturn) + contribution;
      yearlyTotals[year] = (yearlyTotals[year] ?? 0) + balance;
    }

    terminalNominal.push(balance);
    if (balance * retirementModelConstants.withdrawalRate >= targetIncome) {
      successes += 1;
    }
  }

  const sorted = [...terminalNominal].sort((left, right) => left - right);
  const meanNominal = mean(terminalNominal);

  return {
    meanNominal,
    meanReal: meanNominal / inflationIndex,
    medianNominal: quantile(sorted, 0.5),
    lowerNominal: quantile(sorted, 0.025),
    upperNominal: quantile(sorted, 0.975),
    successRate: successes / retirementModelConstants.trials,
    meanWithdrawal: meanNominal * retirementModelConstants.withdrawalRate,
    targetIncome,
    yearlyMean: yearlyTotals.map((total) => total / retirementModelConstants.trials),
    distribution: createDistribution(terminalNominal),
  };
}
