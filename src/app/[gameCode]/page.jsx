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

    if (parseInt(guess) === gameData.randomNumber) {
      await update(gameRef, {
        winner: user.displayName,
      });
    } else {
      await update(playerRef, {
        guess: parseInt(guess),
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
    }

    setGuess('');
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
          </div>
          <div className={styles.players}>
            {gameData.players &&
              Object.keys(gameData.players).map((playerId) => (
                <div key={playerId} className={styles.player}>
                  {gameData.players[playerId].name}: {gameData.players[playerId].guess || 'No guess yet'}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}







// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams } from 'next/navigation';
// import { database } from '../../../firebase.config';
// import Link from 'next/link';
// import { ref, onValue, update } from 'firebase/database';
// import styles from './page.module.css';

// export default function GameplayPage() {
//   const { gameCode } = useParams();
//   const [gameData, setGameData] = useState(null);
//   const [playerName, setPlayerName] = useState('');

//   useEffect(() => {
//     const fetchGameData = () => {
//       if (gameCode) {
//         const gameRef = ref(database, `games/${gameCode}`);
//         onValue(gameRef, (snapshot) => {
//           setGameData(snapshot.val());
//         });
//       }
//     };

//     fetchGameData();
//   }, [gameCode]);

//   const handleJoinGame = () => {
//     if (playerName && gameData) {
//       const newPlayerKey = `player${Object.keys(gameData.players || {}).length + 1}`;
//       const updates = {};
//       updates[`games/${gameCode}/players/${newPlayerKey}`] = {
//         name: playerName,
//         dice: gameData.totalDice / gameData.numPlayers,
//         isCurrentTurn: false,
//         hasQuintilla: false,
//       };
//       update(ref(database), updates);
//     }
//   };

//   if (!gameData) {
//     return <div>Loading...</div>;
//   }

//   const currentPlayer = gameData.currentTurn;
//   const currentPlayerData = gameData.players ? gameData.players[currentPlayer] : null;

//   return (
//     <div className={styles.game}>
//       <h2>Gameplay for Game Code: {gameCode}</h2>
//       <div>
//         <input
//           type="text"
//           placeholder="Enter your name"
//           value={playerName}
//           onChange={(e) => setPlayerName(e.target.value)}
//         />
//         <button onClick={handleJoinGame}>Join Game</button>
//       </div>
//       <div className={styles.players}>
//         {gameData.players && Object.keys(gameData.players).map((playerId) => (
//           <div key={playerId} className={styles.player}>
//             {gameData.players[playerId].name}: {gameData.players[playerId].dice} dice
//           </div>
//         ))}
//       </div>
//       {currentPlayerData && (
//         <div>
//           {currentPlayerData.isCurrentTurn && (
//             <div>
//               <p>It's your turn!</p>
//               {/* Aquí se puede agregar la lógica del turno del jugador */}
//             </div>
//           )}
//         </div>
//       )}
//       <Link href="/">
//         Back to Main Page
//       </Link>
//     </div>
//   );
// }







