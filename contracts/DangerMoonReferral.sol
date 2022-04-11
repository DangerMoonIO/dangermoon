// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.6.12;

import '@chainlink/contracts/src/v0.6/VRFConsumerBase.sol';

interface IERC20 {

    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
contract Ownable is Context {
    address payable private _owner;
    address payable private _previousOwner;
    uint256 private _lockTime;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        address msgSender = _msgSender();
        _owner = payable(msgSender);
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

     /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address payable newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function geUnlockTime() public view returns (uint256) {
        return _lockTime;
    }

    // Locks the contract for owner for the amount of time provided
    function lock(uint256 time) public virtual onlyOwner {
        _previousOwner = _owner;
        _owner = address(0);
        _lockTime = now + time;
        emit OwnershipTransferred(_owner, address(0));
    }

    // Unlocks the contract for owner when _lockTime is exceeds
    function unlock() public virtual {
        require(_previousOwner == msg.sender, "You don't have permission to unlock");
        require(now > _lockTime , "Contract is locked until 7 days");
        emit OwnershipTransferred(_owner, _previousOwner);
        _owner = _previousOwner;
    }
}

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

interface IDangerMoon is IERC20 {
    function lockThePayout() external returns (bool);
    function _minimumTokensForReflection() external returns (uint256);
    function currentReflection() external view returns (uint256);
}

contract DangerMoonReferral is Ownable, VRFConsumerBase {

    address public constant linkAddress = 0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD;
    address public constant vrfCoordinator = 0x747973a5A2a4Ae1D3a8fDF5479f1514F65Db9C31;
    address public constant pegSwapAddress = 0x1FCc3B22955e76Ca48bF025f1A6993685975Bb9e;
    address public constant dangermoonAddress = 0x90c7e271F8307E64d9A1bd86eF30961e5e1031e7;
    address public constant oracleLinkAddress = 0x404460C6A5EdE2D891e8297795264fDe62ADBB75;
    address public constant uniswapV2RouterAddress = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    IERC20 public constant link = IERC20(linkAddress);
    IERC20 public constant oracleLink = IERC20(oracleLinkAddress);
    IPegSwap public constant pegswap = IPegSwap(pegSwapAddress);
    IDangerMoon public constant dangermoon = IDangerMoon(dangermoonAddress);
    IUniswapV2Router02 public constant uniswapV2Router = IUniswapV2Router02(uniswapV2RouterAddress);

    uint256 public commission = 0.01 * 10**18; // 0.01 BNB
    uint8 public maxBuysPerTx = 10;
    bytes32 internal constant keyHash = 0xc251acd21ec4fb7f31bb8868288bfdbaeb4fbfec2df3735ddbd4f7dc8d60103c;
    uint256 public constant linkFee = 0.2 * 10**18; // 0.2 LINK
    uint256 drawing = 0;
    address[] public referrers;
    mapping (address => mapping (uint256 => uint256)) private numEntries;

    event RandomnessFulfilled(uint256 time, address referrer, uint256 amount);

    constructor() VRFConsumerBase(vrfCoordinator, oracleLinkAddress) public {
        // approve link spends once
        link.approve(pegSwapAddress, type(uint256).max);
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawDangerMoon() public onlyOwner {
        dangermoon.transfer(
          payable(owner()),
          dangermoon.balanceOf(address(this))
        );
    }

    function withdrawOracleLink() public onlyOwner {
        oracleLink.transfer(
          payable(owner()),
          oracleLink.balanceOf(address(this))
        );
    }

    function setMaxBuysPerTx(uint8 _maxBuysPerTx) public onlyOwner {
        maxBuysPerTx = _maxBuysPerTx;
    }

    function setCommission(uint256 _commission) public onlyOwner {
        commission = _commission;
    }

    function getPrize() public view returns (uint256) {
        return dangermoon.balanceOf(address(this)).div(2);
    }

    function getNumEntries(address user) public view returns (uint256, uint256) {
        return (numEntries[user][drawing], referrers.length);
    }

    function fulfillRandomness(bytes32, uint256 randomness) internal override {
        address winner = referrers[randomness.mod(referrers.length)];
        uint256 amount = getPrize();
        emit RandomnessFulfilled(now, winner, amount);
        dangermoon.transfer(payable(winner), amount);
        delete referrers;
        drawing += 1;
    }

    function requestVrfRandomness() public onlyOwner {
        require(oracleLink.balanceOf(address(this)) > linkFee, "Need link");
        requestRandomness(keyHash, linkFee, uint256(keccak256(abi.encodePacked(now))));
    }

    function swapBnbIntoLink() payable public onlyOwner {

        // swap BNB into link on pcs
        address[] memory bnbLinkPath = new address[](2);
        bnbLinkPath[0] = uniswapV2Router.WETH();
        bnbLinkPath[1] = linkAddress;
        uniswapV2Router.swapExactETHForTokens{value:msg.value}(
            linkFee,
            bnbLinkPath,
            address(this),
            block.timestamp
        );

        // swap link into pegswap link
        pegswap.swap(
          link.balanceOf(address(this)),
          linkAddress,
          oracleLinkAddress
        );
    }

    receive() external payable {
        dangerMoonReferralBuy(maxBuysPerTx, owner());
    }

    function dangerMoonReferralBuy(uint8 numBuys, address referrer) payable public {
        // user pays in multiples of minimum-entry-price PLUS the commissions

        require(msg.sender != referrer);
        require(numBuys <= maxBuysPerTx, "Use fewer buys, too many for blocksize");
        require(msg.value > commission, "Not enough BNB sent");

        // take commissions, and divide remaining into evenly sized buys
        uint256 valueToSwap = msg.value.sub(commission).div(numBuys);

        // determine dangermoon amount needed for caller to get entries
        // prevents bots frontrunning this contract
        uint256 amountOutMin = dangermoon._minimumTokensForReflection().div(10).mul(9);

        // swap BNB into dangermoon multiple times via pcs
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = dangermoonAddress;
        for (uint i=0; i<numBuys; i++) {
          uniswapV2Router.swapExactETHForTokensSupportingFeeOnTransferTokens{value:valueToSwap}(
              amountOutMin, // this multibuy system is for stacking entries, so we can assume this value here
              path,
              msg.sender, // send directly to minimize tax, & so they get entries
              block.timestamp
          );
          referrers.push(referrer);
          numEntries[referrer][drawing] += 1;
        }

        // pay commission
        payable(owner()).transfer(commission);
    }

}
