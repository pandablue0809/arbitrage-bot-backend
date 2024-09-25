require('dotenv').config();

const fs = require("fs");
const { ethers } = require("hardhat");
const config = require('../contractAbis/config.json');
const abiArbitrage = require('../artifacts/contracts/arbitrage.sol/GoodArbitrage.json').abi;
const abiErc20 = require('../artifacts/contracts/FakeUSDT.sol/FakeUSDT.json').abi;
const abiUniswap = require('../contractAbis/uniswap.json');
const abiSushi = require('../contractAbis/sushi.json');

const isTest = process.env.TEST==="1";

const currentTime = () => Math.round(+new Date() / 1000);

async function main() {
	try {
		let [owner] = await ethers.getSigners();
		console.log("owner address", owner.address);
		const gasPrice = ethers.utils.parseUnits("50", 9);
		console.log('gasPrice', gasPrice);
		let fakeUsdt;
		if (isTest) {
			const erc20 = await ethers.getContractFactory("FakeUSDT");
			fakeUsdt = await erc20.deploy({gasPrice});
			console.log('fakeUsdt', fakeUsdt.deployTransaction.hash);
			await fakeUsdt.deployed();
			console.log("fakeUsdt", fakeUsdt.address);
		}

		const arbitrage = await ethers.getContractFactory("GoodArbitrage");
		const arbitrageContract = await arbitrage.deploy(
			config.uniswap,
			config.sushi,
			fakeUsdt.address,
			{gasPrice}
		);
		await arbitrageContract.deployed();
		console.log("arbitrageContract", arbitrageContract.address);

		if (isTest) {
			/*
				function addLiquidityETH(
					address token,
					uint amountTokenDesired,
					uint amountTokenMin,
					uint amountETHMin,
					address to,
					uint deadline
				)
			*/
			// const weth = new ethers.Contract(config.weth, abiErc20, owner);

			const uniswap = new ethers.Contract(config.uniswap, abiUniswap, owner);
			const amountUniEth = ethers.utils.parseUnits("0.5", 18);
			const amountUniUsdt = ethers.utils.parseUnits("790", 18);
			
			const txUniUSDTApprove = await fakeUsdt.approve(config.uniswap, amountUniUsdt, {gasPrice});
			console.log("approve unitswap to Fake USDT", txUniUSDTApprove.hash);
			await txUniUSDTApprove.wait();

			const txUni = await uniswap.addLiquidityETH(fakeUsdt.address, amountUniUsdt, 0, 0, owner.address, String(currentTime() + 100), {gasPrice, value: amountUniEth});
			console.log("add liquidity to Uniswap with 1/1000", txUni.hash);
			await txUni.wait();
			
			const sushiswap = new ethers.Contract(config.sushi, abiSushi, owner);
			const amountSushiEth = ethers.utils.parseUnits("0.5", 18);
			const amountSushiUsdt = ethers.utils.parseUnits("780", 18);

			const txSushiUSDTApprove = await fakeUsdt.approve(config.sushi, amountSushiUsdt, {gasPrice});
			console.log("approve sushi to Fake USDT", txSushiUSDTApprove.hash);
			await txSushiUSDTApprove.wait();

			const txSushi = await sushiswap.addLiquidityETH(fakeUsdt.address, amountSushiUsdt, 0, 0, owner.address, String(currentTime() + 100), {value: amountSushiEth, gasPrice});
			console.log("add liquidity to Sushi with 1/900", txSushi.hash);
			await txSushi.wait();

			// const txTransfer = await owner.sendTransaction({gasPrice, to: arbitrageContract.address, value: ethers.utils.parseEther("0.01")});
			// console.log("add base fund to arbitrage contract", txTransfer.hash);
			// await txTransfer.wait();

			// const tradeAmount = ethers.utils.parseEther("0.01");
			// const tx = await arbitrageContract.makeArbitrage(tradeAmount, {gasPrice});
			// console.log("wait for final testing", tx.hash);
			// await tx.wait();

			fs.writeFileSync(__dirname + '/../contractAbis/erc20.json', JSON.stringify(abiErc20, null, '\t'));
			fs.writeFileSync(__dirname + '/../contractAbis/config.json', JSON.stringify({
				...config, 
				abitrage: arbitrageContract.address,
				usdt: fakeUsdt.address,
				usdtDecimals: 18,
			}, null, '\t'))
		} else {
			fs.writeFileSync(__dirname + '/../config.json', JSON.stringify({
				...config, 
				abitrage: arbitrageContract.address,
				usdtDecimals: 6,
			}, null, '\t'))
		}
		fs.writeFileSync(__dirname + '/../contractAbis/arbitrage.json', JSON.stringify(abiArbitrage, null, '\t'));
	} catch (error) {
		console.error(error);
	}
}

main()
	.then(() => {
		console.log(
			"Successed deploy!".green
		);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
