#!/usr/bin/env node
const arg = require("arg");
const chalk = require("chalk");
const logger = require("../src/utils/logger")("bin");
const deploy = require("../src/commands/deploy");
const destroy = require("../src/commands/destroy");

try {
  const args = arg({
    "--help": Boolean
  });
  const [command, name] = args._;

  logger.debug("Received args", args);
  logger.debug("Received command:", command);
  logger.debug("Received name:", name);

  switch (command) {
    case "deploy":
      deploy();
      break;
    case "destroy":
      destroy();
      break;
    default:
      throw new Error("Please enter a valid command.")
  }

  // if (args["--help"]) {}
} catch (e) {
  // Logs any errors & instructions
  logger.warning(e.message);
  instructions();
}

function instructions() {
  console.log();
  console.log(`${chalk.whiteBright("tool [CMD]")}
  ${chalk.greenBright("deploy")}\tDeploys waiting room infrastructure
  ${chalk.greenBright("destroy")}\tDestroys waiting room infrastructure
  ${chalk.greenBright("--help")}\tShow help list`
  );
}
