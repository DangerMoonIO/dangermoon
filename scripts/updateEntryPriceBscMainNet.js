const cron = require('node-cron');
const { ethers } = require("hardhat");

const ADDRESS = "0x90c7e271f8307e64d9a1bd86ef30961e5e1031e7";

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function parseScientificNotation(x) {
  var e;
  if (Math.abs(x) < 1.0) {
    e = parseInt(x.toString().split('e-')[1]);
    if (e) {
        x *= Math.pow(10,e-1);
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
        e -= 20;
        x /= Math.pow(10,e);
        x += (new Array(e+1)).join('0');
    }
  }
  return x;
}

async function getPriceFromBnbPair(bnbPairAddress) {
  const PancakePair = await ethers.getContractFactory("PancakePair");
  const TOKEN_BNB_PAIR = await PancakePair.attach(bnbPairAddress);
  const BUSD_BNB_PAIR = await PancakePair.attach('0x1B96B92314C44b159149f7E0303511fB2Fc4774f');
  const TOKEN_BNB_RESERVES = await TOKEN_BNB_PAIR.getReserves();
  const BNB_BUSD_RESERVES = await BUSD_BNB_PAIR.getReserves();
  return parseScientificNotation(
    ( TOKEN_BNB_RESERVES._reserve1 /
      TOKEN_BNB_RESERVES._reserve0 *
      BNB_BUSD_RESERVES._reserve1 /
      BNB_BUSD_RESERVES._reserve0 ) * 10**-9
  );
}

async function main() {

  console.log("Cron triggered", new Date());

  const MS_IN_DAY = 24*60*60*1000;
  const sleeptime = Math.floor(Math.random() * MS_IN_DAY) + 1
  console.log("Sleeping for... ", sleeptime);
  await sleep(sleeptime);

  const DangerMoon = await ethers.getContractFactory("DangerMoon");
  let dangermoon = await DangerMoon.attach(ADDRESS);

  console.log("Fetching updated price from PCS reserves...");
  const bnbPairAddress = await dangermoon.uniswapV2Pair();
  const price = await getPriceFromBnbPair(bnbPairAddress);
  const tenUsdWorth = Math.round(10/price);
  const shift = 10**(tenUsdWorth.toString().length - 3);
  const minimumTokensForReflection = Math.round(tenUsdWorth/shift)*shift.toString()+"000000000";

  console.log("Setting new minimum entry to ", minimumTokensForReflection);
  const tx = await dangermoon.setMinimumTokensForReflection(minimumTokensForReflection);
  const receipt = await tx.wait();
  console.log(receipt);

  // console.log("Updated to: ", (await dangermoon._minimumTokensForReflection()).toString());
}

console.log("Scheduling cronjob");
cron.schedule('0 0 * * *', () => {
  main()
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
});
