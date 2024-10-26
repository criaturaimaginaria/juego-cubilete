'use client';

import { useEffect, useState, useContext } from 'react';
import { db } from '../../../firebase.config';
import { ref, onValue, update, push } from 'firebase/database';
import { LanguageContext } from '../../contexts/LenguageContext';
import { useAuth } from '../../contexts/AuthProvider';
import styles from './page.module.css'
import Link from 'next/link';

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
  const [roundGuessTotalNew, setRoundGuessTotalNew] = useState(0);
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
  const [timeLeft, setTimeLeft] = useState(40); 
  const [PlayersSymbolSum, setPlayersSymbolSum] = useState('');
  const [PlayersSymbolSum2, setPlayersSymbolSum2] = useState('');
  const [devilDiceState, setDevilDiceState] = useState('');
  const [devilFinished, setDevilFinished] = useState(false);
  const [devilDiceRollResult, setDevilDiceRollResult] = useState('');
  const [devilSaved, setDevilSaved] = useState(false);
  const [allChallengedListen, setAllChallengedListen] = useState(false);

  const [symbolChangeStatus, setSymbolStatus] = useState(false);
  const [quantityStatus, setQuantityStatus] = useState(false);
  const [userLastGuess, setUserLastGuess] = useState();

  const [menuPopUp, setMenuPopUp] = useState(false);
  const [direction, setDirection] = useState('');
  const [damnedDiceLast, SetDamnedDiceLast] = useState();


  const menuPopUpFunction = (uid) => {
    setMenuPopUp(!menuPopUp)
  };


  useEffect(() => {
    if (secondToLastPlayerUID === user?.uid && gameData?.challengeStatus === true ){
      // believe
      handleChallenge(true)
    }
  }, [gameData?.challengeStatus,]); 

  useEffect(() => {
    if (gameData?.currentTurn === user?.uid && (roundInProgress == true && allPlayersRolled == true ) && gameData?.challengeStatus === false  ) {
      const timer = setTimeout(() => {
        const autoGuessTotal = roundGuessTotal + 1;
        handleAutoGuessSubmit(autoGuessTotal);
      }, gameData?.players[user.uid].dice === 0 ? 300 : 40000); 
  
      return () => clearTimeout(timer); 
    }
  }, [gameData?.currentTurn, roundGuessTotal, gameData?.challengeStatus, allPlayersRolled]); 
  
  useEffect(() => {
    let timer;
    if (gameData?.currentTurn && (roundInProgress == true && allPlayersRolled == true ) && gameData?.challengeStatus === false   ) {
      setTimeLeft(40);
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


        // Update the player's status :D
        update(ref(db, `games/${gameCode}/players/${user.uid}`), {
          lastGuess: autoGuessTotal , 
          // lastGuess: "2 asss",
        }).then(() => {
            console.log("error user state update")
        });


      const updates = {
        roundGuessTotal: autoGuessTotal,
        // previousPlayerGuess: playerGuess,
        // previousPlayerGuessQuantity: playerGuessQuantity,
        previousPlayerGuess: translateNumberToSymbol(roundGuessTotal +1).split(' ')[1],
        previousPlayerGuessQuantity: translateNumberToSymbol(roundGuessTotal +1).split(' ')[0] ,
        currentTurn: getNextTurn(direction)
      };

      setPreviousPlayerGuess(playerGuess);
      // setPreviousPlayerGuessQuantity(playerGuessQuantity);
      setRoundGuessTotal(autoGuessTotal);
      update(ref(db, `games/${gameCode}`), { roundGuessTotal: autoGuessTotal, currentTurn: getNextTurn(direction) });
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
        setDirection(data.roundDirection || 'forward');
        setUserLastGuess(data.players[user.uid].lastGuess)
        setRoundGuessTotalNew(data.roundGuessTotal + 1 || 0);
        setActualTotalDice(data.actualTotalDice);
        SetDamnedDiceLast(data.resultDevilDice)
        setTotalPlayerDice(calculateTotalPlayerDice(data.players));
        setAllPlayersRolled(data.allPlayersRolled || false); 
        setPlayersChallenges(data.playersChallenges || {});
        setPlayersSymbolSum(data.symbolsSume)
        // setPlayersSymbolSum2(data.symbolsSume)
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

        setPlayerGuess(data.previousPlayerGuess ? data.previousPlayerGuess: '');
        setPlayerGuessQuantity(data.previousPlayerGuessQuantity ? data.previousPlayerGuessQuantity : 1);

      }
    });
    // console.log("PlayersSymbolSum useffect 1", PlayersSymbolSum)
    return () => unsubscribe();
  }, [gameCode]);

  useEffect(() => {
    if (!gameCode) return;
  
    const gameRef = ref(db, `games/${gameCode}/symbolsSume`);
  
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayersSymbolSum(data);
      }
    });
  // console.log("PlayersSymbolSum useffect 2", PlayersSymbolSum)
    return () => unsubscribe();
  }, [gameCode, devilFinished]);

  useEffect(() => {
    if (!devilFinished) return; // Solo ejecuta si isEndRound es true

    const timeoutId = setTimeout(() => {
      endRound(playersChallenges);
    }, 2000); // 2000 milisegundos = 2 segundos

    return () => clearTimeout(timeoutId);

  }, [ devilFinished]);

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
  }, [gameCode, devilFinished]);
  

  useEffect(() => {
    const secondToLastPlayerRef = ref(db, `games/${gameCode}/secondToLastPlayerUID`);
    const handleData = (snapshot) => {
      const data = snapshot.val();
      setSecondToLastPlayerUID(data);
    };
  
    const unsubscribe = onValue(secondToLastPlayerRef, handleData);

    return () => unsubscribe();
  }, [gameCode]);
  
  useEffect(() => {
    const gameRef = ref(db, `games/${gameCode}/allPlayersChallenged`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setAllChallengedListen(data); 
        // console.log("allPlayersChallenged changed:", data);
      }
    });

    return () => unsubscribe();
  }, [gameCode]); 
  
  const logPlayerMove = (uid, guess, believe) => {
    const movesRef = ref(db, `games/${gameCode}/moves`);
    const newMoveRef = push(movesRef);
    
    const moveData = {
      uid,
      guess,
      timestamp: Date.now(), // pa asegurar el orden cronológico
    };
    
    if (believe === true || believe === false) {
      moveData.believe = believe;
    }
    if (!moves.some(move => move.uid === uid && move.guess === guess)) {
      update(newMoveRef, moveData);
    }
    // update(newMoveRef, moveData);
  };

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

  
const getCurrentPlayerName = () => {
  if (gameData && gameData.currentTurn && gameData.players) {
    const currentPlayer = gameData.players[gameData.currentTurn];
    return currentPlayer ? currentPlayer.name : "Unknown Player";
  }
  return "";
};

const getMyPlayerName = () => {
  if (gameData && user && gameData.players) {
    return gameData.players[user.uid]?.name || "Unknown";
  }
  return "Unknown";
};

