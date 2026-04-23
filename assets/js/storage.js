import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// Configurações do seu novo projeto: jampacacamba
const firebaseConfig = {
  apiKey: "AIzaSyAFdteT2eUHZTNQi-kg06Z-3mN-QrcAIz0",
  authDomain: "jampacacamba.firebaseapp.com",
  projectId: "jampacacamba",
  storageBucket: "jampacacamba.firebasestorage.app",
  messagingSenderId: "172977813954",
  appId: "1:172977813954:web:cd142c7050eef80ae03e5b",
  measurementId: "G-JJG1Q05F1M"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referência do documento na nuvem
const docRef = doc(db, "sistema", "banco_de_dados");

export const StorageService = {
  getDatabase: async function() {
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null; 
      }
    } catch (error) {
      console.error("Erro ao buscar dados na nuvem:", error);
      return null;
    }
  },
  
  saveDatabase: async function(data) {
    try {
      await setDoc(docRef, data);
    } catch (error) {
      console.error("Erro ao salvar na nuvem:", error);
    }
  }
};