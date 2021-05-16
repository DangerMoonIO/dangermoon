const CONFIG = require('../hardhat.config.js');
const { MNEMONIC } = require('../secrets.json');
const { ethers } = require("hardhat");
const { expect } = require("chai");

// const utils = require("./helpers/utils");
const time = require("./helpers/time");

const WETH_ADDRESS = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";

let linkContract;
const LINK_DECIMALS = 18;
const VRF_COORDINATOR = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
const LINK_KEYHASH = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
const LINK_ADDRESS = '0xa36085F69e2889c224210F603D836748e7dC0088';
const LINK_ABI_FRAGMENT = [
   {
      "name" : "transfer",
      "type" : "function",
      "inputs" : [
         {
            "type" : "address",
            "name" : "to"
         },
         {
            "type" : "uint256",
            "name" : "tokens"
         }
      ],
      "constant" : false,
      "outputs" : [],
      "payable" : false
   },
   {
       "constant": true,
       "inputs": [
         {
           "name": "_owner",
           "type": "address"
         }
       ],
       "name": "balanceOf",
       "outputs": [
         {
           "name": "balance",
           "type": "uint256"
         }
       ],
       "payable": false,
       "type": "function"
     }
];

// Really its uniswap v2
let uniswapContract;
// const UNISWAP_DECIMALS = 18;
const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAP_ABI_FRAGMENT = [
   {
      "name" : "addLiquidityETH",
      "type" : "function",
      "inputs" : [
         {
            "type" : "address",
            "name" : "token"
         },
         {
            "type" : "uint256",
            "name" : "amountTokenDesired"
         },
         {
            "type" : "uint256",
            "name" : "amountTokenMin"
         },
         {
            "type" : "uint256",
            "name" : "amountETHMin"
         },
         {
            "type" : "address",
            "name" : "to"
         },
         {
            "type" : "uint256",
            "name" : "deadline"
         }
      ],
      "constant" : false,
      "outputs" : [
        {
           "type" : "uint256",
           "name" : "amountToken"
        },
        {
           "type" : "uint256",
           "name" : "amountETH"
        },
        {
           "type" : "uint256",
           "name" : "liquidity"
        }
      ],
      "payable" : true
   },
   {
      "name" : "swapETHForExactTokens",
      "type" : "function",
      "inputs" : [
         {
            "type" : "uint256",
            "name" : "amountOut"
         },
         {
            "type" : "address[]",
            "name" : "path"
         },
         {
            "type" : "address",
            "name" : "to"
         },
         {
            "type" : "uint256",
            "name" : "deadline"
         }
      ],
      "constant" : false,
      "outputs" : [
        {
           "type" : "uint256[]",
           "name" : "amounts"
        }
      ],
      "payable" : true
   },
   {
      "name" : "swapExactTokensForETHSupportingFeeOnTransferTokens",
      "type" : "function",
      "inputs" : [
         {
            "type" : "uint256",
            "name" : "amountIn"
         },
         {
            "type" : "uint256",
            "name" : "amountOutMin"
         },
         {
            "type" : "address[]",
            "name" : "path"
         },
         {
            "type" : "address",
            "name" : "to"
         },
         {
            "type" : "uint256",
            "name" : "deadline"
         }
      ],
      "constant" : false,
      "outputs" : [
        {
           "type" : "uint256[]",
           "name" : "amounts"
        }
      ],
      "payable" : false
   }
];

const DEAD = '0x000000000000000000000000000000000000dEaD';

let dangermoon;
const dangermoonDecimals = 9;
let owner;
let alice;
let bob;
let testWallet;
let halfTotalTokenSupply

async function logAllBalances(header) {
  console.log(header);
  console.log("lifetimeReflection", (await dangermoon.lifetimeReflection()).toString());
  console.log("currentReflection", (await dangermoon.currentReflection()).toString());
  console.log("0xdead", (await dangermoon.balanceOf(DEAD)).toString());
  console.log("0xowner", (await dangermoon.balanceOf(owner.address)).toString());
  console.log("0xalice", (await dangermoon.balanceOf(alice.address)).toString());
  console.log("0xbob", (await dangermoon.balanceOf(bob.address)).toString());
  console.log("0xcindy", (await dangermoon.balanceOf(cindy.address)).toString());
  console.log("\n");
}

