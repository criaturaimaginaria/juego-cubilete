'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'
import styles from './page.module.css'
import { GameCodeInput, LanguageSwitcher, SettingsPopUp, FireTest } from '../components';

export default function HomePage() {
  const [gameCode, setGameCode] = useState('');
  const router = useRouter();

  const handleInputChange = (e) => {
    setGameCode(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (gameCode) {
      router.push(`/${gameCode}`);
    }
  };


  return (
    <main>
      <h2>Home page</h2>

      <GameCodeInput />

      <br></br>
      <SettingsPopUp />
      <br></br>
      <LanguageSwitcher />
      <br></br>
      <FireTest />

    </main>
  );
}
