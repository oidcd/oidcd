// https://github.com/browserify/resolve/pull/224
// const { CompactEncrypt } = require("jose/jwe/compact/encrypt");
const { CompactEncrypt } = require("jose/dist/node/cjs/jwe/compact/encrypt");
const { CompactSign } = require("jose/dist/node/cjs/jws/compact/sign");
const { compactDecrypt } = require("jose/dist/node/cjs/jwe/compact/decrypt");
const { compactVerify } = require("jose/dist/node/cjs/jws/compact/verify");
const { decodeProtectedHeader } = require("jose/dist/node/cjs/util/decode_protected_header");
const {
  JWEDecryptionFailed,
  JWKSNoMatchingKey,
  JWSSignatureVerificationFailed,
} = require("jose/dist/node/cjs/util/errors");

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

const { InvalidJWT } = require("./error");

const { fromString: b64Encode } = require("./encode_base64_url");
const unixTimestamp = require("./unix_timestamp");

const TYPE_JWT = "JWT";

function verifyAudience({ aud, azp }, expected, checkAzp) {
  if (Array.isArray(aud)) {
    const match = aud.some((actual) => actual === expected);
    if (!match) {
      throw new InvalidJWT(`jwt audience missing ${expected}`);
    }
    if (checkAzp) {
      if (!azp) {
        throw new InvalidJWT("jwt missing azp claim");
      }

      if (azp !== expected) {
        throw new InvalidJWT("invalid jwt azp");
      }
    }
  } else {
    if (aud !== expected) {
      throw new InvalidJWT("invalid jwt audience");
    }
  }
}

class JWT {
  static async sign(payload, key, alg, options = {}) {
    const header = {
      alg,
      typ: options.typ !== undefined ? options.typ : TYPE_JWT,
      ...options.fields,
    };
    const timestamp = unixTimestamp();

    const iat = options.noIat ? undefined : timestamp;

    Object.assign(payload, {
      aud: options.audience !== undefined ? options.audience : payload.aud,
      azp:
        options.authorizedParty !== undefined
          ? options.authorizedParty
          : payload.azp,
      exp:
        options.expiresIn !== undefined
          ? timestamp + options.expiresIn
          : payload.exp,
      iat: payload.iat !== undefined ? payload.iat : iat,
      iss: options.issuer !== undefined ? options.issuer : payload.iss,
      sub: options.subject !== undefined ? options.subject : payload.sub,
    });

    if (alg === "none") {
      return [
        b64Encode(JSON.stringify(header)),
        b64Encode(JSON.stringify(payload)),
        "",
      ].join(".");
    }

    return new CompactSign(Buffer.from(JSON.stringify(payload)))
      .setProtectedHeader(header)
      .sign(key);
  }

  static decode(input) {
    let jwt;

    if (Buffer.isBuffer(input)) {
      jwt = input.toString("utf8");
    } else if (typeof input !== "string") {
      throw new InvalidJWT("invalid JWT.decode input type");
    } else {
      jwt = input;
    }

    const { 0: header, 1: payload, length } = jwt.split(".");

    if (length !== 3) {
      throw new InvalidJWT("invalid JWT.decode input");
    }

    return {
      header: JSON.parse(Buffer.from(header, "base64")),
      payload: JSON.parse(Buffer.from(payload, "base64")),
    };
  }

  static header(jwt) {
    return JSON.parse(Buffer.from(jwt.toString().split(".")[0], "base64"));
  }

  static assertHeader(header, { algorithm }) {
    if (algorithm !== undefined) {
      if (header.alg !== algorithm) {
        throw new InvalidJWT("unexpected JWT header alg value");
      }
    }
  }

