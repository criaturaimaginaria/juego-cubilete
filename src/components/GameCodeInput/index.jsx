'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function GameCodeInput() {
  const [gameCode, setGameCode] = useState('');
  const router = useRouter();

  const handleInputChange = (e) => {
    setGameCode(e.target.value);
  };

  const handleGenerateRandomCode = () => {
    const randomCode = generateRandomCode();
    setGameCode(randomCode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (gameCode) {
      router.push(`/${gameCode}`);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Enter game code or generate random"
          value={gameCode}
          onChange={handleInputChange}
        />
        <button type="button" onClick={handleGenerateRandomCode}>
          Generate Random Code
        </button>
        <button type="submit">Go to Game</button>
      </form>
      {/* <Link href="/">
        Back to Main Page
      </Link> */}
    </div>
  );
}
