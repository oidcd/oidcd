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
const { uchar } = require("../../util/uchar");

/**
 * PasswordGrant
 */

class PasswordGrant extends GeneralGrant {
  constructor(options) {
    options = options || {};

    if (!options.model) {
      throw new InvalidGrant("Missing parameter: `model`");
    }

    if (!options.model.getUser) {
      throw new InvalidGrant(
        "Invalid argument: model does not implement `getUser()`"
      );
    }

    if (!options.model.saveToken) {
      throw new InvalidGrant(
        "Invalid argument: model does not implement `saveToken()`"
      );
    }

    super(options);
  }

  /**
   * Retrieve the user from the model using a username/password combination.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.3.2
   */

  handle(request, client) {
    if (!request) {
      throw new InvalidRequest("Missing parameter: `request`");
    }

    if (!client) {
      throw new InvalidClient("Missing parameter: `client`");
    }

    var scope = this.getScope(request);

    return Promise.bind(this)
      .then(function () {
        return this.getUser(request);
      })
      .then(function (user) {
        return this.saveToken(user, client, scope);
      });
  }

  /**
   * Get user using a username/password combination.
   */

  getUser(request) {
    if (!request.body.username) {
      throw new InvalidRequest("Missing parameter: `username`");
    }

    if (!request.body.password) {
      throw new InvalidRequest("Missing parameter: `password`");
    }

    if (!uchar(request.body.username)) {
      throw new InvalidRequest("Invalid parameter: `username`");
    }

    if (!uchar(request.body.password)) {
      throw new InvalidRequest("Invalid parameter: `password`");
    }

    return new Promise((resolve, reject) => {
      return Promise.resolve(
        this.model.getUser(request.body.username, request.body.password)
      ).then((user) => {
        if (!user) {
          reject(
            new InvalidGrant("Invalid grant: user credentials are invalid")
          );
        } else {
          resolve(user);
        }
      });
    });
  }

  /**
   * Save token.
   */

  saveToken(user, client, scope) {
    var fns = [
      this.validateScope(user, client, scope),
      this.generateAccessToken(client, user, scope),
      this.generateRefreshToken(client, user, scope),
      this.getAccessTokenExpiresAt(),
      this.getRefreshTokenExpiresAt(),
    ];

    return Promise.all(fns)
      .bind(this)
      .spread(function (
        scope,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt
      ) {
        var token = {
          accessToken: accessToken,
          accessTokenExpiresAt: accessTokenExpiresAt,
          refreshToken: refreshToken,
          refreshTokenExpiresAt: refreshTokenExpiresAt,
          scope: scope,
        };

        return Promise.resolve(this.model.saveToken(token, client, user));
      });
  }
}

/**
 * Export constructor.
 */

module.exports = PasswordGrant;
