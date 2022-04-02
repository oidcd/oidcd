const {
  x5t,
  "x5t#S256": x5t256,
} = require("../../../../src/core/util/cert_thumbprint");

var cert = `-----BEGIN CERTIFICATE-----
MIID8zCCAtugAwIBAgIUcxpB1Z8+AV52KHN3JMmr2xlc6EEwDQYJKoZIhvcNAQEL
BQAwgYgxCzAJBgNVBAYTAkNOMRAwDgYDVQQIDAdKaWFuZ3N1MRAwDgYDVQQHDAdO
YW5qaW5nMQswCQYDVQQKDAJUTTELMAkGA1UECwwCUkQxFzAVBgNVBAMMDnRtLmV4
YW1wbGUuY29tMSIwIAYJKoZIhvcNAQkBFhNtYWlsQHRtLmV4YW1wbGUuY29tMB4X
DTIyMDMxODA4MDAwOVoXDTMyMDMxNTA4MDAwOVowgYgxCzAJBgNVBAYTAkNOMRAw
DgYDVQQIDAdKaWFuZ3N1MRAwDgYDVQQHDAdOYW5qaW5nMQswCQYDVQQKDAJUTTEL
MAkGA1UECwwCUkQxFzAVBgNVBAMMDnRtLmV4YW1wbGUuY29tMSIwIAYJKoZIhvcN
AQkBFhNtYWlsQHRtLmV4YW1wbGUuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAtlvbikZL9tKYIYlgzX4bWSrZxFLQl48wSniH8EFhzQknkWB/A5Zk
HDbjH6Ht2fcPLTglP5CjyhKMgt5XEmJ2TusaTer+209dx/D6QyVza/T+FUCY9MqU
lX9zuZMIf1HX46Tadq7H61/oSXrCPzb7+V0NrsFKl1ZRWqH1gIf0BUppyfZqoXpa
6+HlcdIIrR8NTFir8i1gSrF5R8JPMFJQQPEZqrnL+igDQOu5OMjOEnH5/4f3NkI7
CU8khCqcmRnUHWQCQ3KtotL1v58B+YmQW7O9Ca6bQQkNw2AyuVIqf/X9sMIxesT1
fCqED7hTzM2qbSAFyciwzg2Vh0zVZ0sjkwIDAQABo1MwUTAdBgNVHQ4EFgQUXOIx
W4WpebgVRsUgzNiZl6i393gwHwYDVR0jBBgwFoAUXOIxW4WpebgVRsUgzNiZl6i3
93gwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAFs8Mzyd95DqT
g5nRSkwNBk5jVgp9quJsfpqlUdp7nVA18ovV7aZYpJoZG8us18VPRkMiwzIwwej4
6uOPGI6c/VNBqb5xpfBhoiNgfbw9Shn6gqfhUhyiTxTKEG3uqwELpo4fLv6r8qq9
u/wB3gEBlJ9BezLYGl1Lu06++ZzKftnLbCDJIJc7g1OaDAH8pPDtcMcw18tvjVHU
a22/vSbPhXzU0rh7Z6naz4Y9CHUQQOCn/FMdgR6+zqZIJQb1ORn7IrKQuuUTOIs1
+wngc03lRqD62IOX8r8yReXip7wm0lIE5zHGA2xQslxGyjMSu3riUk8uOiXoNFOc
eyV52cx9uw==
-----END CERTIFICATE-----
`;

/* eslint-env jest */

describe("calc cert thumbprint", () => {
  it("x5t should equal ''", () => {
    const res = x5t(cert);
    expect(res.toString("hex")).toEqual("s6Y7BY1E5whtDLBOi3W66rqd49Q");
  });

  it("x5t#S256 should equal ''", () => {
    const res = x5t256(cert);
    expect(res).toEqual("mRMTYnJ0T4nZxBhAF8bho0G7wqXvXS2Ol4HLb8YhtNc");
  });
});