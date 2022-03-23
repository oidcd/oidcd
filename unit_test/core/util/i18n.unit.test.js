const i18n = require("../../../src/core/util/i18n");

/* eslint-env jest */

describe("i18n", function () {
  describe("conj", function () {
    it("one item", () => {
      const res = i18n.enConj(["a"]);
      expect(res).toStrictEqual("a");
    });

    it("two items", () => {
      const res = i18n.enConj(["a", "b"]);
      expect(res).toStrictEqual("a and b");
    });

    it("three items", () => {
      const res = i18n.enConj(["a", "b", "c"]);
      expect(res).toStrictEqual("a, b, and c");
    });

    it("four items", () => {
      const res = i18n.enConj(["a", "b", "c", "d"]);
      expect(res).toStrictEqual("a, b, c, and d");
    });
  });

  describe("disj", function () {
    it("one item", () => {
      const res = i18n.enDisj(["a"]);
      expect(res).toStrictEqual("a");
    });

    it("two items", () => {
      const res = i18n.enDisj(["a", "b"]);
      expect(res).toStrictEqual("a or b");
    });

    it("three items", () => {
      const res = i18n.enDisj(["a", "b", "c"]);
      expect(res).toStrictEqual("a, b, or c");
    });

    it("four items", () => {
      const res = i18n.enDisj(["a", "b", "c", "d"]);
      expect(res).toStrictEqual("a, b, c, or d");
    });
  });

  describe("pluralize", function () {
    it("zero item", () => {
      const res = i18n.pluralize(0, "item");
      expect(res).toStrictEqual("0 item");
    });
    it("one item", () => {
      const res = i18n.pluralize(1, "item");
      expect(res).toStrictEqual("1 item");
    });
    it("two item", () => {
      const res = i18n.pluralize(2, "item");
      expect(res).toStrictEqual("2 items");
    });
    it("three item", () => {
      const res = i18n.pluralize(3, "item");
      expect(res).toStrictEqual("3 items");
    });
  });

  describe("githubLink", function () {
    it("overview link", () => {
      const res = i18n.githubLink("overview");
      expect(res).toStrictEqual(
        "https://github.com/leyusec/oidcd/blob/0.1.1/README.md#overview"
      );
    });
  });
});
