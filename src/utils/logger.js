const chalk = require("chalk");
const debug = require('debug');
const delay = require('delay');
const spinner = require('cli-spinner').Spinner;
spinner.setDefaultSpinnerString(18);

module.exports = (name) => {
  return {
    log: (...args) => console.log(chalk.yellow.dim("✔️  ") + chalk.yellow.dim(...args)),
    warning: (...args) => console.log("  " + chalk.bgYellowBright.black(...args)),
    highlight: (...args) => console.log("🐝  " + chalk.yellow.bold(...args)),
    process: async (secs, message) => {
      const spinObj = new spinner(chalk.yellow.bold(message));
      spinObj.start();
      await delay(secs * 1000)
      spinObj.stop();
    },
    debug: debug(name)
  };
};
