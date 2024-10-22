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

const GameCodeInput = () => {
  const [gameCode, setGameCode] = useState('');
  const [numPlayers, setNumPlayers] = useState(4);
  const [numDice, setNumDice] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();

  const minValueNumDice = 5; 
  const maxValueNumDice = 7;
  const minValueNumPlayers = 2; 
  const maxValueNumPlayers = 8;

  const handleGenerateRandomCode = async () => {
    const randomCode = generateRandomCode();
    setGameCode(randomCode);

    setIsCreating(true);

    try {
      await createGame(randomCode, numPlayers, numDice);

      const gameRef = ref(db, `games/${randomCode}`);
      const playerData = {
        name: user.displayName,
        guess: null,
        dice: numDice,
        isCurrentTurn: true,
      };
      await update(gameRef, {
        [`players/${user.uid}`]: playerData,
        actualTotalDice: calculateTotalDice(numPlayers, numDice),
        roundTotalDice: 0,
        currentRound: 1,
        roundInProgress: true,
      });

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

  const calculateTotalDice = (numPlayers, numDice) => {
    return Array(numPlayers)
      .fill(0)
      .reduce((total) => total + Math.floor(Math.random() * numDice) + 1, 0);
  };

  const translations = {
    es: {
      generate: 'crear código de sala',
      play: 'Jugar',
      numPlayers: 'Número de jugadores',
      numDice: 'Número de dados',
    },
    en: {
      generate: 'generate room code',
      play: 'Play',
      numPlayers: 'Number of players',
      numDice: 'Number of dice',
    },
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <p>{translations[language].numPlayers}</p>
        <input
          type="number"
          placeholder={translations[language].numPlayers}
          value={numPlayers}
          onChange={(e) => setNumPlayers(e.target.value)}
          min={3}  
          max={8} 
          readOnly 
          disabled={isCreating}
        />
      <button
        onClick={() => setNumPlayers(prev => Math.max(minValueNumPlayers, prev - 1))}
        disabled={numPlayers <= minValueNumPlayers}
      >
        -
      </button>
      <button
        onClick={() => setNumPlayers(prev => Math.min(maxValueNumPlayers, prev + 1))}
        disabled={numPlayers >= maxValueNumPlayers}
      >
        +
      </button>




          <p>{translations[language].numDice}</p>
        <input
          type="number"
          placeholder={translations[language].numDice}
          value={numDice}
          onChange={(e) => setNumDice(e.target.value)}
          min={5}  
          max={7} 
          readOnly 
          disabled={isCreating}
        />
      <button
        onClick={() => setNumDice(prev => Math.max(minValueNumDice, prev - 1))}
        disabled={numDice <= minValueNumDice}
      >
        -
      </button>
      <button
        onClick={() => setNumDice(prev => Math.min(maxValueNumDice, prev + 1))}
        disabled={numDice >= maxValueNumDice}
      >
        +
      </button>
        
        {/* <input
          type="text"
          placeholder="code"
          value={gameCode}
          readOnly
        /> */}

        <button type="button" onClick={handleGenerateRandomCode} disabled={isCreating}>
          {translations[language].play}
        </button>


        {/* <button type="button" onClick={handleGenerateRandomCode} disabled={isCreating}>
          {translations[language].generate}
        </button>

        <button type="submit">{translations[language].play}</button> */}

      </form>
    </div>
  );
};

export default GameCodeInput;














