'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebase.config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);






















// 'use client';

// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
// import { app } from '../../firebase.config';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const auth = getAuth(app);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//     });

//     return () => unsubscribe();
//   }, [auth]);

//   const signInWithGoogle = async () => {
//     try {
//       const provider = new GoogleAuthProvider();
//       await signInWithPopup(auth, provider);
//     } catch (error) {
//       console.error('Error signing in with Google:', error);
//     }
//   };

//   const signOut = async () => {
//     try {
//       await auth.signOut();
//     } catch (error) {
//       console.error('Error signing out:', error);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, signInWithGoogle, signOut }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);






















// 'use client';
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
// import { app } from '../../firebase.config'; 

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const auth = getAuth(app);
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user);
//     });

//     return () => unsubscribe();
//   }, []);

//   const signInWithGoogle = () => {
//     const auth = getAuth(app);
//     const provider = new GoogleAuthProvider();
//     return signInWithPopup(auth, provider);
//   };

//   const value = { user, signInWithGoogle };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => useContext(AuthContext);