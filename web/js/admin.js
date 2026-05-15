document.addEventListener('DOMContentLoaded', function () {
  const isLoggedIn = localStorage.getItem('plvAdminLoggedIn');
  if (isLoggedIn !== 'true') {
    window.location.href = 'admin-login.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem('plvAdminLoggedIn');
      window.location.href = 'admin-login.html';
    });
  }
});
