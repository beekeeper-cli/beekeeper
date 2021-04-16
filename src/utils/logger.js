const chalk = require("chalk");
const debug = require('debug');

module.exports = (name) => {
  return {
    log: (...args) => console.log(chalk.yellow.dim("✔️  ") + chalk.yellow.dim(...args)),
    warning: (...args) => console.log("  " + chalk.bgYellowBright.black(...args)),
    highlight: (...args) => console.log("🐝  " + chalk.yellow.bold(...args)),
    debug: debug(name)
  };
};
