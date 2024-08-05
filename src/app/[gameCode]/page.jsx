'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../firebase.config';
import { ref, onValue, update } from 'firebase/database';
import { LanguageContext } from '../../contexts/LenguageContext';
import { useAuth } from '../../contexts/AuthProvider';

const GameplayPage = ({ params }) => {
  const { gameCode } = params;
  const [gameData, setGameData] = useState(null);
  const [playerGuess, setPlayerGuess] = useState('');
  const [roundGuessTotal, setRoundGuessTotal] = useState(0);
  const [actualTotalDice, setActualTotalDice] = useState(0);
  const [roundInProgress, setRoundInProgress] = useState(true);
  const [allPlayersRolled, setAllPlayersRolled] = useState(false);
  const [playersChallenges, setPlayersChallenges] = useState({});
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();

  useEffect(() => {
    if (!gameCode) return;

    const gameRef = ref(db, `games/${gameCode}`);

    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log("Game data received:", data);
        setGameData(data);
        setRoundInProgress(data.roundInProgress);
        setRoundGuessTotal(data.roundGuessTotal || 0);
        setActualTotalDice(data.actualTotalDice);
        setAllPlayersRolled(checkAllPlayersRolled(data.players));
        setPlayersChallenges(data.playersChallenges || {});

        // Si todos los jugadores han tirado los dados, iniciamos el turno del primer jugador.
        if (checkAllPlayersRolled(data.players) && !data.currentTurn) {
          startFirstTurn(data.players);
        }
      }
    });

    return () => unsubscribe();
  }, [gameCode]);

  const checkAllPlayersRolled = (players) => {
    return Object.values(players).every(player => player.rollResult !== undefined);
  };

  const startFirstTurn = (players) => {
    const initialTurn = Object.keys(players)[0];
    const updates = {
      currentTurn: initialTurn,
      roundInProgress: true,
    };

    update(ref(db, `games/${gameCode}`), updates);
  };

  const handleRollDice = () => {
    if (gameData && gameData.players && gameData.players[user.uid]) {
      const playerDiceCount = gameData.players[user.uid].dice;
      const rollResult = Math.floor(Math.random() * 6) + 1;
      update(ref(db, `games/${gameCode}/players/${user.uid}`), { rollResult })
        .then(() => {
          const updatedPlayers = { ...gameData.players, [user.uid]: { ...gameData.players[user.uid], rollResult } };
          if (checkAllPlayersRolled(updatedPlayers)) {
            const newTotalDice = calculateTotalDice(updatedPlayers);
            update(ref(db, `games/${gameCode}`), { actualTotalDice: newTotalDice, roundInProgress: true });
          }
        });
    }
  };

  const handleGuessSubmit = () => {
    if (playerGuess && !isNaN(playerGuess)) {
      const newGuessTotal = roundGuessTotal + parseInt(playerGuess);
      setRoundGuessTotal(newGuessTotal);
      update(ref(db, `games/${gameCode}`), { roundGuessTotal: newGuessTotal, currentTurn: getNextTurn() });
      setPlayerGuess('');
    }
  };

  const handleChallenge = (believe) => {
    const newChallenges = { ...playersChallenges, [user.uid]: believe };
    setPlayersChallenges(newChallenges);
    update(ref(db, `games/${gameCode}`), { playersChallenges: newChallenges })
      .then(() => {
        if (Object.keys(newChallenges).length === Object.keys(gameData.players).length) {
          endRound(newChallenges);
        }
      });
  };

  const endRound = (challenges) => {
    const correctGuesses = Object.values(challenges).filter(believe => believe).length;
    const incorrectGuesses = Object.values(challenges).length - correctGuesses;

    const updates = {};

    Object.entries(gameData.players).forEach(([uid, player]) => {
      if (challenges[uid]) {
        updates[`players/${uid}/dice`] = player.dice;
      } else {
        updates[`players/${uid}/dice`] = player.dice - 1;
      }
      updates[`players/${uid}/rollResult`] = null;
    });

    updates['roundInProgress'] = true;
    updates['currentRound'] = gameData.currentRound + 1;
    updates['roundGuessTotal'] = 0;
    updates['playersChallenges'] = {};
    updates['currentTurn'] = Object.keys(gameData.players)[0]; // Reset to the first player for the new round

    update(ref(db, `games/${gameCode}`), updates);
  };

  const calculateTotalDice = (players) => {
    return Object.values(players).reduce((total, player) => total + player.rollResult, 0);
  };

  const getNextTurn = () => {
    const playerOrder = Object.keys(gameData.players);
    const currentTurnIndex = playerOrder.indexOf(gameData.currentTurn);
    return playerOrder[(currentTurnIndex + 1) % playerOrder.length];
  };

  const isPlayerTurn = () => {
    if (gameData && gameData.currentTurn && user && user.uid) {
      console.log(`Checking turn: currentTurn=${gameData.currentTurn}, user.uid=${user.uid}`);
      return gameData.currentTurn === user.uid;
    }
    return false;
  };

  const translations = {
    es: {
      guess: 'Adivinar',
      roll: 'Tirar Dados',
      believe: 'Creo',
      disbelieve: 'No creo',
      endRound: 'Frenar Ronda',
    },
    en: {
      guess: 'Guess',
      roll: 'Roll Dice',
      believe: 'Believe',
      disbelieve: 'Disbelieve',
      endRound: 'End Round',
    },
  };

  if (!gameCode) {
    return <div>Error: No game code provided</div>;
  }

  return (
    <div>
      <h1>Gameplay Page - {gameCode}</h1>
      <p>Current Round: {gameData?.currentRound}</p>
      <p>Actual Total Dice: {actualTotalDice}</p>
      <p>Round Guess Total: {roundGuessTotal}</p>

      {roundInProgress ? (
        <div>
          {!allPlayersRolled ? (
            <button onClick={handleRollDice}>{translations[language].roll}</button>
          ) : (
            <div>
              {isPlayerTurn() && Object.keys(playersChallenges).length === 0 ? (
                <>
                  <input
                    type="text"
                    placeholder={translations[language].guess}
                    value={playerGuess}
                    onChange={(e) => setPlayerGuess(e.target.value)}
                  />
                  <button onClick={handleGuessSubmit}>{translations[language].guess}</button>
                </>
              ) : (
                <p>Waiting for your turn...</p>
              )}
              <button onClick={() => handleChallenge(false)}>{translations[language].disbelieve}</button>
              {Object.keys(playersChallenges).length > 0 && (
                <button onClick={() => handleChallenge(true)}>{translations[language].believe}</button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <p>Waiting for all players to finish their challenges...</p>
        </div>
      )}
    </div>
  );
};

export default GameplayPage;



