const CONFIG = require('../hardhat.config.js');
const { MNEMONIC } = require('../secrets.json');
const { ethers } = require("hardhat");
const { expect } = require("chai");

const GAME_CREATED_EVENT = "GameCreated";
const PLAYER_JOINED_EVENT = "PlayerJoinedGame";
const PLAYER_MADE_MOVE_EVENT = "PlayerMadeMove";
const GAME_OVER_EVENT = "GameOver";

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
let tictactoe;
const dangermoonDecimals = 9;
// NOTE t1p1 = "team 1 player 1" etc
let owner, t1p1, t1p2, t1p3, t2p1, charity, marketing;

async function logAllBalances(header) {
  console.log(header);
  console.log("0xtictactoe", (await dangermoon.balanceOf(tictactoe.address)).toString());
  console.log("0xowner", (await dangermoon.balanceOf(owner.address)).toString());
  console.log("0xt1p1",  (await dangermoon.balanceOf(t1p1.address)).toString());
  console.log("0xt1p2",  (await dangermoon.balanceOf(t1p2.address)).toString());
  console.log("0xt1p3",  (await dangermoon.balanceOf(t1p3.address)).toString());
  console.log("0xt2p1",  (await dangermoon.balanceOf(t2p1.address)).toString());
  console.log("\n");
}

