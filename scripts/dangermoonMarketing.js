const CONFIG = require('../hardhat.config.js');
// const cron = require('node-cron');
const { ethers } = require("hardhat");

const safemoonWhales = [
  "0xeb783789280a2c4c1940f8755aeccb558a4ff581",
  // "0xcd198be08a33cbe2172f3be45cdb431e060076bc",
  // "0x86b695aaa2600668cec754c7827357626b188054",
  // "0xdbe831064ae9b8646de09f270eef3f0076ce9def",
  // "0x82b7503bffd8aea31aea5ee14fb01959191af45b",
  // "0xf55808ac8291551ed8faf5674449238dff44c041",
  // "0xd51d1d5503dcff819e214faa66c3b6f0ebb06abe",
  // "0xa803fc1c1e83d6389865e1248dc924ed4c6953de",
  // "0x0c8c62a7f883c6e47c8c5790474d4eb8a48924f2",
  // "0x424c7cde3dcb32ac7951e9c79f2f5f00625c384b",
  // "0x97b85b5cf219f4b3b5259431d4b5835334767e6a",
  // "0xb3bcdf8392f56f682e5abcd1a7ae422864d1a0b9",
  // "0xdee4eb82dc3f8edfd4f9fdd8e3c8579368784f59",
  // "0xafa5ebe249e86127fe7a63e14a0b06b4e42222f8",
  // "0x1f5e3785aa4605908e12f8049f9c12a9f32980bb",
  // "0xc71fcd7b8db747b2db06d17955d89a749e5f81f6",
  // "0xa91192c48ac959f17bca1df273eea7ed9a2a6390",
  // "0x1667f0fcc1d105069228069b7be20db1e9714d34",
  // "0xe1c33d3eea42227478c39f43dd9a0501887c5a6d",
  // "0x868f027a5e3bd1cd29606a6681c3ddb7d3dd9b67",
  // "0xe6c1c64b9bb1db4ada5a173c8dce803118bfc6c2",
  // "0x2a5331291837ecb0b50ec47b1c9b964223c1faa4",
  // "0x236c1d29203d0b9c6a5c824440358a42929e257b",
  // "0xa7abf1167c1139a7b82847928b0619229db17681",
  // "0x2d39d21e08107816d691ad8f3b663d5d3da45859",
  // "0xdca6d33a76a0732089544e8e25915fd5f31238f9",
  // "0xdc4a7b83d4f99c0bfd23955527840636e2084a01",
  // "0x63578a79cc3baf52c46d638c5f769b9c764e0577",
  // "0xe1526cf30633a46aba1a828e856f515d26b8c7f8",
  // "0x6cd020669b67e45cfc107a042410274d9ea93bf4",
  // "0xdcc64ab5ecab4d5199aaa51de20cdf5b339b8bff",
  // "0x21c9280561c7b805877683e8bd0173dd35ce8cec",
  // "0x4df37f6cf89aa2b53ce1adb236ff6359a89b72f6",
  // "0x6ef6930f2e7dfa91a002184da3e33a0aaf3cac3c",
  // "0x3115cfe9d4ccf04957c115956551ad4735ceeac7",
  // "0x2488c6bce46319be5e0eb3878d65fe716e1d8a22",
  // "0xbea42d6016a44d436053061114e97575d4c15432",
  // "0x8798fbd8f92cd71a972e1eb02b13528318df67ab",
  // "0x905c4e127cda7e539f38c12c178206906d030005",
  // "0x28a96dd71c544508f22f087e2539cfb88689d7df",
  // "0x97c38b2b4882c6b24645ac07e5df74e0c6cae1ba",
  // "0xf8e645a4540f4a20037a76a9348161f8b86d94ec"
];

async function main() {

  const DangerMoonMarketing = await ethers.getContractFactory("DangerMoonMarketing");
  let dangermoonMarketing = await DangerMoonMarketing.attach("0x2A646a2817FE6F85564B78CA48c16296A8A31457");

  const accounts = await hre.ethers.getSigners();
  const chainId = 56;
  const type = 0;
  const gasPrice = 5000000000;
  const value = 0;

  for (let i in safemoonWhales) {
    const to = safemoonWhales[i];
    let tx, receipt;

    // 0x60169a81 buyDangermoon
    tx = await accounts[0].sendTransaction({ chainId, type, to, gasPrice, value, data: "0x60169a81" })
    receipt = await tx.wait();
    console.log(receipt);

    // 0x0af92f56 atWwwDangermoonIo
    tx = await accounts[0].sendTransaction({ chainId, type, to, gasPrice, value, data: "0x0af92f56" })
    receipt = await tx.wait();
    console.log(receipt);

    // // 0x6b8ca67b dangermoonWhalesAreGonnaMakeIt
    // tx = await accounts[0].sendTransaction({ chainId, type, to, gasPrice, value, data: "0x6b8ca67b" })
    // receipt = await tx.wait();
    // console.log(receipt);
    //
    // // 0x5013d0a9 dangermoonUsesChainlinkForFairReflectionPrizes
    // tx = await accounts[0].sendTransaction({ chainId, type, to, gasPrice, value, data: "0x5013d0a9" })
    // receipt = await tx.wait();
    // console.log(receipt);
    //
    // // 0x0af92f56 dangermoonTurnedTenDollarsIntoTwentyGrand
    // tx = await accounts[0].sendTransaction({ chainId, type, to, gasPrice, value, data: "0xabbf727e" })
    // receipt = await tx.wait();
    // console.log(receipt);

    console.log("sent to ", to);
  }

}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
