pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// SPDX-License-Identifier: Unlicensed

interface IUniswapV2Router01 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}

interface IUniswapV2Router02 is IUniswapV2Router01 {
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountETH);
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountETH);

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}

interface IPegSwap {
    function swap(uint256 amount, address source, address target) external;
}

contract DangerMoonTrigger {

    using SafeMath for uint256;

    IUniswapV2Router02 public uniswapV2Router;
    address public dangermoonAddress = 0x90c7e271F8307E64d9A1bd86eF30961e5e1031e7;
    address public uniswapV2RouterAddress = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    address public linkAddress = 0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD;
    address public oracleLinkAddress = 0x404460C6A5EdE2D891e8297795264fDe62ADBB75;
    address public pegSwapAddress = 0x1FCc3B22955e76Ca48bF025f1A6993685975Bb9e;

    constructor() {

        IUniswapV2Router02 _uniswapV2Router = IUniswapV2Router02(uniswapV2RouterAddress);
        uniswapV2Router = _uniswapV2Router;

        // approve link spends once
        IERC20(linkAddress).approve(pegSwapAddress, type(uint256).max);
    }

    receive() external payable {
        triggerDangermoonPayout();
    }

    function triggerDangermoonPayout() payable public {

        // save some for gas
        uint256 valueToSwap = msg.value.sub(5000000000000000).add(address(this).balance);

        // swap BNB into link on pcs
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = linkAddress;
        uniswapV2Router.swapExactETHForTokens{value:valueToSwap}(
            0, // accept any amount of LINK
            path,
            address(this),
            block.timestamp
        );

        // swap link into pegswap link
        uint256 linkAmount = IERC20(linkAddress).balanceOf(address(this));
        if (linkAmount > 200000000000000000) {
            IPegSwap(pegSwapAddress).swap(linkAmount, linkAddress, oracleLinkAddress);
        }

        // send 0.2 oracle link to dangermoon contract
        if (IERC20(oracleLinkAddress).balanceOf(address(this)) > 200000000000000000) {
            IERC20(oracleLinkAddress).transfer(
                dangermoonAddress,
                200000000000000000
            );
        }
    }

}
