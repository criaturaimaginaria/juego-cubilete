'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthProvider';

const ProtectRoute = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Mostrar una carga mientras redirige si el usuario no está autenticado
  if (!user) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default ProtectRoute;