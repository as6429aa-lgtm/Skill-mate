import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBH1ZaqvTAtEDo6BTJ147UUqYcjCv98rkM",
    authDomain: "skill-mate-a572f.firebaseapp.com",
      projectId: "skill-mate-a572f",
        storageBucket: "skill-mate-a572f.appspot.com",
          messagingSenderId: "182420770899",
            appId: "1:182420770899:web:64d7b930d969b9a27f36a6",
              measurementId: "G-NPP5QNYLYK"
              };

              const app = initializeApp(firebaseConfig);
              export const auth = getAuth(app);
              export const db = getFirestore(app);
              export const googleProvider = new GoogleAuthProvider();

              