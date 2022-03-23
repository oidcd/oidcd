const { warn, info, error } = require("../../../src/core/util/debug");

/* eslint-env jest */

describe("debug", function () {
  describe("info", function () {
    it("info a message", () => {
      info("this is an info message");
    });

    it("info a formatted message", () => {
      info("this is an info message, %d, %s, %o, %%", 1, "info level", {
        level: "info",
      });
    });
  });

  describe("warn", function () {
    it("warn a message", () => {
      warn("this is a warn message");
    });

    it("warn a formatted message", () => {
      warn("this is a warn message, %d, %s, %o, %%", 2, "warn level", {
        level: "warn",
      });
    });
  });

  describe("error", function () {
    it("error a message", () => {
      error("this is an error message");
    });

    it("error a formatted message", () => {
      error("this is an error message, %d, %s, %o, %%", 3, "error level", {
        level: "error",
      });
    });
  });
});
