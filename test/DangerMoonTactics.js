const CONFIG = require('../hardhat.config.js');
const { ethers } = require("hardhat");
const { expect } = require("chai");

if (process.env.PKEY === undefined) {
  console.error("Please provide PKEY env")
  process.exit(1)
}

const WETH_ADDRESS = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";

let linkContract;
// const LINK_DECIMALS = 18;
const VRF_COORDINATOR = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
const LINK_KEYHASH = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
const LINK_ADDRESS = '0xa36085F69e2889c224210F603D836748e7dC0088';

// Really its uniswap v2
let uniswapContract;
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
];

const DEAD = '0x000000000000000000000000000000000000dEaD';

let dangermoon, tactics;
// const dangermoonDecimals = 9;

// NOTE p1 = "player 1" etc
let owner, p1, p2, p3, p4, charity, marketing;

async function logAllBalances(header) {
  console.log(header);
  console.log("0xtactics", (await dangermoon.balanceOf(tactics.address)).toString());
  console.log("0xowner", (await dangermoon.balanceOf(owner.address)).toString());
  console.log("0xp1",  (await dangermoon.balanceOf(p1.address)).toString());
  console.log("0xp2",  (await dangermoon.balanceOf(p2.address)).toString());
  console.log("0xp3",  (await dangermoon.balanceOf(p3.address)).toString());
  console.log("0xp4",  (await dangermoon.balanceOf(p4.address)).toString());
  console.log("\n");
}

async function expectAllBalances(expectations) {
  const { _tactics, _owner, _p1, _p2, _p3, _p4 } = expectations;
  expect( (await dangermoon.balanceOf(tactics.address)).toString(), "tactics").to.equal(_tactics);
  expect( (await dangermoon.balanceOf(owner.address)).toString(), "owner").to.equal(_owner);
  expect( (await dangermoon.balanceOf(p1.address)).toString(), "p1").to.equal(_p1);
  expect( (await dangermoon.balanceOf(p2.address)).toString(), "p2").to.equal(_p2);
  expect( (await dangermoon.balanceOf(p3.address)).toString(), "p3").to.equal(_p3);
  expect( (await dangermoon.balanceOf(p4.address)).toString(), "p4").to.equal(_p4);
}

async function mineTenBlocks() {
  for (let i=0; i<10; i++) {
    await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
  }
}

async function printGameBoard(gameId) {
  const {
    mustJoinByBlock,
    prizePool,
    numDead,
    numPlayers,
    playerLimit,
    width,
    height,
    entryFeePercent,
    energyFeePercent
  } = await tactics.games(gameId);
  const gameBoard = await tactics.getGameBoard(gameId);
  // console.log(gameBoard);
  console.log();
  console.log("Board #", gameId);
  console.log("width/height: ", width, "/", height);
  console.log("Players:", numPlayers, "out of", playerLimit);
  console.log("[votes/energy/range/hp]");
  for (let y=0; y<height; y++) {
    for (let x=0; x<width; x++) {
      const {
        owner,
        lastClaim,
        votes,
        energy,
        range,
        hitpoints,
      } = gameBoard[x][y];
      if (owner == "0x0000000000000000000000000000000000000000") {
        process.stdout.write("[ / / / ] ");
      } else {
        process.stdout.write("["+votes+"/"+energy+"/"+range+"/"+hitpoints+"] ");
      }
    }
    console.log();
  }
  console.log();
}

async function buyFromUniswap(buyer, faucetEther, etherToSpend) {
  await testWallet.signTransaction({
    to: buyer.address,
    value: ethers.utils.parseEther(faucetEther)
  });
  await uniswapContract.swapETHForExactTokens(
    "50000000000000000000",
    [WETH_ADDRESS, dangermoon.address],
    buyer.address,
    Math.floor(Date.now() / 1000),
    {
      value: ethers.utils.parseEther(etherToSpend),
      // gasPrice: 100000
    }
  );
}

