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
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!gameCode) return;

    const gameRef = ref(db, `games/${gameCode}`);

    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // console.log("Game data received:", data);
        setGameData(data);
        setRoundInProgress(data.roundInProgress);
        setRoundGuessTotal(data.roundGuessTotal || 0);
        setActualTotalDice(data.actualTotalDice);
        setAllPlayersRolled(checkAllPlayersRolled(data.players));
        setPlayersChallenges(data.playersChallenges || {});

        // Verificar si hay un ganador después de la primera ronda
        if (data.currentRound && data.currentRound > 0) {
          checkForWinner(data.players, data.currentRound);
        }

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
    const activePlayers = Object.keys(players).filter(uid => players[uid].dice > 0);
    const initialTurn = activePlayers[0];
    const updates = {
      currentTurn: initialTurn,
      roundInProgress: true,
    };

    update(ref(db, `games/${gameCode}`), updates);
  };

  const handleRollDice = () => {
    if (gameData && gameData.players && gameData.players[user.uid]) {
      const playerDiceCount = gameData.players[user.uid].dice;
      if (playerDiceCount > 0) {
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
// console.log("hello", playersChallenges)
  const endRound = (challenges) => {
    const updates = {};

Object.entries(gameData.players).forEach(([uid, player]) => {
  if (challenges[uid] === false) {
    if (actualTotalDice > roundGuessTotal) {
      updates[`players/${uid}/dice`] = player.dice - 1;
    } else {
      updates[`players/${uid}/dice`] = player.dice;
    }
  } else if (challenges[uid] === true) {
    if (actualTotalDice < roundGuessTotal) {
      updates[`players/${uid}/dice`] = player.dice - 1;
    } else {
      updates[`players/${uid}/dice`] = player.dice;
    }
  }
  
  // Resetea el resultado del dado
  updates[`players/${uid}/rollResult`] = null;

  console.log("actualTotalDice", actualTotalDice);
  console.log("roundGuessTotal", roundGuessTotal);
});

    // console.log("uid----------" , challenges[uid], player)

    updates['roundInProgress'] = true;
    updates['currentRound'] = gameData.currentRound + 1;
    updates['roundGuessTotal'] = 0;
    updates['playersChallenges'] = {};
    updates['currentTurn'] = Object.keys(gameData.players).filter(uid => updates[`players/${uid}/dice`] > 0)[0]; // Reset to the first active player for the new round

    update(ref(db, `games/${gameCode}`), updates)
      .then(() => checkForWinner(gameData.players, gameData.currentRound + 1));
  };

  const calculateTotalDice = (players) => {
    return Object.values(players).reduce((total, player) => total + (player.rollResult || 0), 0);
  };

  const getNextTurn = () => {
    const activePlayers = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0);
    const currentTurnIndex = activePlayers.indexOf(gameData.currentTurn);
    return activePlayers[(currentTurnIndex + 1) % activePlayers.length];
  };

  const isPlayerTurn = () => {
    if (gameData && gameData.currentTurn && user && user.uid) {
      // console.log(`Checking turn: currentTurn=${gameData.currentTurn}, user.uid=${user.uid}`);
      return gameData.currentTurn === user.uid;
    }
    return false;
  };

  const checkForWinner = (players, currentRound) => {
    const activePlayers = Object.keys(players).filter(uid => players[uid].dice > 0);
    if (activePlayers.length === 1 && currentRound > 1) {
      const winnerUid = activePlayers[0];
      setGameOver(true);
      setWinner(players[winnerUid].name);

      // Actualiza el estado del juego para reflejar el ganador
      update(ref(db, `games/${gameCode}`), { gameOver: true, winner: players[winnerUid].name });
    }
  };

  const translations = {
    es: {
      guess: 'Adivinar',
      roll: 'Tirar Dados',
      believe: 'Creo',
      disbelieve: 'No creo',
      endRound: 'Frenar Ronda',
      winMessage: 'ha ganado el juego!',
      lostMessage: 'Has perdido. No puedes participar más.',
    },
    en: {
      guess: 'Guess',
      roll: 'Roll Dice',
      believe: 'Believe',
      disbelieve: 'Disbelieve',
      endRound: 'End Round',
      winMessage: 'has won the game!',
      lostMessage: 'You have lost. You cannot participate anymore.',
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

      {gameOver ? (
        <p>{winner} {translations[language].winMessage}</p>
      ) : (
        roundInProgress ? (
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
                {Object.keys(playersChallenges).length === 0 && isPlayerTurn() ? (
                  <>
                    <button onClick={() => handleChallenge(false)}>{translations[language].disbelieve}</button>
                    <button onClick={() => handleChallenge(true)}>{translations[language].believe}</button>
                  </>
                ) : (
                  <>
                  <button onClick={() => handleChallenge(false)}>{translations[language].disbelieve}</button>
                  <button onClick={() => handleChallenge(true)}>{translations[language].believe}</button>
                </>
                )}
              </div>
            )}
          </div>
                  ) : (
          <div>
            <button onClick={() => handleChallenge(false)}>{translations[language].disbelieve}</button>
            <button onClick={() => handleChallenge(true)}>{translations[language].believe}</button>
          </div>
        )
      )}

      {gameData && Object.keys(gameData.players).map(uid => {
        const player = gameData.players[uid];
        if (player.dice <= 0 && uid === user.uid) {
          return (
            <div key={uid}>
              <p>{player.name} {translations[language].lostMessage}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default GameplayPage;



