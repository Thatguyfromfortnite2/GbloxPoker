// GBloxPoker Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhPCgDrQ1kO4Ul4Dpehry9DN6InrxzpcE",
    authDomain: "gbloxpoker.firebaseapp.com",
    databaseURL: "https://gbloxpoker-default-rtdb.firebaseio.com",
    projectId: "gbloxpoker",
    storageBucket: "gbloxpoker.firebasestorage.app",
    messagingSenderId: "872500796382",
    appId: "1:872500796382:web:43844e7cfa7dc213cc9b4f",
    measurementId: "G-LJ374RH72D"
};

// Initialize Firebase (Compat mode)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
window.db = db; // Global reference
