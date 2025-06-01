async function checkApiConnection() {
  try {
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('API connection error:', error);
    return false;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");

  if (!document.querySelector('script[src="js/api.js"]')) {
    const apiScript = document.createElement('script');
    apiScript.src = 'js/api.js';
    document.head.appendChild(apiScript);
  }

  // Check if user is already logged in
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname.includes('signup.html')) {
          window.location.href = 'library.html';
        }
      } else {
        if (!window.location.pathname.includes('index.html') && 
            !window.location.pathname.includes('signup.html')) {
          window.location.href = 'index.html';
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  setTimeout(checkAuthStatus, 100);

  const clearErrorMessages = (formPrefix) => {
    document.getElementById(`${formPrefix}-username-error`).style.display = 'none';
    document.getElementById(`${formPrefix}-password-error`).style.display = 'none';
    document.getElementById(`${formPrefix}-general-error`).style.display = 'none';
  };

  const showErrorMessage = (elementId, message) => {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  };

  // Handle Sign-Up
  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearErrorMessages('signup');
      
      const username = document.getElementById("signup-username").value.trim();
      const password = document.getElementById("signup-password").value.trim();

      if (!username) {
        showErrorMessage('signup-username-error', 'Username is required');
        return;
      }

      if (!password) {
        showErrorMessage('signup-password-error', 'Password is required');
        return;
      }

      try {
        const submitButton = document.getElementById("signup-button");
        submitButton.disabled = true;
        submitButton.textContent = "Signing up...";

        const response = await api.auth.register(username, password);
        localStorage.setItem("token", response.token);
        
        window.location.href = "library.html";
      } catch (error) {
        console.log('Signup error:', error);
        
        // Show specific field errors or general error
        if (error.field === 'username') {
          showErrorMessage('signup-username-error', 'Username already exists');
        } else {
          // Only show general error if there's no field-specific error
          const errorMessage = error.msg || error.error || 'Registration failed';
          showErrorMessage('signup-general-error', errorMessage);
        }
        
        document.getElementById("signup-button").disabled = false;
        document.getElementById("signup-button").textContent = "Submit";
      }
    });
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearErrorMessages('login');
      
      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value.trim();

      if (!username) {
        showErrorMessage('login-username-error', 'Username is required');
        return;
      }

      if (!password) {
        showErrorMessage('login-password-error', 'Password is required');
        return;
      }

      try {
        const submitButton = document.getElementById("login-button");
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";

        const response = await api.auth.login(username, password);
        localStorage.setItem("token", response.token);
        localStorage.setItem("loggedInUser", response.username);
        
        window.location.href = "library.html";
      } catch (error) {
        console.log('Login error:', error);
        
        // Show specific field errors or general error
        if (error.field === 'username') {
          showErrorMessage('login-username-error', 'No account exists with this username');
        } else if (error.field === 'password') {
          showErrorMessage('login-password-error', 'Password is incorrect');
        } else {
          // Only show general error if there's no field-specific error
          const errorMessage = error.msg || error.error || 'Login failed';
          showErrorMessage('login-general-error', errorMessage);
        }
        
        document.getElementById("login-button").disabled = false;
        document.getElementById("login-button").textContent = "Submit";
      }
    });
  }

  if (document.getElementById("user-greeting")) {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
      document.getElementById("user-greeting").innerText = `Hey ${loggedInUser}!`;
    } else {
      document.getElementById("user-greeting").innerText = "Hey Guest!";
    }
  }

  const addLogoutButton = () => {
    const profileLinks = document.querySelectorAll('.profile-icon-link');
    
    profileLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Do you want to log out?')) {
          localStorage.removeItem('token');
          localStorage.removeItem('loggedInUser');
          window.location.href = 'index.html';
        }
      });
    });
  };

  setTimeout(addLogoutButton, 200);
  
});
