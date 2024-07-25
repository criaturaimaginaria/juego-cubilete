'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebase.config';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);  // Estado de carga inicial
  const auth = getAuth(app);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);  // Establecer carga como falsa después de obtener el estado del usuario
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);







// 'use client';

// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
// import { app } from '../../firebase.config';
// import { useRouter } from 'next/navigation';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const auth = getAuth(app);
//   const router = useRouter();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user);
//       if (user) {
//         router.push('/'); // Redirige a la página de destino
//       }
//     });

//     return () => unsubscribe();
//   }, [auth, router]);

//   const signInWithGoogle = async () => {
//     try {
//       const provider = new GoogleAuthProvider();
//       await signInWithPopup(auth, provider);
//     } catch (error) {
//       console.error('Error signing in with Google:', error);
//     }
//   };

//   const handleSignOut = async () => {
//     try {
//       await signOut(auth);
//       setUser(null);
//       router.push('/login'); // Redirige a la página de login después de cerrar sesión
//     } catch (error) {
//       console.error('Error signing out:', error);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, signInWithGoogle, handleSignOut }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);





