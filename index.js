const game = (function makeGameModule() {
  const BOARD_STATUS = Object.freeze({
    PLAYING: 0,
    PLAYER_ONE_WIN: 1,
    PLAYER_TWO_WIN: 2,
    TIE: 3,
  });

  const CELL_VALUE = Object.freeze({
    EMPTY: 0,
    PLAYER_ONE: 1,
    PLAYER_TWO: 2,
  });

  function makeGameboard() {
    /** @type ((typeof CELL_VALUE)[keyof typeof CELL_VALUE])[][] */
    const _board = [
      [CELL_VALUE.EMPTY, CELL_VALUE.EMPTY, CELL_VALUE.EMPTY],
      [CELL_VALUE.EMPTY, CELL_VALUE.EMPTY, CELL_VALUE.EMPTY],
      [CELL_VALUE.EMPTY, CELL_VALUE.EMPTY, CELL_VALUE.EMPTY],
    ];

    function board() {
      // make a deep copy
      return _board.map((row) => [...row]);
    }

    function placeMove(row, column, player) {
      if (![0, 1, 2].includes(row)) {
        throw new TypeError("Row number should be 0, 1, or 2");
      }
      if (![0, 1, 2].includes(column)) {
        throw new TypeError("Column number should be 0, 1, or 2");
      }
      if (![1, 2].includes(player)) {
        throw new TypeError("Player number should be 1 or 2");
      }
      if (_board[row][column]) {
        throw new Error("That square is already taken");
      }
      _board[row][column] =
        player === 1 ? CELL_VALUE.PLAYER_ONE : CELL_VALUE.PLAYER_TWO;
    }

    // prettier-ignore
    const columns = [
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
    ];

    // prettier-ignore
    const rows = [
      [[0, 0], [0, 1], [0, 2]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
    ];

    // prettier-ignore
    const diagonals = [
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]],
    ];

    const lines = [...columns, ...rows, ...diagonals];

    function valueOf(cell) {
      const [row, column] = cell;
      return _board[row][column];
    }

    function getBoardStatus() {
      for (const line of lines) {
        const value = valueOf(line[0]);
        const winningLine =
          value != CELL_VALUE.EMPTY &&
          line.every((cell) => valueOf(cell) === value);
        if (!winningLine) {
          continue;
        }
        if (value === CELL_VALUE.PLAYER_ONE) {
          return BOARD_STATUS.PLAYER_ONE_WIN;
        }
        if (value === CELL_VALUE.PLAYER_TWO) {
          return BOARD_STATUS.PLAYER_TWO_WIN;
        }
        throw new TypeError("Cell value is invalid!");
      }
      const gameEnded = _board.every((row) =>
        row.every((cellValue) => cellValue !== CELL_VALUE.EMPTY)
      );
      return gameEnded ? BOARD_STATUS.TIE : BOARD_STATUS.PLAYING;
    }

    return {
      // Requirements: the board is stored as an array inside the gameboard object
      _board,
      board,
      placeMove,
      getBoardStatus,
    };
  }

  function makePlayer(playerNumber, board) {
    function makeMove(row, column) {
      board.placeMove(row, column, playerNumber);
    }

    function replaceBoard(newBoard) {
      board = newBoard;
    }

    return {
      makeMove,
      replaceBoardWith: replaceBoard,
    };
  }

  const GAME_STATUS = Object.freeze({
    PLAYER_ONE_TURN: 1,
    PLAYER_TWO_TURN: 2,
    PLAYER_ONE_WIN: 3,
    PLAYER_TWO_WIN: 4,
    TIE: 5,
  });

  /** Object that controls the game flow itself */
  function makeGame() {
    /** @type {(typeof GAME_STATUS)[keyof typeof GAME_STATUS]} */
    let _status = GAME_STATUS.PLAYER_ONE_TURN;
    let _board = makeGameboard();
    let _player1 = makePlayer(1, _board);
    let _player2 = makePlayer(2, _board);

    function status() {
      return _status;
    }

    function board() {
      return _board.board();
    }

    function reset() {
      _status = GAME_STATUS.PLAYER_ONE_TURN;
      _board = makeGameboard();
      _player1.replaceBoardWith(_board);
      _player2.replaceBoardWith(_board);
    }

    function currentPlayer() {
      if (_status === GAME_STATUS.PLAYER_ONE_TURN) {
        return _player1;
      }
      if (_status === GAME_STATUS.PLAYER_TWO_TURN) {
        return _player2;
      }
      throw new Error("Game already ended.");
    }

    function updateGameStatus() {
      const boardStatus = _board.getBoardStatus();
      switch (boardStatus) {
        case BOARD_STATUS.PLAYING:
          _status =
            _status === GAME_STATUS.PLAYER_ONE_TURN
              ? GAME_STATUS.PLAYER_TWO_TURN
              : GAME_STATUS.PLAYER_ONE_TURN;
          break;
        case BOARD_STATUS.PLAYER_ONE_WIN:
          _status = GAME_STATUS.PLAYER_ONE_WIN;
          break;
        case BOARD_STATUS.PLAYER_TWO_WIN:
          _status = GAME_STATUS.PLAYER_TWO_WIN;
          break;
        case BOARD_STATUS.TIE:
          _status = GAME_STATUS.TIE;
          break;
      }
    }

    function makeMove(row, column) {
      const player = currentPlayer();
      player.makeMove(row, column);
      updateGameStatus();
    }

    return {
      status,
      board,
      reset,
      currentPlayer,
      makeMove,
    };
  }

  // There is only a single instance of `game` in the whole game.
  // Requirements: use the module pattern to prevent creating multiple instances.
  const game = makeGame();
  return game;
})();

const gameController = (function makeGameView() {
  function showGameBoard() {
    const board = game.board();
    for (const row of [0, 1, 2]) {
      for (const column of [0, 1, 2]) {
        const $cell = document.querySelector(
          `#tic_tac_toe [data-row="${row}"][data-column="${column}"]`
        );
        if ($cell) {
          $cell.textContent =
            board[row][column] === 0
              ? ""
              : board[row][column] === 1
              ? "O"
              : "X";
        }
      }
    }
  }

  function handleCellClick(event) {
    const $clickedCell = event.target;
    const row = Number($clickedCell.dataset.row);
    const column = Number($clickedCell.dataset.column);
    try {
      game.makeMove(row, column);
    } catch (error) {
    }
    showGameBoard();
  }

  return {
    showGameBoard,
    handleCellClick,
  };
})();

gameController.showGameBoard();

const $ticTacToe = document.getElementById("tic_tac_toe");
$ticTacToe?.addEventListener("click", gameController.handleCellClick);
