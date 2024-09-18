'use client';

import { useEffect, useState, useContext } from 'react';
import { db } from '../../../firebase.config';
import { ref, onValue, update, push } from 'firebase/database';
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
  const [roundInProgress, setRoundInProgress] = useState(true);
  const [allPlayersRolled, setAllPlayersRolled] = useState(false);
  const [playersChallenges, setPlayersChallenges] = useState({});
  const [winner, setWinner] = useState(null);
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [totalPlayerDice, setTotalPlayerDice] = useState(0);

  const [previousPlayerGuess, setPreviousPlayerGuess] = useState(null);
  const [previousPlayerGuessQuantity, setPreviousPlayerGuessQuantity] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [showGif, setShowGif] = useState(false);

  const [roundResultsMessage, setRoundResultsMessage] = useState('');
  const [moves, setMoves] = useState([]);
  const [secondToLastPlayerUID, setSecondToLastPlayerUID] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25); 

  useEffect(() => {
    if (gameData?.currentTurn === user?.uid && (roundInProgress == true && allPlayersRolled == true ) && gameData?.challengeStatus === false  ) {
      const timer = setTimeout(() => {
        const autoGuessTotal = roundGuessTotal + 1;
        handleAutoGuessSubmit(autoGuessTotal);
      }, gameData?.players[user.uid].dice === 0 ? 300 : 25000); 
  
      return () => clearTimeout(timer); 
    }
  }, [gameData?.currentTurn, roundGuessTotal, gameData?.challengeStatus, allPlayersRolled, playerGuess, playerGuessQuantity]); 
  
  useEffect(() => {
    let timer;
    if (gameData?.currentTurn && (roundInProgress == true && allPlayersRolled == true ) && gameData?.challengeStatus === false   ) {
      setTimeLeft(25);
      // Temporizador que cuenta regresivamente cada segundo.
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime > 1) {
            return prevTime - 1;
          } else {
            clearInterval(timer); 
            return 0; 
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameData?.currentTurn, gameData?.challengeStatus, allPlayersRolled, roundInProgress]);



  useEffect(() => {
    if (!gameCode) return;
  
    const gameRef = ref(db, `games/${gameCode}`);
  
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data);
        setPlayerCount(Object.keys(data.players || {}).length);
        setRoundGuessTotal(data.roundGuessTotal || 0);
        setActualTotalDice(data.actualTotalDice);
        setTotalPlayerDice(calculateTotalPlayerDice(data.players));
        setAllPlayersRolled(data.allPlayersRolled || false); 
        setPlayersChallenges(data.playersChallenges || {});

          if (data.roundResultsMessage) {
            setRoundResultsMessage(data.roundResultsMessage);
          }

        if (data.allPlayersRolled && data.roundInProgress) {
          setRoundInProgress(true);
        } else {
          setRoundInProgress(false);
        }

        // setPreviousPlayerGuess(data?.previousPlayerGuess || '');
        // setPreviousPlayerGuessQuantity(data?.previousPlayerGuessQuantity || 0);

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

  useEffect(() => {
    if (!gameCode) return;
  
    const movesRef = ref(db, `games/${gameCode}/moves`);
    const unsubscribe = onValue(movesRef, (snapshot) => {
      const movesData = snapshot.val();
      if (movesData) {
        const movesArray = Object.values(movesData).sort((a, b) => a.timestamp - b.timestamp);
        setMoves(movesArray);
      }
    });
  
    return () => unsubscribe();
  }, [gameCode]);
  

  useEffect(() => {
    const secondToLastPlayerRef = ref(db, `games/${gameCode}/secondToLastPlayerUID`);
    const handleData = (snapshot) => {
      const data = snapshot.val();
      setSecondToLastPlayerUID(data);
    };
  
    const unsubscribe = onValue(secondToLastPlayerRef, handleData);

    return () => unsubscribe();
  }, [gameCode]);
  




  function translateNumberToSymbol(num) {
    const symbols = ["9", "10", "J", "Q", "K", "A"];
    const baseValues = { "9": 1, "10": 2, "J": 3, "Q": 4, "K": 5, "A": 6 };
    let baseValueSum = 0;
    let increment = 6; // La cantidad de símbolos en el ciclo.

    for (let quantity = 1; quantity <= num; quantity++) {
        for (let i = 0; i < symbols.length; i++) {
            baseValueSum++;
            if (baseValueSum === num) {
                return `${quantity} ${symbols[i]}`;
            }
        }
        increment += 6;
        baseValueSum = increment - 6;
    }

    return null;
}



  const handleGuessSubmit = () => {
    if (playerGuess) {
      const newGuessTotal = getDiceValue(playerGuess, playerGuessQuantity);
      if (newGuessTotal > roundGuessTotal) { 
        console.log("handleguess", playerGuess)
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
          logPlayerMove(user.uid, `${playerGuessQuantity} ${playerGuess}`, undefined);
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


  const handleAutoGuessSubmit = () => {
    setPlayerGuess((currentGuess) => {
      const autoGuess = currentGuess || 'K';  // Esto garantiza que uses el valor más reciente de currentGuess
      const autoGuessQuantity = playerGuessQuantity || 1;
      const autoGuessTotal = getDiceValue(autoGuess, autoGuessQuantity);
  
      if (autoGuessTotal > roundGuessTotal) {
        const updates = {
          roundGuessTotal: autoGuessTotal,
          previousPlayerGuess: autoGuess,
          previousPlayerGuessQuantity: autoGuessQuantity,
          currentTurn: getNextTurn(),
        };
  
        update(ref(db, `games/${gameCode}`), updates)
          .then(() => {
            logPlayerMove(user.uid, translateNumberToSymbol(autoGuessTotal), undefined);
            setError('');
          })
          .catch(error => setError(`Error updating guess: ${error.message}`));
      }
  
      return autoGuess;  // Devuelve el valor actualizado
    });
  };

//   const handleAutoGuessSubmit = (autoGuessTotal) => {
//     const newGuessTotal = getDiceValue(roundGuessTotal + 1, playerGuessQuantity);
//     if (autoGuessTotal > roundGuessTotal) { 
// console.log("auto", playerGuess)
//       const updates = {
//         roundGuessTotal: autoGuessTotal,
//         previousPlayerGuess: playerGuess,
//         previousPlayerGuessQuantity: playerGuessQuantity,
//         currentTurn: getNextTurn()
//       };

//       setPreviousPlayerGuess(playerGuess);
//       setPreviousPlayerGuessQuantity(playerGuessQuantity);
//       setRoundGuessTotal(autoGuessTotal);
//       update(ref(db, `games/${gameCode}`), { roundGuessTotal: autoGuessTotal, currentTurn: getNextTurn() });
//       // setPlayerGuess('');
//       // setPlayerGuessQuantity(1);
//       setError('');

//       update(ref(db, `games/${gameCode}`), updates)
//       .then(() => {
//         logPlayerMove(user.uid, translateNumberToSymbol(autoGuessTotal), undefined);
//         // setPlayerGuess('');
//         // setPlayerGuessQuantity(1);
//         setError(''); 
//       })
//       .catch(error => setError(`Error updating guess: ${error.message}`));
//     }
//   };
  
  


  
  const calculateTotalPlayerDice = (players) => {
    let totalDice = 0;
  
    Object.values(players).forEach(player => {
      // Suma la cantidad de dados que tiene cada jugador
      totalDice += Number(player.dice); 
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
    
    // If there are no active players, return null
    if (activePlayers.length === 0) {
        return null; 
    }

    // Get the index of the current player
    const currentTurnIndex = activePlayers.indexOf(gameData.currentTurn);

    // Start looking for the next player from the current index
    let nextTurnIndex = (currentTurnIndex + 1) % activePlayers.length;

    // Loop until we find a player with dice
    while (gameData.players[activePlayers[nextTurnIndex]].dice <= 0) {
        nextTurnIndex = (nextTurnIndex + 1) % activePlayers.length;

        // If we looped through all players without finding one, return null
        if (nextTurnIndex === currentTurnIndex) {
            return null; // All players have zero dice
        }
    }

    return activePlayers[nextTurnIndex]; // Return the next player with dice
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
    <div className={styles.pageContainer}>

      {gameData?.players[user.uid].dice === 0 ? (
        <div className={styles.lostText}>
          {translations[language].lostMessage}
        </div>
        ) : (
        <div>
          <div className={styles.gameControls}>
            {gameOver && winner ? (
                <p style={{ color: 'green' }}>{winner} {translations[language].winMessage}</p>
              ) : (
                <>
                  {(!roundInProgress || !allPlayersRolled) && (gameData?.currentRound > 1) ? (
                    <div>
                      <button onClick={handleRollDice}>{translations[language].roll}</button>
                    </div>

                  ) : (
                    isPlayerTurn() && !Object.keys(playersChallenges).length ? (
                      <div>
                        <div>
                          {SYMBOLS.map(symbol => (
                            <button key={symbol} onClick={() => handleGuessChange(symbol)}>
                              {symbol}
                            </button>
                          ))}
                        </div>
                        <div className={styles.moreLessButtons}>
                          <button onClick={() => handleQuantityChange(-1)}>-</button>
                          <span>{playerGuessQuantity}</span>
                          <button onClick={() => handleQuantityChange(1)}>+</button>
                        </div>
                        <div>
                          <button onClick={handleGuessSubmit}>
                            {translations[language].guess} {playerGuessQuantity} {playerGuess}
                          </button>
                        </div>
                      </div>
                    ) : ( 
                      <p>Waiting for your turn...</p>
                    ) 
                  )}
                </>
              )}

          </div>
        </div>
        )}

    </div>
  );
  
};

export default GameplayPage;