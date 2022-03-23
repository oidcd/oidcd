/*const BOLD_YELLOW_TEXT = '\x1b[33;1m';
const BOLD_RED_TEXT = '\x1b[31;1m';
const RESET_ALL_ATTRIBUTES = '\x1b[0m';

function colorizeStdout(str) {
  if (process.stdout.isTTY) {
    return `${BOLD_YELLOW_TEXT}${str}${RESET_ALL_ATTRIBUTES}`;
  }
  return str;
}

function colorizeStderr(str) {
  if (process.stderr.isTTY) {
    return `${BOLD_RED_TEXT}${str}${RESET_ALL_ATTRIBUTES}`;
  }
  return str;
}*/

const debug = require("debug");

const debugWarn = debug("oidcd:warn");
const debugInfo = debug("oidcd:info");
const debugError = debug("oidcd:error");
debug.enable("oidcd:*");

module.exports = {
  info: debugInfo,
  warn: debugWarn,
  error: debugError,
  trace: (tid) => {
    return debug(`odicd:trace:${tid}`);
  },
};
