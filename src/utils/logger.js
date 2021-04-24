const chalk = require("chalk");
const debug = require('debug');

module.exports = (name) => {
  return {
    highlight: (...args) => console.log(chalk.yellow.bold(...args)),
    error: (...args) => console.log(chalk.red.bold("✖ ") + chalk.yellow.bold(...args)),
    debug: debug(name),
    debugSuccess: (msg) => {
      const fn = debug(name);
      fn(chalk.bold(`${chalk.green("✔️")} ${msg}`));
    },
    debugError: (...msg) => {
      const fn = debug(name);
      fn(chalk.bold(`${chalk.red("✖")} ${chalk.yellow(...msg)}`));
    }
  };
};
