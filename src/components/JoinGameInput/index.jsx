'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../firebase.config';
import { ref, get, update } from 'firebase/database';
import { useAuth } from '../../contexts/AuthProvider';

const JoinGameInput = () => {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleInputChange = (e) => {
    setJoinCode(e.target.value);
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!joinCode) return;

    const gameRef = ref(db, `games/${joinCode}`);
    const gameSnapshot = await get(gameRef);

    if (gameSnapshot.exists()) {
      const gameData = gameSnapshot.val();

      if (Object.keys(gameData.players).length >= gameData.maxPlayers) {
        setError('Game is full');
        return;
      }

      const playerRef = ref(db, `games/${joinCode}/players/${user.uid}`);
      const playerData = {
        name: user.displayName,
        guess: null,
        dice: gameData.numDice,
        isCurrentTurn: false,
      };
      await update(playerRef, playerData);

      router.push(`/${joinCode}`);
    } else {
      setError('Game not found');
    }
  };

  return (
    <div>
      <form onSubmit={handleJoinGame}>
        <input
          type="text"
          placeholder="Enter game code"
          value={joinCode}
          onChange={handleInputChange}
        />
        <button type="submit">Join Game</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
};

export default JoinGameInput;




















// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { db } from '../../../firebase.config';
// import { ref, get, update } from 'firebase/database';
// import { useAuth } from '../../contexts/AuthProvider';

// const JoinGameInput = () => {
//   const [joinCode, setJoinCode] = useState('');
//   const [error, setError] = useState(null);
//   const router = useRouter();
//   const { user } = useAuth();

//   const handleInputChange = (e) => {
//     setJoinCode(e.target.value);
//   };

//   const handleJoinGame = async (e) => {
//     e.preventDefault();
//     if (!joinCode) {
//       setError('Game code is required');
//       return;
//     }

//     const gameRef = ref(db, `games/${joinCode}`);
//     try {
//       const snapshot = await get(gameRef);
//       if (!snapshot.exists()) {
//         setError('Game not found');
//         return;
//       }

//       const gameData = snapshot.val();
//       const players = gameData.players || {};
//       const playerCount = Object.keys(players).length;


//       if (playerCount >= gameData.maxPlayers) {
//         setError('Game is full');
//         return;
//       }
    
//       const playerData = {
//         name: user.displayName,
//         guess: null,
//         dice: gameData.numDice,
//         isCurrentTurn: false, // Turno no activo para los nuevos jugadores
//       };
//       await update(gameRef, {
//         [`players/${user.uid}`]: playerData,
//       });
    
//       router.push(`/${joinCode}`);
//     } catch (error) {
//       console.error('Error joining game:', error);
//       setError('An error occurred. Please try again.');
//     }

//   };

//   return (
//   <div>
//   <form onSubmit={handleJoinGame}>
//   <input
//          type="text"
//          placeholder="Enter game code"
//          value={joinCode}
//          onChange={handleInputChange}
//        />
//   <button type="submit">Join Game</button>
//   </form>
//   {error && <div>{error}</div>}
//   </div>
//   );
//   };
  
//   export default JoinGameInput;




