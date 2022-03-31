/* eslint-disable camelcase */
/* eslint-disable max-classes-per-file */

const snakeCase = require("lodash/snakeCase");

class OAuth2Error extends Error {
  constructor(status, error, description, state) {
    super(error);
    this.status = status;
    this.error = error;
    this.error_description = description;
    this.error_uri = undefined;
    this.state = state;
  }

  /*
   For example, the authorization server redirects the user-agent by
   sending the following HTTP response:

   HTTP/1.1 302 Found
   Location: https://client.example.com/cb#error=access_denied&state=xyz
  */
  toUri = (isShowDescription = false) => {
    let uri = `error=${this.error}${
      isShowDescription && this.error_description
        ? `&error_description=${encodeURIComponent(this.error_description)}`
        : ""
    }${
      this.error_uri ? `&error_uri=${encodeURIComponent(this.error_uri)}` : ""
    }${this.state ? `state=${encodeURIComponent(this.state)}` : ""}`;
  };

  toBody = (isShowDescription = false) => {
    const res = {
      error: this.error,
    };
    if (isShowDescription && this.error_description) {
      res["error_description"] = this.error_description;
    }
    if (this.error_uri) {
      res["error_uri"] = this.error_uri;
    }
    if (this.state) {
      res["state"] = this.state;
    }
  };
}

// RFC 6749 4.1.2.1 error defines

/* invalid_request
               The request is missing a required parameter, includes an
               invalid parameter value, includes a parameter more than
               once, or is otherwise malformed.
*/

class InvalidRequestError extends OAuth2Error {
  constructor(description, state) {
    super(400, "invalid_request", description, state);
  }
}

/* unauthorized_client
               The client is not authorized to request an authorization
               code using this method.

*/

class UnauthorizedClientError extends OAuth2Error {
  constructor(description, state) {
    super(400, "unauthorized_client", description, state);
  }
}

/*  access_denied
               The resource owner or authorization server denied the
               request.
*/

class AccessDenied extends OAuth2Error {
  constructor(description, state) {
    super(403, "access_denied", description, state);
  }
}

/* unsupported_response_type
               The authorization server does not support obtaining an
               authorization code using this method.
*/

class UnsupportedResponseTypeError extends OAuth2Error {
  constructor(description, state) {
    super(400, "unsupported_response_type", description, state);
  }
}

/* invalid_scope
               The requested scope is invalid, unknown, or malformed.
*/

class InvalidScopeError extends OAuth2Error {
  constructor(description, state) {
    super(400, "invalid_scope", description, state);
  }
}

/* server_error
               The authorization server encountered an unexpected
               condition that prevented it from fulfilling the request.
               (This error code is needed because a 500 Internal Server
               Error HTTP status code cannot be returned to the client
               via an HTTP redirect.)
*/

class ServerError extends OAuth2Error {
  constructor(description, state) {
    super(501, "server_error", description, state);
  }
}

/* temporarily_unavailable
               The authorization server is currently unable to handle
               the request due to a temporary overloading or maintenance
               of the server.  (This error code is needed because a 503
               Service Unavailable HTTP status code cannot be returned
               to the client via an HTTP redirect.)
*/

class TemporarilyUnavailableError extends OAuth2Error {
  constructor(description, state) {
    super(503, "temporarily_unavailable", description, state);
  }
}

// openid 1.0 Authentication Error Response error 3.1.2.6.

/* interaction_required
The Authorization Server requires End-User interaction of some form to proceed. 
This error MAY be returned when the prompt parameter value in the Authentication Request is none,
but the Authentication Request cannot be completed without displaying a user interface for End-User interaction.

*/

class InteractionRequiredError extends OAuth2Error {
  constructor(description, state) {
    super(403, "interaction_required", description, state);
  }
}

/* login_required
The Authorization Server requires End-User authentication. 
This error MAY be returned when the prompt parameter value in the Authentication Request is none, 
but the Authentication Request cannot be completed without displaying a user interface for End-User authentication.
*/

class LoginRequiredError extends OAuth2Error {
  constructor(description, state) {
    super(403, "login_required", description, state);
  }
}

/* account_selection_required
    The End-User is REQUIRED to select a session at the Authorization Server.
    The End-User MAY be authenticated at the Authorization Server with different associated accounts,
    but the End-User did not select a session.
    This error MAY be returned when the prompt parameter value in the Authentication Request is none, 
    but the Authentication Request cannot be completed without displaying a user interface to prompt for a session to use.
*/

class AccountSelectionRequired extends OAuth2Error {
  constructor(description, state) {
    super(403, "account_selection_required", description, state);
  }
}

/* consent_required
The Authorization Server requires End-User consent.
This error MAY be returned when the prompt parameter value in the Authentication Request is none, 
but the Authentication Request cannot be completed without displaying a user interface for End-User consent.
*/

