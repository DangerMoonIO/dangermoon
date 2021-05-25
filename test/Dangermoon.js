const CONFIG = require('../hardhat.config.js');
const { MNEMONIC } = require('../secrets.json');
const { ethers } = require("hardhat");
const { expect } = require("chai");
// const utils = require("./helpers/utils");
// const time = require("./helpers/time");

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
   }
];

const DEAD = '0x000000000000000000000000000000000000dead';

let dangermoon;
const dangermoonDecimals = 9;
let owner;
let alice;
let bob;
let testWallet;

async function logAllBalances(header) {
  console.log(header);
  console.log("lifetimeJackpots", (await dangermoon.lifetimeJackpots()).toString());
  console.log("currentJackpot", (await dangermoon.currentJackpot()).toString());
  console.log("0xdead", (await dangermoon.balanceOf(DEAD)).toString());
  console.log("0xowner", (await dangermoon.balanceOf(owner.address)).toString());
  console.log("0xalice", (await dangermoon.balanceOf(alice.address)).toString());
  console.log("0xbob", (await dangermoon.balanceOf(bob.address)).toString());
  console.log("0xcindy", (await dangermoon.balanceOf(cindy.address)).toString());
  console.log("\n");
}

async function expectAllBalances(expectations) {
  const { _lifetimeJackpots, _currentJackpot, _dead, _owner, _alice, _bob, _cindy } = expectations;
  expect( (await dangermoon.lifetimeJackpots()).toString(), "lifetimeJackpots").to.equal(_lifetimeJackpots);
  expect( (await dangermoon.currentJackpot()).toString(),     "currentJackpot").to.equal(_currentJackpot);
  expect( (await dangermoon.balanceOf(DEAD)).toString(),              "0xdead").to.equal(_dead);
  expect( (await dangermoon.balanceOf(owner.address)).toString(),      "owner").to.equal(_owner);
  expect( (await dangermoon.balanceOf(alice.address)).toString(),      "alice").to.equal(_alice);
  expect( (await dangermoon.balanceOf(bob.address)).toString(),          "bob").to.equal(_bob);
  expect( (await dangermoon.balanceOf(cindy.address)).toString(),      "cindy").to.equal(_cindy);
}

async function buyFromUniswap(buyer, faucetEther, etherToSpend) {
  await testWallet.signTransaction({
    to: buyer.address,
    value: ethers.utils.parseEther(faucetEther)
  });
  await uniswapContract.swapETHForExactTokens(
    100 * 10**9,
    [WETH_ADDRESS, dangermoon.address],
    buyer.address,
    Math.floor(Date.now() / 1000),
    {
      value: ethers.utils.parseEther(etherToSpend),
      gasPrice: 10000
    }
  );
}

describe("DangerMoon", function () {
  beforeEach(async () => {
    [owner, alice, bob, cindy] = await ethers.getSigners();

    // Get and deploy dangermoon
    const DangerMoon = await ethers.getContractFactory("DangerMoon");
    dangermoon = await DangerMoon.deploy(UNISWAP_ROUTER, VRF_COORDINATOR, LINK_ADDRESS, LINK_KEYHASH);
    // console.log("dangermoon deployed to: ", dangermoon.address); // Needed so we can fund via link faucet

    // Send 50% of tokens from deployer to 0xdead to burn them
    const halfTotalTokenSupply = (await dangermoon.totalSupply()).div(2).toString();
    await dangermoon.transfer(DEAD, halfTotalTokenSupply);

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
      0,
      0,
      owner.address,
      Math.floor(Date.now() / 1000),
      {
        value: ethers.utils.parseEther("0.0002"),
        gasPrice: 1000000
      }
    );

    // Players a b and c go buy from uniswap
    await buyFromUniswap(alice, "0.0000001", "0.00000001");
    await buyFromUniswap(bob, "0.0000001", "0.00000001");
    await buyFromUniswap(cindy, "0.0000001", "0.00000001");

    await logAllBalances("Post setup");

  //   // Send in faucet link in to test the lotto
  //   linkContract = new ethers.Contract(LINK_ADDRESS, LINK_ABI_FRAGMENT, testWallet);
  //   // console.log("Link transfer: ",
  //   await linkContract.transfer(
  //     dangermoon.address,
  //     ethers.utils.parseUnits('0.1', LINK_DECIMALS)
  //   )
  // // );
  //
  //   await buyFromUniswap(cindy, "0.0000001", "0.00000001");

  });
  it("should grant half of all tokens to deployer", async () => {
    expect(await dangermoon.balanceOf(owner.address)).to.equal(0);
    await logAllBalances("Test 1");
    await expectAllBalances({
      "_lifetimeJackpots": "0",
      "_currentJackpot": "15000000000",
      "_dead": "500000000000000000000000",
      "_owner": "0",
      "_alice": "90000000000",
      "_bob": "90000000000",
      "_cindy": "90000000000"
    });
  });
  xit("should payout lotto fees to winner", async () => {
    // Transfer tokens from owner to A and check balance
    await dangermoon.transfer(alice.address, 10**10);
    // Transfer tokens from owner to B and C
    await dangermoon.transfer(bob.address, 10**10);
    await dangermoon.transfer(cindy.address, 10**10);
    await logAllBalances("after bob and cindy get some");
    await expectAllBalances({ // assert no payouts yet because owner exempt from fees
      "_lifetimeJackpots": "0",
      "_currentJackpot": "0",
      "_dead": "",
      "_owner": "0",
      "_alice": "90000000000",
      "_bob": "90000000000",
      "_cindy": "90000000000"
    });
    await expectAllBalances(
      "0",
      "0",
      "500000000000000000000000",
      "499999999999970000000000",
      "10000000000",
      "10000000000",
      "10000000000"
    );
    // Owner is exempt from reflection so send B->C, and see that someone won lotto
    await expect(dangermoon.connect(bob).transfer(cindy.address, (10**10)))
      .to.emit(dangermoon, 'LotteryWinner')
      .withArgs(cindy.address, (10 ** 10)/20);

    // await dangermoon.connect(bob).transfer(cindy.address, (10**10));
    await logAllBalances("after lotto 1");
    await expectAllBalances( // assert cindy won all the take fees
      "500000000", // take fees increased
      "0",
      "500000000000000000000000",
      "499999999999970000000000",
      "10000000000",
      "0",
      "19500000000" // recieved 5% fee as lottery payout, as cindy was only participant
    );
    // await dangermoon.connect(alice).transfer(bob.address, (10**10));
    // // await dangermoon.connect(bob).transfer(cindy.address, (10**10));
    // await logAllBalances("after lotto 2");
    // await expectAllBalances( // assert cindy won all the take fees
    //   "1000000000", // take fees increased
    //   "0", // take fees increased
    //   "500000000000000000000000",
    //   "499999999999970000000000",
    //   "0",
    //   "9000000000",
    //   "20000000000" // recieved 5% fee as lottery payout, as cindy was only participant
    // );
  });
  // todo test minimumPurchaseNecessary
  // todo test subsequent lottos work as intended
});
