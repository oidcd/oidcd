const {
  generateKeyPair,
} = require("jose/dist/node/cjs/util/generate_key_pair");
const { generateSecret } = require("jose/dist/node/cjs/util/generate_secret");
const { fromKeyLike } = require("jose/dist/node/cjs/jwk/from_key_like");

const { InvalidJWT } = require("../../../src/core/util/error");
const JWT = require("../../../src/core/util/jwt");
const unixTimestamp = require("../../../src/core/util/unix_timestamp");
const KeyStore = require("../../../src/core/util/key_store");

const ks = new KeyStore();

/* eslint-env jest */

describe("JSON Web Token (JWT) RFC7519 implementation", () => {
  beforeAll(() => {
    const octKey = generateSecret("HS512");
    const rsaKeyPair = generateKeyPair("RSA-OAEP", { modulusLength: 2048 });
    const ecKeyPair = generateKeyPair("ECDH-ES", { crv: "P-256" });
    const okpKeyPair = generateKeyPair("EdDSA", { crv: "Ed25519" });
    ks.add(fromKeyLike(octKey));
    ks.add(fromKeyLike(rsaKeyPair));
    ks.add(fromKeyLike(ecKeyPair));
    ks.add(fromKeyLike(okpKeyPair));
  });

  describe(".decode()", () => {
    it("doesnt decode non strings or non buffers", () => {
      expect(() => JWT.decode({})).toThrow(InvalidJWT);
    });

    it("only handles length 3", () => {
      expect(() => JWT.decode("foo.bar.baz.")).toThrow(InvalidJWT);
    });
  });

  it("signs and decodes with none", () =>
    JWT.sign({ data: true }, null, "none")
      .then((jwt) => JWT.decode(jwt))
      .then((decoded) => {
        expect(decoded.header).not.to.have.property("kid");
        expect(decoded.header).to.have.property("alg", "none");
        expect(decoded.payload).to.contain({ data: true });
      }));

  it("does not verify none", () =>
    JWT.sign({ data: true }, null, "none")
      .then((jwt) => JWT.verify(jwt))
      .then(
        (valid) => {
          expect(valid).not.to.be.ok;
        },
        (err) => {
          expect(err).to.be.ok;
        }
      ));

  it("does not verify none with a key", () =>
    JWT.sign({ data: true }, null, "none")
      .then((jwt) =>
        JWT.verify(jwt, new KeyStore([ks.get({ kty: "oct" }).toJWK(true)]))
      )
      .then(
        (valid) => {
          expect(valid).not.to.be.ok;
        },
        (err) => {
          expect(err).to.be.ok;
        }
      ));

  it("signs and validates with oct", () => {
    const key = ks.get({ kty: "oct" });
    const keyobject = key.keyObject;
    const jwk = key.toJWK(true);
    delete jwk.kid;
    return JWT.sign({ data: true }, keyobject, "HS256")
      .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
      .then((decoded) => {
        expect(decoded.header).not.to.have.property("kid");
        expect(decoded.header).to.have.property("alg", "HS256");
        expect(decoded.payload).to.contain({ data: true });
      });
  });

  it("handles utf8 characters", () => {
    const key = ks.get({ kty: "oct" });
    const keyobject = key.keyObject;

    return JWT.sign({ "ś∂źć√": "ś∂źć√" }, keyobject, "HS256")
      .then((jwt) => JWT.decode(jwt))
      .then((decoded) => {
        expect(decoded.payload).to.contain({ "ś∂źć√": "ś∂źć√" });
      });
  });

  it("signs and validates with RSA", () => {
    const key = ks.get({ kty: "RSA" });
    const keyobject = key.keyObject;
    const jwk = key.toJWK(false);
    return JWT.sign({ data: true }, keyobject, "RS256")
      .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
      .then((decoded) => {
        expect(decoded.header).to.have.property("alg", "RS256");
        expect(decoded.payload).to.contain({ data: true });
      });
  });

  it("signs and validates with EC", () => {
    const key = ks.get({ kty: "EC" });
    const keyobject = key.keyObject;
    const jwk = key.toJWK(false);
    return JWT.sign({ data: true }, keyobject, "ES256")
      .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
      .then((decoded) => {
        expect(decoded.header).to.have.property("alg", "ES256");
        expect(decoded.payload).to.contain({ data: true });
      });
  });

  describe("sign options", () => {
    it("iat by default", () =>
      JWT.sign({ data: true }, null, "none")
        .then((jwt) => JWT.decode(jwt))
        .then((decoded) => {
          expect(decoded.payload).to.have.property("iat");
        }));

    it("expiresIn", () =>
      JWT.sign({ data: true }, null, "none", { expiresIn: 60 })
        .then((jwt) => JWT.decode(jwt))
        .then((decoded) => {
          expect(decoded.payload).to.have.property(
            "exp",
            decoded.payload.iat + 60
          );
        }));

    it("audience", () =>
      JWT.sign({ data: true }, null, "none", { audience: "clientId" })
        .then((jwt) => JWT.decode(jwt))
        .then((decoded) => {
          expect(decoded.payload).to.have.property("aud", "clientId");
        }));

    it("issuer", () =>
      JWT.sign({ data: true }, null, "none", {
        issuer: "http://example.com/issuer",
      })
        .then((jwt) => JWT.decode(jwt))
        .then((decoded) => {
          expect(decoded.payload).to.have.property(
            "iss",
            "http://example.com/issuer"
          );
        }));

    it("subject", () =>
      JWT.sign({ data: true }, null, "none", {
        subject: "http://example.com/subject",
      })
        .then((jwt) => JWT.decode(jwt))
        .then((decoded) => {
          expect(decoded.payload).to.have.property(
            "sub",
            "http://example.com/subject"
          );
        }));
  });

  describe("verify", () => {
    it("nbf", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign(
        { data: true, nbf: unixTimestamp() + 3600 },
        keyobject,
        "HS256"
      )
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(
          (valid) => {
            expect(valid).not.to.be.ok;
          },
          (err) => {
            expect(err).to.be.ok;
            expect(err).to.be.an.instanceOf(InvalidJWT);
            expect(err).to.have.property("message", "jwt not active yet");
          }
        );
    });

    it("nbf ignored", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign(
        { data: true, nbf: unixTimestamp() + 3600 },
        keyobject,
        "HS256"
      ).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          ignoreNotBefore: true,
        })
      );
    });

    it("nbf accepted within set clock tolerance", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign(
        { data: true, nbf: unixTimestamp() + 5 },
        keyobject,
        "HS256"
      ).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          clockTolerance: 10,
        })
      );
    });

    it("nbf invalid", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign({ data: true, nbf: "not a nbf" }, keyobject, "HS256")
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(
          (valid) => {
            expect(valid).not.to.be.ok;
          },
          (err) => {
            expect(err).to.be.ok;
            expect(err).to.be.an.instanceOf(InvalidJWT);
            expect(err).to.have.property("message", "invalid nbf value");
          }
        );
    });

    it("iat", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign(
        { data: true, iat: unixTimestamp() + 3600 },
        keyobject,
        "HS256",
        {
          noTimestamp: true,
        }
      )
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(
          (valid) => {
            expect(valid).not.to.be.ok;
          },
          (err) => {
            expect(err).to.be.ok;
            expect(err).to.be.an.instanceOf(InvalidJWT);
            expect(err).to.have.property("message", "jwt issued in the future");
          }
        );
    });

    it("iat ignored", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign(
        { data: true, iat: unixTimestamp() + 3600 },
        keyobject,
        "HS256",
        {
          noTimestamp: true,
        }
      ).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          ignoreIssued: true,
        })
      );
    });

    it("iat accepted within set clock tolerance", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign(
        { data: true, iat: unixTimestamp() + 5 },
        keyobject,
        "HS256",
        {
          noTimestamp: true,
        }
      ).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          clockTolerance: 10,
        })
      );
    });

    it("iat invalid", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign({ data: true, iat: "not an iat" }, keyobject, "HS256", {
        noTimestamp: true,
      })
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(
          (valid) => {
            expect(valid).not.to.be.ok;
          },
          (err) => {
            expect(err).to.be.ok;
            expect(err).to.be.an.instanceOf(InvalidJWT);
            expect(err).to.have.property("message", "invalid iat value");
          }
        );
    });

    it("exp", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign(
        { data: true, exp: unixTimestamp() - 3600 },
        keyobject,
        "HS256"
      )
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(
          (valid) => {
            expect(valid).not.to.be.ok;
          },
          (err) => {
            expect(err).to.be.ok;
            expect(err).to.be.an.instanceOf(InvalidJWT);
            expect(err).to.have.property("message", "jwt expired");
          }
        );
    });

    it("exp ignored", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign(
        { data: true, exp: unixTimestamp() - 3600 },
        keyobject,
        "HS256"
      ).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          ignoreExpiration: true,
        })
      );
    });

    it("exp accepted within set clock tolerance", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign(
        { data: true, exp: unixTimestamp() - 5 },
        keyobject,
        "HS256"
      ).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          clockTolerance: 10,
        })
      );
    });

    it("exp invalid", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign({ data: true, exp: "not an exp" }, keyobject, "HS256")
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(
          (valid) => {
            expect(valid).not.to.be.ok;
          },
          (err) => {
            expect(err).to.be.ok;
            expect(err).to.be.an.instanceOf(InvalidJWT);
            expect(err).to.have.property("message", "invalid exp value");
          }
        );
    });

    it("audience (single)", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign({ data: true }, keyobject, "HS256", {
        audience: "client",
      }).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          audience: "client",
        })
      );
    });

    it("audience (multi)", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign({ data: true }, keyobject, "HS256", {
        audience: ["client", "momma"],
        authorizedParty: "client",
      }).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          audience: "client",
        })
      );
    });

    it("audience (single) failed", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign({ data: true }, keyobject, "HS256", {
        audience: "client",
      })
        .then((jwt) =>
          JWT.verify(jwt, new KeyStore([jwk]), {
            audience: "pappa",
          })
        )
        .then((valid) => {
          expect(valid).not.to.be.ok;
        })
        .catch((err) => {
          expect(err).to.be.ok;
          expect(err).to.be.an.instanceOf(InvalidJWT);
          expect(err).to.have.property("message", "jwt audience missing pappa");
        });
    });

    it("audience (multi) failed", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign({ data: true }, keyobject, "HS256", {
        audience: ["client", "momma"],
      })
        .then((jwt) =>
          JWT.verify(jwt, new KeyStore([jwk]), {
            audience: "pappa",
          })
        )
        .then((valid) => {
          expect(valid).not.to.be.ok;
        })
        .catch((err) => {
          expect(err).to.be.ok;
          expect(err).to.be.an.instanceOf(InvalidJWT);
          expect(err).to.have.property("message", "jwt audience missing pappa");
        });
    });

    it("issuer", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign({ data: true }, keyobject, "HS256", {
        issuer: "me",
      }).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          issuer: "me",
        })
      );
    });

    it("issuer failed", () => {
      const key = ks.get({ kty: "oct" });
      const keyobject = key.keyObject;
      const jwk = key.toJWK(true);
      delete jwk.kid;
      return JWT.sign({ data: true }, keyobject, "HS256", {
        issuer: "me",
      })
        .then((jwt) =>
          JWT.verify(jwt, new KeyStore([jwk]), {
            issuer: "you",
          })
        )
        .then((valid) => {
          expect(valid).not.to.be.ok;
        })
        .catch((err) => {
          expect(err).to.be.ok;
          expect(err).to.be.an.instanceOf(InvalidJWT);
          expect(err)
            .to.have.property("message")
            .that.matches(/jwt issuer invalid/);
        });
    });
  });
});
