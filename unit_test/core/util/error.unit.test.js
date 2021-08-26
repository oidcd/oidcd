const error = require("../../../src/core/util/error");

/* eslint-env jest */

describe("error", () => {
  test("invalid token error", () => {
    const err = new error.InvalidToken(null, "I have a invalid token.");
    expect(err.error_description).toEqual("invalid token provided");
    expect(JSON.stringify(err)).toEqual(
      '{"name":"InvalidToken","error":"invalid_token","statusCode":401,"expose":true,"error_description":"invalid token provided","error_detail":"I have a invalid token."}'
    );
  });

  test("invalid token error, override description", () => {
    const err = new error.InvalidToken(
      "override description",
      "I have a invalid token."
    );
    expect(err.error_description).toEqual("override description");
    expect(JSON.stringify(err)).toEqual(
      '{"name":"InvalidToken","error":"invalid_token","statusCode":401,"expose":true,"error_description":"override description","error_detail":"I have a invalid token."}'
    );
  });

  test("invalid token error, override statusCode", () => {
    const err = new error.InvalidToken(null, "I have a invalid token.");
    err.statusCode = 403;
    expect(err.statusCode).toEqual(403);
    expect(JSON.stringify(err)).toEqual(
      '{"name":"InvalidToken","error":"invalid_token","statusCode":403,"expose":true,"error_description":"invalid token provided","error_detail":"I have a invalid token."}'
    );
  });
});
