'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../firebase.config';
import { ref, onValue, update } from 'firebase/database';
import { LanguageContext } from '../../contexts/LenguageContext';
import { useAuth } from '../../contexts/AuthProvider';
import styles from './page.module.css'

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
  const [totalPlayerDice, setTotalPlayerDice] = useState(0);

  
  const [previousPlayerGuess, setPreviousPlayerGuess] = useState(null);
  const [previousPlayerGuessQuantity, setPreviousPlayerGuessQuantity] = useState(0);
  const [hasRolled, setHasRolled] = useState(false);



  useEffect(() => {
    if (!gameCode) return;
  
    const gameRef = ref(db, `games/${gameCode}`);
  
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data);
        setRoundGuessTotal(data.roundGuessTotal || 0);
        setActualTotalDice(data.actualTotalDice);
        setTotalDiceSum(calculateTotalDice(data.players));
        setTotalPlayerDice(calculateTotalPlayerDice(data.players));
        setAllPlayersRolled(data.allPlayersRolled || false); 
        setPlayersChallenges(data.playersChallenges || {});
          console.log( "data FULL", data)
        if (data.allPlayersRolled && data.roundInProgress) {
          setRoundInProgress(true);
        } else {
          setRoundInProgress(false);
        }

        setPreviousPlayerGuess(data.previousPlayerGuess || '');
        setPreviousPlayerGuessQuantity(data.previousPlayerGuessQuantity || 0);

        if (data.currentRound && data.currentRound > 0) {
          checkForWinner(data.players, data.currentRound);
        }
  
        if (data.allPlayersRolled && !data.currentTurn) {
          startFirstTurn(data.players);
        }
      }
    });
  
    return () => unsubscribe();
  }, [gameCode]);
  
  
  
  

  const checkAllPlayersRolled = (players) => {
    return Object.values(players).every(player => player.rollResults && player.rollResults.length > 0);
  };
  
  
  

  const startFirstTurn = (players) => {
    const activePlayers = Object.keys(players).filter(uid => players[uid].dice > 0);
    if (activePlayers.length > 0) {
      const initialTurn = activePlayers[0];
      const updates = {
        currentTurn: initialTurn,
        roundInProgress: true, // Establece en true solo cuando todos los jugadores hayan lanzado dados ---
      };
  
      update(ref(db, `games/${gameCode}`), updates);
    }
  };
  
  

  const handleRollDice = () => {
    if (gameData && gameData.players && gameData.players[user.uid]) {
      const playerDiceCount = gameData.players[user.uid].dice;
      if (playerDiceCount > 0) {
        const rollResults = [];
        for (let i = 0; i < playerDiceCount; i++) {
          rollResults.push(rollDice());
        }
  
        // Update the player's roll results and their roll status :D
        update(ref(db, `games/${gameCode}/players/${user.uid}`), {
          rollResults,
          hasRolled: true
        }).then(() => {
          // check if all players have rolled
          const updatedPlayers = {
            ...gameData.players,
            [user.uid]: { ...gameData.players[user.uid], rollResults, hasRolled: true }
          };
  
          const allPlayersRolled = Object.values(updatedPlayers).every(player => player.hasRolled);
  
          if (allPlayersRolled) {
            const newTotalDice = calculateTotalDice(updatedPlayers);
  
            update(ref(db, `games/${gameCode}`), {
              actualTotalDice: newTotalDice,
              roundInProgress: true,
              allPlayersRolled: true 
            });
          }
        });
      }
    }

    if (!hasRolled) {
      setHasRolled(true);
      const audio = new Audio('/images/dices_sound.mp3');
      audio.play();

    }

  };


  
  const handleGuessSubmit = () => {
    if (playerGuess) {
      const newGuessTotal = getDiceValue(playerGuess, playerGuessQuantity);
      if (newGuessTotal > roundGuessTotal) { 

        const updates = {
          roundGuessTotal: newGuessTotal,
          previousPlayerGuess: playerGuess,
          previousPlayerGuessQuantity: playerGuessQuantity,
          currentTurn: getNextTurn()
        };

        setPreviousPlayerGuess(playerGuess);
        setPreviousPlayerGuessQuantity(playerGuessQuantity);
        setRoundGuessTotal(newGuessTotal);
        update(ref(db, `games/${gameCode}`), { roundGuessTotal: newGuessTotal, currentTurn: getNextTurn() });
        setPlayerGuess('');
        setPlayerGuessQuantity(1);
        setError('');

        update(ref(db, `games/${gameCode}`), updates)
        .then(() => {
          setPlayerGuess('');
          setPlayerGuessQuantity(1);
          setError(''); 
        })
        .catch(error => setError(`Error updating guess: ${error.message}`));

      } else {
        setError("Your guess must be greater than the previous guess."); 
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
          endRound(newChallenges); // Si todos eligieron  termina la ronda
        }
      });
  };
  

  const endRound = (challenges) => {
    const updates = {};
  
    Object.entries(gameData.players).forEach(([uid, player]) => {
      // Rules for believe and disbelieve :p
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
  
    updates['roundInProgress'] = false; 
    updates['currentRound'] = gameData.currentRound + 1;
    updates['roundGuessTotal'] = 0;
    updates['playersChallenges'] = {};
    updates['currentTurn'] = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0)[0];
  

    for (let playerId in gameData.players) {
      updates[`players/${playerId}/hasRolled`] = false;
      updates[`players/${playerId}/rollResults`] = []; // Clear roll results for the next round
    }
    updates['allPlayersRolled'] = false; // Reset allPlayersRolled
    updates['roundInProgress'] = false; // Reset roundInProgress
  
    update(ref(db, `games/${gameCode}`), updates);

    update(ref(db, `games/${gameCode}`), updates)
      .then(() => {
        const newTotalDice = calculateTotalDice(gameData.players);
        setTotalDiceSum(newTotalDice);
        checkForWinner(gameData.players, gameData.currentRound + 1);
      });
  };
  
  
  const calculateTotalPlayerDice = (players) => {
    let totalDice = 0;
  
    Object.values(players).forEach(player => {
      // Suma la cantidad de dados que tiene cada jugador
      totalDice += player.dice; 
    });
  
    return totalDice;
  };
  
  

  const calculateTotalDice = (players) => {
    let total = 0;
  
    Object.values(players).forEach(player => {
      if (player.rollResults && player.rollResults.length > 0) {
        const playerTotal = player.rollResults.reduce((sum, symbol) => {
          return sum + getDiceValue(symbol, 1); 
        }, 0);
        total += playerTotal;
      }
    });
  
    return total;
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
      <h1>Room code <b>{gameCode}</b> </h1>
      <p>Current Round: <b>{gameData?.currentRound}</b> </p>
      {/* <p>Actual Total Dice: {actualTotalDice}</p> */}
      <p>Total Dice value of All Players: <b>{totalDiceSum}</b> </p>
      <p>Total Dice of All Players  <b>{totalPlayerDice}</b> </p> 
      {/* <p>Round Guess Total: {roundGuessTotal}</p> */}
  
      {error && <p style={{ color: 'red' }}>{error}</p>} 
  
      {gameOver && winner ? (
        <p style={{ color: 'green' }}>{winner} {translations[language].winMessage}</p>
      ) : (
        <>
          {!roundInProgress || !allPlayersRolled ? (
            <div>
              <button onClick={handleRollDice}>{translations[language].roll}</button>
                {hasRolled && (
                  <div className={styles.diceContainer}>
                     <img className={styles.diceImg} src="/images/cup.gif" alt="Rolling" />
                  </div>
                 
                )}
            </div>

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
                {/* {previousPlayerGuess && (
                  <p>Previous player guessed {previousPlayerGuessQuantity} {previousPlayerGuess}</p>
                )} */}
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

        {previousPlayerGuess && (
           <p>Last player move <b>{previousPlayerGuessQuantity} {previousPlayerGuess}</b></p>
         )}
  
      {gameData?.players && Object.values(gameData.players).map(player => (
        <div key={player.uid}>
          <p>{player.name}:  <b>{player.dice} dice</b> </p>
          {/* {  player.rollResults && (
            <p>Rolled: {player.rollResults.join(', ')}</p>
          )}
          {player.uid === user.uid && player.dice === 0 && (
            <p>{translations[language].lostMessage}</p>
          )} */}
        </div>
      ))}

    {gameData?.players[user.uid]?.rollResults && (
        <div>
          <h3>Your Dice Roll Results:</h3>
          <div>
            {gameData.players[user.uid].rollResults.map((result, index) => (
              <b key={index}>{result}, </b>
            ))}
          </div>
        </div>
      )}


    </div>
  );
  
};

export default GameplayPage;









