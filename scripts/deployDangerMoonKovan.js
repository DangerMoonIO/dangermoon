const hre = require("hardhat");

async function main() {

  const DangerMoon = await hre.ethers.getContractFactory("DangerMoon");

  const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const VRF_COORDINATOR = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
  const LINK_ADDRESS = '0xa36085F69e2889c224210F603D836748e7dC0088';
  const LINK_KEYHASH = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
  const CHARITY_ADDRESS = "0x5c0e5E0Ccb0DED355EcE0cB6f56B2CE75CB0b8eD";
  const MARKETING_ADDRESS = "0x7817279e3510C2385536b0901de14fCC29e36878";
  const dangermoon = await DangerMoon.deploy(
    UNISWAP_ROUTER,
    VRF_COORDINATOR,
    LINK_ADDRESS,
    LINK_KEYHASH,
    CHARITY_ADDRESS,
    MARKETING_ADDRESS
  );

  await dangermoon.deployed();

  console.log("DangerMoon deployed to kovan:", dangermoon.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
