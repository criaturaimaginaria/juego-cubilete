'use client';
import { useContext } from 'react';
// import { LanguageContext } from '../contexts/LenguageContext';
import { LanguageContext } from '../../contexts/LenguageContext';

export const LanguageSwitcher = () => {
  const { language, switchLanguage } = useContext(LanguageContext);

  const handleChange = (e) => {
    switchLanguage(e.target.value);
  };

  return (
    <select value={language} onChange={handleChange}>
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  );
};

export default LanguageSwitcher;