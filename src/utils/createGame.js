import { db } from '../../firebase.config.js';
import { ref, set } from 'firebase/database';

const createGame = (gameCode, maxPlayers, dicePerPlayer) => {
  const gameData = {
    maxPlayers,
    dicePerPlayer,
    players: {},
    currentTurn: 'player1',
    totalDice: maxPlayers * dicePerPlayer,
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

  const gameRef = ref(db, `games/${gameCode}`);
  return set(gameRef, gameData);
};

export default createGame;