'use client';
import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

export const Header = () => {
  const { language } = useContext(LanguageContext);

  const translations = {
    es: {
      text1: 'texto 1 y bueno, así son las cosas',
      text2: 'larga vida a constantino',
      text3: 'como te va?',
    },
    en: {
      text1: 'text 1 and well.. like that are bla',
      text2: 'Long live constantine',
      text3: 'how are you?',
    },
  };


  return (
    <div >
      <p>text 1 {translations[language].Content}</p>
      <p>text 2 {translations[language].about}</p>
      <p>text 3 {translations[language].Portfolio}</p>
    </div>
  );
};

export default Header;