describe('TicTacToe', function() {
    beforeEach(async () => {
      // NOTE p1 = "player 1" etc
      [owner, p1, p2, p3, p4, charity, marketing] = await ethers.getSigners();

      // Get and deploy dangermoon
      const MockDangerMoon = await ethers.getContractFactory("MockDangerMoon");
      dangermoon = await MockDangerMoon.deploy(
        UNISWAP_ROUTER,
        VRF_COORDINATOR,
        LINK_ADDRESS,
        LINK_KEYHASH,
        charity.address,
        marketing.address
      );

      // Send 50% of tokens from deployer to 0xdead to burn them
      let halfTotalTokenSupply = (await dangermoon.totalSupply()).div(2).toString();
      // We dont burn half *during testing*, because we need to simulate having
      // a large amount of tokens in the contract for swapAndLiquify
      // await dangermoon.transfer(DEAD, halfTotalTokenSupply);

      // Set up test wallet
      const rpcUrl = CONFIG.networks.hardhat.forking.url;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      testWallet = new ethers.Wallet(process.env.PKEY);
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
          // gasPrice: 1000000
        }
      );

      // a b and c go buy from uniswap
      await buyFromUniswap(p1, "0.000001", "0.0000001");
      await buyFromUniswap(p2, "0.000001", "0.0000001");
      await buyFromUniswap(p3, "0.000001", "0.0000001");
      await buyFromUniswap(p4, "0.000001", "0.0000001");

      // Get and deploy tactics
      const DangerMoonTactics = await ethers.getContractFactory("DangerMoonTactics");
      tactics = await DangerMoonTactics.deploy(dangermoon.address, 10);

      // ensures playing does not ruin entries
      await dangermoon.excludeFromFee(tactics.address);
    });

  	it("should let players createGame and joinGame", async () => {
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p1).createGame(5)).to.emit(tactics, "GameCreated");

      await dangermoon.connect(p1).approve(tactics.address, "2000000000000000000");
      await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 1, 2);
      await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 0, 0);

      await dangermoon.connect(p2).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p2).createGame(20)).to.emit(tactics, "GameCreated");

      const tacticsDmBalance = (await dangermoon.balanceOf(tactics.address)).toString();
      expect(tacticsDmBalance).to.equal("400000000000000000");

      // await printGameBoard(0);
    });

    it("should let players claimEnergy, attack, and juryVote", async () => {
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p1).createGame(5)).to.emit(tactics, "GameCreated");

      await dangermoon.connect(p1).approve(tactics.address, "2000000000000000000");
      await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 1, 1);
      await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 0, 1);
      await dangermoon.connect(p2).approve(tactics.address, "1000000000000000000");
      await expect(tactics.connect(p2).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p2.address, 1, 0);
      await dangermoon.connect(p3).approve(tactics.address, "1000000000000000000");
      await expect(tactics.connect(p3).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p3.address, 2, 2);
      await dangermoon.connect(p4).approve(tactics.address, "1000000000000000000");
      await expect(tactics.connect(p4).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p4.address, 2, 0);

      // await printGameBoard(0);
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await tactics.connect(p1).claimEnergy(0, 1, 1);

      // await printGameBoard(0);

      await tactics.connect(p1).attack(0, 1, 1, 1, 0);
      await tactics.connect(p1).attack(0, 1, 1, 1, 0);
      await tactics.connect(p1).attack(0, 0, 1, 1, 0);
      await expect(tactics.connect(p4).attack(0, 2, 0, 1, 0))
        .to.be.revertedWith("Target dead");

      // await printGameBoard(0);
      await tactics.connect(p2).juryVote(0, 1, 0, 2, 0);

    });

    it("should prevent joining after round ends", async () => {
      // create a game
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p1).createGame(5)).to.emit(tactics, "GameCreated");

      // mine 10 blocks to pass the join time
      for (let x=0; x<10; x++) {
        await dangermoon.connect(p1).approve(tactics.address, "1000000000000000000");
      }

      // too late to join
      await expect(tactics.connect(p2).joinGame(0))
        .to.be.revertedWith("Too late to join");
    });

    it("should let players upgradeAttackRange", async () => {
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p1).createGame(5)).to.emit(tactics, "GameCreated");

      await dangermoon.connect(p1).approve(tactics.address, "1000000000000000000");
      await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 2, 2);

      // await printGameBoard(0);
      await expect(tactics.connect(p1).upgradeAttackRange(0, 2, 2))
        .to.emit(tactics, "UpgradedAttackRange").withArgs(0, p1.address, 3);
      // await printGameBoard(0);
    });

    it("should let players grantEnergy", async () => {
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p1).createGame(5)).to.emit(tactics, "GameCreated");

      await dangermoon.connect(p1).approve(tactics.address, "1000000000000000000");
      await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 1, 0);

      await dangermoon.connect(p2).approve(tactics.address, "1000000000000000000");
      await expect(tactics.connect(p2).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p2.address, 1, 2);

      // await printGameBoard(0);
      await expect(tactics.connect(p1).grantEnergy(0, 1, 0, 1, 2))
        .to.emit(tactics, "EnergyGranted").withArgs(0, p1.address, 1, 0, 1, 2);
      // await printGameBoard(0);
    });

    it("should let players move", async () => {
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p1).createGame(5)).to.emit(tactics, "GameCreated");

      await dangermoon.connect(p1).approve(tactics.address, "1000000000000000000");
      await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 0, 0);

      // await printGameBoard(0);
      await expect(tactics.connect(p1).move(0, 0, 0, 1, 1))
        .to.emit(tactics, "PlayerMoved").withArgs(0, p1.address, 0, 0, 1, 1);
      // await printGameBoard(0);
    });

    it("should not let players attack out of range", async () => {
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p1).createGame(20)).to.emit(tactics, "GameCreated");

      await dangermoon.connect(p1).approve(tactics.address, "1000000000000000000");
      // await tactics.connect(p1).joinGame(0);
      await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 0, 4);
      await dangermoon.connect(p2).approve(tactics.address, "1000000000000000000");
      // await tactics.connect(p2).joinGame(0);
      await expect(tactics.connect(p2).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p2.address, 4, 2);
      await dangermoon.connect(p3).approve(tactics.address, "1000000000000000000");
      // await tactics.connect(p3).joinGame(0);
      await expect(tactics.connect(p3).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p3.address, 0, 1);

      // await printGameBoard(0);
      await expect(tactics.connect(p1).attack(0, 0, 4, 0, 1))
        .to.be.revertedWith("Not in range");
    });

    it("should let players claimWinnings", async () => {
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p1).createGame(2)).to.emit(tactics, "GameCreated");

      await dangermoon.connect(p1).approve(tactics.address, "1200000000000000000");
      await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 0, 0);

      await dangermoon.connect(p2).approve(tactics.address, "1000000000000000000");
      await expect(tactics.connect(p2).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p2.address, 1, 0);

      await tactics.connect(p1).attack(0, 0, 0, 1, 0);
      await mineTenBlocks();
      await tactics.connect(p1).claimEnergy(0, 0, 0);
      await tactics.connect(p1).attack(0, 0, 0, 1, 0);
      await mineTenBlocks();
      await tactics.connect(p1).claimEnergy(0, 0, 0);
      await tactics.connect(p1).attack(0, 0, 0, 1, 0);

      await printGameBoard(0);

      // await logAllBalances("before claim");
      await expectAllBalances({
        "_tactics": "320000000000000000",
        "_owner": "500000000000000000000000",
        "_p1": "44780000000000000000",
        "_p2": "44900000000000000000",
        "_p3": "45000000000000000000",
        "_p4": "45000000000000000000",
      });

      await tactics.connect(p1).claimWinnings(0, 0, 0);

      // await logAllBalances("after claim");
      await expectAllBalances({
        "_tactics": "0",
        "_owner": "500000032000000000000000",
        "_p1": "45068000000000000000",
        "_p2": "44900000000000000000",
        "_p3": "45000000000000000000",
        "_p4": "45000000000000000000",
      });

    });

    xit("should let players grantHitpoint", async () => {
      await dangermoon.connect(p1).approve(tactics.address, "100000000000000000");
      await expect(tactics.connect(p1).createGame(5)).to.emit(tactics, "GameCreated");

      await dangermoon.connect(p1).approve(tactics.address, "1000000000000000000");
      await tactics.connect(p1).joinGame(0);
      // await expect(tactics.connect(p1).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p1.address, 0, 1);

      await dangermoon.connect(p2).approve(tactics.address, "1000000000000000000");
      await tactics.connect(p2).joinGame(0);
      // await expect(tactics.connect(p2).joinGame(0)).to.emit(tactics, "GameJoined").withArgs(0, p2.address, 1, 2);

      // await printGameBoard(0);
      // TODO shouldnt be able to grant >3 HP
      await expect(tactics.connect(p1).grantHitpoint(0, 0, 1, 1, 2))
        .to.emit(tactics, "HitpointGranted").withArgs(0, p1.address, 0, 1,  1, 2);
      // await printGameBoard(0);
    });

});
