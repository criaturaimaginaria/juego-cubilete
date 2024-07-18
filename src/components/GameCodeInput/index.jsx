'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { database } from '../../../firebase.config'; // Ajusta la ruta de importación según tu configuración
import { ref, set } from 'firebase/database';
import { LanguageContext } from '../../contexts/LenguageContext';
import createGame from '../../utils/createGame';

const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const GameCodeInput = () => {
  const [gameCode, setGameCode] = useState('');
  const router = useRouter();
  const { language } = useContext(LanguageContext);

  const handleInputChange = (e) => {
    setGameCode(e.target.value);
  };

  const handleGenerateRandomCode = () => {
    const randomCode = generateRandomCode();
    setGameCode(randomCode);

    // Create the game in the database with the generated code
    const gameRef = ref(database, `games/${randomCode}`);
    set(gameRef, {
      players: {} // Inicialmente, no hay jugadores definidos
    });
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
    },
    en: {
      generate: 'generate room code',
      play: 'Play',
    },
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <button type="button" onClick={handleGenerateRandomCode}>
          {translations[language].generate}
        </button>

        <input
          type="text"
          placeholder="code"
          value={gameCode}
          onChange={handleInputChange}
          readOnly
        />

        <button type="submit">{translations[language].play}</button>
      </form>
    </div>
  );
};

export default GameCodeInput;