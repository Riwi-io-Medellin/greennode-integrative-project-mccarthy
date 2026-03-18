import {
  apiGet,
  apiPatch,
  requireAuth,
  getStatusBadge,
  getStatusLabel,
  formatCOP,
  escHtml,
  initSidebar,
  logout as logoutFn,
} from '../api.js';

window.logout = logoutFn;
const user = requireAuth('admin');
initSidebar();

let allProjects = [];

async function load() {
  const res = await apiGet('/api/projects');
  allProjects = res?.data || [];
  document.getElementById('projSubtitle').textContent = `${allProjects.length} proyectos en total`;
  render(allProjects);
}

function render(projects) {
  const container = document.getElementById('projectsList');
  if (projects.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="bi bi-folder-x"></i>No hay proyectos.</div>';
    return;
  }
  container.innerHTML = projects.map(p => {
    const pct = p.tree_quantity
      ? Math.min(100, Math.round((p.trees_planted || 0) / p.tree_quantity * 100))
      : 0;
    return `
    <a href="/admin/proyecto-detalle?id=${p.id}" class="project-card">
        <div class="project-card-top">
            <div>
                <div class="project-code">GN-${String(p.id).padStart(4, '0')}</div>
                <div class="project-title">${escHtml(p.name)}</div>
                <div class="project-meta">${escHtml(p.company_name)} · ${escHtml(p.territory_city || p.start_date?.substring(0, 10) || '—')}</div>
            </div>
            <div style="text-align:right">
                <span class="badge-status ${getStatusBadge(p.status)}">${getStatusLabel(p.status)}</span>
                <div class="project-price" style="margin-top:0.5rem">${formatCOP(p.quoted_amount)}</div>
            </div>
        </div>
        <div class="project-bar-row">
            <div class="progress-gn-full"><div class="progress-gn-fill" style="width:${pct}%"></div></div>
            <span style="font-size:0.82rem;font-weight:600;min-width:40px">${pct}%</span>
            <div class="project-stats">
                <span>🌱 ${(p.trees_planted || 0).toLocaleString()} árboles</span>
                <span><i class="bi bi-camera"></i> ${p.evidence_count || 0} evidencias</span>
            </div>
        </div>
    </a>`;
  }).join('');
}

document.getElementById('searchInput').addEventListener('input', filterProjects);
document.getElementById('filterStatus').addEventListener('change', filterProjects);

function filterProjects() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  render(allProjects.filter(p =>
    (!status || p.status === status) &&
    (!q || p.name?.toLowerCase().includes(q) || p.company_name?.toLowerCase().includes(q)),
  ));
}

window.toggleDropdown = function () {
  document.getElementById('userDropdown').classList.toggle('show');
};
document.addEventListener('click', (e) => {
  if (!e.target.closest('#userAvatar'))
    document.getElementById('userDropdown').classList.remove('show');
});

load();
