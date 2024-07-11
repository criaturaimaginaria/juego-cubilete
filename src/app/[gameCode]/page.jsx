'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function GameplayPage() {
  const params = useParams();
  const { gameCode } = params;

  return (
    <main>
      <h2>Gameplay for Game Code: {gameCode}</h2>
      here we have things
      <Link href="/">
        Back to Main Page
      </Link>
    </main>
  );
}
