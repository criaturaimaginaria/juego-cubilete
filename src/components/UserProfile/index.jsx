'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import styles from './UserProfile.module.css';


const DEFAULT_PROFILE_IMAGE = '/images/default-profile.png'; 

const UserProfile = () => {
  const { user } = useAuth();

  const profileImage = user?.photoURL || DEFAULT_PROFILE_IMAGE;

  if (!user) {
    return <div>No user logged in</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <img src={profileImage} alt={user?.displayName || 'User'} className={styles.profileImage} />
      <div className={styles.profileInfo}>
        <h2>{user.displayName}</h2>
        <p>{user.email}</p>
      </div>
    </div>
  );
};

export default UserProfile;