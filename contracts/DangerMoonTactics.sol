pragma solidity ^0.8.0;

// SPDX-License-Identifier: Unlicensed

// import "hardhat/console.sol";

// DangerMoonTactics is a solidity implementation of tank tactics.
// You can find the original rules at https://www.reddit.com/r/boardgames/comments/ot1ua2/tank_turn_tactics/

abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return payable(msg.sender);
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
    constructor () {
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
        _owner = payable(address(0));
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
        _owner = payable(address(0));
        _lockTime = block.timestamp + time;
        emit OwnershipTransferred(_owner, address(0));
    }

    // Unlocks the contract for owner when _lockTime is exceeds
    function unlock() public virtual {
        require(_previousOwner == msg.sender, "You don't have permission to unlock");
        require(block.timestamp > _lockTime , "Contract is locked until 7 days");
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

abstract contract Utils {

    function _random(uint256 seed) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(seed, block.difficulty, block.timestamp, block.number)));
    }

    function _sqrt(uint8 y) internal pure returns (uint8 z) {
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


    function _withinRange(uint8 range, uint8 x, uint8 y, uint8 targetX, uint8 targetY) internal pure returns (bool) {
        bool inRangeX = _distance(x, targetX) <= range;
        bool inRangeY = _distance(y, targetY) <= range;
        return (inRangeX && inRangeY);
    }

    function _distance(uint8 a, uint8 b) internal pure returns (uint8) {
        if (a > b) {
            return a - b;
        }
        return b - a;
    }
}

