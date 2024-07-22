
'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '../../../firebase.config';
import { ref, set } from 'firebase/database';
import { LanguageContext } from '../../contexts/LenguageContext';
import createGame from '../../utils/createGame';

const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const GameCodeInput = () => {
  const [gameCode, setGameCode] = useState('');
  const [numPlayers, setNumPlayers] = useState(4);
  const [numDice, setNumDice] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { language } = useContext(LanguageContext);

  const handleGenerateRandomCode = async () => {
    const randomCode = generateRandomCode();
    setGameCode(randomCode);

    setIsCreating(true); // Indicamos que se está creando la partida

    try {
      // Crear la partida en la base de datos
      await createGame(randomCode, numPlayers, numDice);
    } catch (error) {
      console.error('Error creating game:', error);
      setIsCreating(false);
      return;
    }

    setIsCreating(false);
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
// import Link from 'next/link';
// import { database } from '../../../firebase.config';
// import { ref, set } from 'firebase/database';
// import { LanguageContext } from '../../contexts/LenguageContext';
// import createGame from '../../utils/createGame';

// const generateRandomCode = () => {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// };

// export const GameCodeInput = () => {
//   const [gameCode, setGameCode] = useState('');
//   const router = useRouter();
//   const { language } = useContext(LanguageContext);

//   const handleInputChange = (e) => {
//     setGameCode(e.target.value);
//   };

//   const handleGenerateRandomCode = () => {
//     const randomCode = generateRandomCode();
//     setGameCode(randomCode);


//     const gameRef = ref(database, `games/${randomCode}`);
//     set(gameRef, {
//       players: {} 
//     });
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
//     },
//     en: {
//       generate: 'generate room code',
//       play: 'Play',
//     },
//   };

//   return (
//     <div>
//       <form onSubmit={handleSubmit}>
//         <button type="button" onClick={handleGenerateRandomCode}>
//           {translations[language].generate}
//         </button>

//         <input
//           type="text"
//           placeholder="code"
//           value={gameCode}
//           onChange={handleInputChange}
//           readOnly
//         />

//         <button type="submit">{translations[language].play}</button>
//       </form>
//     </div>
//   );
// };

// export default GameCodeInput;
