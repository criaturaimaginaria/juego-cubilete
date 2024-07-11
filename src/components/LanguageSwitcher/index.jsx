'use client';
import { useContext } from 'react';
import { LanguageContext } from '../../contexts/LenguageContext.js';
import styles from './switcher.module.css';


export const LanguageSwitcher = () => {
  const { language, switchLanguage } = useContext(LanguageContext);

  return (
    <div>
      <button
        onClick={() => switchLanguage('en')}
        className={`${styles.button} ${language === 'en' ? styles.disabled : ''}`}
        disabled={language === 'en'}
      >
        English
      </button>
      <button
        onClick={() => switchLanguage('es')}
        className={`${styles.button} ${language === 'es' ? styles.disabled : ''}`}
        disabled={language === 'es'}
      >
        Español
      </button>
    </div>
  );
};

export default LanguageSwitcher;