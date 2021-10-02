pragma solidity ^0.6.12;

// SPDX-License-Identifier: Unlicensed

// TODO remove
import "hardhat/console.sol";

// DangerMoonBattleground is a solidity implementation of tank tactics.
// You can find the original rules at https://www.reddit.com/r/boardgames/comments/ot1ua2/tank_turn_tactics/

library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
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

interface IDangerMoon is IERC20 {
    function _minimumTokensForReflection() external returns (uint256);
}

contract DangerMoonBattleground is Ownable {

    using SafeMath for uint256;

    // TODO add events
    // GameCreated signals that `creator` created a new game with `gameId`.
    event GameCreated(uint256 gameId, address creator, uint8 playerLimit, uint8 width, uint8 height);
    // // PlayerJoinedGame signals that `player` joined the game with the id `gameId` at x, y
    // event PlayerJoinedGame(uint256 gameId, address player, uint8 xCoord, uint8 yCoord);
    // // PlayerMadeMove signals that `player` moved to `xCoord`, `yCoord`.
    // event PlayerMadeMove(uint256 gameId, address player, uint8 xCoord, uint8 yCoord);
    // // GameOver signals that the game with the id `gameId` is over.
    // event GameOver(uint256 gameId, Winners winner);

    struct Piece {
      address owner;   // only address that can manage this piece
      uint256 lastEnergyClaim;
      uint256 lastVote;
      uint8 juryVotes; // 3 = piece gets an action point
      uint8 energy;    // default 1, required to make moves
      uint8 range;     // default 2, max 5
      uint8 hitpoints; // default 3, dead when == 0
    }

    struct Game {
      uint256 mustJoinByBlock;
      uint256 voteEndBlock;
      uint256 prizePool;
      uint256 numPlayers;
      uint8 width;
      uint8 height;
      uint8 entryFeePercent; // cost of entry as a percent of dangermoon's daily minimum entry
      uint8 energyFeePercent; // cost of energy as a percent of dangermoon's daily minimum entry
      uint8 playerLimit;
      Piece[20][20] board;
      uint8[20][20] votes;
      mapping(address => Piece) dead;
    }

    // games stores all the games, including finished and still-running ones
    // It is possible to iterate over all games by going from `1` to `numGames`.
    mapping(uint256 => Game) public games;
    // dangermoon address (for transfers, reading the current $10 value, etc)
    IDangerMoon public dangermoon;
    // numGames stores the total number of games.
    uint256 public numGames;
    // determines number of blocks per in-game turn
    uint16 public blocksPerRound = 1200 * 24; // 1200 blocks is about 1 hour on BSC
    // dangermoon team's cut of prize pool
    uint8 public takeFeePercent = 10;

    constructor(address _dangermoonAddress) public {
      dangermoon = IDangerMoon(_dangermoonAddress);
    }

    function psuedoRandom() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, block.number)));
    }

    function setTakeFeePercent(uint8 _takeFeePercent) public onlyOwner() {
        takeFeePercent = _takeFeePercent;
    }

    function setBlocksPerRound(uint8 _blocksPerRound) public onlyOwner() {
        blocksPerRound = _blocksPerRound;
    }

    function withdrawDangerMoon(uint256 amount) public onlyOwner() {
        if (amount == 0) {
            amount = dangermoon.balanceOf(address(this));
        }
        if (amount > 0) {
            dangermoon.transfer(owner(), amount);
        }
    }

    // TODO cant loop over entire board for votes...
    function getGameVotes(uint256 gameId) public view returns (uint8[20][20] memory) {
        return games[gameId].votes;
    }

    function getGameBoard(uint256 gameId) public view returns (Piece[20][20] memory) {
        return games[gameId].board;
    }

    function createGame(uint8 playerLimit) public returns (uint256 gameId) {
        // sqrt(20*3) =~ 7
        // sqrt(200*3) =~ 25
        require(playerLimit <= 20, "Player limit too high");

        Game memory game;
        game.entryFeePercent = 100;
        game.energyFeePercent = 10;
        game.mustJoinByBlock = block.number.add(blocksPerRound);
        game.playerLimit = playerLimit;
        game.width = sqrt(playerLimit.mul(3));
        game.height = sqrt(playerLimit.mul(2)); 

        console.log("width");
        console.log(width);
        console.log("height");
        console.log(height);

        numGames = numGames.add(1);
        games[numGames] = game;

        GameCreated(numGames, msg.sender, playerLimit, width, height);

        return numGames;
    }

    function joinGame(uint256 gameId) public returns (uint8 x, uint8 y) {
        // CHECKS
        Game storage game = games[gameId];
        require(0 < gameId && gameId <= numGames, "No such game exists.");
        require(game.numPlayers <= game.playerLimit, "Game is full.");
        require(block.number < game.mustJoinByBlock, "Too late to join game.");

        // EFFECTS
        // Make payment from player to game contract
        uint256 tenUsdWorth = dangermoon._minimumTokensForReflection();
        uint256 entryFee = tenUsdWorth.mul(entryFeePercent).div(10**2);
        uint256 allowance = dangermoon.allowance(msg.sender, address(this));
        require(allowance >= entryFee, "Need DangerMoon transfer approval.");
        dangermoon.transferFrom(msg.sender, address(this), entryFee);
        game.prizePool = game.prizePool.add(entryFee);

        // Generate board piece
        Piece memory piece;
        piece.owner = msg.sender;
        piece.lastEnergyClaim = block.number;
        piece.energy = 1;
        piece.range = 2;
        piece.hitpoints = 3;

        // Add player to game
        game.numPlayers = game.numPlayers.add(1);
        // TODO loop while there is a piece at x,y
        uint8 x = psuedoRandom().mod(game.width);
        uint8 y = psuedoRandom().mod(game.height);
        game.board[x][y] = piece;
    }

    function claimEnergy(uint256 gameId, uint8 x, uint8 y) public {
        // CHECKS
        Game storage game = games[gameId];
        Game storage piece = game.board[x][y];
        require(0 < gameId && gameId <= numGames, "No such game exists.");
        require(x < game.width && y < game.height, "Invalid coordinates.")
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.lastEnergyClaim.add(blocksPerRound) < block.number, "Cant claim yet");
        require(piece.hitpoints !== 0, "Cant claim energy when dead");

        // EFFECTS
        // Make payment from player to game contract
        uint256 tenUsdWorth = dangermoon._minimumTokensForReflection();
        uint256 energyFee = tenUsdWorth.mul(energyFeePercent).div(10**2);
        uint256 allowance = dangermoon.allowance(msg.sender, address(this));
        require(allowance >= energyFee, "Need DangerMoon transfer approval.");
        dangermoon.transferFrom(msg.sender, address(this), energyFee);
        game.prizePool = game.prizePool.add(energyFee);

        piece.energy += 1;
        // TODO decide if this should just get set to block.number to ensure players stay engaged
        piece.lastEnergyClaim = piece.lastEnergyClaim.add(blocksPerRound);
    }

    function upgradeAttackRange(uint256 gameId, uint8 x, uint8 y) public {
        // CHECKS
        Game storage game = games[gameId];
        Game storage piece = game.board[x][y];
        require(0 < gameId && gameId <= numGames, "No such game exists.");
        require(x < game.width && y < game.height, "Invalid coordinates.")
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.energy > 1, "Not enough energy.");

        // EFFECTS
        piece.energy -= 1;
        piece.range += 1;
    }

    function move(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {
        // CHECKS
        Game storage game = games[gameId];
        Game storage piece = game.board[x][y];
        require(0 < gameId && gameId <= numGames, "No such game exists.");
        require(x < game.width && y < game.height, "Invalid coordinates.")
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.energy > 1, "Not enough energy.");
        require(targetX < game.width && targetY < game.height, "Invalid target.")
        require(x-1 <= targetX && targetX <= x+1, "targetX not in range");
        require(y-1 <= targetY && targetY <= y+1, "targetY not in range");

        // EFFECTS
        piece.energy -= 1;
        game.board[targetX][targetY] = piece;
        delete game.board[x][y];
    }

}
