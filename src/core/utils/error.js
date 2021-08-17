/* eslint-disable camelcase */
/* eslint-disable max-classes-per-file */

const snakeCase = require("lodash/snakeCase");

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
};