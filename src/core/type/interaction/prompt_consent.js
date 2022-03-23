/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */

const Prompt = require("./prompt");
const Validate = require("./validate");

const missingOIDCScope = Symbol();
const missingOIDCClaims = Symbol();
const missingResourceScopes = Symbol();

module.exports = () =>
  new Prompt({
    name: "consent",
    requestable: true,
    detail: undefined,
    checks: [
      new Validate({
        reason: "native_client_prompt",
        description: "native clients require End-User interaction",
        error: "interaction_required",
        check: (ctx) => {
          const { oidc } = ctx;
          if (
            oidc.client.applicationType === "native" &&
            oidc.params.response_type !== "none" &&
            (!oidc.result || !("consent" in oidc.result))
          ) {
            return Validate.REQUEST_PROMPT;
          }

          return Validate.NO_NEED_TO_PROMPT;
        },
      }),

      new Validate({
        reason: "op_scopes_missing",
        description: "requested scopes not granted",
        check: (ctx) => {
          const { oidc } = ctx;
          const encounteredScopes = new Set(
            oidc.grant.getOIDCScopeEncountered().split(" ")
          );

          let missing;
          for (const scope of oidc.requestParamOIDCScopes) {
            // eslint-disable-line no-restricted-syntax
            if (!encounteredScopes.has(scope)) {
              missing || (missing = []);
              missing.push(scope);
            }
          }

          if (missing && missing.length) {
            ctx.oidc[missingOIDCScope] = missing;
            return Validate.REQUEST_PROMPT;
          }

          return Validate.NO_NEED_TO_PROMPT;
        },
        detail: ({ oidc }) => ({ missingOIDCScope: oidc[missingOIDCScope] }),
      }),

      new Validate({
        reason: "op_claims_missing",
        description: "requested claims not granted",
        check: (ctx) => {
          const { oidc } = ctx;
          const encounteredClaims = new Set(
            oidc.grant.getOIDCClaimsEncountered()
          );

          let missing;
          for (const claim of oidc.requestParamClaims) {
            // eslint-disable-line no-restricted-syntax
            if (
              !encounteredClaims.has(claim) &&
              !["sub", "sid", "auth_time", "acr", "amr", "iss"].includes(claim)
            ) {
              missing || (missing = []);
              missing.push(claim);
            }
          }

          if (missing && missing.length) {
            ctx.oidc[missingOIDCClaims] = missing;
            return Validate.REQUEST_PROMPT;
          }

          return Validate.NO_NEED_TO_PROMPT;
        },
        detail: ({ oidc }) => ({ missingOIDCClaims: oidc[missingOIDCClaims] }),
      }),

      // checks resource server scopes
      new Validate({
        reason: "rs_scopes_missing",
        description: "requested scopes not granted",
        check: (ctx) => {
          const { oidc } = ctx;

          let missing;

          // eslint-disable-next-line no-restricted-syntax
          for (const [indicator, resourceServer] of Object.entries(
            ctx.oidc.resourceServers
          )) {
            const encounteredScopes = new Set(
              oidc.grant.getResourceScopeEncountered(indicator).split(" ")
            );
            const requestedScopes = ctx.oidc.requestParamScopes;
            const availableScopes = resourceServer.scopes;

            for (const scope of requestedScopes) {
              // eslint-disable-line no-restricted-syntax
              if (availableScopes.has(scope) && !encounteredScopes.has(scope)) {
                missing || (missing = {});
                missing[indicator] || (missing[indicator] = []);
                missing[indicator].push(scope);
              }
            }
          }

          if (missing && Object.keys(missing).length) {
            ctx.oidc[missingResourceScopes] = missing;
            return Validate.REQUEST_PROMPT;
          }

          return Validate.NO_NEED_TO_PROMPT;
        },
        detail: ({ oidc }) => ({
          missingResourceScopes: oidc[missingResourceScopes],
        }),
      }),
    ],
  });
