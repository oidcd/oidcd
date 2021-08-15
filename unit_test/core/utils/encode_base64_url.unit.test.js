const encodeBase64Url = require("../../../src/core/utils/encode_base64_url");

/* eslint-env jest */

describe("encode_base64_url", () => {
  test("encodeFromString", () => {
    const res = encodeBase64Url.fromString("dkfjk#*$**$");
    // not ZGtmamsjKiQqKiQ=
    expect(res).toEqual("ZGtmamsjKiQqKiQ");
  });

  test("encodeFromBuffer", () => {
    const res = encodeBase64Url.fromBuffer(Buffer.from("dkfjk#*$**$"));
    // not ZGtmamsjKiQqKiQ=
    expect(res).toEqual("ZGtmamsjKiQqKiQ");
  });
});
