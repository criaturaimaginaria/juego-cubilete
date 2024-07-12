'use client';
import { useContext } from 'react';
// import { LanguageContext } from '../../contexts/LenguageContext';
// import { LanguageContext } from '../contexts/LanguageContext';
import { LanguageContext } from '../../contexts/LenguageContext';

export const SettingsPopUp = () => {
  const { language } = useContext(LanguageContext );

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
      <p>text 1 {translations[language].text1}</p>
      <p>text 2 {translations[language].text2}</p>
      <p>text 3 {translations[language].text3}</p>
    </div>
  );
};

export default SettingsPopUp;