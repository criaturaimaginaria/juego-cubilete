'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { database } from '../../../firebase.config';
import Link from 'next/link';
import { ref, onValue, update } from 'firebase/database';
import styles from './page.module.css';

export default function GameplayPage() {
  const { gameCode } = useParams();
  const [gameData, setGameData] = useState(null);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const fetchGameData = () => {
      if (gameCode) {
        const gameRef = ref(database, `games/${gameCode}`);
        onValue(gameRef, (snapshot) => {
          setGameData(snapshot.val());
        });
      }
    };

    fetchGameData();
  }, [gameCode]);

  const handleJoinGame = () => {
    if (playerName && gameData) {
      const newPlayerKey = `player${Object.keys(gameData.players || {}).length + 1}`;
      const updates = {};
      updates[`games/${gameCode}/players/${newPlayerKey}`] = {
        name: playerName,
        dice: gameData.totalDice / gameData.numPlayers,
        isCurrentTurn: false,
        hasQuintilla: false,
      };
      update(ref(database), updates);
    }
  };

  if (!gameData) {
    return <div>Loading...</div>;
  }

  const currentPlayer = gameData.currentTurn;
  const currentPlayerData = gameData.players ? gameData.players[currentPlayer] : null;

  return (
    <div className={styles.game}>
      <h2>Gameplay for Game Code: {gameCode}</h2>
      <div>
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <button onClick={handleJoinGame}>Join Game</button>
      </div>
      <div className={styles.players}>
        {gameData.players && Object.keys(gameData.players).map((playerId) => (
          <div key={playerId} className={styles.player}>
            {gameData.players[playerId].name}: {gameData.players[playerId].dice} dice
          </div>
        ))}
      </div>
      {currentPlayerData && (
        <div>
          {currentPlayerData.isCurrentTurn && (
            <div>
              <p>It's your turn!</p>
              {/* Aquí se puede agregar la lógica del turno del jugador */}
            </div>
          )}
        </div>
      )}
      <Link href="/">
        Back to Main Page
      </Link>
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
//       <Link href="/">
//         Back to Main Page
//       </Link>
//     </div>
//   );
// }


