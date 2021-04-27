#!/usr/bin/env node
const arg = require("arg");
const logger = require("../src/utils/logger")("dev");
const deploy = require("../src/commands/deploy");
const destroy = require("../src/commands/destroy");
const init = require("../src/commands/init");
const config = require("../src/commands/config");
const off = require("../src/commands/off");

try {
  const args = arg({});
  const [command, profileName] = args._;

  switch (command) {
    case "init":
      init();
      break;
    case "deploy":
      deploy(profileName);
      break;
    case "destroy":
      destroy(profileName);
      break;
    case "config":
      config();
      break;
    case "off":
      off(profileName);
      break;
    default:
      throw new Error("Please enter a valid command.");
  }
} catch (e) {
  console.log("")
  logger.error(e.message);
  logger.help();
}
