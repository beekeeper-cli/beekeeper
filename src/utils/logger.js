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
    },
    failDeploy: () => {
      console.log("");
      console.log(`${chalk.red("✖")} ${chalk.yellow.bold("Failed to deploy waiting room infrastructure")}`);
      console.log("");
      console.log(`Please enter ${chalk.yellow.bold('sealbuzz destroy')} and then enter ${chalk.yellow.bold('sealbuzz deploy')} after 60 seconds`);
    },
    help: () => {
      console.log();
      console.log(`${chalk.whiteBright("sealbuzz [CMD]")}
      ${chalk.greenBright("init")}\tConfigure waiting room infrastructure before deploying or destroying
      ${chalk.greenBright("deploy")}\tDeploys waiting room infrastructure
      ${chalk.greenBright("destroy")}\tDestroys waiting room infrastructure
      ${chalk.greenBright("config")}\tDisplays current waiting room infrastructure configuration`);
    }
  };
};
