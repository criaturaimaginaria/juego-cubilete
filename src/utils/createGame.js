import { database } from '../../firebase.config.js';
import { ref, set } from 'firebase/database';

const createGame = (gameCode, playerNames) => {
  const players = playerNames.reduce((acc, name, index) => {
    acc[`player${index + 1}`] = {
      name,
      dice: 5,
      isCurrentTurn: index === 0,
      hasQuintilla: false,
    };
    return acc;
  }, {});

  const gameData = {
    players,
    currentTurn: 'player1',
    totalDice: playerNames.length * 5,
    roundActive: true,
    turnDirection: 'right',
    lastBid: {
      number: 0,
      face: '',
    },
    cursedDice: {
      used: false,
      byPlayer: '',
    },
    gameHistory: []
  };

  const gameRef = ref(database, `games/${gameCode}`);
  return set(gameRef, gameData);
};

export default createGame;