class ConsentRequiredError extends OAuth2Error {
  constructor(description, state) {
    super(403, "consent_required", description, state);
  }
}

/* invalid_request_uri
The request_uri in the Authorization Request returns an error or contains invalid data.
*/

class InvalidRequestUriError extends OAuth2Error {
  constructor(description, state) {
    super(400, "invalid_request_uri", description, state);
  }
}

/* invalid_request_object
The request parameter contains an invalid Request Object.
*/

class InvalidRequestObjectError extends OAuth2Error {
  constructor(description, state) {
    super(400, "invalid_request_object", description, state);
  }
}

/* request_not_supported
The OP does not support use of the request parameter defined in Section 6.
*/

class RequestNotSupportedError extends OAuth2Error {
  constructor(description, state) {
    super(400, "request_not_supported", description, state);
  }
}

/* request_uri_not_supported
The OP does not support use of the request_uri parameter defined in Section 6.
*/

class RequestUriNotSupportedError extends OAuth2Error {
  constructor(description, state) {
    super(400, "request_uri_not_supported", description, state);
  }
}

/* registration_not_supported
The OP does not support use of the registration parameter defined in Section 7.2.1.
*/

class RegistrationNotSupportedError extends OAuth2Error {
  constructor(description, state) {
    super(400, "registration_not_supported", description, state);
  }
}

class OIDCCoreError extends Error {
  constructor(status, message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.error = message;
    this.statusCode = status;
    this.expose = status < 500;
  }
}

const generateOIDCCoreError = (
  name,
  message,
  status = 400,
  defaultDescription
) => {
  const klass = class extends OIDCCoreError {
    constructor(description, detail) {
      super(status, message);
      //Error.captureStackTrace(this, this.constructor);
      if (description) {
        this.error_description = description;
      } else {
        this.error_description = defaultDescription;
      }
      if (detail) {
        this.error_detail = detail;
      }
    }
  };
  Object.defineProperty(klass, "name", { value: name });
  return klass;
};

