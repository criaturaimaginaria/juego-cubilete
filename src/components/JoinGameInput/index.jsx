'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../firebase.config';
import { ref, get, update } from 'firebase/database';

const JoinGameInput = () => {
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleInputChange = (e) => {
    setJoinCode(e.target.value);
  };

  const handlePlayerNameChange = (e) => {
    setPlayerName(e.target.value);
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!joinCode || !playerName) {
      setError('Game code and player name are required');
      return;
    }

    const gameRef = ref(db, `games/${joinCode}`);
    try {
      const snapshot = await get(gameRef);
      if (!snapshot.exists()) {
        setError('Game not found');
        return;
      }

      const gameData = snapshot.val();
      const players = gameData.players || {};
      const playerCount = Object.keys(players).length;

      if (playerCount >= gameData.maxPlayers) {
        setError('Game is full');
        return;
      }

      const playerId = `player${playerCount + 1}`;
      players[playerId] = {
        name: playerName,
        dice: gameData.dicePerPlayer,
      };

      await update(gameRef, { players });

      router.push(`/${joinCode}`);
    } catch (error) {
      console.error('Error joining game:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <form onSubmit={handleJoinGame}>
        <input
          type="text"
          placeholder="Enter game code"
          value={joinCode}
          onChange={handleInputChange}
        />
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={handlePlayerNameChange}
        />
        <button type="submit">Join Game</button>
      </form>
      {error && <div>{error}</div>}
    </div>
  );
};

export default JoinGameInput;