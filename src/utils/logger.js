const chalk = require("chalk");
const debug = require('debug');
const ora = require("ora");

module.exports = (name) => {
  return {
    log: (...args) => console.log(chalk.yellow.dim("✔️  ") + chalk.yellow.dim(...args)),
    // warning: (...args) => console.log("💀  " + chalk.bgYellowBright.black(...args)),
    warning: (...args) => console.log(chalk.red("✖ ") + chalk.bold.rgb(209, 132, 112)(...args)),
    highlight: (...args) => console.log(chalk.yellow.bold(...args)),
    spinner: async (startMsg, endMsg, ms) => {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      const spinner = ora();
      spinner.start(startMsg);
      await delay(ms);
      spinner.succeed(endMsg);
    },
    debug: debug(name),
    debugError: (msg) => {
      const fn = debug(name);
      fn(chalk.yellow.bold(`${chalk.red("✖")} ERROR: ${msg}`));
    }
  };
};
