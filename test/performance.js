'use strict';

const fs = require('fs');
const path = require('path');
const { optimize } = require('../');

const measureFibonacci = (count) => {
  const start = process.hrtime.bigint();
  const fib = Array(count);
  let i;
  fib[0] = 0;
  fib[1] = 1;
  for (i = 2; i <= count; i += 1) {
    fib[i] = fib[i - 2] + fib[i - 1];
  }
  const end = process.hrtime.bigint();
  const diff = end - start;
  console.info(
    `Computed ${count} fibonacci numbers in ${diff / BigInt(1e6)}ms`
  );
  return diff;
};

const measureOptimize = (fixturePath) => {
  const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
  const start = process.hrtime.bigint();
  const { error } = optimize(fixtureContent);
  if (error) {
    throw Error(error);
  }
  const end = process.hrtime.bigint();
  const diff = end - start;
  console.info(`Optimized svg in ${diff / BigInt(1e6)}ms`);
  return diff;
};

const baseTime = measureFibonacci(40_000_000);
const fixturesDir = path.join(__dirname, 'performance-fixtures');
const snapshot = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'snapshot.json'), 'utf-8')
);
const errors = [];

for (const [file, ratio] of Object.entries(snapshot)) {
  const optimisationTime = measureOptimize(path.join(fixturesDir, file));
  const newRatio = Number(optimisationTime / baseTime);
  const percentile = Math.abs((newRatio / ratio) * 100 - 100);
  if (percentile > 10) {
    errors.push(
      `${file} has ${newRatio} ratio instead of ${ratio} in snapshot`
    );
  }
  console.log(
    `${file} optimisation is ${newRatio} times slower than fibonacci`
  );
}

if (errors.length !== 0) {
  console.error('Snapshot does not match measures');
  console.error(errors.join('\n'));
  process.exit(1);
}
