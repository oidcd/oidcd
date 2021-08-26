const unixTimestamp = require("../../../src/core/util/unix_timestamp");

/* eslint-env jest */

describe("unix_timestamp", () => {
  test("get giving unix timestamp", () => {
    const timestamp = unixTimestamp(new Date("2021-07-13T09:53:00Z"));
    expect(timestamp).toBe(1626169980);
  });

  test("get default unix timestamp", () => {
    const spyOnGlobalDate = jest
      .spyOn(Date, "now")
      .mockImplementation(() => new Date("2021-07-13T10:02:01Z"));
    const timestamp = unixTimestamp();
    spyOnGlobalDate.mockRestore();
    expect(timestamp).toBe(1626170521);
  });
});
