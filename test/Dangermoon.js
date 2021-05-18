const { ethers } = require("hardhat");
const { expect } = require("chai");
// const utils = require("./helpers/utils");
const time = require("./helpers/time");
const BigNumber = require('bignumber.js');

const deadAddress = '0x000000000000000000000000000000000000dead';
const SECONDS_IN_A_DAY = 86400;

let contract;
let owner;
let alice;
let bob;

async function logAllBalances(header) {
  console.log(header);
  console.log("totalFees", (await contract.totalFees()).toString());
  // console.log("currentPayout", (await contract.currentPayout()).toString());
  console.log("0xdead", (await contract.balanceOf(deadAddress)).toString());
  console.log("0xowner", (await contract.balanceOf(owner.address)).toString());
  console.log("0xalice", (await contract.balanceOf(alice.address)).toString());
  console.log("0xbob", (await contract.balanceOf(bob.address)).toString());
  console.log("0xcindy", (await contract.balanceOf(cindy.address)).toString());
  console.log("\n");
}

describe("DangerMoon", function () {
  beforeEach(async () => {
    [owner, alice, bob, cindy] = await ethers.getSigners();
    // Get and deploy contract
    const DangerMoon = await ethers.getContractFactory("DangerMoon");
    contract = await DangerMoon.deploy();
    // Burn 50% of tokens
    const burnAmount = (await contract.totalSupply()).div(2).toString();
    await contract.transfer(deadAddress, burnAmount);
  });
  it("should grant half of all tokens to deployer", async () => {
    const ownerBalance = await contract.balanceOf(owner.address);
    expect(ownerBalance).to.equal((await contract.totalSupply()).div(2));
    const aliceBalance = await contract.balanceOf(alice.address);
    expect(aliceBalance).to.equal(0);
  });
  it("should payout weeks worth of reflection fees to winner", async () => {
    await logAllBalances("init");
    // Transfer tokens from owner to A and check balance
    await contract.transfer(alice.address, 10**15);
    const aliceStartingBalance = await contract.balanceOf(alice.address);
    // Transfer tokens from owner to B and C
    await contract.transfer(bob.address, 10**15);
    await contract.transfer(cindy.address, 10**15);
    await logAllBalances("after bob and cindy get some");
    // Owner is exempt from reflection so send B->C, and see if A got more tokens
    await contract.connect(bob).transfer(cindy.address, (10**8)/2);
    await contract.connect(cindy).transfer(alice.address, (10**8)/2);
    await contract.connect(alice).transfer(bob.address, (10**8)/2);
    // await contract.connect(alice).transfer(cindy.address, 5000000000000);
    // await contract.connect(bob).transfer(cindy.address, );
    // see how many tokens A has
    // await logAllBalances("before lotto ready");
    // await contract.turnBackTime(SECONDS_IN_A_DAY * 8)
    await contract.connect(bob).transfer(cindy.address, 1);
    await logAllBalances("after lotto");
  });
  // todo test minimumPurchaseNecessary
  // todo test subsequent lottos work as intended
});
