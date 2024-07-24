'use client';

import { useAuth } from '../../contexts/AuthProvider';

const LoginPage = () => {
  const { signInWithGoogle } = useAuth();

  const handleLogin = () => {
    console.log('Login button clicked');
    signInWithGoogle();
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin}>Sign in with Google</button>
    </div>
  );
};

export default LoginPage;





