import { database } from '../../firebase.config.js';
import { ref, set } from 'firebase/database';

const createGame = (gameCode, numPlayers, numDice) => {
  const gameData = {
    players: {},
    currentTurn: null,
    totalDice: numPlayers * numDice,
    numPlayers,
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