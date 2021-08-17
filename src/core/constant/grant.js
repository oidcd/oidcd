"use strict";

module.exports = Object.freeze({
  GRANT_ID_KEY_PREFIX: "oidc:grant:",
  GRANT_SESSION_UID_KEY_PREFIX: "oidc:sessionUid:",
  GRANT_USER_CODE_KEY_PREFIX: "oidc:userCode:",
  GRANTABLE: new Set([
    "AccessToken",
    "AuthorizationCode",
    "RefreshToken",
    "DeviceCode",
    "BackchannelAuthenticationRequest",
  ]),
  GRANT_PARAMETER_LIST: [
    "acr_values", // TODO:
    // 'claims', // added conditionally depending on feature flag
    "claims_locales", // TODO: store claimsLocales on AccessToken instances
    "client_id",
    "code_challenge",
    "code_challenge_method",
    "display",
    "id_token_hint",
    "login_hint",
    "max_age",
    "nonce",
    "prompt",
    "redirect_uri",
    "registration",
    "request",
    "request_uri",
    "response_mode",
    "response_type",
    "scope",
    "state",
    "ui_locales",
    // 'web_message_uri', // added conditionally depending on feature flag
    // 'web_message_target', // added conditionally depending on feature flag
  ],
});
