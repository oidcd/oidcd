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

const { vschar, uri } = require("../../util/uchar");

/**
 * Constructor.
 */

class AuthorizationCodeGrant extends GeneralGrant {
  constructor(options) {
    options = options || {};

    if (!options.model) {
      throw new InvalidGrant("Missing parameter: `model`");
    }

    if (!options.model.getAuthorizationCode) {
      throw new InvalidGrant(
        "Invalid argument: model does not implement `getAuthorizationCode()`"
      );
    }

    if (!options.model.revokeAuthorizationCode) {
      throw new InvalidGrant(
        "Invalid argument: model does not implement `revokeAuthorizationCode()`"
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
   * Handle authorization code grant.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
   */

  handle(request, client) {
    if (!request) {
      throw new InvalidRequest("Missing parameter: `request`");
    }

    if (!client) {
      throw new InvalidClient("Missing parameter: `client`");
    }

    return Promise.bind(this)
      .then(() => {
        return this.getAuthorizationCode(request, client);
      })
      .tap((code) => {
        return this.validateRedirectUri(request, code);
      })
      .tap((code) => {
        return this.revokeAuthorizationCode(code);
      })
      .then((code) => {
        return this.saveToken(
          code.user,
          client,
          code.authorizationCode,
          code.scope
        );
      });
  }

  /**
   * Get the authorization code.
   */

  getAuthorizationCode(request, client) {
    if (!request.body.code) {
      throw new InvalidRequest("Missing parameter: `code`");
    }

    if (!vschar(request.body.code)) {
      throw new InvalidRequest("Invalid parameter: `code`");
    }
    return new Promise((resolve, reject) => {
      return Promise.resolve(
        this.model.getAuthorizationCode(request.body.code)
      ).then((code) => {
        if (!code) {
          reject(new InvalidGrant("authorization code is invalid"));
        }

        if (!code.client) {
          reject(
            new InvalidGrant(
              "`getAuthorizationCode()` did not return a `client` object"
            )
          );
        }

        if (!code.user) {
          reject(
            new InvalidGrant(
              "`getAuthorizationCode()` did not return a `user` object"
            )
          );
        }

        if (code.client.id !== client.id) {
          reject(
            new InvalidGrant("Invalid grant: authorization code is invalid")
          );
        }

        if (!(code.expiresAt instanceof Date)) {
          reject(new InvalidGrant("`expiresAt` must be a Date instance"));
        }

        if (code.expiresAt < new Date()) {
          reject(
            new InvalidGrant("Invalid grant: authorization code has expired")
          );
        }

        if (code.redirectUri && !uri(code.redirectUri)) {
          reject(
            new InvalidGrant("Invalid grant: `redirect_uri` is not a valid URI")
          );
        }

        resolve(code);
      });
    });
  }

  /**
   * Validate the redirect URI.
   *
   * "The authorization server MUST ensure that the redirect_uri parameter is
   * present if the redirect_uri parameter was included in the initial
   * authorization request as described in Section 4.1.1, and if included
   * ensure that their values are identical."
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
   */

  validateRedirectUri(request, code) {
    if (!code.redirectUri) {
      return;
    }

    var redirectUri = request.body.redirect_uri || request.query.redirect_uri;

    if (!uri(redirectUri)) {
      throw new InvalidRequest(
        "Invalid request: `redirect_uri` is not a valid URI"
      );
    }

    if (redirectUri !== code.redirectUri) {
      throw new InvalidRequest("Invalid request: `redirect_uri` is invalid");
    }
  }

  /**
   * Revoke the authorization code.
   *
   * "The authorization code MUST expire shortly after it is issued to mitigate
   * the risk of leaks. [...] If an authorization code is used more than once,
   * the authorization server MUST deny the request."
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.2
   */

  revokeAuthorizationCode(code) {
    return new Promise((resolve, reject) => {
      return Promise.resolve(this.model.revokeAuthorizationCode(code)).then(
        (status) => {
          if (!status) {
            reject(
              new InvalidGrant("Invalid grant: authorization code is invalid")
            );
          }

          resolve(code);
        }
      );
    });
  }

  /**
   * Save token.
   */

  saveToken(user, client, authorizationCode, scope) {
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
          authorizationCode: authorizationCode,
          accessTokenExpiresAt: accessTokenExpiresAt,
          refreshToken: refreshToken,
          refreshTokenExpiresAt: refreshTokenExpiresAt,
          scope: scope,
        };

        return Promise.resolve(this.model.saveToken, token, client, user);
      });
  }
}

/**
 * Export constructor.
 */

module.exports = AuthorizationCodeGrant;
