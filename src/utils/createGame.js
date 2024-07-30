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






// import { db } from '../../firebase.config';
// import { ref, set } from 'firebase/database';

// const createGame = async (gameCode, maxPlayers, numDice) => {
//   const gameRef = ref(db, `games/${gameCode}`);
//   const gameData = {
//     maxPlayers,
//     numDice,
//     players: {},
//     totalDiceInPlay: 0,
//     totalGuess: 0,
//     roundNumber: 1,
//     challenge: false,
//     winner: null,
//     currentTurn: null,
//   };

//   await set(gameRef, gameData);
// };

// export default createGame;







// import { db } from '../../firebase.config';
// import { ref, set } from 'firebase/database';

// const createGame = async (gameCode, maxPlayers, numDice, randomNumber) => {
//   const gameRef = ref(db, `games/${gameCode}`);
//   const gameData = {
//     maxPlayers,
//     numDice,
//     randomNumber,
//     players: {},
//     winner: null,
//     currentTurn: null,
//   };

//   await set(gameRef, gameData);
// };

// export default createGame;






