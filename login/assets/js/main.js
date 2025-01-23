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
    const response = await fetch('http://141.253.109.250:80/api/database');
    const users = await response.json();

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      document.cookie = `userId=${user.id}; path=/`;
      window.location.href = '/';
    } else {
      document.getElementById('error-message').style.display = 'block';
    }
  } catch (error) {
    console.error('Error logging in:', error);
  }
});

// Redirect if already logged in
if (document.cookie.includes('userId=')) {
  window.location.href = '/';
}