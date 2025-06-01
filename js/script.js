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
        const errorMsg = error.message || "Registration failed";
        
        try {
          console.log('Attempting to parse signup error message as JSON');
          const errorData = JSON.parse(error.message);
          console.log('Parsed signup error data:', errorData);
          
          showErrorMessage('signup-general-error', errorData.error || errorData.msg || 'Registration failed');
          
          if (errorData.field === 'username') {
            showErrorMessage('signup-username-error', errorData.error || 'Username already exists');
          }
        } catch (parseError) {
          console.log('Error parsing signup JSON:', parseError);
          showErrorMessage('signup-general-error', 'Registration failed: ' + errorMsg);
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
        const errorMsg = error.message || "Login failed";
        console.log('Login error:', error);
        console.log('Error message:', errorMsg);
        
        try {
          console.log('Attempting to parse error message as JSON');
          const errorData = JSON.parse(error.message);
          console.log('Parsed error data:', errorData);
          console.log('Error field:', errorData.field);
          console.log('Error message:', errorData.error);
          console.log('Error msg:', errorData.msg);
          
          const errorMessage = errorData.error || errorData.msg || 'Login failed';
          console.log('Displaying error message:', errorMessage);
          showErrorMessage('login-general-error', errorMessage);
          
          if (errorData.field === 'username') {
            showErrorMessage('login-username-error', errorData.error || 'No account exists with this username');
          } else if (errorData.field === 'password') {
            showErrorMessage('login-password-error', errorData.error || 'Password is incorrect');
          }
        } catch (parseError) {
          console.log('Error parsing JSON:', parseError);
          showErrorMessage('login-general-error', 'Login failed: ' + errorMsg);
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
