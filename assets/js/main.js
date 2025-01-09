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

document.getElementById('login-form').addEventListener('submit', async function (event) {
  event.preventDefault();

  const username = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // Fetch the credentials list from the text file
    const response = await fetch('credentials.txt');
    const credentialsText = await response.text();

    // Parse the credentials
    const credentials = credentialsText.split('\n').map(line => {
      const [user, pass] = line.split(':');
      return { user, pass };
    });

    // Check if the credentials match
    const isValid = credentials.some(cred => cred.user === username && cred.pass === password);

    if (isValid) {
      // Save login status in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      window.location.href = 'main.html';
    } else {
      // Show error message
      const errorMessage = document.getElementById('error-message');
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error('Error fetching credentials:', error);
  }
});

// Redirect to login page if not logged in and on main.html
if (window.location.pathname.endsWith('main.html') && localStorage.getItem('isLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}