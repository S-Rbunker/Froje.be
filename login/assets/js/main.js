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
    
      // Haal redirect-parameter op uit URL
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
    
      // Redirect correct
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
(async function redirectIfLoggedIn() {
  try {
    const response = await fetch('https://api.froje.be/user', {
      credentials: 'include',
    });

    if (response.ok) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      window.location.href = redirect;
    }
  } catch (err) {
    console.error('Error checking if user is logged in:', err);
  }
})();