async function expectAllBalances(expectations) {
  const { _lifetimeReflection, _currentReflection, _dead, _owner, _alice, _bob, _cindy } = expectations;
  expect( (await dangermoon.lifetimeReflection()).toString(), "lifetimeReflection").to.equal(_lifetimeReflection);
  expect( (await dangermoon.currentReflection()).toString(),   "currentReflection").to.equal(_currentReflection);
  expect( (await dangermoon.balanceOf(DEAD)).toString(),                  "0xdead").to.equal(_dead);
  expect( (await dangermoon.balanceOf(owner.address)).toString(),          "owner").to.equal(_owner);
  expect( (await dangermoon.balanceOf(alice.address)).toString(),          "alice").to.equal(_alice);
  expect( (await dangermoon.balanceOf(bob.address)).toString(),              "bob").to.equal(_bob);
  expect( (await dangermoon.balanceOf(cindy.address)).toString(),          "cindy").to.equal(_cindy);
}

async function buyFromUniswap(buyer, faucetEther, etherToSpend) {
  await testWallet.signTransaction({
    to: buyer.address,
    value: ethers.utils.parseEther(faucetEther)
  });
  await uniswapContract.swapETHForExactTokens(
    "1000000000000000000000",
    [WETH_ADDRESS, dangermoon.address],
    buyer.address,
    Math.floor(Date.now() / 1000),
    {
      value: ethers.utils.parseEther(etherToSpend),
      gasPrice: 100000
    }
  );
}

