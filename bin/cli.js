#!/usr/bin/env node
const arg = require("arg");
const logger = require("../src/utils/logger")("dev");
const deploy = require("../src/commands/deploy");
const destroy = require("../src/commands/destroy");
const start = require("../src/commands/start");
const config = require("../src/commands/config");

try {
  const args = arg({});
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
    case "config":
      config();
      break;
    default:
      throw new Error("Please enter a valid command.");
  }
} catch (e) {
  console.log("")
  logger.error(e.message);
  logger.help();
}
