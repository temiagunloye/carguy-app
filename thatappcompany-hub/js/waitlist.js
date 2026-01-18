// waitlist.js - Handles waitlist form submission
import { addDoc, collection, db } from "./firebaseConfig.js";

const form = document.getElementById("waitlist-form");
const messageDiv = document.getElementById("waitlist-message");
const successDiv = document.getElementById("waitlist-success");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = form.email.value.trim();
        const role = form.role.value;
        const plan = form.planInterest?.value || "";
        const carBuild = form.carBuild?.value || "";
        try {
            await addDoc(collection(db, "waitlist"), {
                email,
                role,
                plan,
                carBuild,
                timestamp: new Date().toISOString()
            });
            form.reset();
            successDiv.style.display = "block";
            messageDiv.style.display = "none";
        } catch (err) {
            console.error("Waitlist error", err);
            messageDiv.textContent = "Failed to join waitlist. Please try again later.";
            messageDiv.style.display = "block";
        }
    });
}