const myPlayerName = getMyPlayerName();

















  const startFirstTurn = (players) => {
    // Filtra los jugadores activos
    const activePlayers = Object.keys(players).filter(uid => players[uid]?.dice > 0);
    
    if (activePlayers.length > 0) {
      const gameRef = ref(db, `games/${gameCode}`);
      
      // Obtén los perdedores de la ronda anterior
      onValue(ref(db, `games/${gameCode}/losersFromLastRound`), (snapshot) => {
        const losers = snapshot.val() || [];
        
        // Filtra los perdedores que siguen activos
        const activeLosers = losers.filter(uid => players[uid] && players[uid].dice > 0);
        
        // Si hay perdedores activos, elige el primero de ellos, si no, elige otro jugador activo
        const initialTurn = activeLosers.length > 0 ? activeLosers[0] : activePlayers[0];
        
        const updates = {
          currentTurn: initialTurn,
          roundInProgress: true,
        };
  
        // Actualiza los datos del juego
        update(gameRef, updates);
      });
    } else {
      console.log('No hay jugadores activos con dados.');
    }
  };
  


  const handleRollDice = () => {

    update(ref(db, `games/${gameCode}`), {
      showDamnedDice: false
    });


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

            const symbolsSume = SYMBOLS.reduce((acc, symbol) => {
              acc[symbol] = 0;
              return acc;
            }, {});

                      // Sumar los símbolos de cada jugador al objeto symbolsSume
          Object.values(updatedPlayers).forEach(player => {
            if (player.rollResults) {
              player.rollResults.forEach(symbol => {
                if (symbolsSume[symbol] !== undefined) {
                  symbolsSume[symbol] += 1;
                }
              });
            }
          });

  
            update(ref(db, `games/${gameCode}`), {
              actualTotalDice: newTotalDice,
              symbolsSume, // Se añade symbolsSume a la base de datos
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

        // Update the player's status :D
        update(ref(db, `games/${gameCode}/`), {
          previousPlayerGuessQuantity: 0 , 
          previousPlayerGuess:'',
        }).then(() => {
            // console.log("error user state update")
        });



  };
























  const handleGuessSubmit = () => {
    if (playerGuess) {
      const newGuessTotal = getDiceValue(playerGuess, playerGuessQuantity);

      // if ((newGuessTotal > roundGuessTotal)  || (roundGuessTotalNew > roundGuessTotal) ) { 
        if ((newGuessTotal > roundGuessTotal) ) { 
        update(ref(db, `games/${gameCode}/players/${user.uid}`), {
          lastGuess: newGuessTotal == roundGuessTotal?  roundGuessTotalNew : newGuessTotal , 
          // lastGuess: newGuessTotal, 

        }).then(() => {
            console.log("error user state update")
        });

        const updates = {
          roundGuessTotal: newGuessTotal == roundGuessTotal?  roundGuessTotalNew : newGuessTotal ,
          // roundGuessTotal: newGuessTotal,
          previousPlayerGuess: playerGuess,
          previousPlayerGuess: newGuessTotal == roundGuessTotal?  translateNumberToSymbol(roundGuessTotalNew).split(' ')[1] : playerGuess ,
          // previousPlayerGuessQuantity: playerGuessQuantity,
          previousPlayerGuessQuantity: newGuessTotal == roundGuessTotal?  translateNumberToSymbol(roundGuessTotalNew).split(' ')[0] : playerGuessQuantity ,
          currentTurn: getNextTurn(direction)
        };

        setPreviousPlayerGuess(playerGuess);
        setPreviousPlayerGuessQuantity(playerGuessQuantity);
        setRoundGuessTotal( newGuessTotal == roundGuessTotal?  roundGuessTotalNew : newGuessTotal );
        // setRoundGuessTotal(newGuessTotal);
        update(ref(db, `games/${gameCode}`), { roundGuessTotal: newGuessTotal, currentTurn: getNextTurn(direction) });
        setPlayerGuess('');
        setPlayerGuessQuantity(1);
        setError('');
        setSymbolStatus(false)
        setQuantityStatus(false)

        update(ref(db, `games/${gameCode}`), updates)
        .then(() => {
          logPlayerMove(user.uid, `${playerGuessQuantity} ${playerGuess}`, undefined);
          setPlayerGuess('');
          setPlayerGuessQuantity(1);
          setError(''); 
        })
        .catch(error => setError(`Error updating guess: ${error.message}`));

      } else if(((roundGuessTotalNew > roundGuessTotal) && (newGuessTotal >= roundGuessTotal )) && (symbolChangeStatus !== true || quantityStatus !== true)){



        update(ref(db, `games/${gameCode}/players/${user.uid}`), {
          lastGuess: newGuessTotal == roundGuessTotal?  roundGuessTotalNew : newGuessTotal , 
          // lastGuess: newGuessTotal, 

        }).then(() => {
            console.log("error user state update")
        });

        const updates = {
          roundGuessTotal: newGuessTotal == roundGuessTotal?  roundGuessTotalNew : newGuessTotal ,
          // roundGuessTotal: newGuessTotal,
          previousPlayerGuess: playerGuess,
          previousPlayerGuess: newGuessTotal == roundGuessTotal?  translateNumberToSymbol(roundGuessTotalNew).split(' ')[1] : playerGuess ,
          // previousPlayerGuessQuantity: playerGuessQuantity,
          previousPlayerGuessQuantity: newGuessTotal == roundGuessTotal?  translateNumberToSymbol(roundGuessTotalNew).split(' ')[0] : playerGuessQuantity ,
          currentTurn: getNextTurn(direction)
        };

        setPreviousPlayerGuess(playerGuess);
        setPreviousPlayerGuessQuantity(playerGuessQuantity);
        setRoundGuessTotal( newGuessTotal == roundGuessTotal?  roundGuessTotalNew : newGuessTotal );
        // setRoundGuessTotal(newGuessTotal);
        update(ref(db, `games/${gameCode}`), { roundGuessTotal: newGuessTotal, currentTurn: getNextTurn(direction) });
        setPlayerGuess('');
        setPlayerGuessQuantity(1);
        setError('');
        setSymbolStatus(false)
        setQuantityStatus(false)

        update(ref(db, `games/${gameCode}`), updates)
        .then(() => {
          logPlayerMove(user.uid, `${playerGuessQuantity} ${playerGuess}`, undefined);
          setPlayerGuess('');
          setPlayerGuessQuantity(1);
          setError(''); 
        })
        .catch(error => setError(`Error updating guess: ${error.message}`))

      }
      else {
        setError("Your guess must be greater than the previous guess."); 
      }
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

        update(ref(db, `games/${gameCode}`), { allPlayersChallenged });

        let symbolGuess = translateNumberToSymbol(roundGuessTotal).split(' ')[1]
        let symbolNumberGuess = translateNumberToSymbol(roundGuessTotal).split(' ')[0]

        if (allPlayersChallenged && symbolNumberGuess - PlayersSymbolSum[symbolGuess] === 1) {
          setDevilDiceState(true);
      } else if (allPlayersChallenged) {
          endRound(newChallenges); 
          update(ref(db, `games/${gameCode}`), { 
              challengeStatus: false 
          });
      }

      });
      setShowGif(false)
  };


  const devilDice = () => {
    const updates = {};
    let symbolGuess = translateNumberToSymbol(roundGuessTotal).split(' ')[1]
    let symbolNumberGuess = translateNumberToSymbol(roundGuessTotal).split(' ')[0]
    let realSymbolNumberGuess = PlayersSymbolSum[symbolGuess]

    let rollDevilDice = rollDice()
    setDevilDiceRollResult(rollDevilDice)


    update(ref(db, `games/${gameCode}`), {
      resultDevilDice: rollDevilDice,
      showDamnedDice: true
    });


    const challenges =  playersChallenges[user?.uid] 

    Object.entries(gameData.players).forEach(([uid, player]) => {

        // believe
       if (challenges === true) {
        // if (actualTotalDice < roundGuessTotal) {
        if (PlayersSymbolSum[symbolGuess]  < symbolNumberGuess && rollDevilDice == symbolGuess ) {
          updates[`symbolsSume/${symbolGuess}`] = PlayersSymbolSum[symbolGuess] + 1;
          updates['actualTotalDice'] = actualTotalDice + 6;
          setDevilSaved(true)
          console.log("devil dice te salvó")
        } else {
          console.log("nada ocurre, el dado maldito no te salvó")
        }
      }
    });
    // setDevilDiceState(false)
    
setDevilFinished(true)

    update(ref(db, `games/${gameCode}`), updates)
      .then(() => {

      });

  };
  






  

//   const endRound = (challenges) => {
//     const updates = {};
//     let resultsMessage = "Resultados de la ronda anterior:\n";
//     let losers = []; // Lista de perdedores
//     let symbolGuess = translateNumberToSymbol(roundGuessTotal).split(' ')[1]
//     let symbolNumberGuess = translateNumberToSymbol(roundGuessTotal).split(' ')[0]
//     let realSymbolNumberGuess = PlayersSymbolSum[symbolGuess]
//     let symbolSumPreDevil = devilSaved == true ? PlayersSymbolSum2[symbolGuess] - 1 : PlayersSymbolSum2[symbolGuess] // symbolSume value antes de activar dado maldito 

//     let PlayersSymbolSumNum = Number(PlayersSymbolSum[symbolGuess])

//     Object.entries(gameData.players).forEach(([uid, player]) => {
//       let messagePart = `${player.name} `;
//       // disbelieve
//       if (challenges[uid] === false) {
//         // if (actualTotalDice > roundGuessTotal) {
//         if (PlayersSymbolSumNum> symbolNumberGuess) {
//           updates[`players/${uid}/dice`] = player.dice - 1;
//           messagePart += `*1* No creyó que haya mas de ${translateNumberToSymbol(roundGuessTotal)} y si había, habían: ${realSymbolNumberGuess} ${ symbolGuess} perdió un dado.`;
//           losers.push(uid); 
//         }
//         else if (devilFinished === true && realSymbolNumberGuess > symbolSumPreDevil ) {
//           updates[`players/${uid}/dice`] = player.dice - 1;
//           messagePart += `*2* believe ${(symbolSumPreDevil)} y ${(realSymbolNumberGuess)} pierde un dado devildice en contra`;
//           losers.push(uid); 
//         } 
//         else if (devilFinished === true && realSymbolNumberGuess == symbolSumPreDevil ) {
//           messagePart += `*3* disbelieve ${(symbolSumPreDevil)} y ${(realSymbolNumberGuess)} mantiene dado, devildice a favor`;
//           losers = losers.filter(loserUid => loserUid !== uid);
//         } 
//         else if (PlayersSymbolSumNum == symbolNumberGuess) {
//           updates[`players/${uid}/dice`] = player.dice - 1;
//           messagePart += `*4*  creyó que haya mas de ${translateNumberToSymbol(roundGuessTotal)} y como habían: ${realSymbolNumberGuess} ${ symbolGuess} mantiene sus dados.`;
//           losers = losers.filter(loserUid => loserUid !== uid);
//         }
//         else {
//           messagePart += `*5* No creyó que hubiese mas de ${translateNumberToSymbol(roundGuessTotal)} y no había, habían: ${realSymbolNumberGuess} ${ symbolGuess}  mantiene sus dados. `;
//           losers = losers.filter(loserUid => loserUid !== uid);
//         }
//         // believe
//       } else if (challenges[uid] === true) {
//         // if (actualTotalDice < roundGuessTotal) {
//         if (PlayersSymbolSumNum < symbolNumberGuess) {
//           updates[`players/${uid}/dice`] = player.dice - 1;
//           messagePart += `*6* Creyó que aún había mas de ${translateNumberToSymbol(roundGuessTotal)}, pero no, habían ${realSymbolNumberGuess} ${ symbolGuess} pierde un dado.`;
//           losers.push(uid); 
//         }
//         else if (devilFinished === true && realSymbolNumberGuess > symbolSumPreDevil ) {
//           messagePart += `*7* believe ${(symbolSumPreDevil)} y ${(realSymbolNumberGuess)} mandiene dado, devildice a favor`;
//           losers = losers.filter(loserUid => loserUid !== uid);  
//         } 
//         else if (devilFinished === true && realSymbolNumberGuess == symbolSumPreDevil ) {
//           updates[`players/${uid}/dice`] = player.dice - 1;
//           messagePart += `*8* believe ${(symbolSumPreDevil)} y ${(realSymbolNumberGuess)} pierde dado, devildice en contra`;
//           losers.push(uid); 
//         } 
//         else if (realSymbolNumberGuess  == symbolNumberGuess) {
//           // updates[`players/${uid}/dice`] = player.dice - 1;
//           messagePart += `*9*Creyó que aún había mas de ${translateNumberToSymbol(roundGuessTotal)}, pero habían ${realSymbolNumberGuess} ${ symbolGuess} pierde un dado.`;
//           losers.push(uid); 
//         } 
//         else {
//           messagePart += `*10* Creyó que aún había más que ${translateNumberToSymbol(roundGuessTotal)}, y si, como habían ${realSymbolNumberGuess} ${ symbolGuess}  mantiene sus dados.`;
//           losers = losers.filter(loserUid => loserUid !== uid);  
//         }
//       }
//       messagePart += "\n";
//       resultsMessage += messagePart;

//       updates[`players/${uid}/rollResult`] = null;
//     });

//     updates['losersFromLastRound'] = losers; 

    
//     Object.entries(gameData.players).forEach(([uid, player]) => {
//       if (player.dice <= 0) {
//         // Elimina al jugador si tiene 0 dados
//         updates[`players/${uid}/isActive`] = false;
//       }
//     });
//     // select el siguiente turno solo de jugadores activos:
//     const nextTurnPlayer = getNextTurn(direction);
//     if (nextTurnPlayer) {
//       updates['currentTurn'] = nextTurnPlayer;
//     } else {
//       checkForWinner(gameData.players, gameData.currentRound);
//     }

//     updates['roundInProgress'] = false;
//     updates['currentRound'] = gameData.currentRound + 1;
//     updates['roundGuessTotal'] = 0;
//     updates['playersChallenges'] = {};
//     updates['currentTurn'] = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0)[0];
//     updates['challengeStatus'] = false; // Cambia challengeStatus a false
//     updates['roundGuessTotal'] = 0;  

//     updates['symbolsSume'] = [];

//       // Restablece el valor en la base de datos
//     update(ref(db, `games/${gameCode}`), { secondToLastPlayerUID: null });
//     setSecondToLastPlayerUID(null);

//     for (let playerId in gameData.players) {
//       updates[`players/${playerId}/hasRolled`] = false;
//       updates[`players/${playerId}/rollResults`] = [];
//     }
//     updates['allPlayersRolled'] = false;
//     updates['roundInProgress'] = false;
//     updates['allPlayersChallenged'] = false;

//     updates['roundResultsMessage'] = resultsMessage;

//     // Actualiza el mensaje de resultados de la ronda
//     setRoundResultsMessage(resultsMessage);
//     setDevilDiceState('')
//     setDevilFinished(false)
//     setDevilSaved(false)


//       setTimeout(() => {
//           update(ref(db, `games/${gameCode}`), updates)
//           .then(() => {
//             checkForWinner(gameData.players, gameData.currentRound + 1);
//           });
//       }, 4000); 

// };













const endRound = (challenges) => {
  const updates = {};
  let resultsMessage = "Resultados de la ronda anterior:\n";
  let losers = []; // Lista de perdedores
  let symbolGuess = translateNumberToSymbol(roundGuessTotal).split(' ')[1]
  let symbolNumberGuess = translateNumberToSymbol(roundGuessTotal).split(' ')[0]
  let realSymbolNumberGuess = PlayersSymbolSum[symbolGuess]
  let symbolSumPreDevil = devilSaved == true ? PlayersSymbolSum2[symbolGuess] - 1 : PlayersSymbolSum2[symbolGuess] // symbolSume value antes de activar dado maldito 

  let PlayersSymbolSumNum = Number(PlayersSymbolSum[symbolGuess])

  Object.entries(gameData.players).forEach(([uid, player]) => {
    let messagePart = `${player.name} `;
    // disbelieve
    if (challenges[uid] === false) {
      // if (actualTotalDice > roundGuessTotal) {
      if (PlayersSymbolSumNum> symbolNumberGuess) {
        updates[`players/${uid}/dice`] = player.dice - 1;
        messagePart += `*1* No creyó que haya mas de ${translateNumberToSymbol(roundGuessTotal)} y si había, habían: ${realSymbolNumberGuess} ${ symbolGuess} perdió un dado.`;
        losers.push(uid); 
      }
      else if (devilFinished === true && realSymbolNumberGuess > symbolSumPreDevil ) {
        updates[`players/${uid}/dice`] = player.dice - 1;
        messagePart += `*2* believe ${(symbolSumPreDevil)} y ${(realSymbolNumberGuess)} pierde un dado devildice en contra`;
        losers.push(uid); 
      } 
      else if (devilFinished === true && realSymbolNumberGuess == symbolSumPreDevil ) {
        messagePart += `*3* disbelieve ${(symbolSumPreDevil)} y ${(realSymbolNumberGuess)} mantiene dado, devildice a favor`;
        losers = losers.filter(loserUid => loserUid !== uid);
      } 
      else if (PlayersSymbolSumNum == symbolNumberGuess) {
        updates[`players/${uid}/dice`] = player.dice - 1;
        messagePart += `*4*  creyó que haya mas de ${translateNumberToSymbol(roundGuessTotal)} y como habían: ${realSymbolNumberGuess} ${ symbolGuess} mantiene sus dados.`;
        losers = losers.filter(loserUid => loserUid !== uid);
      }
      else {
        messagePart += `*5* No creyó que hubiese mas de ${translateNumberToSymbol(roundGuessTotal)} y no había, habían: ${realSymbolNumberGuess} ${ symbolGuess}  mantiene sus dados. `;
        losers = losers.filter(loserUid => loserUid !== uid);
      }
      // believe
    } else if (challenges[uid] === true) {
      // if (actualTotalDice < roundGuessTotal) {
      if (PlayersSymbolSumNum < symbolNumberGuess) {
        updates[`players/${uid}/dice`] = player.dice - 1;
        messagePart += `*6* Creyó que aún había mas de ${translateNumberToSymbol(roundGuessTotal)}, pero no, habían ${realSymbolNumberGuess} ${ symbolGuess} pierde un dado.`;
        losers.push(uid); 
      }
      else if (devilFinished === true && realSymbolNumberGuess > symbolSumPreDevil ) {
        messagePart += `*7* believe ${(symbolSumPreDevil)} y ${(realSymbolNumberGuess)} mandiene dado, devildice a favor`;
        losers = losers.filter(loserUid => loserUid !== uid);  
      } 
      else if (devilFinished === true && realSymbolNumberGuess == symbolSumPreDevil ) {
        updates[`players/${uid}/dice`] = player.dice - 1;
        messagePart += `*8* believe ${(symbolSumPreDevil)} y ${(realSymbolNumberGuess)} pierde dado, devildice en contra`;
        losers.push(uid); 
      } 
      else if (realSymbolNumberGuess  == symbolNumberGuess) {
        // updates[`players/${uid}/dice`] = player.dice - 1;
        messagePart += `*9*Creyó que aún había mas de ${translateNumberToSymbol(roundGuessTotal)}, pero habían ${realSymbolNumberGuess} ${ symbolGuess} pierde un dado.`;
        losers.push(uid); 
      } 
      else {
        messagePart += `*10* Creyó que aún había más que ${translateNumberToSymbol(roundGuessTotal)}, y si, como habían ${realSymbolNumberGuess} ${ symbolGuess}  mantiene sus dados.`;
        losers = losers.filter(loserUid => loserUid !== uid);  
      }
    }
    messagePart += "\n";
    resultsMessage += messagePart;

    // updates[`players/${uid}/rollResult`] = null;
    updates[`players/${uid}/lastGuess`] = null;
  });

  updates['losersFromLastRound'] = losers; 

  
  Object.entries(gameData.players).forEach(([uid, player]) => {
    if (player.dice <= 0) {
      // Elimina al jugador si tiene 0 dados
      updates[`players/${uid}/isActive`] = false;
    }
  });
  // select el siguiente turno solo de jugadores activos:
  const nextTurnPlayer = getNextTurn(direction);
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
  updates['roundGuessTotal'] = 0;  

  updates['symbolsSume'] = [];

    // Restablece el valor en la base de datos
  update(ref(db, `games/${gameCode}`), { secondToLastPlayerUID: null });
  setSecondToLastPlayerUID(null);

  for (let playerId in gameData.players) {
    updates[`players/${playerId}/hasRolled`] = false;
    // updates[`players/${playerId}/rollResults`] = [];
  }
  updates['allPlayersRolled'] = false;
  updates['roundInProgress'] = false;
  updates['allPlayersChallenged'] = false;

  updates['roundResultsMessage'] = resultsMessage;

  // Actualiza el mensaje de resultados de la ronda
  setRoundResultsMessage(resultsMessage);
  setDevilDiceState('')
  setDevilFinished(false)
  setDevilSaved(false)


    setTimeout(() => {
        update(ref(db, `games/${gameCode}`), updates)
        .then(() => {
          checkForWinner(gameData.players, gameData.currentRound + 1);
        });
    }, 200); 

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



//   const getNextTurn = () => {
//     const activePlayers = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0);
    
//     if (activePlayers.length === 0) {
//         return null; 
//     }

//     const currentTurnIndex = activePlayers.indexOf(gameData.currentTurn);
//     let nextTurnIndex = (currentTurnIndex + 1) % activePlayers.length;

//     while (gameData.players[activePlayers[nextTurnIndex]].dice <= 0) {
//         nextTurnIndex = (nextTurnIndex + 1) % activePlayers.length;

//         if (nextTurnIndex === currentTurnIndex) {
//             return null; 
//         }
//     }
//     return activePlayers[nextTurnIndex];
// };


const getNextTurn = (direction) => {
  const activePlayers = Object.keys(gameData.players).filter(uid => gameData.players[uid].dice > 0);
  
  if (activePlayers.length === 0) {
      return null; 
  }

  const currentTurnIndex = activePlayers.indexOf(gameData.currentTurn);
  let nextTurnIndex;

  if (direction === 'forward') {
      nextTurnIndex = (currentTurnIndex + 1) % activePlayers.length;
  } else if (direction === 'backward') {
      nextTurnIndex = (currentTurnIndex - 1 + activePlayers.length) % activePlayers.length;
  }

  while (gameData?.players[activePlayers[nextTurnIndex]]?.dice <= 0) {
      if (direction === 'forward') {
          nextTurnIndex = (nextTurnIndex + 1) % activePlayers.length;
      } else if (direction === 'backward') {
          nextTurnIndex = (nextTurnIndex - 1 + activePlayers.length) % activePlayers.length;
      }

      if (nextTurnIndex === currentTurnIndex) {
          return null; 
      }
  }

  return activePlayers[nextTurnIndex];
};





const handleDirectionChange = () => {

  if(direction === 'forward'){
    setDirection('backward')
    update(ref(db, `games/${gameCode}`), {
      roundDirection: 'backward',
    });
  }
  if(direction === 'backward'){
    setDirection('forward')
    update(ref(db, `games/${gameCode}`), {
      roundDirection: 'forward',
    });
  }

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
      send: 'Enviar',
      roll: 'Tirar Dados',
      believe: 'Creo',
      disbelieve: 'No creo',
      endRound: 'Frenar Ronda',
      winMessage: 'ha ganado el juego!',
      lostMessage: 'Has perdido.',
    },
    en: {
      guess: 'Guess',
      send: 'Send',
      roll: 'Roll Dice',
      believe: 'Believe',
      disbelieve: 'Disbelieve',
      endRound: 'End Round',
      winMessage: 'has won the game!',
      lostMessage: 'You have lost.',
    },
  };

  const handleGuessChange = (symbol) => {
    setSymbolStatus(true)
    setPlayerGuess(symbol);
  };

  // const handleQuantityChange = (increment) => {
  //   setPlayerGuessQuantity(prevQuantity => {
  //     const newQuantity = prevQuantity + increment;
  //     return newQuantity > 0 ? newQuantity : 1;
  //   });
  // };

  const handleQuantityChange = (increment) => {
    setQuantityStatus(true)
    setPlayerGuessQuantity(prevQuantity => {
      const newQuantity = Number(prevQuantity) + increment; 
      return newQuantity > 0 ? newQuantity : 1;
    });
  };

  if (!gameCode) {
    return <div>Error: No game code provided</div>;
  }


  // const playerKeys = Object.keys(gameData?.players || {}); // Obtiene las claves (userIds)
  // const filteredPlayers = playerKeys.filter(playerKey => playerKey !== user?.uid);

  // const currentPlayerIndex = playerKeys.indexOf(user.uid);
  // const before = playerKeys.slice(0, currentPlayerIndex);
  // const after = playerKeys.slice(currentPlayerIndex + 1); 

  // const leftSidePlayers = [...before.slice(-Math.ceil(before.length / 2)), ...after.slice(0, Math.floor(after.length / 2))];
  // const rightSidePlayers = [...after.slice(Math.floor(after.length / 2)), ...before.slice(0, Math.ceil(before.length / 2))];


// -----------------------/////////////---------------------------

const playerKeys = Object.keys(gameData?.players || {}); 
const filteredPlayers = playerKeys.filter(playerKey => playerKey !== user?.uid); 

const totalPlayers = filteredPlayers.length;
const currentPlayerIndex = playerKeys.indexOf(user?.uid);  

const rearrangedPlayers = [
  ...filteredPlayers.slice(currentPlayerIndex), 
  ...filteredPlayers.slice(0, currentPlayerIndex) 
];

const half = Math.ceil(totalPlayers / 2);

let leftSidePlayers = [];
let rightSidePlayers = [];

for (let i = 0; i < totalPlayers; i++) {
    if (i < half) {
        leftSidePlayers.push(rearrangedPlayers[i]); 
    } else {
        rightSidePlayers.push(rearrangedPlayers[i]); 
    }
}

if (leftSidePlayers.length < half) {
    // console.log('Jugador principal estaría al final de leftSidePlayers');
} else {
    // console.log('Jugador principal debería estar después de los jugadores a la derecha');
}

rightSidePlayers = rightSidePlayers.filter(player => !leftSidePlayers.includes(player));
leftSidePlayers = leftSidePlayers.filter(player => !rightSidePlayers.includes(player));


  // console.log("filteredPlayers", user?.uid)
  // console.log("playerKeys", playerKeys)
  // console.log("leftSidePlayers", leftSidePlayers)
  // console.log("rightSidePlayers", rightSidePlayers)
  // console.log("filteredPlayers", filteredPlayers)


  return (
    <div className={styles.pageContainer}>
      <div className={styles.background}></div>
        <div className={styles.gameContainer}>

           <div className={menuPopUp == true ? styles.menuPopUp : styles.menuPopUpClosed}>
              <div className={styles.popUpContent}>
                <button className={styles.closeButton} onClick={() => menuPopUpFunction()}>Close</button>

                Menú

                <Link href="/" passHref>
                  <button className={styles.goHomeButton}>Ir a Inicio</button>
                </Link>
              </div>
            </div>

          <div className={styles.tableContainer}>



            <div className={styles.roundCountContainer}>
              <p>Current Round: <b>{gameData?.currentRound}</b> </p>
            </div>

            <div onClick={() => menuPopUpFunction()}
             className={styles.menuContainer}>
              <button >Menu</button>
            </div>

            <div className={styles.countdownContainer}>
              <div className={styles.circle}>
                <div
                  className={styles.filler}
                  style={{
                    background: `conic-gradient(#fff 0% calc(${(timeLeft / 40) * 100}%), ${timeLeft <= 7 ? '#d10000' : '#000'} calc(${(timeLeft / 40) * 100}%))`,
                    transition: 'background 1s ease-in-out', // Transición suave
                  }}
                />
              </div>
                <p className={styles.timeText}>
                  <p>Tiempo: <b style={{ color: timeLeft <= 7 ? '#fff' : '#fff' }}>{timeLeft}</b> </p>
                </p>
            </div>

            <div className={styles.challengeButtonContainer}>
              {gameData?.players[user?.uid].dice === 0 ? (
                <div></div>
                ) : (
                <div>
                  <div className={styles.gameControls2}>
                    {/* {roundInProgress && allPlayersRolled && ( */}
                    {roundInProgress && allPlayersRolled && userLastGuess !== roundGuessTotal && (
                      <>
                        {!Object.keys(playersChallenges).length ? (
                          <button 
                            onClick={() => handleChallenge(false)} 
                            disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                            style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                          >
                            {translations[language].disbelieve}
                          </button>
                        ) : (
                         
                          <>
                            {secondToLastPlayerUID === user?.uid ?  (
                                <button 
                                  onClick={() => handleChallenge(true)} 
                                  disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                                  style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                                >
                                  {translations[language].believe}
                                </button>
                            
                            ) : (
                              <>




                              {/* 
                              --------------////////////----------------/////////////////---------------////////////-------
                              IMPORTANT! handleDirectionChange funciona, cambia la dirección de la ronda,
                              si es para delante o para atrás. La comento porque aún no está posicionada en
                              los diseños, así que no se donde meterla. Se muestra solo al comienzo.

                              se puede mostrar solamente si roundGuessTotal es == a cero, porque solo el primer
                              jugador en su primer turno puede decidir para dodne va la ronda. Creo este botón se
                              mostraba mas adelante en lo de believe y disbelieve, pero ahí lo podemos mostrar con
                              otras condiciones
                              
                              */}
                              {/* <button onClick={handleDirectionChange}>
                                  Cambiar dirección a {direction === 'forward' ? 'backward' : 'forward'}
                              </button>
                              --------------////////////----------------/////////////////---------------////////////-------
                              */}




                              {/* <button 
                                onClick={() => handleChallenge(true)} 
                                disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                                style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                              >
                                {translations[language].believe}
                              </button>
                                <button 
                                  onClick={() => handleChallenge(false)} 
                                  disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                                  style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                                >
                                  Disbelieve
                                </button> */}
                              </>
                            )}
                         </>
                        )}
                      </>
                    )}

                  </div>
                </div>
                )}
            </div>



          {/* <div className={styles.mesaContainer}>
            <div className={styles.mesa}>
              {filteredPlayers.map(playerKey => (
                <div key={playerKey} className={styles.jugadorContainer}>

                  <div className={styles.cuadradoVerde}></div>

                  <div className={styles.cuadradoRojo}>
                    {gameData?.players[playerKey]?.name}
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* <div className={styles.mesaContainer}>
            <div className={styles.mesa}>
              {filteredPlayers.map((playerKey, index) => {
                const isLeftSide = index < Math.ceil(filteredPlayers.length / 2);
                const sideClass = isLeftSide ? styles.leftSide : styles.rightSide;

                return (
                  <div key={playerKey} className={`${styles.jugadorContainer} ${sideClass}`}>
                    <div className={styles.cuadradoVerde}></div>
                    <div className={styles.cuadradoRojo}>
                      {gameData?.players[playerKey]?.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div> */}


          <div className={styles.mesaContainer}>
            <div className={styles.mesa}>

              <div className={styles.DicesInGame}>
                <b>Dices in game {totalPlayerDice}</b>
              </div>
 


              {/* Contenedor del lado izquierdo */}
              <div className={styles.leftColumn}>
                {rightSidePlayers.map((playerKey, index) => (
                  <div key={playerKey} className={styles.jugadorContainerLeft}>
                    <div className={styles.cuadradoVerde}>

                      {gameData?.currentRound > 1 && gameData?.allPlayersRolled == false ? 
                          <>

                          {gameData.players[playerKey].hasRolled == true ? 
                          <>
                            <p className={styles.rolledText}>rolled dices</p>
                          </> :
                          <>
                            <div className={styles.pyramidContainer3}>
                              {gameData.players[playerKey].rollResults.map((result, index) => (
                                <div className={styles.square3} key={index}>
                                  <b>{result}</b>
                                </div>
                              ))}
                            </div>
                          </>
                          }



                          </> : 
                          <>

                              <div className={styles.cubiletHead}>
                              {!Object.keys(playersChallenges).length ? (
                                  <>
                                    {gameData?.players[playerKey]?.lastGuess > 0 ? 
                                      <>
                                      <div className={styles.areThereHead}>
                                        <p><span>{translateNumberToSymbol(gameData?.players[playerKey]?.lastGuess).split(' ')[0]}x</span></p><div className={styles.diceTemplateHead}>{translateNumberToSymbol(gameData?.players[playerKey]?.lastGuess).split(' ')[1]} </div> <p> </p>
                                      </div>
                                      </> :
                                      <>
                                    
                                      </>}
                                  </>
                                ) : (
                                
                                  <>
                                    { gameData?.playersChallenges[playerKey] === true ? (
                                        <div className={styles.cubHeadChallenge}>
                                          <p>Believe</p>
                                        </div>
                                      ) : gameData?.playersChallenges[playerKey] === false ? (
                                        <div className={styles.cubHeadChallenge2}>
                                          <p>Disbelieve</p>
                                        </div>
                                      ) : (
                                        <div className={styles.cubHeadChallenge3}>
                                          <p></p>
                                        </div>
                                      )
                                    }
                                </>
                                )}

                          </div>
                          <div className={styles.cubiletBody}></div>

                          </>
                      }




                    </div>
                    <div className={styles.cuadradoRojo}>
                      <p
                        style={{ color: playerKey == gameData?.currentTurn  ? '#fff' : 'red' }}
                      >{gameData?.players[playerKey]?.name}</p>
                      <div className={styles.diceContainer2}>
                         {Array.from({ length: gameData?.players[playerKey]?.dice }).map((_, index) => (
                           <div key={index} className={styles.dice}></div>
                        ))}  
                        {gameData?.players[playerKey]?.dice == 0 ? <div className={styles.diceTransparent}></div> : <></>}

                        {gameData?.losersFromLastRound?.includes(playerKey) && gameData?.allPlayersRolled == false ? (
                                 <div key={index} className={styles.diceLost}></div>
                              ) : (
                                <></>
                              )}

                      </div>

                      {/* {gameData?.players[playerKey]?.isCurrentTurn == true ? "YES" : "NO"} */}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.tableCenter}>

                <div className={styles.tableCenterContent}>
                  <p>Last</p>
                  {previousPlayerGuess && (
                    <div className={styles.lastGuessContainer}>
                      <b>{previousPlayerGuessQuantity}x</b>
                      <div className={styles.lastGuessDice}>{previousPlayerGuess}</div>
                    </div>
                  )}                  
                </div>

                <div className={styles.devilDiceInfoContainer}>
                  {/* {
                    (translateNumberToSymbol(roundGuessTotal).split(' ')[0]) - 
                    PlayersSymbolSum[translateNumberToSymbol(roundGuessTotal).split(' ')[1]] === 1 ? "YAS" : "NOS"
                  } */}
                    {devilDiceState == true? (
                      <>
                      <p>
                        damned dice
                        {/* {devilDiceRollResult} */}
                      </p>
                        <div className={styles.devilDiceDice}>{devilDiceRollResult}</div>
                        {/* <div className={styles.devilDiceDice}>9</div> */}

                      </>) :
                    (<>
                    {/* no devil dice */}
                    </>)}

                    {gameData?.allPlayersRolled == false && gameData?.showDamnedDice == true ? (
                      <>
                      <p>
                        damned dice
                      </p>
                        <div className={styles.devilDiceDice}>{damnedDiceLast}</div>
                      </>) :
                    (<>
                    {/* no devil dice */}
                    </>)}
  
                </div>


              </div>

              {/* Contenedor del lado derecho */}
              <div className={styles.rightColumn}>
                {leftSidePlayers.map((playerKey, index) => (
                  <div key={playerKey} className={styles.jugadorContainerRight}>
                    <div className={styles.cuadradoVerde}>

                    {gameData?.currentRound > 1 && gameData?.allPlayersRolled == false ? 
                          <>

                          {gameData.players[playerKey].hasRolled == true ? 
                          <>
                            <p className={styles.rolledText}>rolled dices</p>
                          </> :
                          <>
                            <div className={styles.pyramidContainer3}>
                              {gameData.players[playerKey].rollResults.map((result, index) => (
                                <div className={styles.square3} key={index}>
                                  <b>{result}</b>
                                </div>
                              ))}
                            </div>
                          </>
                          }



                          </> : 
                          <>

                              <div className={styles.cubiletHead}>
                              {!Object.keys(playersChallenges).length ? (
                                  <>
                                    {gameData?.players[playerKey]?.lastGuess > 0 ? 
                                      <>
                                      <div className={styles.areThereHead}>
                                        <p><span>{translateNumberToSymbol(gameData?.players[playerKey]?.lastGuess).split(' ')[0]}x</span></p><div className={styles.diceTemplateHead}>{translateNumberToSymbol(gameData?.players[playerKey]?.lastGuess).split(' ')[1]} </div> <p> </p>
                                      </div>
                                      </> :
                                      <>
                                    
                                      </>}
                                  </>
                                ) : (
                                
                                  <>
                                    { gameData?.playersChallenges[playerKey] === true ? (
                                        <div className={styles.cubHeadChallenge}>
                                          <p>Believe</p>
                                        </div>
                                      ) : gameData?.playersChallenges[playerKey] === false ? (
                                        <div className={styles.cubHeadChallenge2}>
                                          <p>Disbelieve</p>
                                        </div>
                                      ) : (
                                        <div className={styles.cubHeadChallenge3}>
                                          <p></p>
                                        </div>
                                      )
                                    }
                                </>
                                )}

                          </div>
                          <div className={styles.cubiletBody}></div>

                          </>
                      }


                      
                    </div>
                    <div className={styles.cuadradoRojo}>
                      <p
                       style={{ color: playerKey == gameData?.currentTurn ? '#fff' : 'red' }}
                      >{gameData?.players[playerKey]?.name}</p>
                      <div className={styles.diceContainer2}>
                         {Array.from({ length: gameData?.players[playerKey]?.dice }).map((_, index) => (
                          <div key={index} className={styles.dice}></div>
                        ))}                     
                      </div>
                      {/* {gameData?.players[playerKey]?.isCurrentTurn == true ? "YES" : "NO"} */}
                    </div>
                  </div>
                ))}
              </div>

              {/* <div className={styles.userTable}>
                Cosas mias, del jugador principal en primera persona
                ador principal en primera persona
                ador principal en primera persona
              </div> */}
            </div>
            <div className={styles.lowTable}>
              <div className={styles.userTable}>
                <div className={styles.userTableSpace}>



                {/* {showGif && (
                  <div className={styles.diceContainer}>
                    <img className={styles.diceImg} src="/images/cup.gif" alt="Rolling" />
                  </div>
                )} */}


                  {gameData?.players[user.uid]?.rollResults && (
             
                      <div className={styles.pyramidContainer}>
                        {gameData.players[user.uid].rollResults.map((result, index) => (
                          <div className={styles.square} key={index}>
                            <b>{result}</b>
                          </div>
                        ))}
                      </div>
        
                  )}
                </div>
              </div>
            </div>
          </div>





          </div>

          <div className={styles.controlsContainer}>
            {gameData?.players[user?.uid].dice === 0 ? (
              <div className={styles.lostText}>
                {translations[language].lostMessage}
              </div>
              ) : (
              <div>
                <div className={styles.gameControls}>
                  {gameOver && winner ? (
                    <div className={styles.winMessage}>
                        <p>{winner} {translations[language].winMessage}</p>
                    </div>
                    ) : (
                      <>
                        {(!roundInProgress || !allPlayersRolled) && (gameData?.currentRound > 1) ? (
                          <div className={styles.reRollDice}>
                            {/* {gameData?.losersFromLastRound} */}

                            {gameData?.losersFromLastRound?.includes(user.uid) ? (
                                <p>You lost a dice.</p>
                              ) : (
                                <p></p>
                              )}

                            <button onClick={handleRollDice}>{translations[language].roll}</button>
                          </div>

                        ) : (
                          isPlayerTurn() && !Object.keys(playersChallenges).length ? (
                            <div className={styles.controls}>
                              <div className={styles.controlsSymbols}>
                                <div className={styles.symbolContainer}>
                                  {SYMBOLS.map(symbol => (
                                    <button key={symbol} onClick={() => handleGuessChange(symbol)}>
                                      {symbol}
                                    </button>
                                  ))}                        
                                </div>

                              </div>
                              <div className={styles.moreLessButtons}>
                                <button className={styles.moreButton} onClick={() => handleQuantityChange(1)}>+</button>                       
                                <span>{playerGuessQuantity}x</span>
                                <button className={styles.lessButton} onClick={() => handleQuantityChange(-1)}>-</button>
                              </div>



                              {/* <button onClick={handleDirectionChange}>
                                  Cambiar dirección a {direction === 'forward' ? 'backward' : 'forward'}
                              </button> */}



                              <div className={styles.controlsSendButton}>
                                <button onClick={handleGuessSubmit}>
                                  {translations[language].send} {symbolChangeStatus == true || quantityStatus == true ? 
                                  `${playerGuessQuantity} ${playerGuess}` 
                                  :  translateNumberToSymbol(roundGuessTotalNew)}
                                  {/* {translateNumberToSymbol(roundGuessTotalNew)}-
                                  {playerGuessQuantity} {playerGuess}  */}

                                </button>
                              </div>
                            </div>
                          ) : ( 

                            <>
                                  {/* <p>Waiting for your turn...</p> */}
                            </>
                      
                          ) 
                        )}
                      </>
                    )}

                </div>
              </div>
              )}



            {playerCount == gameData?.maxPlayers && !hasRolled && (
              <div className={styles.diceRoll}>
                <div className={styles.diceRollFirst}>
                  <button onClick={handleRollDice}>{translations[language].roll}</button>
                </div>
              </div>
              )}


                <div className={styles.devilDiceButtonContainer2}>
                    {devilDiceState == true? (
                      <>
                      <p>You are missing a dice 
                        {/* {devilDiceRollResult} */}
                      </p>
                        <button onClick={devilDice}>Roll</button>                      
                      </>) :
                    (<>
                    {/* no devil dice */}
                    </>)}
  
                </div>















            <div className={styles.challengeButtonControls}>
              {gameData?.players[user?.uid].dice === 0 ? (
                <div></div>
                ) : (
                <div>
                  <div className={styles.gameControls3}>
                    {/* {roundInProgress && allPlayersRolled && ( */}
                    {roundInProgress && allPlayersRolled && userLastGuess !== roundGuessTotal && (
                      <>
                      {/* {console.log("playersChallenges).length", playersChallenges)} */}
                        {!Object.keys(playersChallenges).length ? (
                          // <button 
                          //   onClick={() => handleChallenge(false)} 
                          //   disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                          //   style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                          // >
                          //   {translations[language].disbelieve}
                          // </button>
                          <>

                          </>
                        ) : (
                         
                          <>
                            {secondToLastPlayerUID === user?.uid ?  (
                                <button 
                                  onClick={() => handleChallenge(true)} 
                                  disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                                  style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                                >
                                  {translations[language].believe}
                                </button>
                            
                            ) : (
                              <div className={styles.challengeControlsContainer}>

                                <div className={styles.areThere}>
                                    <p>Are there <span>{translateNumberToSymbol(roundGuessTotal +1).split(' ')[0]}x</span></p><div className={styles.diceTemplate}>{translateNumberToSymbol(roundGuessTotal).split(' ')[1]} </div> <p> ?</p>
                                </div>
                                <div className={styles.buttonChallengeThere}>
                                  <button 
                                    onClick={() => handleChallenge(true)} 
                                    disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                                    style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                                  >
                                    {translations[language].believe}
                                  </button>
                                    <button 
                                      onClick={() => handleChallenge(false)} 
                                      disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                                      style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                                    >
                                      Disbelieve
                                    </button>               
                                </div>


                              </div>
                            )}
                         </>
                        )}
                      </>
                    )}

                  </div>
                </div>
                )}
            </div>
















          </div>








        </div>


        {/* <div className={styles.myInfo}>
          <h2>My username: <b>{myPlayerName}</b></h2>
        </div> */}

      <div className={styles.gameStatistics}>
        {/* <h1>Room code <b>{gameCode}</b> </h1>
        <p>Current Round: <b>{gameData?.currentRound}</b> </p>
        <p>Actual Total Dice value: {actualTotalDice}</p>
        <p>Actual Total Dice value: {translateNumberToSymbol(actualTotalDice)}</p>
        <p>Tiempo restante: <b style={{ color: timeLeft <= 7 ? 'red' : 'black' }}>{timeLeft}</b></p>
        <p>Total Dice of All Players  <b>{totalPlayerDice}</b> </p> 
        <p>round guess total <b>{roundGuessTotal}</b></p>
        <p>round guess total <b>{translateNumberToSymbol(roundGuessTotal)}</b></p>
        <p>{gameData?.currentTurn && gameData?.players ? <p>It's <b>{getCurrentPlayerName()}</b>'s turn</p> : ""}</p> */}

        {error && <p style={{ color: 'red' }}>{error}</p>} 

          {/* //used */}
        {/* {playerCount == gameData?.maxPlayers && !hasRolled && (
          <div>
            <button onClick={handleRollDice}>{translations[language].roll}</button>
          </div>
          )} */}

      </div>


        {/* <div className={styles.gameControls}>

        maybe i will not need this
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
        </div> */}

        {/* <div>
            {devilDiceState == true? (
              <>
              <p>devil roll result: {devilDiceRollResult}</p>
                <button onClick={devilDice}>devil dice</button>                      
              </>) :
             (<>
             no devil dice
             </>)}
              <br ></br>
        </div> */}

        {/* { allChallengedListen === true ? (
              <>
                {Object?.entries(gameData?.players).map(([uid, playerData]) => (
                  <div key={uid}>
                    <p>{playerData.name}:</p> 
                    <b>Roll:</b>
                    <p>
                      {playerData?.rollResults ? (
                        Object.entries(playerData.rollResults).map(([key, value], index) => (
                          <b key={index}>{value}, </b>
                        ))
                      ) : (
                        <span>No roll results</span> 
                      )}
                    </p>    
                  </div>
                ))}        
              </>) :
             (<>
                No
             </>)} */}


      {/* ya usado */}
      {/* {gameData?.players[user?.uid].dice === 0 ? (
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


            {roundInProgress && allPlayersRolled && (
              <>
                {!Object.keys(playersChallenges).length ? (
                  <button 
                    onClick={() => handleChallenge(false)} 
                    disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                    style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                  >
                    {translations[language].disbelieve}
                  </button>
                ) : (
                  <div>

                    {secondToLastPlayerUID === user?.uid ?  (
                      <>
                        <button 
                          onClick={() => handleChallenge(true)} 
                          disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                          style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                        >
                          {translations[language].believe}
                        </button>
                      </>

                    ) : (
                      <>
                      <button 
                        onClick={() => handleChallenge(true)} 
                        disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                        style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                      >
                        {translations[language].believe}
                      </button>
                        <button 
                          onClick={() => handleChallenge(false)} 
                          disabled={hasPlayerChosen(user.uid) || roundGuessTotal === 0} 
                          style={{ opacity: hasPlayerChosen(user.uid) || roundGuessTotal === 0 ? 0.5 : 1 }}
                        >
                          Disbelieve
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
        )} */}




{/* all used except the animation */}
      {/* <div className={styles.gameControls}>
          {previousPlayerGuess && (
            <p>Last move/dados mandados: <b>{previousPlayerGuessQuantity} {previousPlayerGuess}</b></p>
          )}
    
        {gameData?.players && Object.values(gameData.players).map((player, index )=> (
          
          <div key={index}>
            <p>{player.name}:  <b>{player.dice} dice</b> </p>
          </div>
        ))}

          {showGif && (
              <div className={styles.diceContainer}>
                <img className={styles.diceImg} src="/images/cup.gif" alt="Rolling" />
              </div>
            )}

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
      </div> */}

      {/* <h3>Moves History</h3>
      <div className={styles.movesList}>
          {moves.map((move, index) => {
            const playerName = gameData?.players?.[move.uid]?.name || "Unknown Player";
            return (
              <div className={styles.movesContent} key={index}>
                <p>
                  Player: <b>{playerName} </b>
                  move: <b>{move.guess} </b>
                  and: <b>{move.believe === true ? 'believed' : move.believe === false ? 'disbelieved' : ''}</b>
                </p>
              </div>
            );
          })}
      </div> */}

    </div>
  );
  
};

export default GameplayPage;