const Validate = require("./validate");
const Prompt = require("./prompt");
const loginPrompt = require("./prompt_login");
const consentPrompt = require("./prompt_consent");

class InteractionPolicy {
  constructor() {
    this.Prompts = [];
  }

  get data() {
    return this.Prompts;
  }

  get(name) {
    if (typeof name !== "string") {
      throw new TypeError("name must be a string");
    }
    return this.Prompts.find((p) => p.name === name);
  }

  remove(name) {
    if (typeof name !== "string") {
      throw new TypeError("name must be a string");
    }
    const i = this.Prompts.findIndex((p) => p.name === name);
    this.Prompts.splice(i, 1);
  }

  clear() {
    while (this.Prompts.length) {
      this.Prompts.splice(0, 1);
    }
  }

  add(prompt, i = this.Prompts.length) {
    if (!(prompt instanceof Prompt)) {
      throw new TypeError("argument must be an instance of Prompt");
    }
    this.Prompts.splice(i, 0, prompt);
  }
}

var policy = null;

function defaultInteractionPolicy() {
  if (policy === null) {
    policy = new InteractionPolicy();
    policy.add(loginPrompt());
    policy.add(consentPrompt());
  }
  return policy;
}

module.exports = { Validate, Prompt, defaultInteractionPolicy };
