pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

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
    // GameJoined signals that `player` joined the game with the id `gameId` at x, y
    event GameJoined(uint256 gameId, address player, uint8 xCoord, uint8 yCoord);

    event UpgradedAttackRange(uint256 gameId, address player, uint8 range);

    event EnergyGranted(uint256 gameId, address player, uint8 x, uint8 y, uint8 targetX, uint8 targetY);

    event HitpointGranted(uint256 gameId, address player, uint8 x, uint8 y, uint8 targetX, uint8 targetY);

    event PlayerMoved(uint256 gameId, address player, uint8 x, uint8 y, uint8 targetX, uint8 targetY);
    // // PlayerMadeMove signals that `player` moved to `xCoord`, `yCoord`.
    // event PlayerMadeMove(uint256 gameId, address player, uint8 xCoord, uint8 yCoord);
    // // GameOver signals that the game with the id `gameId` is over.
    // event GameOver(uint256 gameId, Winners winner);

    struct Piece {
      address owner;   // the only address that can manage this piece
      uint256 lastClaim;
      uint8 votes;     // 3 votes = piece gets 1 energy
      uint8 energy;    // default 1, required to perform any action
      uint8 range;     // default 2, max 5
      uint8 hitpoints; // default 3, dead when == 0
    }

    struct Game {
      uint256 mustJoinByBlock;
      uint256 prizePool;
      uint8 numDead;
      uint8 numPlayers;
      uint8 playerLimit;
      uint8 width;
      uint8 height;
      uint8 entryFeePercent;  // cost of entry as % of dangermoon's daily entry
      uint8 energyFeePercent; // cost of energy as % of dangermoon's daily entry
      Piece[20][20] board;
    }

    // games stores all the games, including finished and still-running ones
    // It is possible to iterate over all games by going from `0` to `games.length`.
    Game[] public games;
    // dangermoon address (for transfers, reading the current $10 value, etc)
    IDangerMoon public dangermoon;
    // determines number of blocks per in-game turn
    uint16 public blocksPerRound;
    // improves randomness in testing
    uint256 private randomSeed = 0;
    // dangermoon team's cut of prize pool
    uint8 public takeFeePercent = 10;
    // lets the team lock this game contract and migrate to new version
    bool public lockNewGame = false;

    constructor(address _dangermoonAddress, uint16 _blocksPerRound) public {
      dangermoon = IDangerMoon(_dangermoonAddress);
      blocksPerRound = _blocksPerRound; // 1200 blocks is about 1 hour on BSC
    }

    function random(uint256 seed) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(seed, block.difficulty, block.timestamp, block.number)));
    }

    function sqrt(uint8 y) internal pure returns (uint8 z) {
        if (y > 3) {
            z = y;
            uint8 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function setLockNewGame(bool _lockNewGame) public onlyOwner() {
        lockNewGame = _lockNewGame;
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

    function getNumGames() public view returns (uint256) {
        return games.length;
    }

    function getGameBoard(uint256 gameId) public view returns (Piece[20][20] memory) {
        return games[gameId].board;
    }

    // TODO ensure we always stay within width/height

    function createGame(uint8 playerLimit) public returns (uint256 gameId) {
        // TODO think about board size & player limits
        // sqrt(20*3) =~ 7
        // sqrt(200*3) =~ 25
        require(playerLimit >= 2, "Player limit too low"); // TODO set minPlayers
        require(playerLimit <= 20, "Player limit too high");
        require(!lockNewGame, "Cant create a new game right now");

        games.push();
        uint256 newIndex = games.length - 1;
        games[newIndex].entryFeePercent = 100;
        games[newIndex].energyFeePercent = 10;
        games[newIndex].mustJoinByBlock = block.number.add(blocksPerRound);
        games[newIndex].playerLimit = playerLimit;
        games[newIndex].width = sqrt(playerLimit * 4);
        games[newIndex].height = sqrt(playerLimit * 3);

        // Make payment from player to game contract
        uint256 tenUsdWorth = dangermoon._minimumTokensForReflection();
        uint256 entryFee = tenUsdWorth.mul(games[newIndex].entryFeePercent).div(10**2);
        uint256 allowance = dangermoon.allowance(msg.sender, address(this));
        require(allowance >= entryFee, "Need DangerMoon transfer approval.");
        dangermoon.transferFrom(msg.sender, address(this), entryFee);
        games[newIndex].prizePool = games[newIndex].prizePool.add(entryFee);

        GameCreated(newIndex, msg.sender, playerLimit, games[newIndex].width, games[newIndex].height);

        return newIndex;
    }

    function joinGame(uint256 gameId) public returns (uint8 x, uint8 y) {

        // CHECKS
        Game storage game = games[gameId];
        require(gameId < games.length, "No such game exists.");
        require(game.numPlayers <= game.playerLimit, "Game is full.");
        require(block.number < game.mustJoinByBlock, "Too late to join game.");

        // EFFECTS
        // Make payment from player to game contract
        uint256 tenUsdWorth = dangermoon._minimumTokensForReflection();
        uint256 entryFee = tenUsdWorth.mul(game.entryFeePercent).div(10**2);
        uint256 allowance = dangermoon.allowance(msg.sender, address(this));
        require(allowance >= entryFee, "Need DangerMoon transfer approval.");
        dangermoon.transferFrom(msg.sender, address(this), entryFee);
        game.prizePool = game.prizePool.add(entryFee);

        // Generate board piece
        Piece memory piece;
        piece.owner = msg.sender;
        piece.lastClaim = block.number;
        piece.energy = 1;
        piece.range = 2;
        piece.hitpoints = 3;

        // Add piece to game by selecting random open square
        do {
          x = uint8(random(randomSeed++).mod(game.width));
          y = uint8(random(randomSeed++).mod(game.height));
        } while (game.board[x][y].lastClaim != 0);
        game.board[x][y] = piece;
        game.numPlayers += 1;

        emit GameJoined(gameId, msg.sender, x, y);

        console.log("x");
        console.log(x);
        console.log("y");
        console.log(y);
    }

    function claimEnergy(uint256 gameId, uint8 x, uint8 y) public {

        // CHECKS
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        require(gameId < games.length, "No such game exists.");
        require(x < game.width && y < game.height, "Coordinates not on board.");
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.lastClaim.add(blocksPerRound) < block.number, "Cant claim yet");

        // EFFECTS
        // Make payment from player to game contract
        uint256 tenUsdWorth = dangermoon._minimumTokensForReflection();
        uint256 energyFee = tenUsdWorth.mul(game.energyFeePercent).div(10**2);
        uint256 allowance = dangermoon.allowance(msg.sender, address(this));
        require(allowance >= energyFee, "Need DangerMoon transfer approval.");
        dangermoon.transferFrom(msg.sender, address(this), energyFee);
        game.prizePool =  game.prizePool.add(energyFee);

        // Grant energy and update claim time
        piece.energy += 1;
        piece.lastClaim = block.number;
    }

    function upgradeAttackRange(uint256 gameId, uint8 x, uint8 y) public {

        // CHECKS
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        require(gameId < games.length, "No such game exists.");
        require(x < game.width && y < game.height, "Coordinates not on board.");
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.energy >= 1, "Not enough energy.");
        require(piece.range < 5, "Cant upgrade range");

        // EFFECTS
        // Spend energy
        piece.energy -= 1;
        // Buff range
        piece.range += 1;

        emit UpgradedAttackRange(gameId, msg.sender, piece.range);
    }

    function grantEnergy(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(gameId < games.length, "No such game exists.");
        require(x < game.width && y < game.height, "Coordinates not on board.");
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.energy >= 1, "Not enough energy.");
        require(piece.hitpoints != 0, "Piece is dead");
        require(target.lastClaim != 0, "Target does not exist");
        require(_withinRange(piece.range, x, y, targetX, targetY), "Target not within range");

        // EFFECTS
        // Reallocate 1 energy to the piece on targetX,targetY
        piece.energy -= 1;
        target.energy += 1;

        emit EnergyGranted(gameId, msg.sender, x, y, targetX, targetY);
    }

    function grantHitpoint(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(gameId < games.length, "No such game exists.");
        require(x < game.width && y < game.height, "Coordinates not on board.");
        require(targetX < game.width && targetY < game.height, "Coordinates not on board.");
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.energy >= 1, "Not enough energy.");
        require(piece.hitpoints != 0, "You are dead");
        require(target.lastClaim != 0, "Target does not exist");
        require(piece.hitpoints >= 1, "Not enough hp.");
        require(_withinRange(piece.range, x, y, targetX, targetY), "Target not within range");

        // EFFECTS
        // Keep track of numDead if target is being revived
        if (target.hitpoints == 0) {
            game.numDead -= 1;
        }
        // Spend energy
        piece.energy -= 1;
        // Reallocate 1 hitpoint from sender to the piece on targetX,targetY
        piece.hitpoints -= 1;
        target.hitpoints += 1;

        emit HitpointGranted(gameId, msg.sender, x, y, targetX, targetY);
    }

    function move(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(gameId < games.length, "No such game exists.");
        require(x < game.width && y < game.height, "Coordinates not on board.");
        require(targetX < game.width && targetY < game.height, "Coordinates not on board.");
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.hitpoints != 0, "You are dead");
        require(piece.energy >= 1, "Not enough energy.");
        require(target.lastClaim == 0, "Target square not empty.");
        require(
          (_distance(x, targetX) <= 1) && // x must be within range
          (_distance(y, targetY) <= 1) && // y must be within range
          (x != targetX || y != targetY), // x or y position needs to change
          "Invalid destination"
        );

        // EFFECTS
        // Spend energy
        piece.energy -= 1;
        // Game storage piece = games[gameId].board[x][y];
        game.board[targetX][targetY] = piece; // TODO check
        delete games[gameId].board[x][y];

        emit PlayerMoved(gameId, msg.sender, x, y, targetX, targetY);
    }

    function attack(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(gameId < games.length, "No such game exists.");
        require(x < game.width && y < game.height, "Coordinates not on board.");
        require(targetX < game.width && targetY < game.height, "Coordinates not on board.");
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.hitpoints != 0, "You are dead");
        require(target.hitpoints != 0, "Target is dead");
        require(piece.energy >= 1, "Not enough energy.");
        require(_withinRange(piece.range, x, y, targetX, targetY), "Target not within range");

        // EFFECTS
        // Spend energy
        piece.energy -= 1;
        // Deduct 1 hitpoint from piece on targetX,targetY
        target.hitpoints -= 1;
        // Keep track of numDead if target has been killed
        if (target.hitpoints == 0) {
            game.numDead += 1;
        }
    }

    function juryVote(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(gameId < games.length, "No such game exists.");
        require(x < game.width && y < game.height, "Coordinates not on board.");
        require(targetX < game.width && targetY < game.height, "Coordinates not on board.");
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.hitpoints == 0, "You are alive");
        require(target.hitpoints != 0, "Target is dead");
        require(piece.energy >= 1, "Not enough energy.");

        // EFFECTS
        // Spend energy
        piece.energy -= 1;
        // Keep track of target's votes
        target.votes += 1;
        // When target has 3+ votes, they lose 3 votes and get 1 energy
        if (target.votes >= 3) {
            target.votes -= 3;
            target.energy += 1;
        }
    }

    function claimWinnings(uint256 gameId, uint8 x, uint8 y) public {

        // CHECKS
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        require(gameId < games.length, "No such game exists.");
        require(x < game.width && y < game.height, "Coordinates not on board.");
        require(piece.owner == msg.sender, "You do not own this piece.");
        require(piece.hitpoints != 0, "You are dead");
        require(game.numDead == game.numPlayers - 1, "Game not over yet.");

        // EFFECTS
        uint256 takeFee = game.prizePool.mul(takeFeePercent).div(10**2);
        dangermoon.transfer(owner(), takeFee);
        dangermoon.transfer(msg.sender, game.prizePool.sub(takeFee));
        game.prizePool = 0;
    }

    function _withinRange(uint8 range, uint8 x, uint8 y, uint8 targetX, uint8 targetY) private pure returns (bool) {
        bool inRangeX = _distance(x, targetX) <= range;
        bool inRangeY = _distance(y, targetY) <= range;
        return (inRangeX && inRangeY);
    }

    function _distance(uint8 a, uint8 b) private pure returns (uint8) {
        if (a > b) {
            return a - b;
        }
        return b - a;
    }

}
