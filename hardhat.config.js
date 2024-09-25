require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("@nomiclabs/hardhat-etherscan");
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log("accounts", account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    goeril: {
      url: "https://goerli.infura.io/v3/ffb7592d1c7f4e84a0a50538ce0b188a",
      accounts: [process.env.PRIVATEKEY],
    },
    ethereum: {
      url: "https://main-light.eth.linkpool.io/",
      accounts: [process.env.PRIVATEKEY],
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      mainnet: "YOUR_ETHERSCAN_API_KEY",
      ropsten: "YOUR_ETHERSCAN_API_KEY",
      rinkeby: "YOUR_ETHERSCAN_API_KEY",
      bsc: "WK3XCXHZDQZR4S7KSWSFIZPZUZFWUVWHNV",
      bscTestnet: "YOUR_BSCSCAN_API_KEY",
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 200000,
  },
};
