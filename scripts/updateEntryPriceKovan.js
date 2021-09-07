const cron = require('node-cron');
const hre = require("hardhat");
const fetch = require("node-fetch");
const { ethers } = require("hardhat");
const Contract = require('web3-eth-contract');

const ADDRESS = "0xfA1E56f8BC6AF69Ce4AE36f2E6E5412e06FC6e57";

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function main() {

  console.log("Cron triggered", new Date());

  const SECONDS_IN_DAY = 86400/1000;
  const sleeptime = Math.floor(Math.random() * SECONDS_IN_DAY) + 1
  console.log("Sleeping for... ", sleeptime);
  await sleep(sleeptime);

  console.log("Fetching updated price from PCS...");
  const pcsApiUrl = "https://api.pancakeswap.info/api/v2/tokens/0x90c7e271F8307E64d9A1bd86eF30961e5e1031e7";
  const pcsResponse = await fetch(pcsApiUrl);
  const pcsData = await pcsResponse.json();
  const tenUsdWorth = Math.round(10/pcsData.data.price);
  const shift = 10**(tenUsdWorth.toString().length - 3);
  const minimumTokensForReflection = Math.round(tenUsdWorth/shift)*shift.toString()+"000000000";

  const DangerMoon = await ethers.getContractFactory("DangerMoon");
  let dangermoon = await DangerMoon.attach(ADDRESS);

  console.log("Setting new minimum entry to ", minimumTokensForReflection);
  const tx = await dangermoon.setMinimumTokensForReflection(minimumTokensForReflection);
  const receipt = await tx.wait()
  console.log(receipt);

  // await sleep(5000);

  // console.log(dangermoon);
  // console.log("Updated to: ", (await dangermoon._minimumTokensForReflection()).toString());
}

console.log("Scheduling cronjob");
cron.schedule('* * * * *', () => {
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    // .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
});