contract DangerMoonTactics is Ownable, Utils {

    event GameCreated(uint256 indexed gameId, address player, uint8 playerLimit, uint8 width, uint8 height);
    event GameJoined(uint256 indexed gameId, address player, uint8 x, uint8 y);
    event UpgradedAttackRange(uint256 indexed gameId, address player, uint8 range);
    event EnergyGranted(uint256 indexed gameId, address player, uint8 x, uint8 y, uint8 targetX, uint8 targetY);
    event HitpointGranted(uint256 indexed gameId, address player, uint8 x, uint8 y, uint8 targetX, uint8 targetY);
    event PlayerMoved(uint256 indexed gameId, address player, uint8 x, uint8 y, uint8 targetX, uint8 targetY);
    event PlayerAttacked(uint256 indexed gameId, address player, uint8 x, uint8 y, uint8 targetX, uint8 targetY);
    event ClaimedEnergy(uint256 indexed gameId, address player, uint8 x, uint8 y);
    event JuryVoted(uint256 indexed gameId, address player, uint8 x, uint8 y, uint8 targetX, uint8 targetY);
    event WinningsClaimed(uint256 indexed gameId, address player, uint8 x, uint8 y, uint256 winnings);

    struct Piece {
      address owner;   // the only address that can manage this piece
      uint256 lastClaim;
      uint8 votes;     // 3 votes = piece gets 1 energy
      uint8 energy;    // default 0, required to perform any action
      uint8 range;     // default 2, max 4
      uint8 hitpoints; // default 3, dead when == 0
    }

    struct Game {
      uint256 mustJoinByBlock;
      uint256 prizePool;
      uint16 blocksPerRound;  // determines number of seconds per in-game turn
      uint8 numDead;
      uint8 numPlayers;
      uint8 playerLimit;
      uint8 width;
      uint8 height;
      uint8 entryFeePercent;  // cost of entry as % of dangermoon's daily entry
      uint8 energyFeePercent; // cost of energy as % of dangermoon's daily entry
      Piece[10][10] board;
    }

    // dangermoon address (for transfers, reading the current $10 value, etc)
    IDangerMoon public dangermoon;
    // improves randomness
    uint256 private randomSeed = 0;
    // dangermoon team's cut of prize pool
    uint8 public takeFeePercent = 10;
    // lets the team lock this game contract and migrate to new version
    bool public lockNewGame = false;

    // joinedGame prevents players from joining same game more than once
    mapping(address => mapping(uint256 => bool)) joinedGame;

    // playerGames stores the games each player is in. This lets us render the
    // the games players care about in the UI.
    mapping(address => uint256[]) playerGames;

    // games stores all the games, including finished and still-running ones
    // It is possible to iterate over all games by going from `0` to `games.length`.
    Game[] public games;

    constructor(address _dangermoonAddress) {
      dangermoon = IDangerMoon(_dangermoonAddress);
    }

    function setLockNewGame(bool _lockNewGame) public onlyOwner() {
        lockNewGame = _lockNewGame;
    }

    function setTakeFeePercent(uint8 _takeFeePercent) public onlyOwner() {
        takeFeePercent = _takeFeePercent;
    }

    function withdrawDangerMoon(uint256 amount) public onlyOwner() {
        if (amount == 0) {
            amount = dangermoon.balanceOf(address(this));
        }
        if (amount > 0) {
            dangermoon.transfer(owner(), amount);
        }
    }

    function getPlayerGames() public view returns (uint256[] memory) {
        return playerGames[msg.sender];
    }

    function getNumGames() public view returns (uint256) {
        return games.length;
    }

    function getGameBoard(uint256 gameId) public view returns (Piece[10][10] memory) {
        return games[gameId].board;
    }

    function commonChecks(uint256 gameId, uint8 x, uint8 y) private view returns (bool) {
        require(gameId < games.length);
        require(x < games[gameId].width && y < games[gameId].height);
        require(games[gameId].board[x][y].owner == msg.sender);
        return true;
    }

    function canCreateGame() public view returns (bool) {
        require(!lockNewGame);
        return true;
    }

    function createGame(uint8 playerLimit, uint16 _blocksPerRound, uint8 _entryFeePercent, uint8 _energyFeePercent) public returns (uint256 gameId) {

        require(playerLimit >= 2);
        require(playerLimit <= 20);
        require(canCreateGame());

        games.push();
        uint256 newIndex = games.length - 1;
        games[newIndex].entryFeePercent = _entryFeePercent;
        games[newIndex].energyFeePercent = _energyFeePercent;
        games[newIndex].blocksPerRound = _blocksPerRound;
        games[newIndex].mustJoinByBlock = block.number + _blocksPerRound;
        games[newIndex].playerLimit = playerLimit;
        games[newIndex].width = _sqrt(playerLimit * 4);
        games[newIndex].height = _sqrt(playerLimit * 3);

        // Make payment from player to game contract
        uint256 tenUsdWorth = dangermoon._minimumTokensForReflection();
        uint256 allowance = dangermoon.allowance(msg.sender, address(this));
        require(allowance >= tenUsdWorth);
        dangermoon.transferFrom(msg.sender, address(this), tenUsdWorth);
        games[newIndex].prizePool = games[newIndex].prizePool + tenUsdWorth;

        emit GameCreated(newIndex, msg.sender, playerLimit, games[newIndex].width, games[newIndex].height);

        return newIndex;
    }

    function canJoinGame(uint256 gameId) public view returns (bool) {
        Game storage game = games[gameId];
        require(gameId < games.length);
        require(!joinedGame[msg.sender][gameId]);
        require(game.numPlayers <= game.playerLimit);
        require(block.number < game.mustJoinByBlock);
        return true;
    }

    function joinGame(uint256 gameId) public returns (uint8 x, uint8 y) {

        // CHECKS
        require(canJoinGame(gameId));
        Game storage game = games[gameId];

        // EFFECTS
        // Make payment from player to game contract
        uint256 tenUsdWorth = dangermoon._minimumTokensForReflection();
        uint256 entryFee = (tenUsdWorth * game.entryFeePercent) / 10**2;
        uint256 allowance = dangermoon.allowance(msg.sender, address(this));
        require(allowance >= entryFee);
        dangermoon.transferFrom(msg.sender, address(this), entryFee);
        game.prizePool = game.prizePool + entryFee;

        // Track which games player is playing
        playerGames[msg.sender].push(gameId);
        joinedGame[msg.sender][gameId] = true;

        // Generate board piece
        Piece memory piece;
        piece.owner = msg.sender;
        // piece.lastClaim = 0; // implied
        // piece.energy = 0; // implied
        piece.range = 2;
        piece.hitpoints = 3;

        // Add piece to game by selecting random open square
        do {
          x = uint8(_random(randomSeed++) % game.width);
          y = uint8(_random(randomSeed++) % game.height);
        } while (game.board[x][y].owner != address(0));
        game.board[x][y] = piece;
        game.numPlayers += 1;

        emit GameJoined(gameId, msg.sender, x, y);

        // console.log(x);
        // console.log(y);
        // console.log("____");

        return (x, y);
    }

    function canClaimEnergy(uint256 gameId, uint8 x, uint8 y) public view returns (bool) {
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        require(commonChecks(gameId, x, y));
        require(
          // first claim
          piece.lastClaim == 0 ||
          // or been 1 round since claim
          piece.lastClaim + game.blocksPerRound < block.number
        );
        require(
          // game full
          game.numPlayers == game.playerLimit ||
          // or join round over
          block.number > game.mustJoinByBlock
        );
        return true;
    }

    function claimEnergy(uint256 gameId, uint8 x, uint8 y) public {

        // CHECKS
        Game storage game = games[gameId];
        require(canClaimEnergy(gameId, x, y));

        // EFFECTS
        // Make payment from player to game contract
        uint256 tenUsdWorth = dangermoon._minimumTokensForReflection();
        uint256 energyFee = (tenUsdWorth * game.energyFeePercent) / 10**2;
        uint256 allowance = dangermoon.allowance(msg.sender, address(this));
        require(allowance >= energyFee);
        dangermoon.transferFrom(msg.sender, address(this), energyFee);
        game.prizePool =  game.prizePool + energyFee;

        // Grant energy and update claim time
        Piece storage piece = game.board[x][y];
        piece.energy += 1;
        piece.lastClaim = block.number;

        emit ClaimedEnergy(gameId, msg.sender, x, y);
    }

    function canUpgradeAttackRange(uint256 gameId, uint8 x, uint8 y) public view returns (bool) {
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        require(commonChecks(gameId, x, y));
        require(piece.energy >= 1);
        require(piece.range < 4); // "Cant upgrade range"
        return true;
    }

    function upgradeAttackRange(uint256 gameId, uint8 x, uint8 y) public {

        // CHECKS
        require(canUpgradeAttackRange(gameId, x, y));
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];

        // EFFECTS
        // Spend energy
        piece.energy -= 1;
        // Buff range
        piece.range += 1;

        emit UpgradedAttackRange(gameId, msg.sender, piece.range);
    }

    function canGrantEnergy(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public view returns (bool) {
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(commonChecks(gameId, x, y));
        require(piece.energy >= 1);
        require(piece.hitpoints != 0); //, "Piece is dead"
        require(target.owner != address(0)); //, "Target does not exist"
        require(_withinRange(piece.range, x, y, targetX, targetY)); //, "Not in range"
        return true;
    }

    function grantEnergy(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        require(canGrantEnergy(gameId, x, y, targetX, targetY));
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];

        // EFFECTS
        // Reallocate 1 energy to the piece on targetX,targetY
        piece.energy -= 1;
        target.energy += 1;

        emit EnergyGranted(gameId, msg.sender, x, y, targetX, targetY);
    }

    function canGrantHitpoint(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public view returns (bool) {
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(commonChecks(gameId, x, y));
        require(targetX < game.width && targetY < game.height);
        require(piece.energy >= 1);
        require(piece.hitpoints != 0); //, "You are dead"
        require(target.owner != address(0)); //, "Target does not exist"
        require(piece.hitpoints >= 1); //, "Not enough hp"
        require(_withinRange(piece.range, x, y, targetX, targetY)); //, "Not in range"
        return true;
    }

    function grantHitpoint(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        require(canGrantHitpoint(gameId, x, y, targetX, targetY));
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];

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

    function canMove(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public view returns (bool) {
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(commonChecks(gameId, x, y));
        require(targetX < game.width && targetY < game.height);
        require(piece.hitpoints != 0); //, "You are dead"
        require(piece.energy >= 1);
        require(target.owner == address(0)); //, "Target square not empty"
        require(
          (_distance(x, targetX) <= 1) && // x must be within range
          (_distance(y, targetY) <= 1) && // y must be within range
          (x != targetX || y != targetY) // x or y position needs to change
          // "Invalid destination"
        );
        return true;
    }

    function move(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        require(canMove(gameId, x, y, targetX, targetY));
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];

        // EFFECTS
        // Spend energy
        piece.energy -= 1;
        game.board[targetX][targetY] = piece;
        delete games[gameId].board[x][y];

        emit PlayerMoved(gameId, msg.sender, x, y, targetX, targetY);
    }

    function canAttack(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public view returns (bool) {
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(commonChecks(gameId, x, y));
        require(targetX < game.width && targetY < game.height);
        require(piece.hitpoints != 0); //, "You are dead"
        require(target.hitpoints != 0); //, "Target dead"
        require(piece.energy >= 1);
        require(_withinRange(piece.range, x, y, targetX, targetY)); //, "Not in range"
        return true;
    }

    function attack(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        require(canAttack(gameId, x, y, targetX, targetY));
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];

        // EFFECTS
        // Spend energy
        piece.energy -= 1;
        // Deduct 1 hitpoint from piece on targetX,targetY
        target.hitpoints -= 1;
        // Keep track of numDead if target has been killed
        if (target.hitpoints == 0) {
            game.numDead += 1;
        }

        emit PlayerAttacked(gameId, msg.sender, x, y, targetX, targetY);
    }

    function canJuryVote(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public view returns (bool) {
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];
        require(commonChecks(gameId, x, y));
        require(targetX < game.width && targetY < game.height);
        require(piece.hitpoints == 0); //, "You are alive"
        require(target.hitpoints != 0); //, "Target dead"
        require(piece.energy >= 1);
        return true;
    }

    function juryVote(uint256 gameId, uint8 x, uint8 y, uint8 targetX, uint8 targetY) public {

        // CHECKS
        require(canJuryVote(gameId, x, y, targetX, targetY));
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        Piece storage target = game.board[targetX][targetY];

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

        emit JuryVoted(gameId, msg.sender, x, y, targetX, targetY);
    }

    function canClaimWinnings(uint256 gameId, uint8 x, uint8 y) public view returns (bool) {
        Game storage game = games[gameId];
        Piece storage piece = game.board[x][y];
        require(commonChecks(gameId, x, y));
        require(piece.hitpoints != 0); //, "You are dead"
        require(game.numDead == game.numPlayers - 1); //, "Game not over yet"
        return true;
    }

    function claimWinnings(uint256 gameId, uint8 x, uint8 y) public {

        require(canClaimWinnings(gameId, x, y));
        Game storage game = games[gameId];

        // EFFECTS
        uint256 takeFee = (game.prizePool * takeFeePercent) / 10**2;
        uint256 winnings = game.prizePool - takeFee;
        dangermoon.transfer(owner(), takeFee);
        dangermoon.transfer(msg.sender, winnings);
        game.prizePool = 0;

        emit WinningsClaimed(gameId, msg.sender, x, y, winnings);
    }
}
