/**
 * Exports functions for calculating the mean and standard deviation of a sample set.
 * @module stats 
 */

function average(tests) {
  let sums = tests.reduce((sum, test) => {
    return sum + test;
  }, 0);

  return sums / tests.length;
}

/**
 * Calculates sample standard deviation from an Array of tests.
 * @param {Array} tests Array of tests
 * @param {Number} mean Mean of an array of tests
 * @returns {Number} Sample standard deviation
 */
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