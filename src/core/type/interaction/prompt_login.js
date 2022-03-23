/* eslint-disable camelcase, max-len */

const { InvalidRequest } = require("../../util/error");
const Prompt = require("./prompt");
const Validate = require("./validate");
const get = require("lodash/get");

module.exports = () =>
  new Prompt({
    name: "login",
    requestable: true,

    detail: (ctx) => {
      const { oidc } = ctx;

      return {
        ...(oidc.params.max_age === undefined
          ? undefined
          : { max_age: oidc.params.max_age }),
        ...(oidc.params.login_hint === undefined
          ? undefined
          : { login_hint: oidc.params.login_hint }),
        ...(oidc.params.id_token_hint === undefined
          ? undefined
          : { id_token_hint: oidc.params.id_token_hint }),
      };
    },

    checks: [
      new Validate({
        reason: "no_session",
        description: "End-User authentication is required",
        check: (ctx) => {
          const { oidc } = ctx;
          if (oidc.session.accountId) {
            return Validate.NO_NEED_TO_PROMPT;
          }

          return Validate.REQUEST_PROMPT;
        },
      }),

      new Validate({
        reason: "max_age",
        description: "End-User authentication could not be obtained",
        check: (ctx) => {
          const { oidc } = ctx;
          if (oidc.params.max_age === undefined) {
            return Validate.NO_NEED_TO_PROMPT;
          }

          if (!oidc.session.accountId) {
            return Validate.REQUEST_PROMPT;
          }

          if (
            oidc.session.past(oidc.params.max_age) &&
            (!ctx.oidc.result || !ctx.oidc.result.login)
          ) {
            return Validate.REQUEST_PROMPT;
          }

          return Validate.NO_NEED_TO_PROMPT;
        },
      }),

      new Validate({
        reason: "id_token_hint",
        description: "id_token_hint and authenticated subject do not match",
        check: async (ctx) => {
          const { oidc } = ctx;
          if (oidc.entities.IdTokenHint === undefined) {
            return Validate.NO_NEED_TO_PROMPT;
          }

          const { payload } = oidc.entities.IdTokenHint;

          let sub = oidc.session.accountId;
          if (sub === undefined) {
            return Validate.REQUEST_PROMPT;
          }

          if (oidc.client.subjectType === "pairwise") {
            sub = await oidc.provider.configuration("pairwiseIdentifier")(
              ctx,
              sub,
              oidc.client
            );
          }

          if (payload.sub !== sub) {
            return Validate.REQUEST_PROMPT;
          }

          return Validate.NO_NEED_TO_PROMPT;
        },
      }),

      new Validate({
        reason: "claims_id_token_sub_value",
        description: "requested subject could not be obtained",
        check: async (ctx) => {
          const { oidc } = ctx;

          if (
            !oidc.claims.id_token ||
            !oidc.claims.id_token.sub ||
            !("value" in oidc.claims.id_token.sub)
          ) {
            return Validate.NO_NEED_TO_PROMPT;
          }

          let sub = oidc.session.accountId;
          if (sub === undefined) {
            return Validate.REQUEST_PROMPT;
          }

          if (oidc.client.subjectType === "pairwise") {
            sub = await oidc.provider.configuration("pairwiseIdentifier")(
              ctx,
              sub,
              oidc.client
            );
          }

          if (oidc.claims.id_token.sub.value !== sub) {
            return Validate.REQUEST_PROMPT;
          }

          return Validate.NO_NEED_TO_PROMPT;
        },
        detail: ({ oidc }) => ({ sub: oidc.claims.id_token.sub }),
      }),

      new Validate({
        reason: "essential_acrs",
        description: "none of the requested ACRs could not be obtained",
        check: (ctx) => {
          const { oidc } = ctx;
          const request = get(oidc.claims, "id_token.acr", {});

          if (!request || !request.essential || !request.values) {
            return Validate.NO_NEED_TO_PROMPT;
          }

          if (!Array.isArray(oidc.claims.id_token.acr.values)) {
            throw new InvalidRequest("invalid claims.id_token.acr.values type");
          }

          if (request.values.includes(oidc.acr)) {
            return Validate.NO_NEED_TO_PROMPT;
          }

          return Validate.REQUEST_PROMPT;
        },
        detail: ({ oidc }) => ({ acr: oidc.claims.id_token.acr }),
      }),

      new Validate({
        reason: "essential_acr",
        description: "requested ACR could not be obtained",
        check: (ctx) => {
          const { oidc } = ctx;
          const request = get(oidc.claims, "id_token.acr", {});

          if (!request || !request.essential || !request.value) {
            return Validate.NO_NEED_TO_PROMPT;
          }

          if (request.value === oidc.acr) {
            return Validate.NO_NEED_TO_PROMPT;
          }

          return Validate.REQUEST_PROMPT;
        },
        detail: ({ oidc }) => ({ acr: oidc.claims.id_token.acr }),
      }),
    ],
  });
