"use strict";
// eslint-disable-next-line import/order
const debug = require("./core/util/debug");
const { Configuration } = require("./core/type/config/configuration");

module.exports = {
  use: (config, router) => {
    debug.info("use config = %o, router type = %s", config, typeof router);
    Configuration.init(config, router);
    return require("./router");
  },
};
