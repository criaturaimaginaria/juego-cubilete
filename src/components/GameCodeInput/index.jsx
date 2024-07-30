'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../firebase.config';
import { ref, set, update } from 'firebase/database';
import { LanguageContext } from '../../contexts/LenguageContext';
import { useAuth } from '../../contexts/AuthProvider';
import createGame from '../../utils/createGame';

const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateRandomNumber = () => {
  return Math.floor(Math.random() * 100) + 1; // Número aleatorio entre 1 y 100
};

export const GameCodeInput = () => {
  const [gameCode, setGameCode] = useState('');
  const [numPlayers, setNumPlayers] = useState(4);
  const [numDice, setNumDice] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();

  const handleGenerateRandomCode = async () => {
    const randomCode = generateRandomCode();
    setGameCode(randomCode);

    setIsCreating(true);

    try {
      const randomNumber = generateRandomNumber();
      await createGame(randomCode, numPlayers, numDice, randomNumber);

      const gameRef = ref(db, `games/${randomCode}`);
      const playerData = {
        name: user.displayName,
        guess: null,
        isCurrentTurn: true,
      };
      await update(gameRef, {
        [`players/${user.uid}`]: playerData,
      });

      // Navigate to the game page after creating the game
      router.push(`/${randomCode}`);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (gameCode) {
      router.push(`/${gameCode}`);
    }
  };

  const translations = {
    es: {
      generate: 'crear código de sala',
      play: 'Jugar',
      numPlayers: 'Número de jugadores',
      numDice: 'Número de dados'
    },
    en: {
      generate: 'generate room code',
      play: 'Play',
      numPlayers: 'Number of players',
      numDice: 'Number of dice'
    },
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <button type="button" onClick={handleGenerateRandomCode} disabled={isCreating}>
          {translations[language].generate}
        </button>

        <input
          type="text"
          placeholder="code"
          value={gameCode}
          readOnly
        />

        <div>
          <label>{translations[language].numPlayers}</label>
          <input
            type="number"
            value={numPlayers}
            onChange={(e) => setNumPlayers(Number(e.target.value))}
            min="2"
            max="6"
          />
        </div>

        <div>
          <label>{translations[language].numDice}</label>
          <input
            type="number"
            value={numDice}
            onChange={(e) => setNumDice(Number(e.target.value))}
            min="1"
            max="10"
          />
        </div>

        <button type="submit" disabled={isCreating}>{translations[language].play}</button>
      </form>
    </div>
  );
};

export default GameCodeInput;






// 'use client';

// import { useState, useContext } from 'react';
// import { useRouter } from 'next/navigation';
// import { db } from '../../../firebase.config';
// import { ref, set, update } from 'firebase/database';
// import { LanguageContext } from '../../contexts/LenguageContext';
// import { useAuth } from '../../contexts/AuthProvider';
// import createGame from '../../utils/createGame';

// const generateRandomCode = () => {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// };

// export const GameCodeInput = () => {
//   const [gameCode, setGameCode] = useState('');
//   const [numPlayers, setNumPlayers] = useState(4);
//   const [numDice, setNumDice] = useState(5);
//   const [isCreating, setIsCreating] = useState(false);
//   const router = useRouter();
//   const { language } = useContext(LanguageContext);
//   const { user } = useAuth();

//   const handleGenerateRandomCode = async () => {
//     const randomCode = generateRandomCode();
//     setGameCode(randomCode);

//     setIsCreating(true);

//     try {
//       await createGame(randomCode, numPlayers, numDice);

//       const gameRef = ref(db, `games/${randomCode}`);
//       const playerData = {
//         name: user.displayName,
//         guess: null,
//         isCurrentTurn: true,
//       };
//       await update(gameRef, {
//         [`players/${user.uid}`]: playerData,
//       });

//       // Navigate to the game page after creating the game
//       router.push(`/${randomCode}`);

//     } catch (error) {
//       console.error('Error creating game:', error);
//     } finally {
//       setIsCreating(false);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (gameCode) {
//       router.push(`/${gameCode}`);
//     }
//   };

//   const translations = {
//     es: {
//       generate: 'crear código de sala',
//       play: 'Jugar',
//       numPlayers: 'Número de jugadores',
//       numDice: 'Número de dados'
//     },
//     en: {
//       generate: 'generate room code',
//       play: 'Play',
//       numPlayers: 'Number of players',
//       numDice: 'Number of dice'
//     },
//   };

//   return (
//     <div>
//       <form onSubmit={handleSubmit}>
//         <button type="button" onClick={handleGenerateRandomCode} disabled={isCreating}>
//           {translations[language].generate}
//         </button>

//         <input
//           type="text"
//           placeholder="code"
//           value={gameCode}
//           readOnly
//         />

//         <div>
//           <label>{translations[language].numPlayers}</label>
//           <input
//             type="number"
//             value={numPlayers}
//             onChange={(e) => setNumPlayers(Number(e.target.value))}
//             min="2"
//             max="6"
//           />
//         </div>

//         <div>
//           <label>{translations[language].numDice}</label>
//           <input
//             type="number"
//             value={numDice}
//             onChange={(e) => setNumDice(Number(e.target.value))}
//             min="1"
//             max="10"
//           />
//         </div>

//         <button type="submit" disabled={isCreating}>{translations[language].play}</button>
//       </form>
//     </div>
//   );
// };

// export default GameCodeInput;



