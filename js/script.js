document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    // Handle Sign-Up
    if (signupForm) {
        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();
            let username = document.getElementById("signup-username").value.trim();
            let password = document.getElementById("signup-password").value.trim();

            if (username && password) {
                localStorage.setItem("username", username);
                localStorage.setItem("password", password);
                alert("Sign-up successful! Now login.");
                window.location.href = "index.html";
            } else {
                alert("Please fill in all fields.");
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            let username = document.getElementById("login-username").value.trim();
            let password = document.getElementById("login-password").value.trim();
            let storedUser = localStorage.getItem("username");
            let storedPass = localStorage.getItem("password");

            if (username === storedUser && password === storedPass) {
                localStorage.setItem("loggedInUser", username); 
                alert(`Hey ${username}!`);
                window.location.href = "flashcard2.html"; 
            } else {
                alert("Invalid login credentials.");
            }
        });
    }

    if (document.getElementById("user-greeting")) {
        let loggedInUser = localStorage.getItem("loggedInUser");
        if (loggedInUser) {
            document.getElementById("user-greeting").innerText = `Hey ${loggedInUser}!`;
        } else {
            document.getElementById("user-greeting").innerText = "Hey Guest!";
        }
    }
});
