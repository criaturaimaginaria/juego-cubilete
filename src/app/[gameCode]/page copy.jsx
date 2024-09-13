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
  const [visibleResults, setVisibleResults] = useState(true);
  const [moves, setMoves] = useState([]);
  const [secondToLastPlayerUID, setSecondToLastPlayerUID] = useState(null);

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


  

  useEffect(() => {
    const secondToLastPlayerRef = ref(db, `games/${gameCode}/secondToLastPlayerUID`);
    const handleData = (snapshot) => {
      const data = snapshot.val();
      setSecondToLastPlayerUID(data);
    };
  
    const unsubscribe = onValue(secondToLastPlayerRef, handleData);

    return () => unsubscribe();
  }, [gameCode]);
  

  const hasPlayerChosen = (uid) => {
    return playersChallenges && playersChallenges[uid] !== undefined;
  };
  
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

  

const getMyPlayerName = () => {
  if (gameData && user && gameData.players) {
    return gameData.players[user.uid]?.name || "Unknown";
  }
  return "Unknown";
};

const myPlayerName = getMyPlayerName();

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
  

  
  
  const handleChallenge = (believe) => {
  if (secondToLastPlayerUID === null) {
    const secondToLastUID = moves.length >= 2 ? moves[moves.length - 1].uid : null;
    update(ref(db, `games/${gameCode}`), { secondToLastPlayerUID: secondToLastUID });
  }

    const newChallenges = { ...playersChallenges, [user.uid]: believe };
    setPlayersChallenges(newChallenges)
    // update(ref(db, `games/${gameCode}`), { playersChallenges: newChallenges })

  update(ref(db, `games/${gameCode}`), { 
    playersChallenges: newChallenges,
    challengeStatus: true 
  })
      .then(() => {
        // Verifica si todos los jugadores hicieron su elección
        logPlayerMove(user.uid, `${playerGuessQuantity} ${playerGuess}`, believe);
        const activePlayers = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0);
        // si los jugadores activos hicieron su elección
        const allPlayersChallenged = activePlayers.every(uid => newChallenges[uid] !== undefined);

        if (allPlayersChallenged) {
          endRound(newChallenges); 
          update(ref(db, `games/${gameCode}`), { 
            challengeStatus: false 
          })
        }
      });
      setShowGif(false)
  };

  
  const endRound = (challenges) => {
    const updates = {};
    let resultsMessage = "Resultados de la ronda anterior:\n";

    Object.entries(gameData.players).forEach(([uid, player]) => {
      let messagePart = `${player.name} `;
      // disbelieve
      if (challenges[uid] === false) {
        if (actualTotalDice > roundGuessTotal) {
          updates[`players/${uid}/dice`] = player.dice - 1;
          messagePart += `No creyó que haya mas de ${translateNumberToSymbol(roundGuessTotal)} y si había, habían: ${translateNumberToSymbol(actualTotalDice)} perdió un dado.`;
        } else {
          messagePart += `No creyó que hubiese mas de ${translateNumberToSymbol(roundGuessTotal)} y no había, habían: ${translateNumberToSymbol(actualTotalDice)} mantiene sus dados. `;
        }
        // believe
      } else if (challenges[uid] === true) {
        if (actualTotalDice < roundGuessTotal) {
          updates[`players/${uid}/dice`] = player.dice - 1;
          messagePart += `Creyó que aún había mas de ${translateNumberToSymbol(roundGuessTotal)}, pero no, habían ${translateNumberToSymbol(actualTotalDice)} pierde un dado.`;
        } else {
          messagePart += `Creyó que aún había más que ${translateNumberToSymbol(roundGuessTotal)}, y si, como habían ${translateNumberToSymbol(actualTotalDice)} mantiene sus dados.`;
        }
      }
      messagePart += "\n";
      resultsMessage += messagePart;

      updates[`players/${uid}/rollResult`] = null;
    });

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



  const getNextTurn = () => {
    const activePlayers = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0);
    if (activePlayers.length === 0) {
      return null; 
    }
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
      guess: 'Mandar',
      roll: 'Tirar Dados',
      believe: 'Creo',
      disbelieve: 'No creo',
      endRound: 'Frenar Ronda',
      winMessage: 'ha ganado el juego!',
      lostMessage: 'Has perdido.',
    },
    en: {
      guess: 'Guess',
      roll: 'Roll Dice',
      believe: 'Believe',
      disbelieve: 'Disbelieve',
      endRound: 'End Round',
      winMessage: 'has won the game!',
      lostMessage: 'You have lost.',
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
    <div className={styles.pageContainer}>
      <div className={styles.background}></div>

        <div className={styles.myInfo}>
          <h2>My username: <b>{myPlayerName}</b></h2>
        </div>

      <div className={styles.gameStatistics}>

      </div>

        <div className={styles.gameControls}>
          {gameOver && winner ? (
                <p style={{ color: 'green' }}>{winner} {translations[language].winMessage}</p>
              ) : (
                <>
                  {roundResultsMessage && (
                    <button onClick={() => setVisibleResults(!visibleResults)}>
                    { visibleResults ? 'Ocultar' : 'Mostrar'} 
                    </button>
                  )}

                  {visibleResults && (
                    <div className="message-box">
                      {roundResultsMessage && <p>{roundResultsMessage}</p>}
                    </div>
                  )}
                </>
              )}
        </div>


    </div>
  );
  
};

export default GameplayPage;