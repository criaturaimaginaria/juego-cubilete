import { db } from '../../firebase.config';
import { ref, set } from 'firebase/database';

const createGame = async (gameCode, maxPlayers, numDice, randomNumber) => {
  const gameRef = ref(db, `games/${gameCode}`);
  const gameData = {
    maxPlayers,
    numDice,
    randomNumber,
    players: {},
    winner: null,
    currentTurn: null,
  };

  await set(gameRef, gameData);
};

export default createGame;









// import { db } from '../../firebase.config.js';
// import { ref, set } from 'firebase/database';

// const createGame = (gameCode, maxPlayers) => {
//   const gameData = {
//     maxPlayers,
//     players: {},
//     currentTurn: 'player1',
//     randomNumber: Math.floor(Math.random() * 100) + 1,
//     gameStatus: 'waiting', // waiting, in-progress, finished
//     winner: null,
//     gameHistory: [],
//   };

//   const gameRef = ref(db, `games/${gameCode}`);
//   return set(gameRef, gameData);
// };

// export default createGame;

