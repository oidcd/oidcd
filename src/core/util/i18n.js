const enConj = new Intl.ListFormat("en", { type: "conjunction" });
const enDisj = new Intl.ListFormat("en", { type: "disjunction" });
const { homepage, version } = require("../../../package.json");

module.exports = {
  enConj: enConj.format.bind(enConj),
  enDisj: enDisj.format.bind(enDisj),
  pluralize: (count, noun, suffix = "s") =>
    `${count} ${noun}${count > 1 ? suffix : ""}`,
  githubLink: (anchor) =>
    `${homepage}/blob/${version}/README.md#${anchor}`,
};
