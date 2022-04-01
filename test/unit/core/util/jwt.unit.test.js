const {
  generateKeyPair,
  generateSecret,
  importJWK,
  exportJWK,
} = require("jose");

const { InvalidJWT } = require("../../../../src/core/util/error");
const JWT = require("../../../../src/core/util/jwt");
const unixTimestamp = require("../../../../src/core/util/unix_timestamp");
const KeyStore = require("../../../../src/core/util/key_store");

const ks = new Map();

/* eslint-env jest */

describe("JSON Web Token (JWT) RFC7519 implementation", () => {
  beforeAll(async () => {
    const octKey = await generateSecret("HS512");
    const rsaKeyPair = await generateKeyPair("RSA-OAEP", {
      modulusLength: 2048,
    });
    const ecKeyPair = await generateKeyPair("ECDH-ES", { crv: "P-256" });
    // const okpKeyPair = await generateKeyPair("EdDSA", { crv: "Ed25519" });
    ks.set("oct", {
      keyObject: octKey,
      jwk: await exportJWK(octKey),
    });

    ks.set("RSA", {
      keyObject: rsaKeyPair.privateKey,
      jwk: await exportJWK(rsaKeyPair.privateKey),
    });

    ks.set("EC", {
      keyObject: ecKeyPair.privateKey,
      jwk: await exportJWK(ecKeyPair.privateKey),
    });
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
        expect(decoded.header).not.toHaveProperty("kid");
        expect(decoded.header).toHaveProperty("alg", "none");
        expect(decoded.payload).toHaveProperty("data", true);
      }));

  it("does not verify none", () => {
    const validated = jest.fn();
    JWT.sign({ data: true }, null, "none")
      .then((jwt) => JWT.verify(jwt))
      .then(validated, (err) => {
        expect(err).toBeTruthy();
        expect(validated).not.toHaveBeenCalled();
      });
  });

  it("does not verify none with a key", () => {
    const validated = jest.fn();
    JWT.sign({ data: true }, null, "none")
      .then((jwt) =>
        JWT.verify(jwt, new KeyStore([ks.get({ kty: "oct" }).toJWK(true)]))
      )
      .then(validated, (err) => {
        expect(err).toBeTruthy();
        expect(validated).not.toHaveBeenCalled();
      });
  });

  it("signs and validates with oct", async () => {
    const { keyObject: keyobject, jwk } = ks.get("oct");
    delete jwk.kid;
    const decoded = await JWT.sign({ data: true }, keyobject, "HS256").then(
      (jwt) => JWT.verify(jwt, new KeyStore([jwk]))
    );

    expect(decoded.header).not.toHaveProperty("kid");
    expect(decoded.header).toHaveProperty("alg", "HS256");
    expect(decoded.payload).toHaveProperty("data", true);
  });

  it("handles utf8 characters", () => {
    const { keyObject: keyobject } = ks.get("oct");

    JWT.sign({ "ś∂źć√": "ś∂źć√" }, keyobject, "HS256")
      .then((jwt) => JWT.decode(jwt))
      .then((decoded) => {
        expect(decoded.payload).toHaveProperty("ś∂źć√", "ś∂źć√");
      });
  });

  it("signs and validates with RSA", () => {
    const { keyObject: keyobject, jwk } = ks.get("RSA");
    JWT.sign({ data: true, name: "RSA" }, keyobject, "RS256")
      .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
      .then((decoded) => {
        expect(decoded.header).toHaveProperty("alg", "RS256");
        expect(decoded.payload).toHaveProperty("data", true);
        expect(decoded.payload).toHaveProperty("name", "RSA");
      });
  });

  it("signs and validates with EC", () => {
    const { keyObject: keyobject, jwk } = ks.get("EC");
    JWT.sign({ data: true, name: "EC" }, keyobject, "ES256")
      .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
      .then((decoded) => {
        expect(decoded.header).toHaveProperty("alg", "ES256");
        expect(decoded.payload).toHaveProperty("data", true);
        expect(decoded.payload).toHaveProperty("name", "EC");
      });
  });

  describe("sign options", () => {
    it("iat by default", () =>
      JWT.sign({ data: true }, null, "none")
        .then((jwt) => JWT.decode(jwt))
        .then((decoded) => {
          expect(decoded.payload).toHaveProperty("iat");
        }));

    it("expiresIn", () =>
      JWT.sign({ data: true }, null, "none", { expiresIn: 60 })
        .then((jwt) => JWT.decode(jwt))
        .then((decoded) => {
          expect(decoded.payload).toHaveProperty(
            "exp",
            decoded.payload.iat + 60
          );
        }));

    it("audience", () =>
      JWT.sign({ data: true }, null, "none", { audience: "clientId" })
        .then((jwt) => JWT.decode(jwt))
        .then((decoded) => {
          expect(decoded.payload).toHaveProperty("aud", "clientId");
        }));

    it("issuer", () =>
      JWT.sign({ data: true }, null, "none", {
        issuer: "http://example.com/issuer",
      })
        .then((jwt) => JWT.decode(jwt))
        .then((decoded) => {
          expect(decoded.payload).toHaveProperty(
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
          expect(decoded.payload).toHaveProperty(
            "sub",
            "http://example.com/subject"
          );
        }));
  });

  describe("verify", () => {
    it("nbf", () => {
      const validated = jest.fn();
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true, nbf: unixTimestamp() + 3600 }, keyobject, "HS256")
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(validated, (err) => {
          expect(err).toBeTruthy();
          expect(err).toBeInstanceOf(InvalidJWT);
          expect(err).toHaveProperty("error_description", "jwt not active yet");
          expect(validated).not.toHaveBeenCalled();
        });
    });

    it("nbf ignored", () => {
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign(
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
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign(
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
      const validated = jest.fn();
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true, nbf: "not a nbf" }, keyobject, "HS256")
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(validated, (err) => {
          expect(err).toBeTruthy();
          expect(err).toBeInstanceOf(InvalidJWT);
          expect(err).toHaveProperty("error_description", "invalid nbf value");
          expect(validated).not.toHaveBeenCalled();
        });
    });

    it("iat", () => {
      const validated = jest.fn();
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign(
        { data: true, iat: unixTimestamp() + 3600 },
        keyobject,
        "HS256",
        {
          noTimestamp: true,
        }
      )
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(validated, (err) => {
          expect(err).toBeTruthy;
          expect(err).toBeInstanceOf(InvalidJWT);
          expect(err).toHaveProperty(
            "error_description",
            "jwt issued in the future"
          );
          expect(validated).not.toHaveBeenCalled();
        });
    });

    it("iat ignored", () => {
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign(
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
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true, iat: unixTimestamp() + 5 }, keyobject, "HS256", {
        noTimestamp: true,
      }).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          clockTolerance: 10,
        })
      );
    });

    it("iat invalid", () => {
      const validated = jest.fn();
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true, iat: "not an iat" }, keyobject, "HS256", {
        noTimestamp: true,
      })
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(validated, (err) => {
          expect(err).toBeTruthy();
          expect(err).toBeInstanceOf(InvalidJWT);
          expect(err).toHaveProperty("error_description", "invalid iat value");
          expect(validated).not.toHaveBeenCalled();
        });
    });

    it("exp", () => {
      const validated = jest.fn();
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true, exp: unixTimestamp() - 3600 }, keyobject, "HS256")
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(validated, (err) => {
          expect(err).toBeTruthy();
          expect(err).toBeInstanceOf(InvalidJWT);
          expect(err).toHaveProperty("error_description", "jwt expired");
          expect(validated).not.toHaveBeenCalled();
        });
    });

    it("exp ignored", () => {
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign(
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
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign(
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
      const validated = jest.fn();
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true, exp: "not an exp" }, keyobject, "HS256")
        .then((jwt) => JWT.verify(jwt, new KeyStore([jwk])))
        .then(validated, (err) => {
          expect(err).toBeTruthy();
          expect(err).toBeInstanceOf(InvalidJWT);
          expect(err).toHaveProperty("error_description", "invalid exp value");
          expect(validated).not.toHaveBeenCalled();
        });
    });

    it("audience (single)", () => {
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true }, keyobject, "HS256", {
        audience: "client",
      }).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          audience: "client",
        })
      );
    });

    it("audience (multi)", () => {
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true }, keyobject, "HS256", {
        audience: ["client", "momma"],
        authorizedParty: "client",
      }).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          audience: "client",
        })
      );
    });

    it("audience (single) failed", () => {
      const validated = jest.fn();
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true }, keyobject, "HS256", {
        audience: "client",
      })
        .then((jwt) =>
          JWT.verify(jwt, new KeyStore([jwk]), {
            audience: "pappa",
          })
        )
        .then(validated)
        .catch((err) => {
          expect(err).toBeTruthy();
          expect(err).toBeInstanceOf(InvalidJWT);
          expect(err).toHaveProperty(
            "error_description",
            "jwt audience missing pappa"
          );
          expect(validated).not.toHaveBeenCalled();
        });
    });

    it("audience (multi) failed", () => {
      const validated = jest.fn();
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true }, keyobject, "HS256", {
        audience: ["client", "momma"],
      })
        .then((jwt) =>
          JWT.verify(jwt, new KeyStore([jwk]), {
            audience: "pappa",
          })
        )
        .then(validated)
        .catch((err) => {
          expect(err).toBeTruthy();
          expect(err).toBeInstanceOf(InvalidJWT);
          expect(err).toHaveProperty(
            "error_description",
            "jwt audience missing pappa"
          );
          expect(validated).not.toHaveBeenCalled();
        });
    });

    it("issuer", () => {
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true }, keyobject, "HS256", {
        issuer: "me",
      }).then((jwt) =>
        JWT.verify(jwt, new KeyStore([jwk]), {
          issuer: "me",
        })
      );
    });

    it("issuer failed", () => {
      const validated = jest.fn();
      const { keyObject: keyobject, jwk } = ks.get("oct");
      delete jwk.kid;
      JWT.sign({ data: true }, keyobject, "HS256", {
        issuer: "me",
      })
        .then((jwt) =>
          JWT.verify(jwt, new KeyStore([jwk]), {
            issuer: "you",
          })
        )
        .then(validated)
        .catch((err) => {
          expect(err).toBeTruthy();
          expect(err).toBeInstanceOf(InvalidJWT);
          expect(err).toHaveProperty("error_description", "jwt issuer invalid");
          expect(validated).not.toHaveBeenCalled();
        });
    });
  });
});
