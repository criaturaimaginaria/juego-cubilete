'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../../firebase.config';
import { useAuth } from '../../contexts/AuthProvider';
import styles from './page.module.css';

export default function GameplayPage() {
  const { gameCode } = useParams();
  const [gameData, setGameData] = useState(null);
  const [guess, setGuess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (gameCode) {
      const gameRef = ref(db, `games/${gameCode}`);
      onValue(gameRef, (snapshot) => {
        setGameData(snapshot.val());
      });
    }
  }, [gameCode]);

  const handleGuessChange = (e) => {
    setGuess(e.target.value);
  };

  const handleSubmitGuess = async (e) => {
    e.preventDefault();
    if (!gameData || !user) return;

    const playerRef = ref(db, `games/${gameCode}/players/${user.uid}`);
    const gameRef = ref(db, `games/${gameCode}`);

    // Actualiza la adivinanza del jugador
    await update(playerRef, {
      guess: parseInt(guess, 10),
    });

    // Cambiar el turno al siguiente jugador
    const currentTurnPlayer = Object.keys(gameData.players).find(
      (key) => gameData.players[key].isCurrentTurn
    );

    const playerKeys = Object.keys(gameData.players);
    const currentTurnIndex = playerKeys.indexOf(currentTurnPlayer);
    const nextTurnIndex = (currentTurnIndex + 1) % playerKeys.length;
    const nextTurnPlayer = playerKeys[nextTurnIndex];

    await update(gameRef, {
      [`players/${currentTurnPlayer}/isCurrentTurn`]: false,
      [`players/${nextTurnPlayer}/isCurrentTurn`]: true,
    });

    setGuess('');
  };

  const handleChallenge = async () => {
    if (!gameData || !user) return;

    const gameRef = ref(db, `games/${gameCode}`);
    const totalDice = gameData.totalDice;
    const playerGuesses = Object.values(gameData.players).map((player) => player.guess);

    const sumOfGuesses = playerGuesses.reduce((sum, guess) => sum + (guess || 0), 0);
    const challengeSuccess = sumOfGuesses <= totalDice;

    const updatedPlayers = { ...gameData.players };

    if (challengeSuccess) {
      Object.keys(updatedPlayers).forEach((playerId) => {
        if (updatedPlayers[playerId].guess > totalDice) {
          updatedPlayers[playerId].dice -= 1;
        }
      });
    } else {
      updatedPlayers[user.uid].dice -= 1;
    }

    await update(gameRef, {
      players: updatedPlayers,
      totalDice: null,
    });

    // Reinicia el juego
    const newTotalDice = calculateTotalDice(Object.keys(gameData.players).length, gameData.numDice);
    await update(gameRef, {
      totalDice: newTotalDice,
      currentTurn: null,
    });
  };

  const calculateTotalDice = (numPlayers, numDice) => {
    return Array(numPlayers)
      .fill(0)
      .reduce((total) => total + Math.floor(Math.random() * numDice) + 1, 0);
  };

  if (!gameData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.game}>
      <h2>Gameplay for Game Code: {gameCode}</h2>
      {gameData.winner ? (
        <div>
          <h3>{gameData.winner} has won the game!</h3>
        </div>
      ) : (
        <>
          <div>
            <form onSubmit={handleSubmitGuess}>
              <input
                type="number"
                placeholder="Enter your guess"
                value={guess}
                onChange={handleGuessChange}
              />
              <button type="submit">Submit Guess</button>
            </form>
            <button onClick={handleChallenge}>Challenge</button>
          </div>
          <div className={styles.players}>
            {gameData.players &&
              Object.keys(gameData.players).map((playerId) => (
                <div key={playerId} className={styles.player}>
                  {gameData.players[playerId].name}: {gameData.players[playerId].guess || 'No guess yet'} | Dice: {gameData.players[playerId].dice}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

