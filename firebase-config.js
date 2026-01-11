// ==============================================
// CONFIGURAÇÃO DO FIREBASE
// ==============================================
// Suas credenciais do Firebase Console
// Projeto: bible-plan-95825

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB7uLzC11ekDHjx9Gw14Cx2R4h9I8hyGJ4",
    authDomain: "bible-plan-95825.firebaseapp.com",
    projectId: "bible-plan-95825",
    storageBucket: "bible-plan-95825.firebasestorage.app",
    messagingSenderId: "788106777338",
    appId: "1:788106777338:web:9f19d40a7f45e6ec9f6f43",
    measurementId: "G-DTSQ5TXN50"
};

// reCAPTCHA v3 Site Key (do Console Firebase → App Check)
// SUBSTITUA pela sua chave que começa com 6L...
const RECAPTCHA_SITE_KEY = "6LeCwkYsAAAAAAzi5X_dAIDNdKTD2FrXLaGeuuLS";

// Expõe globalmente para os scripts usarem
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.RECAPTCHA_SITE_KEY = RECAPTCHA_SITE_KEY;
