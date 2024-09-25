const axios = require("axios");
const {
  getPrices,
  Calculate,
  Withdraw,
  getBalance,
  Deposit,
} = require("../utils");
require("dotenv").config();
const transacDB = require('../db/transaction');

let myInterval;

const INTERVAL = 12000;

const startApi = async (data) => {
  let time = +new Date();
  if (myInterval) {
    clearTimeout(myInterval);
  }
  await Calculate(data);
  const interval = INTERVAL + (new Date() - time);
  if (interval < 0) {
    startApi(data);
  } else {
    myInterval = setTimeout(() => {
      startApi(data);
    }, interval);
  }
};

module.exports = {
  Start: async (req, res) => {
    let priceData = req.body;
    try {
      startApi(priceData);
      res.send({ serverMsg: "Bot started!", flag: true });
    } catch (err) {
      res.send({
        serverMsg: err.message,
        flag: false,
      });
    }
  },

  Stop: async (req, res) => {
    if (myInterval) {
      clearTimeout(myInterval);
      myInterval = null;
    }
    res.send("Bot stopped!");
  },

  GetBalance: async (req, res) => {
    try {
      res.send({ balance: await getBalance(), flag: true });
    } catch (err) {
      res.send({
        serverMsg: err.message,
        flag: false,
      });
    }
  },

  GetPrice: async (req, res) => {
    try {
      const prices = await getPrices();
      res.send({
        UniSwap: prices[0],
        SushiSwap: prices[1],
        flag: true,
      });
    } catch (err) {
      res.send({
        serverMsg: err.message,
        flag: false,
      });
    }
  },

  Diposit: async (req, res) => {
    try {
      const deposit = await Deposit(req.body.dipositAmount);
      res.send({
        serverMsg: deposit,
        flag: true,
      });
    } catch (err) {
      res.send({
        serverMsg: err.message,
        flag: false,
      });
    }
  },

  Withdraw: async (req, res) => {
    try {
      const withdraw = await Withdraw();
      res.send({
        serverMsg: withdraw,
        flag: true,
      });
    } catch (err) {
      res.send({
        serverMsg: err.message,
        flag: false,
      });
    }
  },
};
