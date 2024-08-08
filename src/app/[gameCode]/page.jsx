'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../firebase.config';
import { ref, onValue, update } from 'firebase/database';
import { LanguageContext } from '../../contexts/LenguageContext';
import { useAuth } from '../../contexts/AuthProvider';

const SYMBOLS = ['9', '10', 'J', 'Q', 'K', 'A'];

const rollDice = () => {
  const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
  return SYMBOLS[randomIndex];
};

const getDiceValue = (symbol, quantity) => {
  const baseValue = SYMBOLS.indexOf(symbol) + 1;
  return baseValue + (quantity - 1) * SYMBOLS.length;
};


const GameplayPage = ({ params }) => {
  const { gameCode } = params;
  const [gameData, setGameData] = useState(null);
  const [playerGuess, setPlayerGuess] = useState('');
  const [playerGuessQuantity, setPlayerGuessQuantity] = useState(1);
  const [roundGuessTotal, setRoundGuessTotal] = useState(0);
  const [actualTotalDice, setActualTotalDice] = useState(0);
  const [totalDiceSum, setTotalDiceSum] = useState(0);
  const [roundInProgress, setRoundInProgress] = useState(true);
  const [allPlayersRolled, setAllPlayersRolled] = useState(false);
  const [playersChallenges, setPlayersChallenges] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');


  useEffect(() => {
    if (!gameCode) return;
  
    const gameRef = ref(db, `games/${gameCode}`);
  
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data);
        setRoundInProgress(data.roundInProgress);
        setRoundGuessTotal(data.roundGuessTotal || 0);
        setActualTotalDice(data.actualTotalDice);
        setTotalDiceSum(calculateTotalDice(data.players));
        setAllPlayersRolled(checkAllPlayersRolled(data.players));
        setPlayersChallenges(data.playersChallenges || {});
  
        if (data.currentRound && data.currentRound > 0) {
          checkForWinner(data.players, data.currentRound);
        }
  
        if (checkAllPlayersRolled(data.players) && !data.currentTurn) {
          startFirstTurn(data.players);
        }
  
        // Store the previous player's guess
        if (data.previousPlayerGuess) {
          setPreviousPlayerGuess(data.previousPlayerGuess.symbol);
          setPreviousPlayerGuessQuantity(data.previousPlayerGuess.quantity);
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
        const rollResult = rollDice();
        update(ref(db, `games/${gameCode}/players/${user.uid}`), { rollResult })
          .then(() => {
            const updatedPlayers = { ...gameData.players, [user.uid]: { ...gameData.players[user.uid], rollResult } };
            if (checkAllPlayersRolled(updatedPlayers)) {
              const newTotalDice = calculateTotalDice(updatedPlayers);
              setTotalDiceSum(newTotalDice);
              update(ref(db, `games/${gameCode}`), { actualTotalDice: newTotalDice, roundInProgress: true });
            }
          });
      }
    }
  };

  const [previousPlayerGuess, setPreviousPlayerGuess] = useState(null);
  const [previousPlayerGuessQuantity, setPreviousPlayerGuessQuantity] = useState(0);
  
  const handleGuessSubmit = () => {
    if (playerGuess) {
      const newGuessTotal = getDiceValue(playerGuess, playerGuessQuantity);
      if (newGuessTotal > roundGuessTotal) { // Cambia la condición aquí
        setPreviousPlayerGuess(playerGuess);
        setPreviousPlayerGuessQuantity(playerGuessQuantity);
        setRoundGuessTotal(newGuessTotal);
        update(ref(db, `games/${gameCode}`), { roundGuessTotal: newGuessTotal, currentTurn: getNextTurn() });
        setPlayerGuess('');
        setPlayerGuessQuantity(1);
        setError(''); // Clear error message
      } else {
        setError("Your guess must be greater than the previous guess."); // Mensaje de error modificado
      }
    }
  };
  
  
  
  
  
  
  
  

  const handleChallenge = (believe) => {
    const newChallenges = { ...playersChallenges, [user.uid]: believe };
    setPlayersChallenges(newChallenges);
    update(ref(db, `games/${gameCode}`), { playersChallenges: newChallenges })
      .then(() => {
        // Verificar si todos los jugadores han hecho su elección
        if (Object.keys(newChallenges).length === Object.keys(gameData.players).length) {
          endRound(newChallenges); // Todos han elegido, termina la ronda
        }
      });
  };
  

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
      updates[`players/${uid}/rollResult`] = null;
    });
  
  
    updates['roundInProgress'] = true;
    updates['currentRound'] = gameData.currentRound + 1;
    updates['roundGuessTotal'] = 0;
    updates['playersChallenges'] = {};
    updates['currentTurn'] = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0)[0];
  
    update(ref(db, `games/${gameCode}`), updates)
      .then(() => {
        const newTotalDice = calculateTotalDice(gameData.players);
        setTotalDiceSum(newTotalDice);
        checkForWinner(gameData.players, gameData.currentRound + 1);
      });
  };
  

  const calculateTotalDice = (players) => {
    return Object.values(players).reduce((total, player) => total + player.dice, 0);
  };

  const getNextTurn = () => {
    const activePlayers = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0);
    const currentTurnIndex = activePlayers.indexOf(gameData.currentTurn);
    return activePlayers[(currentTurnIndex + 1) % activePlayers.length];
  };

  const isPlayerTurn = () => {
    if (gameData && gameData.currentTurn && user && user.uid) {
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

  const handleGuessChange = (symbol) => {
    setPlayerGuess(symbol);
  };

  const handleQuantityChange = (increment) => {
    setPlayerGuessQuantity(prevQuantity => {
      const newQuantity = prevQuantity + increment;
      return newQuantity > 0 ? newQuantity : 1;
    });
  };

  if (!gameCode) {
    return <div>Error: No game code provided</div>;
  }

  return (
    <div>
      <h1>Gameplay Page - {gameCode}</h1>
      <p>Current Round: {gameData?.currentRound}</p>
      <p>Actual Total Dice: {actualTotalDice}</p>
      <p>Total Dice of All Players: {totalDiceSum}</p>
      <p>Round Guess Total: {roundGuessTotal}</p>
  
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}
  
      {gameOver && winner ? (
        <p>{winner} {translations[language].winMessage}</p>
      ) : (
        <>
          {!allPlayersRolled && !Object.keys(playersChallenges).length ? (
            <button onClick={handleRollDice}>{translations[language].roll}</button>
          ) : (
            isPlayerTurn() && !Object.keys(playersChallenges).length ? (
              <div>
                <p>{translations[language].guess}</p>
                <div>
                  {SYMBOLS.map(symbol => (
                    <button key={symbol} onClick={() => handleGuessChange(symbol)}>
                      {symbol}
                    </button>
                  ))}
                </div>
                <div>
                  <button onClick={() => handleQuantityChange(-1)}>-</button>
                  <span>{playerGuessQuantity}</span>
                  <button onClick={() => handleQuantityChange(1)}>+</button>
                </div>
                <div>
                  <button onClick={handleGuessSubmit}>
                    {translations[language].guess} {playerGuessQuantity} {playerGuess}
                  </button>
                </div>
                {previousPlayerGuess && (
                  <p>Previous player guessed {previousPlayerGuessQuantity} {previousPlayerGuess}</p>
                )}
              </div>
            ) : (
              <p>Waiting for your turn...</p>
            )
          )}
        </>
      )}
  
      {roundInProgress && allPlayersRolled && (
        <>
          {!Object.keys(playersChallenges).length ? (
            <button onClick={() => handleChallenge(false)}>{translations[language].disbelieve}</button>
          ) : (
            <div>
              <button onClick={() => handleChallenge(true)}>{translations[language].believe}</button>
              <button onClick={() => handleChallenge(false)}>{translations[language].disbelieve}</button>
            </div>
          )}
        </>
      )}
  
      {gameData?.players && Object.values(gameData.players).map(player => (
        <div key={player.uid}>
          <p>{player.name}: {player.dice} dice</p>
          {player.uid === user.uid && player.dice === 0 && (
            <p>{translations[language].lostMessage}</p>
          )}
        </div>
      ))}
    </div>
  );
  
};

export default GameplayPage;

