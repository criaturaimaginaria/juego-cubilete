'use client';
import { useState } from 'react';
import styles from './mainCup.module.css';
// import SettingsPopUp from './SettingsPopUp';
import { SettingsPopUp } from './../SettingsPopUp/index';
import { LanguageSwitcher } from './../LanguageSwitcher/index';

import { useContext } from 'react';
import { LanguageContext } from '../../contexts/LenguageContext';

export const MainCup = () => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };


  const { language } = useContext(LanguageContext );

  const translations = {
    es: {
      settings: 'Configuración',
      close: 'cerrar',
      play: 'Jugar',
    },
    en: {
      settings: 'Settings',
      close: 'close',
      play: 'Play',
    },
  };

  return (
    <div className={styles.MainCup}>
      <div className={styles.cup}>
        <div className={styles.cupTop}></div>
        <div className={styles.cupMiddle}>
          <div className={styles.btnContainer}>
            <button className={styles.btn}>{translations[language].play}</button>
            <button className={styles.btn} onClick={togglePopup}>Settings</button>
          </div>
        </div>
        <div className={styles.cupBottom}></div>
      </div>

      {/* Popup */}
      {isPopupVisible && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h2>{translations[language].settings}</h2>
            <LanguageSwitcher />
            <SettingsPopUp />
            <button onClick={togglePopup}>{translations[language].close}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainCup;