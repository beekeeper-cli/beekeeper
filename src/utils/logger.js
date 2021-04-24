const chalk = require("chalk");
const debug = require('debug');
const ora = require("ora");

module.exports = (name) => {
  return {
    highlight: (...args) => console.log(chalk.yellow.bold(...args)),
    error: (...args) => console.log(chalk.red.bold("✖ ") + chalk.yellow.bold(...args)),
    spinner: async (startMsg, endMsg, ms) => {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      const spinner = ora();
      spinner.start(startMsg);
      await delay(ms);
      spinner.succeed(endMsg);
    },
    debug: debug(name),
    debugSuccess: (msg) => {
      const fn = debug(name);
      fn(chalk.bold(`${chalk.green("✔️")} ${msg}`));
    },
    debugError: (msg) => {
      const fn = debug(name);
      fn(chalk.bold(`${chalk.red("✖")} ${chalk.yellow(msg)}`));
    }
  };
};
