document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById('username')?.value.trim();
  const password = document.getElementById('password')?.value.trim();
  const message = document.getElementById('loginMessage');

  if (!username || !password) {
    if (message) message.textContent = 'Please enter both username and password.';
    return;
  }

  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem('plvAdminLoggedIn', 'true');
    window.location.href = 'admin.html';
    return;
  }

  if (message) message.textContent = 'Invalid credentials. Try admin / admin123.';
}
