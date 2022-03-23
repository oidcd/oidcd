/* eslint-disable no-param-reassign */

class Validate {
  constructor({ reason, description, error, check, detail }) {
    this.reason = reason;
    this.description = description;
    this.error = error;
    this.detail = detail;
    this.check = check;
  }
}

Validate.REQUEST_PROMPT = true;
Validate.NO_NEED_TO_PROMPT = false;

module.exports = Validate;
