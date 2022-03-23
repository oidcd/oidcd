/* eslint-disable no-param-reassign */

const Validate = require("./validate");

class Prompt {
  constructor({ name, requestable = false, detail = () => {}, checks = [] }) {
    if (typeof requestable !== "boolean") {
      throw new TypeError("requestable argument must be provided as Boolean");
    }

    let error;
    switch (name) {
      case "none":
        throw new Error(
          "prompt none is special, cannot be registered like this"
        );
      case "login":
      case "consent":
        error = `${name}_required`;
        break;
      case "select_account":
        error = "account_selection_required";
        break;
      default:
        error = "interaction_required";
    }

    checks.forEach((check) => {
      if (check.error === undefined) {
        check.error = error;
      }
    });

    if (requestable) {
      checks.unshift(
        new Validate({
          reason: `${name}_prompt`,
          description: `${name} prompt was not resolved`,
          error,
          check: (ctx) => {
            const { oidc } = ctx;
            if (oidc.prompts.has(name) && oidc.promptPending(name)) {
              return true;
            }
            return false;
          },
        })
      );
    }

    this.name = name;
    this.requestable = requestable;
    this.detail = detail;
    this.checks = checks;
  }

  get(reason) {
    if (typeof reason !== "string") {
      throw new TypeError("reason must be a string");
    }
    return this.checks.find((p) => p.reason === reason);
  }

  remove(reason) {
    if (typeof reason !== "string") {
      throw new TypeError("reason must be a string");
    }
    const i = this.checks.findIndex((p) => p.reason === reason);
    this.check.splice(i, 1);
  }

  clear() {
    while (this.length) {
      this.checks.splice(0, 1);
    }
  }

  add(validate, i = this.checks.length) {
    if (!(validate instanceof Validate)) {
      throw new TypeError("argument must be an instance of Validate");
    }
    this.checks.splice(i, 0, validate);
  }
}

module.exports = Prompt;
