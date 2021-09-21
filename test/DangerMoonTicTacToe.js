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
let owner, a, b, c, d, charity, marketing;

async function logAllBalances(header) {
  console.log(header);
  console.log("totalReflected", (await dangermoon.totalReflected()).toString());
  console.log("currentReflection", (await dangermoon.currentReflection()).toString());
  console.log("0xdead", (await dangermoon.balanceOf(DEAD)).toString());
  console.log("0xowner", (await dangermoon.balanceOf(owner.address)).toString());
  console.log("0xa", (await dangermoon.balanceOf(a.address)).toString());
  console.log("0xb", (await dangermoon.balanceOf(b.address)).toString());
  console.log("0xc", (await dangermoon.balanceOf(c.address)).toString());
  console.log("\n");
}

async function expectAllBalances(expectations) {
  const { _totalReflected, _currentReflection, _dead, _owner, _a, _b, _c } = expectations;
  expect( (await dangermoon.totalReflected()).toString(),       "totalReflected").to.equal(_totalReflected);
  expect( (await dangermoon.currentReflection()).toString(), "currentReflection").to.equal(_currentReflection);
  expect( (await dangermoon.balanceOf(DEAD)).toString(),                "0xdead").to.equal(_dead);
  expect( (await dangermoon.balanceOf(owner.address)).toString(),        "owner").to.equal(_owner);
  expect( (await dangermoon.balanceOf(a.address)).toString(),                "a").to.equal(_a);
  expect( (await dangermoon.balanceOf(b.address)).toString(),                "b").to.equal(_b);
  expect( (await dangermoon.balanceOf(c.address)).toString(),                "c").to.equal(_c);
}

