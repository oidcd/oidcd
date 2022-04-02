"use strict";

const Configuration = require("../core/type/config/configuration");
/*
const {
  authorizationGet,
  authorizationPost,
} = require("../core/action/authorization");
*/

const router = new Configuration.Router();
const { routes, features } = Configuration.configuration;
// authorization
router.get(routes.authorization, (req, res, next) => {
  res.json(200);
});
router.post(routes.authorization, (req, res, next) => {
  res.json(200);
});

// resume tbd
router.get(`${routes.authorization}/:uid`, () => {});

// userinfo
if (features.userinfo.enabled) {
  router.get(
    routes.userinfo,
    () => {
      /*CORS*/
    },
    () => {}
  );
  router.post(
    routes.userinfo,
    () => {
      /*CORS*/
    },
    () => {}
  );
  router.options(routes.userinfo, () => {
    /*CORS*/
  });
}

// token
router.post(routes.token, () => {});

// jwks CORS open
router.get(routes.jwks, () => {});

// discovery CORS open
router.get("/.well-known/openid-configuration", (req, res, next) => {
  return res.json(Configuration.configuration.oidcdConfiguration());
});

// registeration
if (features.registration.enabled) {
  router.post(routes.registration, () => {});
  router.get(`${routes.registration}/:clientId`, () => {});

  if (features.registrationManagement.enable) {
    router.put(`${routes.registration}/:clientId`, () => {});
    router.delete(`${routes.registration}/:clientId`, () => {});
  }
}

// revocation
if (features.revocation.enabled) {
  router.post(routes.revocation, () => {});
}

// introspection
if (features.introspection.enabled) {
  router.post(routes.introspection, () => {});
}

// end session
router.post(`${routes.end_session}/confirm`, () => {});
if (features.rpInitiatedLogout.enabled) {
  router.post(routes.end_session, () => {});
  router.get(routes.end_session, () => {});
  router.get(`${routes.end_session}/success`, () => {});
}

// device flow
if (features.deviceFlow.enabled) {
  router.post(routes.device_authorization, () => {});

  router.get(routes.code_verification, () => {});

  router.post(routes.code_verification, () => {});

  // device resume
  router.get(`${routes.code_verification}/:uid`, () => {});
}

if (features.pushedAuthorizationRequests.enabled) {
  router.post(routes.pushed_authorization_request, () => {});
}

if (features.ciba.enabled) {
  router.post(routes.backchannel_authentication, () => {});
}

if (features.interactions.enabled) {
  router.get("/interaction/:uid", () => {});
  router.post("/interaction/:uid", () => {});
  router.get("/interaction/:uid/abort", () => {});
}

module.exports = router;
