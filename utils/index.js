require("dotenv").config();
const ethers = require("ethers");
const Web3 = require("web3");

const config = require('../contractAbis/config.json');
const abiArbitrage = require('../contractAbis/arbitrage.json');
const abiErc20 = require('../contractAbis/erc20.json');
const abiUniswap = require('../contractAbis/uniswap.json');
const abiSushi = require('../contractAbis/sushi.json');

let TestProvider = new ethers.providers.JsonRpcProvider(process.env.TEST_INFURAKEY);

// const { ERC20Contracts, ArbitrageContract } = require("../ContractABIs");

// Main net
// const Uniswap_Address = "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852";
// const Sushi_Address = "0x06da0fd433C1A5d7a4faa01111c044910A184553";
// const WETH_Address = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
// const USDT_Address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const web3Provider = new Web3.providers.HttpProvider(process.env.TEST_INFURAKEY);
const web3 = new Web3(web3Provider);

const WETH_Contract = new web3.eth.Contract(abiErc20, config.weth);
const USDT_Contract = new web3.eth.Contract(abiErc20, config.usdt);

async function getPrices() {
  try {
    const signer = new ethers.Wallet(process.env.PRIVATEKEY, TestProvider);
    const Arbitrage = new ethers.Contract(
      config.abitrage,
      abiArbitrage,
      signer
    );
    const amount = ethers.utils.parseUnits("0.01", config.usdtDecimals);
    const tx = await Arbitrage.getPrices(amount);
    const prices = [ethers.utils.formatEther(tx[0]) * 100, ethers.utils.formatEther(tx[1]) * 100];
    return prices;
  } catch (err) {
    throw new Error("trying!");
  }
}

async function getBalance() {
  try {
    let balance = await web3.eth.getBalance(
      config.abitrage
    );
    balance = await ethers.utils.formatEther(balance.toString());
    return balance;
  } catch (err) {
    throw new Error("trying!");
  }
}

async function Deposit(amount) {
  try {
    const signer = new ethers.Wallet(process.env.PRIVATEKEY, TestProvider);
    const tx = await signer.sendTransaction({
      to: config.abitrage,
      value: ethers.utils.parseEther(amount),
    });
    await tx.wait();
    return "Successed deposit!";
  } catch (err) {
    throw new Error("Failed deposit!");
  }
}

async function Withdraw() {
  try {
    const signer = new ethers.Wallet(process.env.PRIVATEKEY, TestProvider);
    const Arbitrage = new ethers.Contract(
      config.abitrage,
      abiArbitrage,
      signer
    );
    const tx = await Arbitrage.WithdrawBalance();
    await tx.wait();
    return "Successed withdraw!";
  } catch (err) {
    throw new Error("Failed withdraw!");
  }
}

async function Calculate(data) {
  try {
    const prices = await getPrices();
    const uniPrice = await prices[0];
    const sushiPrice = await prices[1];
    let resultAmount = 0;
    
    if (uniPrice > sushiPrice) {
      resultAmount = (data.tradeAmount - 0.00012) * 0.997 * 0.997 * uniPrice / sushiPrice;
    } else {
      resultAmount = (data.tradeAmount - 0.00012) * 0.997 * 0.997 * sushiPrice / uniPrice;
    }
    console.log('-----------------------------------------');
    console.log('trade=', data.tradeAmount, 'result=', resultAmount);
    if(resultAmount > data.tradeAmount) {
      await runTransaction(data);
      console.log("earn!");
    } else {
      console.log("skip!");
    }
    console.log('-----------------------------------------');
  } catch (err) {
    throw new Error("Server error!");
  }
}

async function runTransaction(data) {
  try {
    const signer = new ethers.Wallet(process.env.PRIVATEKEY, TestProvider);
    const Arbitrage = new ethers.Contract(
      config.abitrage,
      abiArbitrage,
      signer
    );
    let tradeAmount = ethers.utils.parseEther(data.tradeAmount);
    const tx = await Arbitrage.makeArbitrage(tradeAmount);
    await tx.wait();
    return "Successed trade!";
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  getPrices,
  Calculate,
  Withdraw,
  Deposit,
  getBalance,
};
