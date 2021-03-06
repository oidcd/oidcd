"use strict";
const debug = require('../util/debug');

const storage = new Map();

module.exports = () => {
  debug.warn(
    "Development only in-memory storage is used, MUST change it in" +
      " order to not lose all stateful data upon restart and to be able to share these" +
      " between processes"
  );

  return storage;
};
