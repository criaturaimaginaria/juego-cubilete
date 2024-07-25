'use client';

import { useAuth } from '../../contexts/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LoginPage = () => {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/'); 
    }
  }, [user, router]);

  if (loading) {
    return <div>Loading...</div>;  // Mostrar un mensaje de carga mientras se obtiene el estado del usuario
  }

  return (
    <div>
      <h1>Login</h1>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
  );
};

export default LoginPage;



