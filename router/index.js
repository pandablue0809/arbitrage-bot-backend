const express = require("express");
const router = express.Router();
const Bot = require("../controller/api");

module.exports = (router) => {
  // User API
  router.post("/botStart", Bot.Start);
  router.post("/botStop", Bot.Stop);
  router.post("/getBalance", Bot.GetBalance);
  router.post("/getPrice", Bot.GetPrice);
  router.post("/withdraw", Bot.Withdraw);
  router.post("/diposit", Bot.Diposit);
};
