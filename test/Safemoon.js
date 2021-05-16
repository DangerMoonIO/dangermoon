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

async function logAllBalances(s) {
  console.log("dead", (await contract.balanceOf(deadAddress)).toString());
  console.log("owner", (await contract.balanceOf(owner.address)).toString());
  console.log("alice", (await contract.balanceOf(alice.address)).toString());
  console.log("bob", (await contract.balanceOf(bob.address)).toString());
  console.log("cindy", (await contract.balanceOf(cindy.address)).toString());
  console.log("\n");
}

describe("SafeMoon", function () {
  beforeEach(async () => {
    [owner, alice, bob, cindy] = await ethers.getSigners();
    // Get and deploy contract
    const SafeMoon = await ethers.getContractFactory("SafeMoon");
    contract = await SafeMoon.deploy();
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
  it("should grant reflected tokens to holders", async () => {
    await logAllBalances();
    // Transfer tokens from owner to A and check balance
    await contract.transfer(alice.address, 10**15);
    const aliceStartingBalance = await contract.balanceOf(alice.address);
    // Transfer tokens from owner to B and C
    await contract.transfer(bob.address, 10**15);
    await contract.transfer(cindy.address, 10**15);
    await logAllBalances();
    // Owner is exempt from reflection so send B->C, and see if A got more tokens
    await contract.connect(bob).transfer(cindy.address, (10**15)/2);
    // await contract.connect(alice).transfer(cindy.address, 5000000000000);
    // await contract.connect(bob).transfer(cindy.address, );
    // see how many tokens A has
    await logAllBalances();
  });
});