describe("DangerMoon", function () {
  beforeEach(async () => {
    [owner, alice, bob, cindy] = await ethers.getSigners();

    // Get and deploy dangermoon
    const MockDangerMoon = await ethers.getContractFactory("MockDangerMoon");
    dangermoon = await MockDangerMoon.deploy(UNISWAP_ROUTER, VRF_COORDINATOR, LINK_ADDRESS, LINK_KEYHASH);

    // Send 50% of tokens from deployer to 0xdead to burn them
    halfTotalTokenSupply = (await dangermoon.totalSupply()).div(2).toString();
    // We dont burn half *during testing*, because we need to simulate having
    // a large amount of tokens in the contract for swapAndLiquify
    // await dangermoon.transfer(DEAD, halfTotalTokenSupply);

    // Set up test wallet
    const rpcUrl = CONFIG.networks.hardhat.forking.url;
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    testWallet = ethers.Wallet.fromMnemonic(MNEMONIC);
    testWallet = testWallet.connect(provider);

    // Send faucet eth to dangermoon contract
    // await testWallet.signTransaction({
    //   to: owner.address,
    //   value: ethers.utils.parseEther("0.01")
    // });

    // Create the uniswap pair
    await dangermoon.approve(UNISWAP_ROUTER, halfTotalTokenSupply);
    uniswapContract = new ethers.Contract(UNISWAP_ROUTER, UNISWAP_ABI_FRAGMENT, owner);
    await uniswapContract.addLiquidityETH(
      dangermoon.address,
      halfTotalTokenSupply,
      0, // dont care about initial price
      0, // dont care about initial price
      owner.address,
      Math.floor(Date.now() / 1000),
      {
        value: ethers.utils.parseEther("0.000001"),
        gasPrice: 1000000
      }
    );

    // a b and c go buy from uniswap
    await buyFromUniswap(alice, "0.0000001", "0.00000001");
    await buyFromUniswap(bob,   "0.0000001", "0.00000001");
    await buyFromUniswap(cindy, "0.0000001", "0.00000001");

  });
  // it("should have put half the tokens in 0xdead", async () => {
  //   expect(await dangermoon.balanceOf(DEAD)).to.equal(halfTotalTokenSupply);
  // });
  it("should grant 0xdead an entry in reflection system when someone burns 100,000,000", async () => {
    await expect(dangermoon.connect(cindy).transfer(DEAD, 100000000))
      .to.emit(dangermoon, "AddedReflectionEntry")
      .withArgs(DEAD);
  });
  it("should return how many entries an address has when numberOfReflectionEntries is called", async () => {
    await dangermoon.connect(cindy).transfer(DEAD, 100000000);
    expect(await dangermoon.numberOfReflectionEntries(DEAD)).to.equal(1);
  });
  it("should have put the other half of tokens in owner address. Owner burns this on real deploy.", async () => {
    expect(await dangermoon.balanceOf(owner.address)).to.equal(halfTotalTokenSupply);
  });
  it("should have let a b c buy from uniswap pool", async () => {
    // await logAllBalances("Test 1");
    await expectAllBalances({
      "_lifetimeReflection": "0",
      "_currentReflection": "150000000000000000000",
      "_dead": "0",
      "_owner": "500000000000000000000000",
      "_alice": "900000000000000000000",
      "_bob": "900000000000000000000",
      "_cindy": "900000000000000000000"
    });
  });
  it("should distribute reflection randomly when fulfillRandomness is called", async () => {
    // Ensure that chainlink's response triggers a reflection distribution
    const psuedoRandomOracleResponse = Math.floor(Math.random() * 10**10);
    const requestId = ethers.utils.formatBytes32String("42");
    await expect(dangermoon._fulfillRandomness(requestId, psuedoRandomOracleResponse))
      .to.emit(dangermoon, 'ReflectionRecipient');

    // await logAllBalances("Test 4");
    // await expectAllBalances({
    //   "_lifetimeReflection": "15000000000",
    //   "_currentReflection": "0",
    //   "_dead": "0",
    //   "_owner": "500000000000000000000000",
    //   "_alice": "90000000000",
    //   "_bob": "90000000000",
    //   "_cindy": "105000000000" // recieved distribution
    // });
  });
  it("should swapAndLiquify 5% liquidity fees into liquidity pool", async () => {
    /**
      Need to get contractTokenBalance >= numTokensSellToAddToLiquidity
      so that entails sending more than (5**5 * 10**6 * 10**9) to the contract
    */
    await dangermoon.connect(owner).transfer(dangermoon.address, "3125000000000000001");

    // Ensure cindy's buy triggers swapAndLiquify
    await expect(dangermoon.connect(owner).transfer(cindy.address, 1))
      .to.emit(dangermoon, 'SwapAndLiquify');
  });
  it("should sell to uniswap without adding a reflection entry", async () => {

    await dangermoon.connect(owner).approve(UNISWAP_ROUTER, "10000000000000000000000")

    // Ensure cindy's sell to uniswap doesnt give uniswap a reflection entry
    await expect(uniswapContract.swapExactTokensForETHSupportingFeeOnTransferTokens(
        "100000000000000000000",
        0, // ignore slippage
        [dangermoon.address, WETH_ADDRESS],
        owner.address,
        Math.floor(Date.now() / 1000),
        { gasPrice: 100000 }
    ))
    .to.not.emit(dangermoon, "AddedReflectionEntry");

    // await logAllBalances("after selling to uniswap");

  });
  /**
    NOTE This test takes the longest, and for some reason it fails if it is not the last test
  */
  it("should requestRandomness from chainlink once link is deposited", async () => {
    // Send in faucet link to test requestRandomness
    linkContract = new ethers.Contract(LINK_ADDRESS, LINK_ABI_FRAGMENT, owner);
    await linkContract.connect(owner).transfer(
      dangermoon.address,
      ethers.utils.parseUnits('0.2', LINK_DECIMALS),
      { gasPrice: 6000000000 }
    );

    // Ensure wallet has faucet link:
    // console.log("Link Balance: ", (await dangermoon.linkBalance()).toString());

    // Give cindy some more money to go buy dangermoon to trigger requestRandomness
    await testWallet.signTransaction({
      to: cindy.address,
      value: ethers.utils.parseEther("0.0000001")
    });

    // Ensure cindy's buy requests a random number from chainlink
    await expect(uniswapContract.swapETHForExactTokens(
      100 * 10**9,
      [WETH_ADDRESS, dangermoon.address],
      cindy.address,
      Math.floor(Date.now() / 1000),
      {
        value: ethers.utils.parseEther("0.00000001"),
        gasPrice: 100000
      }
    ))
    .to.emit(dangermoon, 'RequestedRandomness');
  });
});
