const CONFIG = require('../hardhat.config.js');
// const cron = require('node-cron');
const { ethers } = require("hardhat");

async function main() {

  const DangerMoon = await ethers.getContractFactory("DangerMoon");
  let dangermoon = await DangerMoon.attach("0x90c7e271f8307e64d9a1bd86ef30961e5e1031e7");

  const value = hre.ethers.utils.parseEther("0.01");
  const owner = "0xEe506A9Cb95EB6F74CAF7164ad607C61a9cb7E06";
  const tx = await dangermoon.dangerMoonMultiSend(owner, 10, { value });

  console.log(tx);
  const receipt = await tx.wait();
  console.log("done");

}

// console.log("Scheduling cronjob");
// cron.schedule('0 0 * * *', () => {
//
// });

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
