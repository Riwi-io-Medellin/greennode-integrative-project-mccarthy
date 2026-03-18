import {
  apiGet,
  requireAuth,
  getStatusBadge,
  getStatusLabel,
  formatCOP,
  escHtml,
  initSidebar,
  logout as logoutFn,
  openCompanyModal,
} from '../api.js';

const user = requireAuth('client');
window.openCompanyModal = () => openCompanyModal(user);
window.logout = logoutFn;
initSidebar();

const initials = (user?.companyName || user?.email || 'ME').substring(0, 2).toUpperCase();
document.getElementById('companyAvatar').textContent = initials;
document.getElementById('companyName').textContent = user?.companyName || user?.email;
document.getElementById('userAvatar').textContent = initials;

async function load() {
  const res = await apiGet('/api/projects/my');
  const projects = res?.data || [];
  document.getElementById('projectSubtitle').textContent = `${projects.length} proyectos en total`;

  // Verificar si hay un proyecto activo
  const hasActive = projects.some(p => p.status === 'in_progress');
  if (hasActive) {
    document.getElementById('blockBanner').classList.remove('d-none');
    document.getElementById('newQuoteBtn').style.opacity = '0.5';
    document.getElementById('newQuoteBtn').style.pointerEvents = 'none';
    document.getElementById('newQuoteBtn').title = 'Tienes un proyecto activo';
  }

  const container = document.getElementById('projectsList');
  if (projects.length === 0) {
    container.innerHTML = `
    <div class="empty-state">
        <i class="bi bi-folder-x"></i>
        <div style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">No tienes proyectos aún</div>
        <p style="color:var(--gn-muted)">Crea una cotización para iniciar tu proyecto de reforestación.</p>
        <a href="/client/nueva-cotizacion" class="btn-primary-gn" style="margin-top:0.75rem">
            <i class="bi bi-plus"></i> Nueva Cotización
        </a>
    </div>`;
    return;
  }

  container.innerHTML = projects.map(p => {
    const pct = p.tree_quantity
      ? Math.min(100, Math.round((p.trees_planted || 0) / p.tree_quantity * 100))
      : 0;
    return `
    <a href="/client/proyecto-detalle?id=${p.id}" class="project-card">
        <div class="project-card-top">
            <div>
                <div style="display:flex;gap:0.5rem;align-items:center">
                    <div class="project-code">GN-${String(p.id).padStart(4, '0')}</div>
                    <span class="badge-status ${getStatusBadge(p.status)}">${getStatusLabel(p.status)}</span>
                </div>
                <div class="project-title">${escHtml(p.name)}</div>
                <div class="project-meta">${escHtml(p.company_name)} · ${escHtml(p.territory_city || '—')}, Colombia</div>
            </div>
            <div style="text-align:right">
                <div class="project-price">${formatCOP(p.quoted_amount)}</div>
                <div style="font-size:0.82rem;color:var(--gn-muted)">${escHtml(p.territory_name || '—')}</div>
            </div>
        </div>
        <div class="project-bar-row">
            <div class="progress-gn-full"><div class="progress-gn-fill" style="width:${pct}%"></div></div>
            <span style="font-size:0.82rem;font-weight:600;min-width:40px">${pct}%</span>
            <div class="project-stats">
                <span>${(p.trees_planted || 0).toLocaleString()} árboles</span>
                <span>→</span>
            </div>
        </div>
    </a>`;
  }).join('');
}

load();
