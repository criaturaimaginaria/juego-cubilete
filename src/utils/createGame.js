import { db } from '../../firebase.config';
import { ref, set } from 'firebase/database';

const createGame = async (gameCode, maxPlayers, numDice) => {
  const gameRef = ref(db, `games/${gameCode}`);
  const gameData = {
    maxPlayers,
    numDice,
    totalDice: null,
    players: {},
    winner: null,
    currentTurn: null,
  };

  await set(gameRef, gameData);
};

export default createGame;




