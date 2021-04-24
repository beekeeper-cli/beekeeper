#!/usr/bin/env node
const arg = require("arg");
const chalk = require("chalk");
const logger = require("../src/utils/logger")("dev");
const deploy = require("../src/commands/deploy");
const destroy = require("../src/commands/destroy");
const start = require('../src/commands/start');

try {
  const args = arg({
    "--help": Boolean
  });
  const [command] = args._;
  
  switch (command) {
    case "start":
      start();
      break;
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
  logger.error(e.message);
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
