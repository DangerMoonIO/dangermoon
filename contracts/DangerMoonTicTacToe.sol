pragma solidity ^0.6.12;

// SPDX-License-Identifier: Unlicensed

// TODO remove
import "hardhat/console.sol";

// DangerMoonTicTacToe is a solidity implementation of the tic tac toe game.
// You can find the rules at https://en.wikipedia.org/wiki/Tic-tac-toe
// Shamelessly forked from
// https://github.com/schemar/TicTacToe/blob/master/contracts/TicTacToe.sol

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

contract DangerMoonTicTacToe is Ownable {

    using SafeMath for uint256;

    // Teams enumerates all possible teams
    enum Teams { None, TeamOne, TeamTwo }
    // Winners enumerates all possible winners
    enum Winners { None, TeamOne, TeamTwo, Draw }

    // GameCreated signals that `creator` created a new game with this `gameId`.
    event GameCreated(uint256 gameId, address creator, bool isTeamOneEven);
    // PlayerJoinedGame signals that `player` joined the game with the id `gameId`.
    // That player has the player number `playerNumber` in that game.
    event PlayerJoinedGame(uint256 gameId, address player, uint8 teamNumber);
    // PlayerVotesMove signals that `player` filled in the board of the game with
    // the id `gameId`. They did so at the coordinates `xCoord`, `yCoord`.
    event PlayerVotesMove(uint256 gameId, address player, uint256 numVotes, uint8 xCoord, uint8 yCoord);
    // TeamMadeMove signals that `team` filled in the board of the game with
    // the id `gameId`. They did so at the coordinates `xCoord`, `yCoord`.
    event TeamMadeMove(uint256 gameId, uint8 teamNumber, uint8 xCoord, uint8 yCoord);
    // GameOver signals that the game with the id `gameId` is over.
    // The winner is indicated by `winner`. No more moves are allowed in this game.
    event GameOver(uint256 gameId, Winners winner);

    // Game stores the state of a round of tic tac toe.
    // As long as `winner` is `None`, the game is not over.
    // `turn` defines who may go next.
    // Player one must make the first move.
    // The `board` has the size 3x3 and in each cell, a player
    // can be listed. Initializes as `None` player, as that is the
    // first element in the enumeration.
    // That means that players are free to fill in any cell at the
    // start of the game.
    struct Game {
        // Timing
        uint256 turnEndBlock;
        uint256 blocksPerTurn;

        // Accounting
        uint256 teamOnePrizePool;
        uint256 teamTwoPrizePool;
        uint256 teamOneTotalVoteFees;
        uint256 teamTwoTotalVoteFees;

        // Voting
        uint256[3][3] votes;
        uint256 totalVotesThisTurn;

        // Game state
        bool isTeamOneEven;
        Winners winner;
        Teams turn;
        Teams[3][3] board;
        mapping(address => uint256) teamOneVoteFees;
        mapping(address => uint256) teamTwoVoteFees;
    }

    // games stores all the games.
    // Games that are already over as well as games that are still running.
    // It is possible to iterate over all games, as the keys of the mapping
    // are known to be the integers from `1` to `numGames`.
    mapping(uint256 => Game) public games;
    // numGames stores the total number of games in this contract.
    uint256 public numGames;

    // determines number of votes per in-game turn
    uint8 public minimumVotesPerTurn;
    // dangermoon team's cut of prize pool
    uint8 private takeFeePercent = 10;

    address public dangermoonAddress;

    constructor(address _dangermoonAddress) public {
      dangermoonAddress = _dangermoonAddress;
      minimumVotesPerTurn = 25;
    }

    function setTakeFeePercent(uint8 _takeFeePercent) external onlyOwner() {
        takeFeePercent = _takeFeePercent;
    }

    function setMinimumVotesPerTurn(uint8 _minimumVotesPerTurn) external onlyOwner() {
        minimumVotesPerTurn = _minimumVotesPerTurn;
    }

    function withdrawDangerMoon(uint256 amount) public onlyOwner() {
        if (amount == 0) {
          amount = IDangerMoon(dangermoonAddress).balanceOf(address(this));
        }
        IDangerMoon(dangermoonAddress).transferFrom(address(this), owner(), amount);
    }

    // newGame creates a new game and returns the new game's `gameId`.
    // The `gameId` is required in subsequent calls to identify the game.
    function newGame(uint8 _blocksPerTurn) public returns (uint256 gameId) {
        Game memory game;
        game.turn = Teams.TeamOne;
        game.isTeamOneEven = (uint256(msg.sender).mod(2) == 0);
        game.turnEndBlock = block.number + _blocksPerTurn;
        game.blocksPerTurn = _blocksPerTurn;

        numGames = numGames.add(1);
        games[numGames] = game;

        emit GameCreated(numGames, msg.sender, game.isTeamOneEven);

        return numGames;
    }

    function isPlayerOnTeamOne(bool isTeamOneEven) public view returns (bool) {
      if (isTeamOneEven) {
        return (uint256(msg.sender).mod(2) == 0);
      }
      return (uint256(msg.sender).mod(2) != 0);
    }

    // joinGame lets the sender of the message join the game with the id `gameId`.
    // It returns `success = true` when joining the game was possible and
    // `false` otherwise.
    // `reason` indicates why a game was joined or not joined.
    function joinGame(uint128 gameId) public returns (bool success, string memory reason) {
        require(gameId < numGames, "No such game exists.");

        Game storage game = games[gameId];

        // Assign the new msg.sender to team 1 if their address ending matches game creator's
        if (isPlayerOnTeamOne(game.isTeamOneEven)) {
            game.teamOne[msg.sender] = 0;
            emit PlayerJoinedGame(gameId, msg.sender, uint8(Teams.TeamOne));
            return (true, "Joined team one.");
        }

        // Assign the new msg.sender to team 2 if their address ending doesnt match game creator's
        game.teamTwo[msg.sender] = 0;
        emit PlayerJoinedGame(gameId, msg.sender, uint8(Teams.TeamTwo));
        return (true, "Joined team two. Only team one can make the first move.");
    }

    // voteMove denotes a player votes to move the game board.
    // The player is identified as the sender of the message.
    // once 25 votes are reached, the turn is over
    // once the elapsed time has passed, the turn is over
    function voteMove(uint128 gameId, uint8 numVotes, uint8 xCoord, uint8 yCoord) public returns (bool success, string memory reason) {
        Game storage game = games[gameId];

        // CHECKS
        require(gameId < numGames, "No such game exists.");
        require(game.winner == Winners.None, "The game already has a winner, it is over.");
        require(game.board[xCoord][yCoord] == Teams.None, "There is already a mark at the given coordinates.");

        // Check if we have to end the previous team's turn
        if (block.number > game.turnEndBlock) {
          Winners winner = endVote(gameId, game);
          // We check for winners after each vote concludes
          if (winner != Winners.None) {
              return (true, "The game is over.");
          }
        }

        // Players can only vote for a move on their team's turn
        bool _isPlayerOnTeamOne = isPlayerOnTeamOne(game.isTeamOneEven);
        require(_isPlayerOnTeamOne && game.turn == Teams.TeamOne, "It is not your teams turn.");
        require(!_isPlayerOnTeamOne && game.turn == Teams.TeamTwo, "It is not your teams turn.");

        // EFFECTS
        // Transfer dangermoon vote-fee to this contract
        uint256 voteFee = IDangerMoon(dangermoonAddress)._minimumTokensForReflection().div(10).mul(numVotes);
        IDangerMoon(dangermoonAddress).transferFrom(msg.sender, address(this), voteFee);

        // Update game prize pool and player's vote-contribution
        if (game.turn == Teams.TeamOne) {
          game.teamTwoPrizePool = game.teamTwoPrizePool.add(voteFee);
          game.teamOneTotalVoteFees = game.teamOneTotalVoteFees.add(voteFee);
          game.teamOneVoteFees[msg.sender] = game.teamOneVoteFees[msg.sender].add(voteFee);
        } else {
          game.teamOnePrizePool = game.teamOnePrizePool.add(voteFee);
          game.teamTwoTotalVoteFees = game.teamTwoTotalVoteFees.add(voteFee);
          game.teamTwoVoteFees[msg.sender] = game.teamTwoVoteFees[msg.sender].add(voteFee);
        }

        // Record the player's vote
        game.totalVotesThisTurn = game.totalVotesThisTurn.add(numVotes);
        game.votes[xCoord][yCoord] = game.votes[xCoord][yCoord].add(numVotes);
        emit PlayerVotesMove(gameId, msg.sender, numVotes, xCoord, yCoord);

        // A vote was made and there is no winner yet.
        // Let the next team play if we have reached max votes for this turn.
        if (game.totalVotesThisTurn > minimumVotesPerTurn) {
          Winners winner = endVote(gameId, game);
          // We check for winners after each vote concludes
          if (winner != Winners.None) {
              return (true, "The game is over.");
          }
        }

        return (true, "");
    }

    // endVote updates game state given all players votes.
    function endVote(uint8 gameId, Game memory _game) private returns (Winners winner) {
        // uint128[3][3][2] memory _votes;
        // for (uint8 x = 0; x < 3; x++) {
        //     for (uint8 y = 0; y < 3; y++) {
        //         if (_board[x][y] == Teams.None) {
        //             return false;
        //         }
        //     }
        // }

        // TODO
        // Now the vote is recorded and the according event emitted.
        // game.board[xCoord][yCoord] = game.turn;
        // emit PlayerVotesMove(gameId, msg.sender, xCoord, yCoord);

        // Check if there is a winner now that we have a new move.
        Winners winner = calculateWinner(_game.board);
        if (winner != Winners.None) {
            // If there is a winner (can be a `Draw`) it must be recorded
            _game.winner = winner;
            emit GameOver(gameId, winner);
            return winner;
        }

        // clear current turn votes

        // change whose turn it is for the given `_game`.
        if (_game.turn == Teams.TeamOne) {
            _game.turn = Teams.TeamTwo;
        } else {
            _game.turn = Teams.TeamOne;
        }

        // Begin voting for next team
        _game.turnEndBlock = block.number + _game.blocksPerTurn;
        _game.totalVotesThisTurn = 0;

        return Winners.None;
    }

    // getCurrentTeam returns the team that should make the next move.
    // Returns the `0x0` address if it is no team's turn.
    function getCurrentTeam(Game storage _game) private view returns (Teams team) {
        if (_game.turn == Teams.TeamOne) {
            return Teams.TeamOne;
        }

        if (_game.turn == Teams.TeamTwo) {
            return Teams.TeamTwo;
        }

        return Teams.None;
    }

    // calculateWinner returns the winner on the given board.
    // The returned winner can be `None` in which case there is no winner and no draw.
    function calculateWinner(Teams[3][3] memory _board) private pure returns (Winners winner) {
        // First we check if there is a victory in a row.
        // If so, convert `Teams` to `Winners`
        // Subsequently we do the same for columns and diagonals.
        Teams team = winnerInRow(_board);
        if (team == Teams.TeamOne) {
            return Winners.TeamOne;
        }
        if (team == Teams.TeamTwo) {
            return Winners.TeamTwo;
        }

        team = winnerInColumn(_board);
        if (team == Teams.TeamOne) {
            return Winners.TeamOne;
        }
        if (team == Teams.TeamTwo) {
            return Winners.TeamTwo;
        }

        team = winnerInDiagonal(_board);
        if (team == Teams.TeamOne) {
            return Winners.TeamOne;
        }
        if (team == Teams.TeamTwo) {
            return Winners.TeamTwo;
        }

        // If there is no winner and no more space on the board,
        // then it is a draw.
        if (isBoardFull(_board)) {
            return Winners.Draw;
        }

        return Winners.None;
    }

    // winnerInRow returns the player that wins in any row.
    // To win in a row, all cells in the row must belong to the same player
    // and that player must not be the `None` player.
    function winnerInRow(Teams[3][3] memory _board) private pure returns (Teams winner) {
        for (uint8 x = 0; x < 3; x++) {
            if (
                _board[x][0] == _board[x][1]
                && _board[x][1]  == _board[x][2]
                && _board[x][0] != Teams.None
            ) {
                return _board[x][0];
            }
        }

        return Teams.None;
    }

    // winnerInColumn returns the player that wins in any column.
    // To win in a column, all cells in the column must belong to the same player
    // and that player must not be the `None` player.
    function winnerInColumn(Teams[3][3] memory _board) private pure returns (Teams winner) {
        for (uint8 y = 0; y < 3; y++) {
            if (
                _board[0][y] == _board[1][y]
                && _board[1][y] == _board[2][y]
                && _board[0][y] != Teams.None
            ) {
                return _board[0][y];
            }
        }

        return Teams.None;
    }

    // winnerInDiagoral returns the player that wins in any diagonal.
    // To win in a diagonal, all cells in the diaggonal must belong to the same player
    // and that player must not be the `None` player.
    function winnerInDiagonal(Teams[3][3] memory _board) private pure returns (Teams winner) {
        if (
            _board[0][0] == _board[1][1]
            && _board[1][1] == _board[2][2]
            && _board[0][0] != Teams.None
        ) {
            return _board[0][0];
        }

        if (
            _board[0][2] == _board[1][1]
            && _board[1][1] == _board[2][0]
            && _board[0][2] != Teams.None
        ) {
            return _board[0][2];
        }

        return Teams.None;
    }

    // isBoardFull returns true if all cells of the board belong to a team other than `None`.
    function isBoardFull(Teams[3][3] memory _board) private pure returns (bool isFull) {
        for (uint8 x = 0; x < 3; x++) {
            for (uint8 y = 0; y < 3; y++) {
                if (_board[x][y] == Teams.None) {
                    return false;
                }
            }
        }

        return true;
    }

    function claimWinnings(uint128 gameId) public {
      Game storage game = games[gameId];

      // CHECKS
      require(gameId < numGames, "No such game exists.");
      // TODO distribute winnins
      // Check winners...
      // None, TeamOne, TeamTwo, Draw
      require(game.winner != Winners.None, "The game already doesnt have a winner yet, it is not over.");
      // TODO require player is on the winning team

      // TODO
      uint256 playerWinnings = 0;
      IDangerMoon(dangermoonAddress).transferFrom(address(this), msg.sender, playerWinnings);
    }
}