module.exports = {
  OIDCCoreError,
  InvalidArgument: generateOIDCCoreError(
    "InvalidArgument",
    snakeCase("InvalidArgument").toLocaleLowerCase(),
    400
  ),
  InvalidJWT: generateOIDCCoreError(
    "InvalidJWT",
    snakeCase("InvalidJWT").toLowerCase(),
    400
  ),
  UnknownOIDCCoreError: generateOIDCCoreError(
    "UnknownOIDCCoreError",
    snakeCase("UnknownOIDCCoreError").toLowerCase(),
    400
  ),
  InvalidToken: generateOIDCCoreError(
    "InvalidToken",
    snakeCase("InvalidToken").toLowerCase(),
    401,
    "invalid token provided"
  ),
  InvalidClientMetadata: generateOIDCCoreError(
    "InvalidClientMetadata",
    snakeCase("InvalidClientMetadata").toLowerCase(),
    400
  ),
  InvalidScope: generateOIDCCoreError(
    "InvalidScope",
    snakeCase("InvalidScope").toLowerCase(),
    400
  ),
  InvalidRequest: generateOIDCCoreError(
    "InvalidRequest",
    snakeCase("InvalidRequest").toLowerCase(),
    400,
    "request is invalid"
  ),
  SessionNotFound: generateOIDCCoreError(
    "SessionNotFound",
    snakeCase("SessionNotFound").toLowerCase(),
    400,
    "session cannot be found"
  ),
  InvalidClientAuth: generateOIDCCoreError(
    "InvalidClientAuth",
    snakeCase("InvalidClientAuth").toLowerCase(),
    401,
    "client authentication failed"
  ),
  InvalidGrant: generateOIDCCoreError(
    "InvalidGrant",
    snakeCase("InvalidGrant").toLowerCase(),
    400,
    "grant request is invalid"
  ),
  InvalidRedirectUri: generateOIDCCoreError(
    "InvalidRedirectUri",
    snakeCase("InvalidRedirectUri").toLowerCase(),
    400,
    "redirect_uri does not match any of the client's registered redirect_uris"
  ),
  InvalidWebMessageUri: generateOIDCCoreError(
    "InvalidWebMessageUri",
    snakeCase("InvalidWebMessageUri").toLowerCase(),
    400,
    "web_message_uri did not match any of the client's registered web_message_uris"
  ),
  AccessDenied: generateOIDCCoreError(
    "AccessDenied",
    snakeCase("AccessDenied").toLowerCase(),
    400
  ),
  AuthorizationPending: generateOIDCCoreError(
    "AuthorizationPending",
    snakeCase("AuthorizationPending").toLowerCase(),
    400,
    "authorization request is still pending as the end-user hasn't yet completed the user interaction steps"
  ),
  ConsentRequired: generateOIDCCoreError(
    "ConsentRequired",
    snakeCase("ConsentRequired").toLowerCase(),
    400
  ),
  ExpiredLoginHintToken: generateOIDCCoreError(
    "ExpiredLoginHintToken",
    snakeCase("ExpiredLoginHintToken").toLowerCase(),
    400
  ),
  ExpiredToken: generateOIDCCoreError(
    "ExpiredToken",
    snakeCase("ExpiredToken").toLowerCase(),
    400
  ),
  InteractionRequired: generateOIDCCoreError(
    "InteractionRequired",
    snakeCase("InteractionRequired").toLowerCase(),
    400
  ),
  InvalidBindingMessage: generateOIDCCoreError(
    "InvalidBindingMessage",
    snakeCase("InvalidBindingMessage").toLowerCase(),
    400
  ),
  InvalidClient: generateOIDCCoreError(
    "InvalidClient",
    snakeCase("InvalidClient").toLowerCase(),
    400
  ),
  InvalidPpopProof: generateOIDCCoreError(
    "InvalidPpopProof",
    snakeCase("InvalidPpopProof").toLowerCase(),
    400
  ),
  InvalidRequestObject: generateOIDCCoreError(
    "InvalidRequestObject",
    snakeCase("InvalidRequestObject").toLowerCase(),
    400
  ),
  InvalidRequestUri: generateOIDCCoreError(
    "InvalidRequestUri",
    snakeCase("InvalidRequestUri").toLowerCase(),
    400
  ),
  InvalidSoftwareStatement: generateOIDCCoreError(
    "InvalidSoftwareStatement",
    snakeCase("InvalidSoftwareStatement").toLowerCase(),
    400
  ),
  InvalidTarget: generateOIDCCoreError(
    "InvalidTarget",
    snakeCase("InvalidTarget").toLowerCase(),
    400,
    "resource indicator is missing, or unknown"
  ),
  InvalidUserCode: generateOIDCCoreError(
    "InvalidUserCode",
    snakeCase("InvalidUserCode").toLowerCase(),
    400
  ),
  LoginRequired: generateOIDCCoreError(
    "LoginRequired",
    snakeCase("LoginRequired").toLowerCase(),
    400
  ),
  MissingUserCode: generateOIDCCoreError(
    "MissingUserCode",
    snakeCase("MissingUserCode").toLowerCase(),
    400
  ),
  RegistrationNotSupported: generateOIDCCoreError(
    "RegistrationNotSupported",
    snakeCase("RegistrationNotSupported").toLowerCase(),
    400,
    "registration parameter provided but not supported"
  ),
  RequestNotSupported: generateOIDCCoreError(
    "RequestNotSupported",
    snakeCase("RequestNotSupported").toLowerCase(),
    400,
    "request parameter provided but not supported"
  ),
  RequestUriNotSupported: generateOIDCCoreError(
    "RequestUriNotSupported",
    snakeCase("RequestUriNotSupported").toLowerCase(),
    400,
    "request_uri parameter provided but not supported"
  ),
  SlowDown: generateOIDCCoreError(
    "SlowDown",
    snakeCase("SlowDown").toLowerCase(),
    400,
    "polling too quickly and should back off at a reasonable rate"
  ),
  TemporarilyUnavailable: generateOIDCCoreError(
    "TemporarilyUnavailable",
    snakeCase("TemporarilyUnavailable").toLowerCase(),
    500
  ),
  TransactionFailed: generateOIDCCoreError(
    "TransactionFailed",
    snakeCase("TransactionFailed").toLowerCase(),
    400
  ),
  UnapprovedSoftwareStatement: generateOIDCCoreError(
    "UnapprovedSoftwareStatement",
    snakeCase("UnapprovedSoftwareStatement").toLowerCase(),
    400
  ),
  UnknownUserId: generateOIDCCoreError(
    "UnknownUserId",
    snakeCase("UnknownUserId").toLowerCase(),
    400
  ),
  UnsupportedGrantType: generateOIDCCoreError(
    "UnsupportedGrantType",
    snakeCase("UnsupportedGrantType").toLowerCase(),
    400,
    "unsupported grant_type requested"
  ),
  UnsupportedResponseMode: generateOIDCCoreError(
    "UnsupportedResponseMode",
    snakeCase("UnsupportedResponseMode").toLowerCase(),
    400,
    "unsupported response_mode requested"
  ),
  UnsupportedResponseType: generateOIDCCoreError(
    "UnsupportedResponseType",
    snakeCase("UnsupportedResponseType").toLowerCase(),
    400,
    "unsupported response_type requested"
  ),
  InternalServerError: generateOIDCCoreError(
    "InternalServerError",
    snakeCase("InternalServerError").toLowerCase(),
    500,
    "internal server error"
  ),
};
