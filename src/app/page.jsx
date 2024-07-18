'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'
import styles from './page.module.css'
import { GameCodeInput, LanguageSwitcher, SettingsPopUp, FireTest, MainCup } from '../components';

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
    <main className={styles.main}>
      <div className={styles.background}></div>

        <div className={styles.mainBox1}>

        </div>
        <div className={styles.mainBox2}>
          <div className={styles.MainCupContainer}>
              <MainCup />    
          </div>

          <div className={styles.table}></div>
        </div>
    </main>
  );
}
