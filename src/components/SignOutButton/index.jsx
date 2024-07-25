'use client';

import { useAuth } from '../../contexts/AuthProvider';

const SignOutButton = () => {
  const { handleSignOut } = useAuth();

  return (
    <button onClick={handleSignOut}>
      Sign Out
    </button>
  );
};

export default SignOutButton;