async function expectAllBalances(expectations) {
  const { _tictactoe, _owner, _t1p1, _t1p2, _t1p3, _t2p1 } = expectations;
  expect( (await dangermoon.balanceOf(tictactoe.address)).toString(), "tictactoe").to.equal(_tictactoe);
  expect( (await dangermoon.balanceOf(owner.address)).toString(), "owner").to.equal(_owner);
  expect( (await dangermoon.balanceOf(t1p1.address)).toString(), "t1p1").to.equal(_t1p1);
  expect( (await dangermoon.balanceOf(t1p2.address)).toString(), "t1p2").to.equal(_t1p2);
  expect( (await dangermoon.balanceOf(t1p3.address)).toString(), "t1p3").to.equal(_t1p3);
  expect( (await dangermoon.balanceOf(t2p1.address)).toString(), "t2p1").to.equal(_t2p1);
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
      // NOTE t1p1 = "team 1 player 1" etc
      [owner, t1p1, t1p2, t1p3, t2p1, charity, marketing] = await ethers.getSigners();

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
      await buyFromUniswap(t1p1, "0.000001", "0.0000001");
      await buyFromUniswap(t1p2, "0.000001", "0.0000001");
      await buyFromUniswap(t1p3, "0.000001", "0.0000001");
      await buyFromUniswap(t2p1, "0.000001", "0.0000001");

      // Get and deploy tictactoe
      const DangerMoonTicTacToe = await ethers.getContractFactory("DangerMoonTicTacToe");
      tictactoe = await DangerMoonTicTacToe.deploy(dangermoon.address);

      // ensures playing does not ruin entries
      await dangermoon.excludeFromFee(tictactoe.address);
    });

  	it("should create a game", async () => {
        // console.log(await dangermoon.balanceOf(tictactoe.address));
        // console.log(await dangermoon.connect(c).transfer(tictactoe.address, "100000000000000000"));

        await expect(tictactoe.connect(t1p1).newGame(1200)).to.emit(tictactoe, "GameCreated");
        await expect(tictactoe.connect(t2p1).newGame(1200)).to.emit(tictactoe, "GameCreated");

        // const game0 = await tictactoe.games(0);
        // console.log(game0);
        // const game1 = await tictactoe.games(1);
        // console.log(game1);

        // const tictactoeDmBalance = (await dangermoon.balanceOf(tictactoe.address)).toString();
        // expect(tictactoeDmBalance).to.equal("200000000000000000");
    });

    it("should switch turns after 25+ votes", async () => {
        // create a game
        await expect(tictactoe.connect(t1p1).newGame(1200)).to.emit(tictactoe, "GameCreated");

        // await expect(tictactoe.connect(t2p1).newGame(1200)).to.emit(tictactoe, "GameCreated");

        // await dangermoon.connect(t1p1).approve(tictactoe.address, "250000000000000000");
        // console.log((await dangermoon.balanceOf(t1p1.address)).toString());
        await dangermoon.connect(t1p1).approve(tictactoe.address, "250000000000000000");
        await tictactoe.connect(t1p1).voteMove(0, 15, 0, 0);
        await dangermoon.connect(t1p2).approve(tictactoe.address, "250000000000000000");
        await tictactoe.connect(t1p2).voteMove(0, 15, 0, 0);
        await dangermoon.connect(t2p1).approve(tictactoe.address, "250000000000000000");
        await tictactoe.connect(t2p1).voteMove(0, 25, 1, 1);

        // await dangermoon.connect(t2p1).approve(tictactoe.address, "250000000000000000");
        // await tictactoe.connect(t1p1).voteMove(0, 25, 0, 0);
        // await tictactoe.connect(t2p1).voteMove(0, 25, 0, 0);
    });

    it("should let the players make moves", async () => {
        // create a game
        await expect(tictactoe.connect(t1p1).newGame(1200)).to.emit(tictactoe, "GameCreated");
        // approve interactions
        await dangermoon.connect(t1p1).approve(tictactoe.address, "750000000000000000");
        await dangermoon.connect(t1p2).approve(tictactoe.address, "750000000000000000");
        await dangermoon.connect(t1p3).approve(tictactoe.address, "750000000000000000");
        await dangermoon.connect(t2p1).approve(tictactoe.address, "750000000000000000");

        // let team 1 win
        // console.log((await dangermoon.balanceOf(t1p1.address)).toString());
        await tictactoe.connect(t1p1).voteMove(0, 15, 0, 0);
        await tictactoe.connect(t1p2).voteMove(0, 15, 0, 0);
        await tictactoe.connect(t2p1).voteMove(0, 25, 0, 1);
        // console.log((await dangermoon.balanceOf(t1p1.address)).toString());
        await tictactoe.connect(t1p1).voteMove(0, 15, 1, 1);
        await tictactoe.connect(t1p3).voteMove(0, 15, 1, 1);
        await tictactoe.connect(t2p1).voteMove(0, 25, 0, 2);
        // console.log((await dangermoon.balanceOf(t1p1.address)).toString());
        await tictactoe.connect(t1p1).voteMove(0, 25, 2, 2);

        // await logAllBalances("after playing");
        await expectAllBalances({
          "_tictactoe":  "1350000000000000000",
          "_owner": "500000000000000000000000",
          "_t1p1":      "44450000000000000000",
          "_t1p2":      "44850000000000000000",
          "_t1p3":      "44850000000000000000",
          "_t2p1":      "44500000000000000000",
        });

        // verify players can claim their winnings
        await tictactoe.connect(t1p1).claimWinnings(0);
        await tictactoe.connect(t1p2).claimWinnings(0);
        await tictactoe.connect(t1p3).claimWinnings(0);

        // cant claim 2x
        await expect(tictactoe.connect(t1p1).claimWinnings(0)).to.be.reverted;
        // didnt play
        await expect(tictactoe.connect(owner).claimWinnings(0)).to.be.reverted;
        // cant claim if you lost
        await expect(tictactoe.connect(t2p1).claimWinnings(0)).to.be.reverted;

        // await logAllBalances("after claiming");
        await expectAllBalances({
          "_tictactoe":                    "2",
          "_owner": "500000134999999999999998",
          "_t1p1":      "45236176470588235294",
          "_t1p2":      "45064411764705882353",
          "_t1p3":      "45064411764705882353",
          "_t2p1":      "44500000000000000000",
        });

    });

    xit("should not let the same player make two moves in a row", async () => {
        await tictactoe.connect(t1p1).voteMove(0, 25, 0, 0);
        await tictactoe.connect(t1p1).voteMove(0, 25, 0, 1);
        await tictactoe.connect(t1p1).voteMove(0, 25, 0, 2);
    });

    xit("should not let a player make a move at already filled coordinates", async () => {
        await tictactoe.connect(t1p1).voteMove(0, 25, 0, 0);
        await tictactoe.connect(t1p1).voteMove(0, 25, 0, 1);
        await tictactoe.connect(t1p1).voteMove(0, 25, 0, 1);
    });
});
