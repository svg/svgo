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

const baseTime = measureFibonacci(50_000_000);
const subjectTime = measureOptimize(
  path.join(__dirname, 'performance-fixtures', 'nlin-sierpinski-mbx.svg')
);

console.log(
  `SVG is measured in ${subjectTime / baseTime} times longer than fibonacci`
);
