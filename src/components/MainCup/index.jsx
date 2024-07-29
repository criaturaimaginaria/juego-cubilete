'use client';
import { useState } from 'react';
import styles from './mainCup.module.css';
import { SettingsPopUp } from './../SettingsPopUp/index';
import { LanguageSwitcher } from './../LanguageSwitcher/index';
import GameCodeInput from './../GameCodeInput/index';  // Asegúrate de que la ruta es correcta
import SignOutButton from './../SignOutButton';
import { UserProfile } from '../'; 
import JoinGameInput from './../JoinGameInput/index';  // Asegúrate de que la ruta es correcta

import { useContext } from 'react';
import { LanguageContext } from '../../contexts/LenguageContext';

export const MainCup = () => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isPlayVisible, setIsPlayVisible] = useState(false);

  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };

  const PlayTogglePopup = () => {
    setIsPlayVisible(!isPlayVisible);
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
            <button className={styles.btn} onClick={PlayTogglePopup}>{translations[language].play}</button>
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
            <UserProfile />
            <LanguageSwitcher />
            <SettingsPopUp />
            <button onClick={togglePopup}>{translations[language].close}</button>
            <SignOutButton />
          </div>
        </div>
      )}

      {isPlayVisible && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <button className={styles.playCloseBtn} onClick={PlayTogglePopup}>{translations[language].close}</button>
            <GameCodeInput />
            <JoinGameInput />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainCup;