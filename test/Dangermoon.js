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
  console.log("totalFees", (await contract.totalFees()).toString());
  console.log("0xdead", (await contract.balanceOf(deadAddress)).toString());
  console.log("0xowner", (await contract.balanceOf(owner.address)).toString());
  console.log("0xalice", (await contract.balanceOf(alice.address)).toString());
  console.log("0xbob", (await contract.balanceOf(bob.address)).toString());
  console.log("0xcindy", (await contract.balanceOf(cindy.address)).toString());
  console.log("\n");
}

async function expectAllBalances(_totalFees, _dead, _owner, _alice, _bob, _cindy) {
  expect( (await contract.totalFees()).toString(),               "totalFees").to.equal(_totalFees);
  expect( (await contract.balanceOf(deadAddress)).toString(),  "deadAddress").to.equal(_dead);
  expect( (await contract.balanceOf(owner.address)).toString(),      "owner").to.equal(_owner);
  expect( (await contract.balanceOf(alice.address)).toString(),      "alice").to.equal(_alice);
  expect( (await contract.balanceOf(bob.address)).toString(),          "bob").to.equal(_bob);
  expect( (await contract.balanceOf(cindy.address)).toString(),      "cindy").to.equal(_cindy);
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
    await contract.transfer(alice.address, 10**10);
    // Transfer tokens from owner to B and C
    await contract.transfer(bob.address, 10**10);
    await contract.transfer(cindy.address, 10**10);
    await logAllBalances("after bob and cindy get some");
    await expectAllBalances( // assert no payouts yet because owner exempt from fees
      "0",
      "500000000000000000000000",
      "499999999999970000000000",
      "10000000000",
      "10000000000",
      "10000000000"
    );
    // Owner is exempt from reflection so send B->C, and see that someone won lotto
    await contract.connect(bob).transfer(cindy.address, (10**10));
    await logAllBalances("after lotto");
    await expectAllBalances( // assert cindy won all the take fees
      "500000000",
      "500000000000000000000000",
      "499999997000000000000000",
      "1000000000000000",
      "999990000000000",
      "1000009500000000"
    );
  });
  // todo test minimumPurchaseNecessary
  // todo test subsequent lottos work as intended
});
