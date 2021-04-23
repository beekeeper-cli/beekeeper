const chalk = require("chalk");
const debug = require('debug');
const spinner = require('cli-spinner').Spinner;
spinner.setDefaultSpinnerString(18);

module.exports = (name) => {
  return {
    log: (...args) => console.log(chalk.yellow.dim("✔️  ") + chalk.yellow.dim(...args)),
    // warning: (...args) => console.log("💀  " + chalk.bgYellowBright.black(...args)),
    warning: (...args) => console.log(chalk.red("✖ ") + chalk.bold.rgb(209, 132, 112)(...args)),
    highlight: (...args) => console.log(chalk.yellow.bold(...args)),
    process: async (millisecs, message) => {
      const spinObj = new spinner(chalk.yellow.bold(message));
      spinObj.start();
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      await delay(millisecs);
      spinObj.stop();
    },
    debug: debug(name)
  };
};