  static assertPayload(
    payload,
    {
      clockTolerance = 0,
      audience,
      ignoreExpiration,
      ignoreAzp,
      ignoreIssued,
      ignoreNotBefore,
      issuer,
      subject = false,
    } = {}
  ) {
    const timestamp = unixTimestamp();

    if (typeof payload !== "object") {
      throw new InvalidJWT(
        "payload is not of JWT type (JSON serialized object)"
      );
    }

    if (typeof payload.nbf !== "undefined" && !ignoreNotBefore) {
      if (typeof payload.nbf !== "number") {
        throw new InvalidJWT("invalid nbf value");
      }

      if (payload.nbf > timestamp + clockTolerance) {
        throw new InvalidJWT("jwt not active yet");
      }
    }

    if (typeof payload.iat !== "undefined" && !ignoreIssued) {
      if (typeof payload.iat !== "number") {
        throw new InvalidJWT("invalid iat value");
      }
      if (typeof payload.exp === "undefined") {
        if (payload.iat > timestamp + clockTolerance) {
          throw new InvalidJWT("jwt issued in the future");
        }
      }
    }

    if (typeof payload.exp !== "undefined" && !ignoreExpiration) {
      if (typeof payload.exp !== "number") {
        throw new InvalidJWT("invalid exp value");
      }
      if (timestamp - clockTolerance > payload.exp) {
        throw new InvalidJWT("jwt expired");
      }
    }

    if (typeof payload.jti !== "undefined") {
      if (typeof payload.jti !== "string") {
        throw new InvalidJWT("invalid jti value");
      }
    }

    if (typeof payload.iss !== "undefined") {
      if (typeof payload.iss !== "string") {
        throw new InvalidJWT("invalid iss value");
      }
    }

    if (subject) {
      if (typeof payload.sub !== "string") {
        throw new InvalidJWT("invalid sub value");
      }
    }

    if (audience) {
      verifyAudience(payload, audience, !ignoreAzp);
    }

    if (issuer) {
      if (payload.iss !== issuer) {
        throw new InvalidJWT("jwt issuer invalid");
      }
    }
  }

  static async verify(jwt, keystore, options = {}) {
    let verified;
    try {
      const header = decodeProtectedHeader(jwt);

      const keys = keystore.selectForVerify({
        alg: header.alg,
        kid: header.kid,
      });
      if (keys.length === 0) {
        throw new JWKSNoMatchingKey();
      } else {
        // eslint-disable-next-line no-restricted-syntax
        for (const key of keys) {
          try {
            // eslint-disable-next-line no-await-in-loop
            verified = await compactVerify(
              jwt,
              // eslint-disable-next-line no-await-in-loop
              await keystore.getKeyObject(key, header.alg),
              {
                algorithms: options.algorithm ? [options.algorithm] : undefined,
              }
            );
          } catch (err) {}
        }
      }

      if (!verified) {
        throw new JWSSignatureVerificationFailed();
      }
    } catch (err) {
      if (typeof keystore.fresh !== "function" || keystore.fresh()) {
        throw err;
      }

      await keystore.refresh();
      // eslint-disable-next-line prefer-rest-params
      return JWT.verify(...arguments);
    }

    const payload = JSON.parse(Buffer.from(verified.payload));

    this.assertPayload(payload, options);
    return { payload, header: verified.protectedHeader };
  }

  static async encrypt(cleartext, key, { enc, alg, fields } = {}) {
    const header = {
      alg,
      enc,
      ...fields,
    };

    return new CompactEncrypt(Buffer.from(cleartext))
      .setProtectedHeader(header)
      .encrypt(key);
  }

  static async decrypt(jwe, keystore) {
    const header = decodeProtectedHeader(jwe);

    const keys = keystore.selectForDecrypt({
      alg: header.alg === "dir" ? header.enc : header.alg,
      kid: header.kid,
      epk: header.epk,
    });
    let decrypted;
    if (keys.length === 0) {
      throw new JWKSNoMatchingKey();
    } else {
      // eslint-disable-next-line no-restricted-syntax
      for (const key of keys) {
        try {
          // eslint-disable-next-line no-await-in-loop
          decrypted = await compactDecrypt(
            jwe,
            await keystore.getKeyObject(
              key,
              header.alg === "dir" ? header.enc : header.alg
            )
          );
        } catch (err) {}
      }
    }

    if (!decrypted) {
      throw new JWEDecryptionFailed();
    }

    return Buffer.from(decrypted.plaintext);
  }
}

module.exports = JWT;
