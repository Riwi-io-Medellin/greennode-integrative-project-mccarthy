/* dashboard-ui.js — Funciones de UI no-module para admin/dashboard.html
   (dropdown de usuario, logout, colapso de sidebar)
   Se carga como script normal (sin type="module"). */

function toggleDropdown() {
  document.getElementById('userDropdown').classList.toggle('show');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#userAvatar')) {
    document.getElementById('userDropdown').classList.remove('show');
  }
});

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.replace('/login');
}

// Colapso de sidebar
const sidebar = document.getElementById('sidebar');
const mainWrapper = document.getElementById('mainWrapper');
document.getElementById('collapseBtn').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  mainWrapper.classList.toggle('collapsed');
});
