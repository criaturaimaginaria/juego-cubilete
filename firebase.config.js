import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   databaseURL: "YOUR_DATABASE_URL",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };

const firebaseConfig = {
  apiKey: "AIzaSyBdlTxlns8nZFskTbucHaI72CAO1HZa-z0",
  authDomain: "cubilete-6182f.firebaseapp.com",
  databaseURL: "https://cubilete-6182f-default-rtdb.firebaseio.com",
  projectId: "cubilete-6182f",
  storageBucket: "cubilete-6182f.appspot.com",
  messagingSenderId: "903682159191",
  appId: "1:903682159191:web:063d2b14880fd958a72912",
  measurementId: "G-NGY8GTZBV3"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
