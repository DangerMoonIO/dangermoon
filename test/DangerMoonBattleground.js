const CONFIG = require('../hardhat.config.js');
const { MNEMONIC } = require('../secrets.json');
const { ethers } = require("hardhat");
const { expect } = require("chai");

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

let dangermoon, bg;
// const dangermoonDecimals = 9;

// NOTE p1 = "player 1" etc
let owner, p1, p2, p3, p4, charity, marketing;

async function logAllBalances(header) {
  console.log(header);
  console.log("0xbg", (await dangermoon.balanceOf(bg.address)).toString());
  console.log("0xowner", (await dangermoon.balanceOf(owner.address)).toString());
  console.log("0xp1",  (await dangermoon.balanceOf(p1.address)).toString());
  console.log("0xp2",  (await dangermoon.balanceOf(p2.address)).toString());
  console.log("0xp3",  (await dangermoon.balanceOf(p3.address)).toString());
  console.log("0xp4",  (await dangermoon.balanceOf(p4.address)).toString());
  console.log("\n");
}

async function expectAllBalances(expectations) {
  const { _bg, _owner, _p1, _p2, _p3, _p4 } = expectations;
  expect( (await dangermoon.balanceOf(bg.address)).toString(), "bg").to.equal(_bg);
  expect( (await dangermoon.balanceOf(owner.address)).toString(), "owner").to.equal(_owner);
  expect( (await dangermoon.balanceOf(p1.address)).toString(), "p1").to.equal(_p1);
  expect( (await dangermoon.balanceOf(p2.address)).toString(), "p2").to.equal(_p2);
  expect( (await dangermoon.balanceOf(p3.address)).toString(), "p3").to.equal(_p3);
  expect( (await dangermoon.balanceOf(p4.address)).toString(), "p4").to.equal(_p4);
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
  } = await bg.games(gameId);
  const gameBoard = await bg.getGameBoard(gameId);
  // console.log(gameBoard);
  console.log();
  console.log("Board #", gameId);
  console.log("width/height: ", width, "/", height);
  console.log("Players:", numPlayers, "out of", playerLimit);
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
      gasPrice: 100000
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
      await buyFromUniswap(p1, "0.000001", "0.0000001");
      await buyFromUniswap(p2, "0.000001", "0.0000001");
      await buyFromUniswap(p3, "0.000001", "0.0000001");
      await buyFromUniswap(p4, "0.000001", "0.0000001");

      // Get and deploy battleground
      const DangerMoonBattleground = await ethers.getContractFactory("DangerMoonBattleground");
      bg = await DangerMoonBattleground.deploy(dangermoon.address);

      // ensures playing does not ruin entries
      await dangermoon.excludeFromFee(bg.address);
    });

  	it("should create games", async () => {
        await dangermoon.connect(p1).approve(bg.address, "100000000000000000");
        await expect(bg.connect(p1).createGame(5)).to.emit(bg, "GameCreated");

        await dangermoon.connect(p2).approve(bg.address, "100000000000000000");
        await expect(bg.connect(p2).createGame(20)).to.emit(bg, "GameCreated");

        const bgDmBalance = (await dangermoon.balanceOf(bg.address)).toString();
        expect(bgDmBalance).to.equal("200000000000000000");

        // await printGameBoard(0);
    });

    it("should let players join", async () => {
        await dangermoon.connect(p1).approve(bg.address, "100000000000000000");
        await expect(bg.connect(p1).createGame(5)).to.emit(bg, "GameCreated");

        // approve interactions
        await dangermoon.connect(p1).approve(bg.address, "1000000000000000000");
        await bg.connect(p1).joinGame(0);

        await dangermoon.connect(p2).approve(bg.address, "1000000000000000000");
        await bg.connect(p2).joinGame(0);

        await dangermoon.connect(p3).approve(bg.address, "1000000000000000000");
        await bg.connect(p3).joinGame(0);

        // await dangermoon.connect(p4).approve(bg.address, "1000000000000000000");
        // await bg.connect(p4).joinGame(0);

        await printGameBoard(0);
    });

    xit("should prevent joining after four turns", async () => {
        // create a game
        await expect(bg.connect(p1).newGame(1200)).to.emit(bg, "GameCreated");
        // approve interactions
        await dangermoon.connect(p1).approve(bg.address, "1000000000000000000");
        await dangermoon.connect(p2).approve(bg.address, "1000000000000000000");
        await dangermoon.connect(p4).approve(bg.address, "1000000000000000000");

        // round 1
        await bg.connect(p1).voteMove(0, 25, 0, 0);
        // round 2
        await bg.connect(p4).voteMove(0, 25, 0, 1);
        // round 3
        await bg.connect(p1).voteMove(0, 25, 0, 2);
        // round 4
        await bg.connect(p4).voteMove(0, 25, 1, 0);
        // too late to join
        await expect(bg.connect(p2).voteMove(0, 25, 1, 2))
          .to.be.revertedWith("You must join a game before the fourth round.");
    });

    xit("should let player that creates game move first", async () => {
        // create a game
        await expect(bg.connect(p4).newGame(1200)).to.emit(bg, "GameCreated");

        // ensure the player that created game can make first move
        await dangermoon.connect(p4).approve(bg.address, "250000000000000000");
        await bg.connect(p4).voteMove(0, 15, 0, 0);
        await bg.connect(p4).voteMove(0, 10, 0, 0);

        await dangermoon.connect(p1).approve(bg.address, "250000000000000000");
        await bg.connect(p1).voteMove(0, 25, 1, 0);
    });

    xit("should end game if team missed their window", async () => {
        // Create a game w/ short playing window
        await bg.connect(owner).setMinimumBlocksPerTurn(2);
        await expect(bg.connect(p1).newGame(2)).to.emit(bg, "GameCreated");

        // Approve 2x to mine 2x blocks, thereby missing playing window
        await dangermoon.connect(p2).approve(bg.address, "250000000000000000");
        await dangermoon.connect(p3).approve(bg.address, "250000000000000000");

        // This player missed their turn
        await expect(bg.connect(p1).voteMove(0, 15, 0, 0))
          .to.emit(bg, "TeamSkippedMove");

        // So the game is over
        await expect(bg.connect(p4).voteMove(0, 25, 1, 1))
          .to.be.revertedWith("The game already has a winner, it is over.");
    });

    xit("should let winning team end game if other team missed their window", async () => {
        // Create a game w/ short playing window
        await bg.connect(owner).setMinimumBlocksPerTurn(2);
        await expect(bg.connect(p1).newGame(2)).to.emit(bg, "GameCreated");

        // Approve 2x to mine 2x blocks, thereby missing playing window
        await dangermoon.connect(p2).approve(bg.address, "250000000000000000");
        await dangermoon.connect(p3).approve(bg.address, "250000000000000000");

        // So the game is over
        await expect(bg.connect(p4).voteMove(0, 25, 1, 1))
          .to.emit(bg, "GameOver");
    });

    xit("should let the players vote to play and claim winnings", async () => {
        // create a game
        await expect(bg.connect(p1).newGame(1200)).to.emit(bg, "GameCreated");
        // approve interactions
        await dangermoon.connect(p1).approve(bg.address, "750000000000000000");
        await dangermoon.connect(p2).approve(bg.address, "750000000000000000");
        await dangermoon.connect(p3).approve(bg.address, "750000000000000000");
        await dangermoon.connect(p4).approve(bg.address, "750000000000000000");

        // await logAllBalances("before playing");
        await expectAllBalances({
          "_bg":                    "0",
          "_owner": "500000000000000000000000",
          "_p1":      "45000000000000000000",
          "_p2":      "45000000000000000000",
          "_p3":      "45000000000000000000",
          "_p4":      "45000000000000000000",
        });

        // let team 1 win
        // console.log((await dangermoon.balanceOf(p1.address)).toString());
        await bg.connect(p1).voteMove(0, 15, 0, 0);
        await bg.connect(p2).voteMove(0, 15, 0, 0);
        await bg.connect(p4).voteMove(0, 25, 0, 1);
        // console.log((await dangermoon.balanceOf(p1.address)).toString());
        // should not let a player make a move at already filled coordinates
        await expect(bg.connect(p1).voteMove(0, 15, 0, 0))
          .to.be.revertedWith('There is already a mark at the given coordinates');
        // should not let a player claim winnings before game is over
        await expect(bg.connect(p1).claimWinnings(0))
          .to.be.revertedWith('The game doesnt have a winner yet, it is not over.');
        await bg.connect(p1).voteMove(0, 15, 1, 1);
        await bg.connect(p3).voteMove(0, 15, 1, 1);
        await bg.connect(p4).voteMove(0, 25, 0, 2);
        // console.log((await dangermoon.balanceOf(p1.address)).toString());
        await bg.connect(p1).voteMove(0, 25, 2, 2);

        // await logAllBalances("after playing");
        await expectAllBalances({
          "_bg":  "1350000000000000000",
          "_owner": "500000000000000000000000",
          "_p1":      "44450000000000000000",
          "_p2":      "44850000000000000000",
          "_p3":      "44850000000000000000",
          "_p4":      "44500000000000000000",
        });

        // const gamePayoutsBefore = await bg.connect(p1).getGamePayouts(0);
        // console.log(gamePayoutsBefore.draw.toString());
        // console.log(gamePayoutsBefore.win.toString());

        // verify players can claim their winnings
        await bg.connect(p1).claimWinnings(0);
        await bg.connect(p2).claimWinnings(0);
        await bg.connect(p3).claimWinnings(0);
        // collect dust for even numbers
        await bg.connect(owner).withdrawDangerMoon(0);

        await expect(bg.connect(p1).claimWinnings(1))
          .to.be.revertedWith("No such game exists.");
        // cant claim 2x
        await expect(bg.connect(p1).claimWinnings(0))
          .to.be.revertedWith("You have no DangerMoon to claim, you may have already claimed it.");
        // didnt play
        await expect(bg.connect(owner).claimWinnings(0))
          .to.be.revertedWith("You have no DangerMoon to claim, you may have already claimed it.");
        // cant claim if you lost
        await expect(bg.connect(p4).claimWinnings(0))
          .to.be.revertedWith("The game was not a draw and your team lost.");

        // const gamePayoutsAfter = await bg.connect(p1).getGamePayouts(0);
        // console.log(gamePayoutsAfter.draw.toString());
        // console.log(gamePayoutsAfter.win.toString());

        // await logAllBalances("after claiming");
        await expectAllBalances({
          "_bg":                    "0",
          "_owner": "500000135000000000000000",
          "_p1":      "45236176470588235294",
          "_p2":      "45064411764705882353",
          "_p3":      "45064411764705882353",
          "_p4":      "44500000000000000000",
        });

    });

    xit("should let players get dangermoon back on a draw", async () => {
        // create a game
        await expect(bg.connect(p1).newGame(1200)).to.emit(bg, "GameCreated");
        // approve interactions
        await dangermoon.connect(p1).approve(bg.address, "1000000000000000000");
        await dangermoon.connect(p2).approve(bg.address,  "250000000000000000");
        await dangermoon.connect(p4).approve(bg.address, "1000000000000000000");

        // await logAllBalances("before playing");
        await expectAllBalances({
          "_bg":                    "0",
          "_owner": "500000000000000000000000",
          "_p1":      "45000000000000000000",
          "_p2":      "45000000000000000000",
          "_p3":      "45000000000000000000",
          "_p4":      "45000000000000000000",
        });

        // force a draw
        await bg.connect(p1).voteMove(0, 25, 0, 0);
        await bg.connect(p4).voteMove(0, 25, 0, 1);
        await bg.connect(p2).voteMove(0, 25, 0, 2);
        await bg.connect(p4).voteMove(0, 25, 1, 0);
        await bg.connect(p1).voteMove(0, 25, 1, 2);
        await bg.connect(p4).voteMove(0, 25, 1, 1);
        await bg.connect(p1).voteMove(0, 25, 2, 0);
        await bg.connect(p4).voteMove(0, 25, 2, 2);
        await bg.connect(p1).voteMove(0, 25, 2, 1);

        // await logAllBalances("after playing");
        await expectAllBalances({
          "_bg":  "2250000000000000000",
          "_owner": "500000000000000000000000",
          "_p1":      "44000000000000000000",
          "_p2":      "44750000000000000000",
          "_p3":      "45000000000000000000",
          "_p4":      "44000000000000000000",
        });

        // verify players can get their money back
        await bg.connect(p1).claimWinnings(0);
        await bg.connect(p2).claimWinnings(0);
        await bg.connect(p4).claimWinnings(0);

        // cant claim twice
        await expect(bg.connect(p2).claimWinnings(0))
          .to.be.revertedWith("You have no DangerMoon to claim, you may have already claimed it.");
        // didnt play
        await expect(bg.connect(p3).claimWinnings(0))
          .to.be.revertedWith("You have no DangerMoon to claim, you may have already claimed it.");
        // didnt play
        await expect(bg.connect(owner).claimWinnings(0))
          .to.be.revertedWith("You have no DangerMoon to claim, you may have already claimed it.");

        // await logAllBalances("after claiming");
        await expectAllBalances({
          "_bg":                    "0",
          "_owner": "500000225000000000000000",
          "_p1":      "44900000000000000000",
          "_p2":      "44975000000000000000",
          "_p3":      "45000000000000000000",
          "_p4":      "44900000000000000000",
        });

    });

});
