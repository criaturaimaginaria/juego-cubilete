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
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [totalPlayerDice, setTotalPlayerDice] = useState(0);

  const [previousPlayerGuess, setPreviousPlayerGuess] = useState(null);
  const [previousPlayerGuessQuantity, setPreviousPlayerGuessQuantity] = useState(0);
  const [hasRolled, setHasRolled] = useState(false);
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
  }, [gameData?.currentTurn, roundGuessTotal, gameData?.challengeStatus, allPlayersRolled]); 
  
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


  const handleAutoGuessSubmit = (autoGuessTotal) => {
    const newGuessTotal = getDiceValue(roundGuessTotal + 1, playerGuessQuantity);
    if (autoGuessTotal > roundGuessTotal) { 

      const updates = {
        roundGuessTotal: autoGuessTotal,
        previousPlayerGuess: playerGuess,
        previousPlayerGuessQuantity: playerGuessQuantity,
        currentTurn: getNextTurn()
      };

      setPreviousPlayerGuess(playerGuess);
      setPreviousPlayerGuessQuantity(playerGuessQuantity);
      setRoundGuessTotal(autoGuessTotal);
      update(ref(db, `games/${gameCode}`), { roundGuessTotal: autoGuessTotal, currentTurn: getNextTurn() });
      setPlayerGuess('');
      setPlayerGuessQuantity(1);
      setError('');

      update(ref(db, `games/${gameCode}`), updates)
      .then(() => {
        logPlayerMove(user.uid, translateNumberToSymbol(autoGuessTotal), undefined);
        setPlayerGuess('');
        setPlayerGuessQuantity(1);
        setError(''); 
      })
      .catch(error => setError(`Error updating guess: ${error.message}`));
    }
  };
  

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

  



  const handleRollDice = () => {
    if (gameData && gameData.players && gameData.players[user.uid]) {
      const playerDiceCount = gameData.players[user.uid].dice;
      if (playerDiceCount > 0) {
        const rollResults = [];
        for (let i = 0; i < playerDiceCount; i++) {
          rollResults.push(rollDice());
        }

        // if all symbols are the same
        const allEqual = rollResults.every(symbol => symbol === rollResults[0]);
        let newDiceCount = playerDiceCount;
        if (allEqual && rollResults.length >= 5) {
          newDiceCount += 1; 
        }
        // Update the player's roll results and their roll status :D
        update(ref(db, `games/${gameCode}/players/${user.uid}`), {
          rollResults,
          dice: newDiceCount, 
          hasRolled: true
        }).then(() => {
          // check if all players have rolled
          const updatedPlayers = {
            ...gameData.players,
            [user.uid]: { ...gameData.players[user.uid], rollResults, hasRolled: true }
          };
  
          const allPlayersRolled = Object.values(updatedPlayers).filter(player => player.dice > 0).every(player => player.hasRolled);

          if (allPlayersRolled) {
            const newTotalDice = calculateTotalDice(updatedPlayers);
  
            update(ref(db, `games/${gameCode}`), {
              actualTotalDice: newTotalDice,
              roundInProgress: true,
              allPlayersRolled: true ,
              challengeStatus: false 
            });
          }
        });
      }else {
        // If the player has no dice then they are marked as having rolled anyways :p
        update(ref(db, `games/${gameCode}/players/${user.uid}`), {
          hasRolled: true
        });
      }
    }

    if (!hasRolled) {
      setHasRolled(true);
    }

    const audio = new Audio('/images/dices_sound.mp3');
    audio.play();

    setShowGif(true); 

  setRoundResultsMessage('');

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
  

  
  const endRound = (challenges) => {
    const updates = {};
    let resultsMessage = "Resultados de la ronda anterior:\n";
    let losers = []; // Lista de perdedores

    Object.entries(gameData.players).forEach(([uid, player]) => {
      let messagePart = `${player.name} `;
      // disbelieve
      if (challenges[uid] === false) {
        if (actualTotalDice > roundGuessTotal) {
          updates[`players/${uid}/dice`] = player.dice - 1;
          messagePart += `No creyó que haya mas de ${translateNumberToSymbol(roundGuessTotal)} y si había, habían: ${translateNumberToSymbol(actualTotalDice)} perdió un dado.`;
          losers.push(uid); 
        } else {
          messagePart += `No creyó que hubiese mas de ${translateNumberToSymbol(roundGuessTotal)} y no había, habían: ${translateNumberToSymbol(actualTotalDice)} mantiene sus dados. `;
          losers = losers.filter(loserUid => loserUid !== uid);
        }
        // believe
      } else if (challenges[uid] === true) {
        if (actualTotalDice < roundGuessTotal) {
          updates[`players/${uid}/dice`] = player.dice - 1;
          messagePart += `Creyó que aún había mas de ${translateNumberToSymbol(roundGuessTotal)}, pero no, habían ${translateNumberToSymbol(actualTotalDice)} pierde un dado.`;
          losers.push(uid); 
        } else {
          messagePart += `Creyó que aún había más que ${translateNumberToSymbol(roundGuessTotal)}, y si, como habían ${translateNumberToSymbol(actualTotalDice)} mantiene sus dados.`;
          losers = losers.filter(loserUid => loserUid !== uid);  
        }
      }
      messagePart += "\n";
      resultsMessage += messagePart;

      updates[`players/${uid}/rollResult`] = null;
    });

    updates['losersFromLastRound'] = losers; 

    
    Object.entries(gameData.players).forEach(([uid, player]) => {
      if (player.dice <= 0) {
        // Elimina al jugador si tiene 0 dados
        updates[`players/${uid}/isActive`] = false;
      }
    });
    // select el siguiente turno solo de jugadores activos:
    const nextTurnPlayer = getNextTurn();
    if (nextTurnPlayer) {
      updates['currentTurn'] = nextTurnPlayer;
    } else {
      checkForWinner(gameData.players, gameData.currentRound);
    }

    updates['roundInProgress'] = false;
    updates['currentRound'] = gameData.currentRound + 1;
    updates['roundGuessTotal'] = 0;
    updates['playersChallenges'] = {};
    updates['currentTurn'] = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0)[0];
    updates['challengeStatus'] = false; // Cambia challengeStatus a false

    updates['losersFromLastRound'] = losers;

      // Restablece el valor en la base de datos
    update(ref(db, `games/${gameCode}`), { secondToLastPlayerUID: null });
    setSecondToLastPlayerUID(null);

    for (let playerId in gameData.players) {
      updates[`players/${playerId}/hasRolled`] = false;
      updates[`players/${playerId}/rollResults`] = [];
    }
    updates['allPlayersRolled'] = false;
    updates['roundInProgress'] = false;

    updates['roundResultsMessage'] = resultsMessage;

    // Actualiza el mensaje de resultados de la ronda
    setRoundResultsMessage(resultsMessage);

    update(ref(db, `games/${gameCode}`), updates)
      .then(() => {
        checkForWinner(gameData.players, gameData.currentRound + 1);
      });
};

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


  const checkForWinner = (players, currentRound) => {
    const activePlayers = Object.keys(players).filter(uid => players[uid].dice > 0);
    if (activePlayers.length === 1 && currentRound > 1) {
      const winnerUid = activePlayers[0];
      setGameOver(true);
      setWinner(players[winnerUid].name);
      update(ref(db, `games/${gameCode}`), { gameOver: true, winner: players[winnerUid].name });
    }
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