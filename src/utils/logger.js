/**
 * Exports a function, which takes a string as an argument, and returns an object with methods that adds syntactial highlighting to your logs, leveraging the "chalk" and "debug" npm packages.
 * @module logger
 * @category utilities
 * @example <caption>Use as a terminal command</caption>
 * const logger = require('/path/to/logger.js');
 * const debugLogger = logger("dev")
 * debugLogger.debugSucess("Hello Beekeeper");
 * // in the terminal
 * // DEBUG=dev node tester.js
 * // "✔️Hello Beekeeper"
 * @example <caption>Use as an in-file command</caption>
 * const logger = require('/path/to/logger.js')("dev");
 * logger.highlight("Hello Beekeeper");
 * // Hello Beekeeper
 */

 const chalk = require("chalk");
 const debug = require('debug');

 /**
 * Exports the logger function.
 * @returns {Object}
 */
 module.exports = (name) => {
   return {
     /**
      * Outputs bold yellow text
      * @param {*} args Takes nearly anything that you would pass into console.log
      * @returns {undefined}
      */
     highlight: (...args) => console.log(chalk.yellow.bold(...args)),
     /**
      * Outputs a thick red "X", followed by bold yellow text
      * @param {*} args Takes nearly anything that you would pass into console.log
      * @returns {undefined}
      */
     error: (...args) => console.log(chalk.red.bold("✖ ") + chalk.yellow.bold(...args)),
     /**
      * Returns a debug function that will then return a decorated version of console.error for you to pass debug statements to.
      * The returned function can be called by running  "DEBUG=name node filename.js" in the terminal. This is meant to be a private method, used internally by other methods.
      * @method debug
      * @private
      * @param {String} name Takes a string that will help identify the code you are running. This is also the value given to DEBUG.
      * @returns {Function}
      */
     debug: debug(name),
     /**
      * Outputs bold text with a green arrow when running DEGUG=name [COMMAND] in the terminal. 
      * @param {String} msg A string of text 
      * @returns {undefined}
      */
     debugSuccess: (msg) => {
       const fn = debug(name);
       fn(chalk.bold(`${chalk.green("✔️")} ${msg}`));
     },
     /**
      * Outputs bold yellow text with a red "X" when running DEGUG=name [COMMAND] in the terminal
      * @param {String} msg A string of text
      * @returns {undefined}
      */
     debugError: (...msg) => {
       const fn = debug(name);
       fn(chalk.bold(`${chalk.red("✖")} ${chalk.yellow(...msg)}`));
     },
     /**
      * Outputs bold yellow text with a red "X" if any part of the aws deployment failed.
      * @returns {undefined}
      */
     failDeploy: (profileName) => {
       console.log("");
       console.log(`${chalk.red("✖")} ${chalk.yellow.bold("Failed to deploy waiting room infrastructure")}`);
       console.log("");
       console.log(`Please enter ${chalk.yellow.bold(`beekeeper destroy ${profileName}`)} and then enter ${chalk.yellow.bold(`beekeeper deploy ${profileName}`)} after 60 seconds`);
     },
     /**
      * Triggered by entering an invalid command. Outputs possible valid commands.
      * @returns {undefined}
      */
     help: () => {
       console.log();
       console.log(`${chalk.whiteBright("beekeeper [CMD]")}
       ${chalk.greenBright("init")}\tConfigure waiting room infrastructure before deploying or destroying
       ${chalk.greenBright("deploy")}\tDeploys waiting room infrastructure
       ${chalk.greenBright("destroy")}\tDestroys waiting room infrastructure
       ${chalk.greenBright("config")}\tDisplays current waiting room infrastructure configuration
       ${chalk.greenBright("on/off")}\tTurns a deployed waiting room infrastructure on or off
       ${chalk.greenBright("set-rate")}\tChanges the rate on a deployed waiting room infrastructure`);
     }
   };
 };
 