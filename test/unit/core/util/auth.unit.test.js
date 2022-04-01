const { basicAuth } = require("../../../../src/core/util/auth");
const { InvalidArgument } = require("../../../../src/core/util/error");

function request(authorization) {
  return {
    headers: {
      authorization: authorization,
    },
  };
}

/* eslint-env jest */

describe("basicAuth(req)", function () {
  describe("arguments", function () {
    describe("req", function () {
      it("should be required", function () {
        expect(() => {
          basicAuth();
        }).toThrow(new TypeError("argument req is required"));
      });

      it("should accept a request", function () {
        var req = request("basic Zm9vOmJhcg==");
        var creds = basicAuth(req);
        expect(creds.name).toEqual("foo");
        expect(creds.pass).toEqual("bar");
      });

      it("should reject null", function () {
        expect(() => {
          basicAuth(null);
        }).toThrow(new TypeError("argument req is required"));
      });

      it("should reject a number", function () {
        expect(() => {
          basicAuth(42);
        }).toThrow(new TypeError("argument req is required to be an object"));
      });

      it("should reject an object without headers", function () {
        expect(() => {
          basicAuth({});
        }).toThrow(
          new TypeError("argument req is required to have headers property")
        );
      });
    });
  });

  describe("with no Authorization field", function () {
    it("should return undefined", function () {
      var req = request();
      expect(basicAuth(req)).toEqual(undefined);
    });
  });

  describe("with malformed Authorization field", function () {
    it("should return undefined", function () {
      var req = request("Something");
      expect(() => {
        basicAuth(req);
      }).toThrow(new InvalidArgument("invalid credential format"));
    });
  });

  describe("with malformed Authorization scheme", function () {
    it("should return undefined", function () {
      var req = request("basic_Zm9vOmJhcg==");
      expect(() => {
        basicAuth(req);
      }).toThrow(new InvalidArgument("invalid credential format"));
    });
  });

  describe("with malformed credentials", function () {
    it("should return undefined", function () {
      var req = request("basic Zm9vcgo=");
      expect(() => {
        basicAuth(req);
      }).toThrow(new InvalidArgument("invalid credential format"));
    });
  });

  describe("with valid credentials", function () {
    it("should return .name and .pass", function () {
      var req = request("basic Zm9vOmJhcg==");
      var creds = basicAuth(req);
      expect(creds.name).toEqual("foo");
      expect(creds.pass).toEqual("bar");
    });
  });

  describe("with empty password", function () {
    it("should return .name and .pass", function () {
      var req = request("basic Zm9vOg==");
      var creds = basicAuth(req);
      expect(creds.name).toEqual("foo");
      expect(creds.pass).toEqual("");
    });
  });

  describe("with empty userid", function () {
    it("should return .name and .pass", function () {
      var req = request("basic OnBhc3M=");
      var creds = basicAuth(req);
      expect(creds.name).toEqual("");
      expect(creds.pass).toEqual("pass");
    });
  });

  describe("with empty userid and pass", function () {
    it("should return .name and .pass", function () {
      var req = request("basic Og==");
      var creds = basicAuth(req);
      expect(creds.name).toEqual("");
      expect(creds.pass).toEqual("");
    });
  });

  describe("with colon in pass", function () {
    it("should return .name and .pass", function () {
      var req = request("basic Zm9vOnBhc3M6d29yZA==");
      var creds = basicAuth(req);
      expect(creds.name).toEqual("foo");
      expect(creds.pass).toEqual("pass:word");
    });
  });

  describe('with scheme "Basic"', function () {
    it("should return .name and .pass", function () {
      var req = request("Basic Zm9vOmJhcg==");
      var creds = basicAuth(req);
      expect(creds.name).toEqual("foo");
      expect(creds.pass).toEqual("bar");
    });
  });

  describe('with scheme "BASIC"', function () {
    it("should return .name and .pass", function () {
      var req = request("BASIC Zm9vOmJhcg==");
      var creds = basicAuth(req);
      expect(creds.name).toEqual("foo");
      expect(creds.pass).toEqual("bar");
    });
  });

  describe('with scheme "BaSiC"', function () {
    it("should return .name and .pass", function () {
      var req = request("BaSiC Zm9vOmJhcg==");
      var creds = basicAuth(req);
      expect(creds.name).toEqual("foo");
      expect(creds.pass).toEqual("bar");
    });
  });
});
