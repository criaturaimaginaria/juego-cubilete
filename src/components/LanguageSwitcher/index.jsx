'use client';
import { useContext } from 'react';
import { LanguageContext } from '../../contexts/LenguageContext.js';

export const LanguageSwitcher = () => {
  const { language, switchLanguage } = useContext(LanguageContext);

  return (
    <div>
      <button onClick={() => switchLanguage('en')}>
        English
      </button>
      <button onClick={() => switchLanguage('es')}>
        Español
      </button>
    </div>
  );
};

export default LanguageSwitcher;