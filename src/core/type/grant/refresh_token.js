"use strict";

/**
 * Module dependencies.
 */

const GeneralGrant = require("./general");
const {
  InvalidGrant,
  InvalidClient,
  InvalidRequest,
} = require("../../util/error");

const { vschar } = require("../../util/uchar");

/**
 * Constructor.
 */

class RefreshTokenGrantType extends GeneralGrant {
  constructor(options) {
    options = options || {};

    if (!options.model) {
      throw new InvalidGrant("Missing parameter: `model`");
    }

    if (!options.model.getRefreshToken) {
      throw new InvalidGrant(
        "Invalid argument: model does not implement `getRefreshToken()`"
      );
    }

    if (!options.model.revokeToken) {
      throw new InvalidGrant(
        "Invalid argument: model does not implement `revokeToken()`"
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
   * Handle refresh token grant.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-6
   */

  handle(request, client) {
    if (!request) {
      throw new InvalidRequest("Missing parameter: `request`");
    }

    if (!client) {
      throw new InvalidClient("Missing parameter: `client`");
    }

    return Promise.bind(this)
      .then(function () {
        return this.getRefreshToken(request, client);
      })
      .tap(function (token) {
        return this.revokeToken(token);
      })
      .then(function (token) {
        return this.saveToken(token.user, client, token.scope);
      });
  }

  /**
   * Get refresh token.
   */

  getRefreshToken(request, client) {
    if (!request.body.refresh_token) {
      throw new InvalidRequest("Missing parameter: `refresh_token`");
    }

    if (!vschar(request.body.refresh_token)) {
      throw new InvalidRequest("Invalid parameter: `refresh_token`");
    }

    return new Promise((resolve, reject) => {
      return Promise.resolve(
        this.model.getRefreshToken(request.body.refresh_token)
      ).then((token) => {
        if (!token) {
          reject(new InvalidGrant("Invalid grant: refresh token is invalid"));
        }

        if (!token.client) {
          reject(
            new InvalidGrant(
              "Server error: `getRefreshToken()` did not return a `client` object"
            )
          );
        }

        if (!token.user) {
          reject(
            new InvalidGrant(
              "Server error: `getRefreshToken()` did not return a `user` object"
            )
          );
        }

        if (token.client.id !== client.id) {
          reject(new InvalidGrant("Invalid grant: refresh token is invalid"));
        }

        if (
          token.refreshTokenExpiresAt &&
          !(token.refreshTokenExpiresAt instanceof Date)
        ) {
          reject(
            new InvalidGrant(
              "Server error: `refreshTokenExpiresAt` must be a Date instance"
            )
          );
        }

        if (
          token.refreshTokenExpiresAt &&
          token.refreshTokenExpiresAt < new Date()
        ) {
          reject(new InvalidGrant("Invalid grant: refresh token has expired"));
        }

        resolve(token);
      });
    });
  }

  /**
   * Revoke the refresh token.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-6
   */

  revokeToken(token) {
    if (this.alwaysIssueNewRefreshToken === false) {
      return Promise.resolve(token);
    }

    return new Promise((resolve, reject) => {
      return Promise.resolve(this.model.revokeToken(token)).then((status) => {
        if (!status) {
          reject(new InvalidGrant("Invalid grant: refresh token is invalid"));
        }

        resolve(token);
      });
    });
  }

  /**
   * Save token.
   */

  saveToken(user, client, scope) {
    var fns = [
      this.generateAccessToken(client, user, scope),
      this.generateRefreshToken(client, user, scope),
      this.getAccessTokenExpiresAt(),
      this.getRefreshTokenExpiresAt(),
    ];

    return Promise.all(fns)
      .bind(this)
      .spread(function (
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt
      ) {
        var token = {
          accessToken: accessToken,
          accessTokenExpiresAt: accessTokenExpiresAt,
          scope: scope,
        };

        if (this.alwaysIssueNewRefreshToken !== false) {
          token.refreshToken = refreshToken;
          token.refreshTokenExpiresAt = refreshTokenExpiresAt;
        }

        return token;
      })
      .then((token) => {
        return Promise.resolve(this.model.saveToken(token, client, user));
      });
  }
}
/**
 * Export constructor.
 */

module.exports = RefreshTokenGrantType;
