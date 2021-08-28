"use strict";

/**
 * Module dependencies.
 */

var GeneralGrant = require("./general");

const { InvalidGrant } = require("../../util/error");

/**
 * Constructor.
 */

class ClientCredentialsGrant extends GeneralGrant {
  constructor(options) {
    options = options || {};

    if (!options.store) {
      throw new InvalidGrant("Missing parameter: `store`");
    }

    if (!options.store.getUserFromClient) {
      throw new InvalidGrant(
        "Invalid argument: store does not implement `getUserFromClient()`"
      );
    }

    if (!options.store.saveToken) {
      throw new InvalidGrant(
        "Invalid argument: store does not implement `saveToken()`"
      );
    }

    super(options);
  }

  /**
   * Handle client credentials grant.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.4.2
   */

  handle(request, client) {
    if (!request) {
      throw new InvalidGrant("Missing parameter: `request`");
    }

    if (!client) {
      throw new InvalidGrant("Missing parameter: `client`");
    }

    var scope = this.getScope(request);

    return Promise.bind(this)
      .then(function () {
        return this.getUserFromClient(client);
      })
      .then(function (user) {
        return this.saveToken(user, client, scope);
      });
  }

  /**
   * Retrieve the user using client credentials.
   */
  getUserFromClient(client) {
    return Promise.resolve(this.store.getUserFromClient(client)).then(
      (user) => {
        if (!user) {
          throw new InvalidGrant("user credentials are invalid");
        }
        return user;
      }
    );
  }

  /**
   * Save token.
   */

  saveToken(user, client, scope) {
    var fns = [
      Promise.resolve(this.validateScope(user, client, scope)),
      Promise.resolve(this.generateAccessToken(client, user, scope)),
      Promise.resolve(this.getAccessTokenExpiresAt(client, user, scope)),
    ];

    return Promise.all(fns)
      .bind(this)
      .spread(function (scope, accessToken, accessTokenExpiresAt) {
        var token = {
          accessToken: accessToken,
          accessTokenExpiresAt: accessTokenExpiresAt,
          scope: scope,
        };
        return Promise.resolve(this.store.saveToken(token, client, user));
      });
  }
}

/**
 * Export constructor.
 */

module.exports = ClientCredentialsGrant;
