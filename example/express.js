const express = require("express");
const oidcd = require("../src/oidcd");
const { defaultInteractionPolicy } = require("../src/core/type/interaction/policy");

var app = express();

app.set("port", 8633);

const oidcdRouter = oidcd.use(
  { interactions: { policy: defaultInteractionPolicy(), enabled: true } },
  express.Router
);

app.use("/", oidcdRouter);

app.listen(8633, function () {
  console.info(
    "oidcd-express-example, %s, %s",
    app.get("port"),
    app.get("env")
  );
});

process.on("uncaughtException", (err) => {
  console.error("UncaughtException, %j", err);
});
