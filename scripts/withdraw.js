async function main() {
  const arbitrage = await ethers.getContractFactory("GoodArbitrage");
  const arbitrageContract = arbitrage.attach(
    process.env.CONTRACT_DEPLOY_CONTRACT
  );
  console.log("", arbitrageContract.address);
  await arbitrageContract.WithdrawBalance();
}

main()
  .then(() => {
    console.log("Success! ❤ current contract address ----------------❤".green);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
