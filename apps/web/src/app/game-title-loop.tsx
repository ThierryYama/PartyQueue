'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

const gameNames = ['it takes two', 'overcooked 2', 'unrailed!'];

export function GameTitleLoop() {
  const [gameIndex, setGameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGameIndex((current) => (current + 1) % gameNames.length);
    }, 2600);

    return () => clearInterval(interval);
  }, []);

  return (
    <span aria-live="polite" className={styles.gameName} key={gameIndex}>
      {gameNames[gameIndex]}
    </span>
  );
}
