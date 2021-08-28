"use strict";

/**
 * Module dependencies.
 */

const { InvalidToken } = require("../../util/error");

/**
 * Constructor.
 */

class BearerToken {
  constructor(
    accessToken,
    accessTokenLifetime,
    refreshToken,
    scope,
    customAttributes
  ) {
    if (!accessToken) {
      throw new InvalidToken("Missing parameter: `accessToken`");
    }

    this.accessToken = accessToken;
    this.accessTokenLifetime = accessTokenLifetime;
    this.refreshToken = refreshToken;
    this.scope = scope;

    if (customAttributes && typeof customAttributes === "object") {
      this.customAttributes = customAttributes;
    }
  }

  /**
   * Retrieve the value representation.
   */

  valueOf() {
    var object = {
      access_token: this.accessToken,
      token_type: "Bearer",
    };

    if (this.accessTokenLifetime) {
      object.expires_in = this.accessTokenLifetime;
    }

    if (this.refreshToken) {
      object.refresh_token = this.refreshToken;
    }

    if (this.scope) {
      object.scope = this.scope;
    }

    for (var key in this.customAttributes) {
      if (Object.prototype.hasOwnProperty.call(this.customAttributes, key)) {
        object[key] = this.customAttributes[key];
      }
    }
    return object;
  }
}

/**
 * Export constructor.
 */

module.exports = BearerToken;
