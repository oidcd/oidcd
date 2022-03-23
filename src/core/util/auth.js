const { InvalidArgument } = require("./error");

const basicAuth = function (req) {
  if (!req) {
    throw new TypeError("argument req is required");
  }

  if (typeof req !== "object") {
    throw new TypeError("argument req is required to be an object");
  }
  if (!req.headers || typeof req.headers !== "object") {
    throw new TypeError("argument req is required to have headers property");
  }

  if (typeof req.headers.authorization !== "string") {
    return undefined;
  }
  const auth = req.headers.authorization.trim().split(" ");
  if (auth.length !== 2) {
    throw new InvalidArgument("invalid credential format");
  }
  if (auth[0].trim().toLowerCase() !== "basic" || auth[1].trim().length <= 0) {
    throw new InvalidArgument("invalid credential format");
  }
  const credentials = Buffer.from(auth[1], "base64").toString();
  const index = credentials.indexOf(":");
  if (index < 0) {
    throw new InvalidArgument("invalid credential format");
  }
  const res = {
    name: credentials.substring(0, index).trim(),
    pass: credentials.substring(index + 1).trim(),
  };
  return res;
};

module.exports = {
  basicAuth,
};
