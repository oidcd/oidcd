"use strict";

/**
 * Module dependencies.
 */

const includes = require("lodash/includes");
const has = require("lodash/has");

const BearerToken = require("../type/token/bearer");
const {
  InvalidArgument,
  InvalidRequest,
  InvalidClient,
  InvalidGrant,
  InternalServerError,
} = require("../util/error");
const { vschar, nchar, uri } = require("../util/uchar");
const { ClientRequest, ServerResponse } = require("http");
var TokenModel = require("../models/token-model");
const { basicAuth } = require("../util/auth");

const grantTypes = {
  authorization_code: require("../type/grant/authorization_code"),
  client_credentials: require("../type/grant/client_credential"),
  password: require("../type/grant/password"),
  refresh_token: require("../type/grant/refresh_token"),
};

class Token {
  constructor(options) {
    options = options || {};

    if (!options.accessTokenLifetime) {
      throw new InvalidArgument("Missing parameter: `accessTokenLifetime`");
    }

    if (!options.model) {
      throw new InvalidArgument("Missing parameter: `model`");
    }

    if (!options.refreshTokenLifetime) {
      throw new InvalidArgument("Missing parameter: `refreshTokenLifetime`");
    }

    if (!options.model.getClient) {
      throw new InvalidArgument(
        "Invalid argument: model does not implement `getClient()`"
      );
    }

    this.accessTokenLifetime = options.accessTokenLifetime;
    this.grantTypes = Object.assign({}, grantTypes, options.extendedGrantTypes);
    this.model = options.model;
    this.refreshTokenLifetime = options.refreshTokenLifetime;
    this.allowExtendedTokenAttributes = options.allowExtendedTokenAttributes;
    this.requireClientAuthentication =
      options.requireClientAuthentication || {};
    this.alwaysIssueNewRefreshToken =
      options.alwaysIssueNewRefreshToken !== false;
  }

  handle(request, response) {
    if (!(request instanceof ClientRequest)) {
      throw new InvalidArgument(
        "Invalid argument: `request` must be an instance of Request"
      );
    }

    if (!(response instanceof ServerResponse)) {
      throw new InvalidArgument(
        "Invalid argument: `response` must be an instance of Response"
      );
    }

    if (request.method !== "POST") {
      return Promise.reject(
        new InvalidArgument("Invalid request: method must be POST")
      );
    }

    if (!request.is("application/x-www-form-urlencoded")) {
      return Promise.reject(
        new InvalidArgument(
          "Invalid request: content must be application/x-www-form-urlencoded"
        )
      );
    }

    // Extend model object with request
    this.model.request = request;

    return Promise.then(function () {
      return this.getClient(request, response);
    })
      .then(function (client) {
        return this.handleGrantType(request, client);
      })
      .tap(function (data) {
        var model = new TokenModel(data, {
          allowExtendedTokenAttributes: this.allowExtendedTokenAttributes,
        });
        var tokenType = this.getTokenType(model);

        this.updateSuccessResponse(response, tokenType);
      })
      .catch(function (e) {
        if (!(e instanceof InternalServerError)) {
          e = new InternalServerError(e);
        }

        this.updateErrorResponse(response, e);

        throw e;
      });
  }

  getClient(request, response) {
    var credentials = this.getClientCredentials(request);
    var grantType = request.body.grant_type;

    if (!credentials.clientId) {
      throw new InvalidRequest("Missing parameter: `client_id`");
    }

    if (
      this.isClientAuthenticationRequired(grantType) &&
      !credentials.clientSecret
    ) {
      throw new InvalidRequest("Missing parameter: `client_secret`");
    }

    if (!vschar(credentials.clientId)) {
      throw new InvalidRequest("Invalid parameter: `client_id`");
    }

    if (credentials.clientSecret && !vschar(credentials.clientSecret)) {
      throw new InvalidRequest("Invalid parameter: `client_secret`");
    }

    return new Promise(() => {
      return this.model.getClient(
        credentials.clientId,
        credentials.clientSecret
      );
    })
      .then(function (client) {
        if (!client) {
          throw new InvalidClient("Invalid client: client is invalid");
        }

        if (!client.grants) {
          throw new InternalServerError(
            "Server error: missing client `grants`"
          );
        }

        if (!(client.grants instanceof Array)) {
          throw new InternalServerError(
            "Server error: `grants` must be an array"
          );
        }

        return client;
      })
      .catch(function (e) {
        // Include the "WWW-Authenticate" response header field if the client
        // attempted to authenticate via the "Authorization" request header.
        //
        // @see https://tools.ietf.org/html/rfc6749#section-5.2.
        if (e instanceof InvalidClient && request.get("authorization")) {
          response.set("WWW-Authenticate", 'Basic realm="Service"');

          throw new InvalidClient(e, { code: 401 });
        }

        throw e;
      });
  }

  getClientCredentials(request) {
    var credentials = basicAuth(request);
    var grantType = request.body.grant_type;

    if (credentials) {
      return { clientId: credentials.name, clientSecret: credentials.pass };
    }

    if (request.body.client_id && request.body.client_secret) {
      return {
        clientId: request.body.client_id,
        clientSecret: request.body.client_secret,
      };
    }

    if (!this.isClientAuthenticationRequired(grantType)) {
      if (request.body.client_id) {
        return { clientId: request.body.client_id };
      }
    }

    throw new InvalidClient(
      "Invalid client: cannot retrieve client credentials"
    );
  }

  handleGrantType(request, client) {
    var grantType = request.body.grant_type;

    if (!grantType) {
      throw new InvalidRequest("Missing parameter: `grant_type`");
    }

    if (!nchar(grantType) && !uri(grantType)) {
      throw new InvalidRequest("Invalid parameter: `grant_type`");
    }

    if (!has(this.grantTypes, grantType)) {
      throw new InvalidGrant("Unsupported grant type: `grant_type` is invalid");
    }

    if (!includes(client.grants, grantType)) {
      throw new InvalidClient("Unauthorized client: `grant_type` is invalid");
    }

    var accessTokenLifetime = this.getAccessTokenLifetime(client);
    var refreshTokenLifetime = this.getRefreshTokenLifetime(client);
    var Type = this.grantTypes[grantType];

    var options = {
      accessTokenLifetime: accessTokenLifetime,
      model: this.model,
      refreshTokenLifetime: refreshTokenLifetime,
      alwaysIssueNewRefreshToken: this.alwaysIssueNewRefreshToken,
    };

    return new Type(options).handle(request, client);
  }

  getAccessTokenLifetime(client) {
    return client.accessTokenLifetime || this.accessTokenLifetime;
  }

  getRefreshTokenLifetime(client) {
    return client.refreshTokenLifetime || this.refreshTokenLifetime;
  }

  getTokenType(model) {
    return new BearerToken(
      model.accessToken,
      model.accessTokenLifetime,
      model.refreshToken,
      model.scope,
      model.customAttributes
    );
  }

  updateSuccessResponse(response, tokenType) {
    response.body = tokenType.valueOf();

    response.set("Cache-Control", "no-store");
    response.set("Pragma", "no-cache");
  }

  updateErrorResponse(response, error) {
    response.body = {
      error: error.name,
      error_description: error.message,
    };

    response.status = error.code;
  }

  isClientAuthenticationRequired(grantType) {
    if (Object.keys(this.requireClientAuthentication).length > 0) {
      return typeof this.requireClientAuthentication[grantType] !== "undefined"
        ? this.requireClientAuthentication[grantType]
        : true;
    } else {
      return true;
    }
  }
}

module.exports = Token;
