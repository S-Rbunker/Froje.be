/*=============== SHOW HIDDEN - PASSWORD ===============*/
const showHiddenPassword = (inputPassword, inputIcon) => {
  const input = document.getElementById(inputPassword),
        iconEye = document.getElementById(inputIcon)

  iconEye.addEventListener('click', () => {
    // Change password to text
    if (input.type === 'password') {
      // Switch to text
      input.type = 'text'

      // Add icon
      iconEye.classList.add('ri-eye-line')

      // Remove icon
      iconEye.classList.remove('ri-eye-off-line')
    } else {
      // Change to password
      input.type = 'password'

      // Remove icon
      iconEye.classList.remove('ri-eye-line')

      // Add icon
      iconEye.classList.add('ri-eye-off-line')
    }
  })
}

showHiddenPassword('password', 'input-icon')

document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('https://api.froje.be/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });

    if (response.status === 429) {
      // Rate limit reached
      document.getElementById('rate-limit').style.display = 'block';
      document.getElementById('error-message').style.display = 'none';
    } else if (response.ok) {
      const data = await response.json();
    
      const params = new URLSearchParams(window.location.search);
      let redirect = params.get('redirect');
      
      if (!redirect) {
        redirect = sessionStorage.getItem("loginRedirect") || '/';
        console.log("Loaded redirect from sessionStorage:", redirect);
      }

      sessionStorage.removeItem("loginRedirect");
      window.location.href = redirect;
    } else {
      // Other error (e.g., 401, 500)
      document.getElementById('error-message').style.display = 'block';
      document.getElementById('rate-limit').style.display = 'none';
    }
  } catch (error) {
  }
});

// Redirect if already logged in
document.addEventListener("DOMContentLoaded", function () {
  console.log("Login page loaded.");

  const params = new URLSearchParams(window.location.search);
  let redirect = params.get('redirect');
  if (!redirect) {
    redirect = sessionStorage.getItem("loginRedirect") || '/';
    console.log("Loaded redirect from sessionStorage:", redirect);
  }
  console.log("Redirect parameter on page load:", redirect);

  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('https://api.froje.be/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (response.status === 429) {
        console.log("Rate limit reached.");
        document.getElementById('rate-limit').style.display = 'block';
        document.getElementById('error-message').style.display = 'none';
      } else if (response.ok) {
        const data = await response.json();
        console.log("Login successful:", data);

        console.log("Using final redirect path:", redirect);
        sessionStorage.removeItem("loginRedirect");
        window.location.href = redirect;
      } else {
        console.log("Login failed. Status:", response.status);
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('rate-limit').style.display = 'none';
      }
    } catch (error) {
      console.error("Error during login fetch:", error);
    }
  });

  // Redirect if already logged in
  (async function redirectIfLoggedIn() {
    try {
      const response = await fetch('https://api.froje.be/user', {
        credentials: 'include',
      });

      if (response.ok) {
        const redirect = params.get('redirect') || '/';
        console.log("User already logged in, redirecting to:", redirect);
        window.location.href = redirect;
      } else {
        console.log("User not logged in.");
      }
    } catch (err) {
      console.error('Error checking if user is logged in:', err);
    }
  })();
});


