'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthProvider';

const ProtectRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;  // Mostrar un mensaje de carga mientras se obtiene el estado del usuario
  }

  if (!user) {
    router.push('/login');
  }

  return <>{children}</>;
};

export default ProtectRoute;









// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '../../contexts/AuthProvider';

// const ProtectRoute = ({ children }) => {
//   const { user } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!user) {
//       router.push('/login');
//     }
//   }, [user, router]);


//   if (!user) {
//     return <div>Loading...</div>;
//   }

//   return <>{children}</>;
// };

// export default ProtectRoute;