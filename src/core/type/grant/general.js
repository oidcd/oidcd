"use strict";

/**
 * Module dependencies.
 */

const { InvalidGrant, InvalidScope } = require("../../util/error");
const { nqschar } = require("../../util/uchar");
const { nanoid } = require("../../util/nanoid");

/**
 * Constructor.
 */

class GeneralGrant {
  constructor(options) {
    options = options || {};

    if (!options.accessTokenLifetime) {
      throw new InvalidGrant("Missing parameter: `accessTokenLifetime`");
    }

    if (!options.store) {
      throw new InvalidGrant("Missing parameter: `store`");
    }

    this.accessTokenLifetime = options.accessTokenLifetime;
    this.store = options.store;
    this.refreshTokenLifetime = options.refreshTokenLifetime;
    this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken;
  }

  /**
   * Generate access token.
   */

  generateAccessToken(client, user, scope) {
    if (this.store.generateAccessToken) {
      return this.store.generateAccessToken(client, user, scope) || nanoid;
    }

    return nanoid();
  }

  /**
   * Generate refresh token.
   */

  generateRefreshToken(client, user, scope) {
    if (this.store.generateRefreshToken) {
      return this.store.generateRefreshToken(client, user, scope) || nanoid();
    }

    return nanoid();
  }

  /**
   * Get access token expiration date.
   */

  getAccessTokenExpiresAt() {
    return new Date(Date.now() + this.accessTokenLifetime * 1000);
  }

  /**
   * Get refresh token expiration date.
   */

  getRefreshTokenExpiresAt() {
    return new Date(Date.now() + this.refreshTokenLifetime * 1000);
  }

  /**
   * Get scope from the request body.
   */

  getScope(request) {
    if (!nqschar(request.body.scope)) {
      throw new InvalidScope("Invalid parameter: `scope`");
    }

    return request.body.scope;
  }

  /**
   * Validate requested scope.
   */
  validateScope(user, client, scope) {
    if (this.store.validateScope) {
      return new Promise((resolve, reject) => {
        return Promise.resolve(
          this.store.validateScope(user, client, scope)
        ).then((validScope) => {
          if (!validScope) {
            reject(
              new InvalidScope("Invalid scope: Requested scope is invalid")
            );
          } else {
            resolve(validScope);
          }
        });
      });
    } else {
      return scope;
    }
  }
}

/**
 * Export constructor.
 */

module.exports = GeneralGrant;
