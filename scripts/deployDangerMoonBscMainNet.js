const hre = require("hardhat");

async function main() {

  const DangerMoon = await hre.ethers.getContractFactory("DangerMoon");

  const UNISWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // pcs v2
  const VRF_COORDINATOR = "0x747973a5A2a4Ae1D3a8fDF5479f1514F65Db9C31";
  const LINK_ADDRESS = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75';
  const LINK_KEYHASH = "0xc251acd21ec4fb7f31bb8868288bfdbaeb4fbfec2df3735ddbd4f7dc8d60103c";
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

  console.log("DangerMoon deployed to bsc mainnet:", dangermoon.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
