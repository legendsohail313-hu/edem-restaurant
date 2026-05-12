import { auth, db } from "./firebase-config.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

console.log("Auth script loaded");

// Protocol Check
if (window.location.protocol === 'file:') {
    alert("Warning: Firebase Modules do not work on file:// protocol. Please use a local server (like VS Code Live Server).");
}

// DOM Elements
const signupForm = document.getElementById("signupForm") || document.getElementById("signupPanel");
const signinForm = document.getElementById("signinForm") || document.getElementById("signinPanel");
const googleAuthBtn = document.getElementById("googleAuthBtn");
const authMessage = document.getElementById("authMessage");
const orderNote = document.getElementById("orderNote");
const tabs = document.querySelectorAll(".tab-btn");

// Handle Tabs (for auth.html)
if (tabs.length > 0) {
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const selected = tab.dataset.tab;
            tabs.forEach((btn) => btn.classList.remove("active"));
            tab.classList.add("active");
            
            if (signinForm) signinForm.classList.toggle("active", selected === "signin");
            if (signupForm) signupForm.classList.toggle("active", selected === "signup");

            const activePanel = selected === "signin" ? signinForm : signupForm;
            if (window.gsap) {
                window.gsap.fromTo(
                    activePanel.querySelectorAll(".field, .submit-btn"),
                    { y: 18, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: "power2.out" }
                );
            }
        });
    });
}

// Handle URL parameters for dish/price (to keep context after login)
const params = new URLSearchParams(window.location.search);
const dish = params.get("dish");
const price = params.get("price");

if (dish && price && orderNote) {
    orderNote.textContent = `You selected ${dish} (${price}). Sign in or sign up to complete your order.`;
}

// Handle Sign Up
if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = signupForm.querySelector(".submit-btn");
        const name = document.getElementById("signupName").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        if (submitBtn) submitBtn.disabled = true;
        showMessage("Creating account...", "success");

        try {
            console.log("Attempting sign up...");
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log("User created, updating profile...");
            await updateProfile(user, { displayName: name });

            console.log("Storing user in Firestore...");
            try {
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: name,
                    email: email,
                    createdAt: new Date().toISOString()
                });
            } catch (fsError) {
                console.warn("Firestore storage failed (check rules):", fsError);
                // We continue even if Firestore fails, as Auth succeeded
            }

            showMessage("Account created! You can now Sign In.", "success");
            alert("Account created successfully! Now please login.");
            
            // Redirect to signin with same params
            const query = dish ? `?dish=${dish}&price=${price}` : "";
            window.location.href = `signin.html${query}`;

        } catch (error) {
            console.error("Sign up error:", error);
            showMessage(error.message, "error");
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// Handle Sign In
if (signinForm) {
    signinForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = signinForm.querySelector(".submit-btn");
        const email = document.getElementById("signinEmail").value;
        const password = document.getElementById("signinPassword").value;

        if (submitBtn) submitBtn.disabled = true;
        showMessage("Signing in...", "success");

        try {
            console.log("Attempting sign in...");
            await signInWithEmailAndPassword(auth, email, password);
            
            showMessage("Login successful! Redirecting...", "success");
            
            setTimeout(() => {
                // If they came from a dish selection, redirect back to menu
                const redirectTarget = dish ? "index.html#popular" : "index.html";
                window.location.href = redirectTarget;
            }, 800);

        } catch (error) {
            console.error("Sign in error:", error);
            showMessage(error.message, "error");
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// Handle Google Auth
if (googleAuthBtn) {
    googleAuthBtn.addEventListener("click", async () => {
        const provider = new GoogleAuthProvider();
        try {
            console.log("Attempting Google sign in...");
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            try {
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    lastLogin: new Date().toISOString()
                }, { merge: true });
            } catch (fsError) {
                console.warn("Firestore storage failed:", fsError);
            }

            showMessage("Login successful!", "success");
            setTimeout(() => {
                const redirectTarget = dish ? "index.html#popular" : "index.html";
                window.location.href = redirectTarget;
            }, 800);
        } catch (error) {
            console.error("Google auth error:", error);
            showMessage(error.message, "error");
        }
    });
}

function showMessage(msg, type) {
    if (authMessage) {
        authMessage.textContent = msg;
        authMessage.style.color = type === "success" ? "#4caf50" : "#f44336";
    } else {
        console.log("Message:", msg);
    }
}
