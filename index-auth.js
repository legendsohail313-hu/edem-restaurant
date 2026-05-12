import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const userLink = document.getElementById("userLink");
const loginLink = document.getElementById("loginLink");
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

const ADMIN_EMAIL = "legendsohail313@gmail.com";
const adminLink = document.getElementById("adminLink");

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        userLink.style.display = "block";
        loginLink.style.display = "none";
        userName.textContent = user.displayName || user.email;
        
        // Show Admin link if email matches
        if (user.email === ADMIN_EMAIL && adminLink) {
            adminLink.style.display = "block";
        } else if (adminLink) {
            adminLink.style.display = "none";
        }

        // Export user status for script.js to check if needed
        window.isLoggedIn = true;
    } else {
        // User is signed out
        userLink.style.display = "none";
        loginLink.style.display = "block";
        if (adminLink) adminLink.style.display = "none";
        window.isLoggedIn = false;
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.reload();
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}
