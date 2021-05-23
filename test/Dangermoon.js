const { ethers } = require("hardhat");
const { expect } = require("chai");
// const utils = require("./helpers/utils");
const time = require("./helpers/time");
const BigNumber = require('bignumber.js');

const deadAddress = '0x000000000000000000000000000000000000dead';

let contract;
let owner;
let alice;
let bob;

async function logAllBalances(header) {
  console.log(header);
  console.log("lifetimeJackpots", (await contract.lifetimeJackpots()).toString());
  console.log("jackpot", (await contract.currentJackpot()).toString());
  console.log("0xdead", (await contract.balanceOf(deadAddress)).toString());
  console.log("0xowner", (await contract.balanceOf(owner.address)).toString());
  console.log("0xalice", (await contract.balanceOf(alice.address)).toString());
  console.log("0xbob", (await contract.balanceOf(bob.address)).toString());
  console.log("0xcindy", (await contract.balanceOf(cindy.address)).toString());
  console.log("\n");
}

async function expectAllBalances(_lifetimeJackpots, _currentJackpot, _dead, _owner, _alice, _bob, _cindy) {
  expect( (await contract.lifetimeJackpots()).toString(), "lifetimeJackpots").to.equal(_lifetimeJackpots);
  expect( (await contract.currentJackpot()).toString(),     "currentJackpot").to.equal(_currentJackpot);
  expect( (await contract.balanceOf(deadAddress)).toString(),  "deadAddress").to.equal(_dead);
  expect( (await contract.balanceOf(owner.address)).toString(),      "owner").to.equal(_owner);
  expect( (await contract.balanceOf(alice.address)).toString(),      "alice").to.equal(_alice);
  expect( (await contract.balanceOf(bob.address)).toString(),          "bob").to.equal(_bob);
  expect( (await contract.balanceOf(cindy.address)).toString(),      "cindy").to.equal(_cindy);
}

// TODO we can test for now by deploying to test net a few times
// but ideally we can automate the faucet distribution

describe("DangerMoon", function () {
  beforeEach(async () => {
    [owner, alice, bob, cindy] = await ethers.getSigners();
    console.log(typeof(owner.address));
    // Get and deploy contract
    const DangerMoon = await ethers.getContractFactory("DangerMoon");
    contract = await DangerMoon.deploy(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // UniswapV2RouterAddress
      "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9", // VRF Coordinator address
      "0xa36085F69e2889c224210F603D836748e7dC0088", // Link Token Address
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4" // keyhash
    );
    console.log("contract deployed to: ", contract.address); // Needed so we can fund via link faucet
    // Burn 50% of tokens
    const burnAmount = (await contract.totalSupply()).div(2).toString();
    await contract.transfer(deadAddress, burnAmount);
  });
  it("should grant half of all tokens to deployer", async () => {
    const ownerBalance = await contract.balanceOf(owner.address);
    expect(ownerBalance).to.equal((await contract.totalSupply()).div(2));
    expectAllBalances(
      "0",
      "0",
      "500000000000000000000000",
      "500000000000000000000000",
      "0",
      "0",
      "0"
    );
  });
  it("should payout lotto fees to winner", async () => {
    // Transfer tokens from owner to A and check balance
    await contract.transfer(alice.address, 10**10);
    // Transfer tokens from owner to B and C
    await contract.transfer(bob.address, 10**10);
    await contract.transfer(cindy.address, 10**10);
    await logAllBalances("after bob and cindy get some");
    await expectAllBalances( // assert no payouts yet because owner exempt from fees
      "0",
      "0",
      "500000000000000000000000",
      "499999999999970000000000",
      "10000000000",
      "10000000000",
      "10000000000"
    );
    // Owner is exempt from reflection so send B->C, and see that someone won lotto
    await expect(contract.connect(bob).transfer(cindy.address, (10**10)))
      .to.emit(contract, 'LotteryWinner')
      .withArgs(cindy.address, (10 ** 10)/20);

    // await contract.connect(bob).transfer(cindy.address, (10**10));
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
    // await contract.connect(alice).transfer(bob.address, (10**10));
    // // await contract.connect(bob).transfer(cindy.address, (10**10));
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