async function buyFromUniswap(buyer, faucetEther, etherToSpend) {
  await testWallet.signTransaction({
    to: buyer.address,
    value: ethers.utils.parseEther(faucetEther)
  });
  await uniswapContract.swapETHForExactTokens(
    "111111111111111111",
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
      [owner, a, b, c, d, charity, marketing] = await ethers.getSigners();

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
      await buyFromUniswap(a, "0.0000001", "0.00000001");
      await buyFromUniswap(b, "0.0000001", "0.00000001");
      await buyFromUniswap(c, "0.0000001", "0.00000001");
      await buyFromUniswap(d, "0.0000001", "0.00000001");

      // Get and deploy tictactoe
      const DangerMoonTicTacToe = await ethers.getContractFactory("DangerMoonTicTacToe");
      tictactoe = await DangerMoonTicTacToe.deploy(dangermoon.address);

      // ensures playing does not ruin entries
      await dangermoon.excludeFromFee(tictactoe.address);
    });

  	it("should create a game", async () => {
        // console.log(await dangermoon.balanceOf(tictactoe.address));
        // console.log(await dangermoon.connect(c).transfer(tictactoe.address, "100000000000000000"));

        await dangermoon.connect(a).approve(tictactoe.address, "100000000000000000");
        await expect(tictactoe.connect(a).newGame(100)).to.emit(tictactoe, "GameCreated");

        await dangermoon.connect(d).approve(tictactoe.address, "100000000000000000");
        await expect(tictactoe.connect(d).newGame(100)).to.emit(tictactoe, "GameCreated");

        // const game0 = await tictactoe.games(0);
        // console.log(game0);
        // const game1 = await tictactoe.games(1);
        // console.log(game1);

        // const tictactoeDmBalance = (await dangermoon.balanceOf(tictactoe.address)).toString();
        // expect(tictactoeDmBalance).to.equal("200000000000000000");
    });

    xit("should accept exactly twenty five votes", () => {
        var tictactoe;
        var game_id;
        return TicTacToe.deployed().then((instance) => {
    	    tictactoe = instance;
    	    return tictactoe.newGame();
        }).then((result) => {
        	eventArgs = getEventArgs(result, GAME_CREATED_EVENT);
        	game_id = eventArgs.gameId;

        	return tictactoe.joinGame(game_id, {from: accounts[0]});
        }).then((result) => {
        	eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
        	assert.isTrue(eventArgs !== false, "Player one did not join the game.");
        	assert.equal(accounts[0], eventArgs.player, "The wrong player joined the game.");
        	assert.equal(game_id.valueOf(), eventArgs.gameId.valueOf(), "Player one joined the wrong game.");

        	return tictactoe.joinGame(game_id, {from: accounts[1]});
        }).then((result) => {
        	eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
        	assert.isTrue(eventArgs !== false, "Player two did not join the game.");
        	assert.equal(accounts[1], eventArgs.player, "The wrong player joined the game.");
        	assert.equal(game_id.valueOf(), eventArgs.gameId.valueOf(), "Player two joined the wrong game.");

        	return tictactoe.joinGame(game_id, {from: accounts[2]});
        }).then((result) => {
        	// assert that there is no event of a player that joined
        	eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
        	assert.isTrue(eventArgs === false);
        });
    });

    xit("should let the players make moves", () => {
        var tictactoe;
        var game_id;
        return TicTacToe.deployed().then((instance) => {
    	    tictactoe = instance;

    	    return tictactoe.newGame();
        }).then((result) => {
        	eventArgs = getEventArgs(result, GAME_CREATED_EVENT);
        	game_id = eventArgs.gameId;

        	return tictactoe.joinGame(game_id, {from: accounts[0]});
        }).then((result) => {
        	return tictactoe.joinGame(game_id, {from: accounts[1]});
        }).then((result) => {
        	return tictactoe.makeMove(game_id, 0, 0, {from: accounts[0]});
        }).then((result) => {
        	eventArgs = getEventArgs(result, PLAYER_MADE_MOVE_EVENT);
        	assert.isTrue(eventArgs !== false, "Player did not make a move.");
        	assert.equal(accounts[0], eventArgs.player, "The wrong player joined the game.");
        	assert.equal(game_id.valueOf(), eventArgs.gameId.valueOf(), "Player made move in the wrong game.");
        	assert.equal(0, eventArgs.xCoord.valueOf(), "Player made move in another cell.");
        	assert.equal(0, eventArgs.yCoord.valueOf(), "Player made move in another cell.");

        	return tictactoe.makeMove(game_id, 1, 1, {from: accounts[1]});
        }).then((result) => {
        	eventArgs = getEventArgs(result, PLAYER_MADE_MOVE_EVENT);
        	assert.isTrue(eventArgs !== false, "Player did not make a move.");
        	assert.equal(accounts[1], eventArgs.player, "The wrong player joined the game.");
        	assert.equal(game_id.valueOf(), eventArgs.gameId.valueOf(), "Player made move in the wrong game.");
        	assert.equal(1, eventArgs.xCoord.valueOf(), "Player made move in another cell.");
        	assert.equal(1, eventArgs.yCoord.valueOf(), "Player made move in another cell.");

        	return tictactoe.makeMove(game_id, 0, 1, {from: accounts[0]});
        }).then((result) => {
        	eventArgs = getEventArgs(result, PLAYER_MADE_MOVE_EVENT);
        	assert.isTrue(eventArgs !== false, "Player did not make a move.");
        	assert.equal(accounts[0], eventArgs.player, "The wrong player joined the game.");
        	assert.equal(game_id.valueOf(), eventArgs.gameId.valueOf(), "Player made move in the wrong game.");
        	assert.equal(0, eventArgs.xCoord.valueOf(), "Player made move in another cell.");
        	assert.equal(1, eventArgs.yCoord.valueOf(), "Player made move in another cell.");

        	return tictactoe.makeMove(game_id, 1, 2, {from: accounts[1]});
        }).then((result) => {
        	eventArgs = getEventArgs(result, PLAYER_MADE_MOVE_EVENT);
        	assert.isTrue(eventArgs !== false, "Player did not make a move.");
        	assert.equal(accounts[1], eventArgs.player, "The wrong player joined the game.");
        	assert.equal(game_id.valueOf(), eventArgs.gameId.valueOf(), "Player made move in the wrong game.");
        	assert.equal(1, eventArgs.xCoord.valueOf(), "Player made move in another cell.");
        	assert.equal(2, eventArgs.yCoord.valueOf(), "Player made move in another cell.");

        	return tictactoe.makeMove(game_id, 0, 2, {from: accounts[0]});
        }).then((result) => {
        	eventArgs = getEventArgs(result, GAME_OVER_EVENT);
        	assert.isTrue(eventArgs !== false, "Game is not over.");
        	assert.equal(1, eventArgs.winner, "The wrong player won the game (or draw).");
        	assert.equal(game_id.valueOf(), eventArgs.gameId.valueOf(), "Player won the wrong game.");
        });
    });

    xit("should not let the same player make two moves in a row", () => {
        var tictactoe;
        var game_id;
        return TicTacToe.deployed().then((instance) => {
    	    tictactoe = instance;

    	    return tictactoe.newGame();
        }).then((result) => {
        	eventArgs = getEventArgs(result, GAME_CREATED_EVENT);
        	game_id = eventArgs.gameId;

        	return tictactoe.joinGame(game_id, {from: accounts[0]});
        }).then((result) => {
        	return tictactoe.joinGame(game_id, {from: accounts[1]});
        }).then((result) => {
        	return tictactoe.makeMove(game_id, 0, 0, {from: accounts[0]});
        }).then((result) => {
        	return tictactoe.makeMove(game_id, 0, 1, {from: accounts[1]});
        }).then((result) => {
        	return tictactoe.makeMove(game_id, 0, 2, {from: accounts[1]});
        }).then((result) => {
        	// assert that there is no event of a player that made a move
        	eventArgs = getEventArgs(result, PLAYER_MADE_MOVE_EVENT);
        	assert.isTrue(eventArgs === false);
        });
    });

    xit("should not let a player make a move at already filled coordinates", () => {
        var tictactoe;
        var game_id;
        return TicTacToe.deployed().then((instance) => {
    	    tictactoe = instance;

    	    return tictactoe.newGame();
        }).then((result) => {
        	eventArgs = getEventArgs(result, GAME_CREATED_EVENT);
        	game_id = eventArgs.gameId;

        	return tictactoe.joinGame(game_id, {from: accounts[0]});
        }).then((result) => {
        	return tictactoe.joinGame(game_id, {from: accounts[1]});
        }).then((result) => {
        	return tictactoe.makeMove(game_id, 0, 0, {from: accounts[0]});
        }).then((result) => {
        	return tictactoe.makeMove(game_id, 0, 1, {from: accounts[1]});
        }).then((result) => {
        	return tictactoe.makeMove(game_id, 0, 1, {from: accounts[0]});
        }).then((result) => {
        	// assert that there is no event of a player that made a move
        	eventArgs = getEventArgs(result, PLAYER_MADE_MOVE_EVENT);
        	assert.isTrue(eventArgs === false);
        });
    });
});
