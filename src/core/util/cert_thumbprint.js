const { createHash } = require("crypto");
const { fromBuffer } = require("./encode_base64_url");

const normalize = (cert) =>
  cert.replace(/(?:-----(?:BEGIN|END) CERTIFICATE-----|\s|=)/g, "");

module.exports = {
  x5t: (cert) =>
    fromBuffer(
      createHash("sha1")
        .update(Buffer.from(normalize(cert), "base64"))
        .digest()
    ),
  "x5t#S256": (cert) =>
    fromBuffer(
      createHash("sha256")
        .update(Buffer.from(normalize(cert), "base64"))
        .digest()
    ),
};
