"use strict";

if (Buffer.isEncoding("base64url")) {
  module.exports = {
    fromString: (input, encoding = "utf8") =>
      Buffer.from(input, encoding).toString("base64url"),
    fromBuffer: (buffer) => buffer.toString("base64url"),
  };
} else {
  module.exports = {
    fromString: (input, encoding = "utf8") =>
      Buffer.from(input, encoding)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_"),
    fromBuffer: (buffer) =>
      buffer
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_"),
  };
}
