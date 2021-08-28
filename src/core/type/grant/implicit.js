"use strict";

/**
 * Module dependencies.
 */

var GeneralGrant = require("./general");
const {
  InvalidGrant,
  InvalidClient,
  InvalidRequest,
} = require("../../util/error");

/**
 * Constructor.
 */

class ImplicitGrant extends GeneralGrant {
  constructor(options) {
    options = options || {};

    if (!options.model) {
      throw new InvalidGrant("Missing parameter: `model`");
    }

    if (!options.model.saveToken) {
      throw new InvalidGrant(
        "Invalid argument: model does not implement `saveToken()`"
      );
    }

    if (!options.user) {
      throw new InvalidGrant("Missing parameter: `user`");
    }

    super(options);

    this.scope = options.scope;
    this.user = options.user;
  }

  /**
   * Handle implicit token grant.
   */

  handle(request, client) {
    if (!request) {
      throw new InvalidRequest("Missing parameter: `request`");
    }

    if (!client) {
      throw new InvalidClient("Missing parameter: `client`");
    }

    return this.saveToken(this.user, client, this.scope);
  }

  /**
   * Save token.
   */

  saveToken(user, client, scope) {
    var fns = [
      this.validateScope(user, client, scope),
      this.generateAccessToken(client, user, scope),
      this.getAccessTokenExpiresAt(),
    ];

    return Promise.all(fns)
      .bind(this)
      .spread(function (scope, accessToken, accessTokenExpiresAt) {
        var token = {
          accessToken: accessToken,
          accessTokenExpiresAt: accessTokenExpiresAt,
          scope: scope,
        };

        return Promise.resolve(this.model.saveToken(token, client, user));
      });
  }
}
/**
 * Export constructor.
 */

module.exports = ImplicitGrant;
