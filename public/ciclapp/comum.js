// Partes comuns às páginas web do CiclApp (estudos e treino).
// Publicadas em kielima.com/ciclapp/ (cópia automática deste diretório) e em
// paralelo no Firebase Hosting; por isso os links entre páginas são relativos.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Configuração Web do Firebase: valores públicos por definição (identificam o
// projeto, não dão acesso). A proteção dos dados está nas regras do Firestore e
// na Edge Function. O domínio que serve a página precisa estar em
// Authentication → Settings → Authorized domains, senão o login é recusado.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBk34fWvRl-vEl5Hj3t5WXWQO864UoKgYA",
  authDomain: "ciclapp-1180a.firebaseapp.com",
  projectId: "ciclapp-1180a",
  storageBucket: "ciclapp-1180a.firebasestorage.app",
  messagingSenderId: "174899485491",
  appId: "1:174899485491:web:7f86b2f956386e8d253c46",
};

// Mesmos valores públicos usados pelo app Android (anon key do Supabase: só passa
// pelo gateway). Nunca colocar aqui a service_role key.
export const SUPABASE_URL = "https://lgteihdbapcumlpqrqfd.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndGVpaGRiYXBjdW1scHFycWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNjc0MTUsImV4cCI6MjEwMTk0MzQxNX0.E26nsngrA2M3TXy6hsE_70e7ymcEUAVNjqovHaKfH-k";

export const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);

export const $ = (id) => document.getElementById(id);

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * Liga as telas de login e do app (#login-screen, #app-screen) ao estado do
 * Firebase Auth. `aoEntrar(user)` roda a cada login; `aoSair()` ao sair.
 */
export function iniciarLogin({ aoEntrar, aoSair }) {
  const mostrar = (id) => {
    ["login-screen", "app-screen"].forEach((s) => $(s).classList.toggle("hidden", s !== id));
  };

  $("login-btn").addEventListener("click", () => {
    $("login-error").textContent = "";
    signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => {
      $("login-error").textContent =
        e.code === "auth/unauthorized-domain"
          ? `O domínio ${location.hostname} ainda não está autorizado no Firebase (Authentication → Settings → Authorized domains).`
          : "Erro no login: " + e.message;
    });
  });
  $("logout-btn").addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, (user) => {
    if (user) {
      mostrar("app-screen");
      $("user-email").textContent = user.email || "";
      aoEntrar(user);
    } else {
      mostrar("login-screen");
      aoSair?.();
    }
  });
}
