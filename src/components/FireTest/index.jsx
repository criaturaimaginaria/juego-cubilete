'use client';

import { useState, useEffect } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { db, auth } from '../../../firebase.config';
import { signInAnonymously } from 'firebase/auth';

const FireTest = () => {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Sign in the user anonymously
    signInAnonymously(auth).catch((error) => {
      console.error("Error during anonymous sign-in:", error);
    });

    // Fetch data from the database when the component mounts
    const usersRef = ref(db, 'users');
    const listener = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      setUserData(data);
    });

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      listener(); // Remove the listener
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const dbRef = ref(db, `users/${nombre}`);

    try {
      await set(dbRef, {
        nombre: nombre,
        edad: edad
      });

      setNombre('');
      setEdad('');
      console.log('Datos guardados en la base de datos');
    } catch (error) {
      console.error('Error al guardar los datos: ', error);
    }
  };

  return (
    <div>
      {userData && (
        <div>
          <h2>Users</h2>
          <ul>
            {Object.entries(userData).map(([key, value]) => (
              <li key={key}>
                <strong>Nombre:</strong> {value.nombre}, <strong>Edad:</strong> {value.edad}
              </li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="edad">Edad:</label>
          <input
            type="number"
            id="edad"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
          />
        </div>
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
};

export default FireTest;
