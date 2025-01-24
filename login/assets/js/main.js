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
      // Successful login
      const data = await response.json();
      window.location.href = '/';
    } else {
      // Other error (e.g., 401, 500)
      document.getElementById('error-message').style.display = 'block';
      document.getElementById('rate-limit').style.display = 'none';
    }
  } catch (error) {
  }
});

// Redirect if already logged in
(async function redirectIfLoggedIn() {
  try {
    // Make a request to your Node endpoint that returns user info if logged in
    const response = await fetch('https://api.froje.be/user', {
      credentials: 'include', // crucial for cross-site cookies
    });

    // If the server returns 200, user is logged in
    if (response.ok) {
      // Redirect to homepage (or wherever) if already logged in
      window.location.href = '/';
    }
    // If response is 401 or 404, do nothing—user can stay on login page
  } catch (err) {
    console.error('Error checking if user is logged in:', err);
    // Optionally handle errors (network issues, etc.)
  }
})();
