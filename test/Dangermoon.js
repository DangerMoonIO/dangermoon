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
  console.log("0xdead", (await contract.balanceOf(deadAddress)).toString());
  console.log("0xowner", (await contract.balanceOf(owner.address)).toString());
  console.log("0xalice", (await contract.balanceOf(alice.address)).toString());
  console.log("0xbob", (await contract.balanceOf(bob.address)).toString());
  console.log("0xcindy", (await contract.balanceOf(cindy.address)).toString());
  console.log("\n");
}

async function expectAllBalances(_totalFees, _dead, _owner, _alice, _bob, _cindy) {
  expect( (await contract.totalFees()).toString()              ).to.equal(_totalFees);
  expect( (await contract.balanceOf(deadAddress)).toString()   ).to.equal(_dead);
  expect( (await contract.balanceOf(owner.address)).toString() ).to.equal(_owner);
  expect( (await contract.balanceOf(alice.address)).toString() ).to.equal(_alice);
  expect( (await contract.balanceOf(bob.address)).toString()   ).to.equal(_bob);
  expect( (await contract.balanceOf(cindy.address)).toString() ).to.equal(_cindy);
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
    expectAllBalances(
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
    await contract.transfer(alice.address, 10**15);
    // await logAllBalances("2");
    expectAllBalances(
      "0",
      "500000000000000000000000",
      "499999997000000000000000",
              "1000000000000000",
      "0",
      "0"
    );
    // Transfer tokens from owner to B and C
    await contract.transfer(bob.address, 10**15);
    await contract.transfer(cindy.address, 10**15);
    // await logAllBalances("after bob and cindy get some");
    // Owner is exempt from reflection so send B->C, and see if A got more tokens
    await contract.connect(bob).transfer(cindy.address, (10**10));
    // await contract.connect(bob).transfer(cindy.address, (10**10)/2);
    // await contract.connect(bob).transfer(cindy.address, (10**3)/2);
    // await contract.connect(alice).transfer(cindy.address, 5000000000000);
    // await contract.connect(bob).transfer(cindy.address, );
    // see how many tokens A has
    // await logAllBalances("before lotto ready");
    // await contract.turnBackTime(SECONDS_IN_A_DAY * 8)
    await contract.connect(bob).transfer(cindy.address, 1);
    // await logAllBalances("after lotto");
  });
  // todo test minimumPurchaseNecessary
  // todo test subsequent lottos work as intended
});
