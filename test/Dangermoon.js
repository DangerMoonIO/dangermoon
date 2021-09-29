const CONFIG = require('../hardhat.config.js');
const { MNEMONIC } = require('../secrets.json');
const { ethers } = require("hardhat");
const { expect } = require("chai");

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
const dangermoonDecimals = 9;
let owner, a, b, c, d, marketing, charity, testWallet;
let halfTotalTokenSupply

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

describe("DangerMoon", function () {
  beforeEach(async () => {
    [owner, a, b, c, d, marketing, charity] = await ethers.getSigners();

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
    halfTotalTokenSupply = (await dangermoon.totalSupply()).div(2).toString();
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
  });

  // it("should have put half the tokens in 0xdead", async () => {
  //   expect(await dangermoon.balanceOf(DEAD)).to.equal(halfTotalTokenSupply);
  // });


  it("should cap you at 100 entries, and distribute entries to 3 addresses properly", async () => {
    await testWallet.signTransaction({
      to: c.address,
      value: ethers.utils.parseEther("0.0000001")
    });
    await uniswapContract.swapETHForExactTokens(
      "100000000000000000001",
      [WETH_ADDRESS, dangermoon.address],
      c.address,
      Math.floor(Date.now() / 1000),
      {
        value: ethers.utils.parseEther("0.00000001"),
        gasPrice: 100000
      }
    );
    // This also tests the swapTokensForEth function 2x
    for (let i = 0; i < 500; i++) {
      await dangermoon.connect(c).transfer(DEAD, "100000000000000000");
    }
    expect(await dangermoon.totalReflectionEntries()).to.equal(617);
    // 1 from initial buy
    expect(await dangermoon.numberOfReflectionEntries(a.address)).to.equal(1);
    // 1 from initial buy
    expect(await dangermoon.numberOfReflectionEntries(b.address)).to.equal(1);
    // 1 from initial buy + 99 from all the burns
    expect(await dangermoon.numberOfReflectionEntries(c.address)).to.equal(100);
    // 500 from donations, plus 6 from the "1% entries go to burn" feature
    expect(await dangermoon.numberOfReflectionEntries(DEAD)).to.equal(506);
    // 6 from the "1% entries go to burn" feature
    expect(await dangermoon.numberOfReflectionEntries(charity.address)).to.equal(6);
    // 3 from the "0.5% entries go to burn" feature
    expect(await dangermoon.numberOfReflectionEntries(marketing.address)).to.equal(3);
  });


  it("should grant sender 1 entry in reflection system when they send to marketing", async () => {
    await expect(dangermoon.connect(c).transfer(marketing.address, "100000000000000000"))
      .to.emit(dangermoon, "AddedReflectionEntry")
      .withArgs(c.address);
  });
  it("should still let sender win when they send to marketing", async () => {
    await dangermoon.connect(c).transfer(marketing.address, "100000000000000000");
    expect(await dangermoon.numberOfReflectionEntries(c.address)).to.equal(2);
  });
  it("should grant marketing address an entry in reflection system when someone sends to marketing", async () => {
    await dangermoon.connect(c).transfer(marketing.address, "100000000000000000");
    expect(await dangermoon.numberOfReflectionEntries(marketing.address)).to.equal(1);
  });
  it("should let marketing address spend without losing chance to win", async () => {
    await dangermoon.connect(c).transfer(marketing.address, "100000000000000000");
    await dangermoon.connect(marketing).transfer(d.address, "1");
    expect(await dangermoon.numberOfReflectionEntries(marketing.address)).to.equal(1);
  });


  it("should grant sender 1 entries in reflection system when they send to charity", async () => {
    await expect(dangermoon.connect(c).transfer(charity.address, "100000000000000000"))
      .to.emit(dangermoon, "AddedReflectionEntry")
      .withArgs(c.address);
  });
  it("should still let sender win when they send to charity", async () => {
    await dangermoon.connect(c).transfer(charity.address, "100000000000000000");
    expect(await dangermoon.numberOfReflectionEntries(c.address)).to.equal(2);
  });
  it("should grant charity address an entry in reflection system when someone sends to charity", async () => {
    await dangermoon.connect(c).transfer(charity.address, "100000000000000000");
    expect(await dangermoon.numberOfReflectionEntries(charity.address)).to.equal(1);
  });
  it("should let charity address spend without losing chance to win", async () => {
    await dangermoon.connect(c).transfer(charity.address, "100000000000000000");
    await dangermoon.connect(charity).transfer(d.address, "1");
    expect(await dangermoon.numberOfReflectionEntries(charity.address)).to.equal(1);
  });


  it("should grant sender 2 entries in reflection system when they burn", async () => {
    await expect(dangermoon.connect(c).transfer(DEAD, "100000000000000000"))
      .to.emit(dangermoon, "AddedReflectionEntry")
      .withArgs(c.address);
  });
  it("should still let sender win when they burn", async () => {
    await dangermoon.connect(c).transfer(DEAD, "100000000000000000");
    expect(await dangermoon.numberOfReflectionEntries(c.address)).to.equal(3);
  });
  it("should grant burn address an entry in reflection system when someones burns", async () => {
    await dangermoon.connect(c).transfer(DEAD, "100000000000000000");
    expect(await dangermoon.numberOfReflectionEntries(DEAD)).to.equal(1);
  });


  // it("should return how many entries an address has when numberOfReflectionEntries is called", async () => {
  //   await dangermoon.connect(c).transfer(DEAD, "100000000000000000");
  //   expect(await dangermoon.numberOfReflectionEntries(DEAD)).to.equal(1);
  // });

  it("should have put the other half of tokens in owner address. Owner burns this on real deploy.", async () => {
    expect(await dangermoon.balanceOf(owner.address)).to.equal(halfTotalTokenSupply);
  });
  it("should have let a b c buy from uniswap pool", async () => {
    // await logAllBalances("before buy from uniswap pool");
    await expectAllBalances({
      "_totalReflected": "0",
      "_currentReflection": "16666666666666665",
      "_dead": "0",
      "_owner": "500000000000000000000000",
      "_a": "100000000000000001",
      "_b": "100000000000000001",
      "_c": "100000000000000001"
    });
  });
  it("should distribute reflection randomly when fulfillRandomness is called", async () => {
    // Ensure that chainlink's response triggers a reflection distribution
    const psuedoRandomOracleResponse = Math.floor(Math.random() * 10**10);
    const requestId = ethers.utils.formatBytes32String("42");
    await expect(dangermoon._fulfillRandomness(requestId, psuedoRandomOracleResponse))
      .to.emit(dangermoon, 'ReflectionRecipient');

    // await logAllBalances("after fulfillRandomness");
    // await expectAllBalances({
    //   "_totalReflected": "15000000000",
    //   "_currentReflection": "0",
    //   "_dead": "0",
    //   "_owner": "500000000000000000000000",
    //   "_a": "90000000000",
    //   "_b": "90000000000",
    //   "_c": "105000000000" // recieved distribution
    // });
  });
  it("should emit HaveFunStayingPoor when someones a paperhanded bitch", async () => {

    // Simulate paperhanded bitches (this transfer same as selling back to uniswap)
    await dangermoon.connect(a).transfer(d.address, "1");
    await dangermoon.connect(b).transfer(d.address, "1");
    await dangermoon.connect(c).transfer(d.address, "1");

    // Ensure that chainlink's response triggers a HFSP event
    const psuedoRandomOracleResponse = Math.floor(Math.random() * 10**10);
    const requestId = ethers.utils.formatBytes32String("42");
    await expect(dangermoon._fulfillRandomness(requestId, psuedoRandomOracleResponse))
      .to.emit(dangermoon, 'HaveFunStayingPoor');
  });
  it("should swapAndLiquify 5% liquidity fees into liquidity pool", async () => {
    /**
      Need to get contractTokenBalance >= numTokensSellToAddToLiquidity
      so that entails sending more than (5**5 * 10**6 * 10**9) to the contract
    */
    await dangermoon.connect(owner).transfer(dangermoon.address, "3125000000000000001");

    // Ensure c's buy triggers swapAndLiquify
    await expect(dangermoon.connect(owner).transfer(c.address, 1))
      .to.emit(dangermoon, 'SwapAndLiquify');
  });
  it("should sell to uniswap without adding a reflection entry", async () => {

    // await logAllBalances("before selling to uniswap");

    await dangermoon.connect(owner).approve(UNISWAP_ROUTER, "100000000000000000")

    // Ensure cs's sell to uniswap doesnt give uniswap a reflection entry
    await expect(uniswapContract.swapExactTokensForETHSupportingFeeOnTransferTokens(
        "100000000000000000",
        0, // ignore slippage
        [dangermoon.address, WETH_ADDRESS],
        owner.address,
        Math.floor(Date.now() / 1000),
        { gasPrice: 100000 }
    ))
    .to.not.emit(dangermoon, "AddedReflectionEntry");

    // await logAllBalances("after selling to uniswap");

  });
  /**
    NOTE This test takes the longest, and for some reason it fails if it is not the last test
  */
  it("should requestRandomness from chainlink once link is deposited", async () => {
    // Send in faucet link to test requestRandomness
    linkContract = new ethers.Contract(LINK_ADDRESS, LINK_ABI_FRAGMENT, owner);
    await linkContract.connect(owner).transfer(
      dangermoon.address,
      ethers.utils.parseUnits('0.2', LINK_DECIMALS),
      { gasPrice: 6000000000 }
    );

    // Ensure wallet has faucet link:
    // console.log("Link Balance: ", (await dangermoon.linkBalance()).toString());

    // Give c some more money to go buy dangermoon to trigger requestRandomness
    await testWallet.signTransaction({
      to: c.address,
      value: ethers.utils.parseEther("0.0000001")
    });

    // Ensure c's buy requests a random number from chainlink
    await expect(uniswapContract.swapETHForExactTokens(
      100 * 10**9,
      [WETH_ADDRESS, dangermoon.address],
      c.address,
      Math.floor(Date.now() / 1000),
      {
        value: ethers.utils.parseEther("0.00000001"),
        gasPrice: 100000
      }
    ))
    .to.emit(dangermoon, 'RequestedRandomness');
  });
});
