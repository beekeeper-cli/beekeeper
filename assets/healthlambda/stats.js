function average(tests) {
  let sums = tests.reduce((sum, test) => {
    return sum + test;
  }, 0);

  return sums / tests.length;
}

function stdDev(tests, mean) {
  let sumOfDiffs = tests.reduce((sqrSum, test) => {
    return sqrSum + (test - mean) ** 2;
  }, 0);

  return Math.sqrt(sumOfDiffs / (tests.length - 1));
}

module.exports = {
  average,
  stdDev
}