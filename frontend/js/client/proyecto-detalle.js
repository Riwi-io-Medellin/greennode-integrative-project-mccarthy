import {
  apiGet,
  apiPost,
  requireAuth,
  getStatusBadge,
  getStatusLabel,
  formatCOP,
  escHtml,
  initSidebar,
  logout as logoutFn,
  openCompanyModal,
} from '../api.js';

window.openCompanyModal = () => openCompanyModal(user);
window.logout = logoutFn;
const user = requireAuth('client');
initSidebar();

const initials = (user?.companyName || 'ME').substring(0, 2).toUpperCase();
document.getElementById('companyAvatar').textContent = initials;
document.getElementById('companyName').textContent = user?.companyName || '';
document.getElementById('userAvatar').textContent = initials;

const params = new URLSearchParams(location.search);
const projectId = params.get('id');

async function load() {
  if (!projectId) { location.href = '/client/proyectos'; return; }
  const res = await apiGet(`/api/projects/${projectId}`);
  const p = res?.data;
  if (!p) { location.href = '/client/proyectos'; return; }
  render(p);
}

function render(p) {
  const pct = p.tree_quantity
    ? Math.min(100, Math.round((p.trees_planted || 0) / p.tree_quantity * 100))
    : 0;
  const stepStatus = { quotation: 1, in_progress: 3, completed: 4, cancelled: 2 };
  const step = stepStatus[p.status] || 1;

  const lastEvidence = p.evidences?.[0];
  const daysAgo = lastEvidence
    ? Math.floor((Date.now() - new Date(lastEvidence.evidence_date)) / 86400000)
    : null;

  document.getElementById('pageContent').innerHTML = `
    <div class="detail-header">
        <a href="/client/proyectos" class="btn-back"><i class="bi bi-arrow-left"></i></a>
        <div>
            <div style="display:flex;gap:0.75rem;align-items:center">
                <span style="color:var(--gn-muted);font-size:0.82rem">GN-${String(p.id).padStart(4, '0')}</span>
                <span class="badge-status ${getStatusBadge(p.status)}">${getStatusLabel(p.status)}</span>
            </div>
            <h2 style="margin:0.2rem 0 0;font-size:1.4rem;font-weight:700">${escHtml(p.name)}</h2>
        </div>
    </div>

    <!-- Ciclo de vida -->
    <div class="lifecycle-steps">
        <div class="step-item">
            <div class="step-circle ${step > 1 ? 'done' : step === 1 ? 'active' : ''}">${step > 1 ? '✓' : '1'}</div>
            <span class="step-label ${step === 1 ? 'active' : ''}">Cotización IA</span>
        </div>
        <div class="step-connector ${step > 1 ? 'done' : ''}"></div>
        <div class="step-item">
            <div class="step-circle ${step > 2 ? 'done' : step === 2 ? 'active' : ''}">${step > 2 ? '✓' : '2'}</div>
            <span class="step-label ${step === 2 ? 'active' : ''}">Validación</span>
        </div>
        <div class="step-connector ${step > 2 ? 'done' : ''}"></div>
        <div class="step-item">
            <div class="step-circle ${step > 3 ? 'done' : step === 3 ? 'active' : ''}">${step > 3 ? '✓' : '3'}</div>
            <span class="step-label ${step === 3 ? 'active' : ''}">En Progreso</span>
        </div>
        <div class="step-connector ${step > 3 ? 'done' : ''}"></div>
        <div class="step-item">
            <div class="step-circle ${step === 4 ? 'done' : ''}">4</div>
            <span class="step-label ${step === 4 ? 'active' : ''}">Completado</span>
        </div>
    </div>

    <!-- Mini stats -->
    <div class="mini-stat-grid">
        <div class="mini-stat">
            <div class="mini-stat-label">Progreso global</div>
            <div class="mini-stat-value">${pct}%</div>
            <div style="margin-top:0.4rem"><div class="progress-gn-full"><div class="progress-gn-fill" style="width:${pct}%"></div></div></div>
        </div>
        <div class="mini-stat">
            <div class="mini-stat-label">Árboles sembrados</div>
            <div class="mini-stat-value">${(p.trees_planted || 0).toLocaleString()}</div>
            <div class="mini-stat-sub">de ${(p.tree_quantity || 0).toLocaleString()} objetivo</div>
        </div>
        <div class="mini-stat">
            <div class="mini-stat-label">Última evidencia</div>
            <div class="mini-stat-value ${daysAgo > 10 ? 'warning' : ''}">${daysAgo !== null ? `hace ${daysAgo} días` : 'Sin evidencia'}</div>
            <div class="mini-stat-sub">${daysAgo > 10 ? '⚠ Pendiente' : '✓ Al día'}</div>
        </div>
        <div class="mini-stat">
            <div class="mini-stat-label">Próximo hito</div>
            <div style="font-size:0.95rem;font-weight:700;margin-top:0.4rem">Siembra Jornada #3</div>
            <div class="mini-stat-sub">${p.end_date || 'Por definir'}</div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="gn-tabs">
        <div class="gn-tab active" onclick="switchTab('evidencias')">Evidencias</div>
        <div class="gn-tab" onclick="switchTab('documentos')">Documentos</div>
        <div class="gn-tab" onclick="switchTab('cotizacion')">Cotización</div>
    </div>

    <div class="gn-tab-content active" id="tab-evidencias">${renderEvidences(p.evidences || [])}</div>
    <div class="gn-tab-content" id="tab-documentos">${renderFiles(p.files || [])}</div>
    <div class="gn-tab-content" id="tab-cotizacion">${renderQuote(p)}</div>
  `;
}

function renderEvidences(evidences) {
  if (!evidences.length) {
    return `<div class="empty-state">
        <i class="bi bi-camera" style="font-size:2.5rem"></i>
        <div style="margin-top:0.5rem">No hay evidencias cargadas aún.</div>
        <p style="font-size:0.85rem">Ve a la pestaña <strong>Documentos</strong> para ver el repositorio de archivos.</p>
    </div>`;
  }
  return `<div class="evidence-grid">${evidences.map(e => `
    <div class="evidence-item">
        <img src="${escHtml(e.evidence_url)}" class="evidence-img" onerror="this.src='https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=200&fit=crop'" />
        <div class="evidence-caption">${escHtml(e.description || '')} · ${new Date(e.evidence_date).toLocaleDateString('es-CO')}</div>
    </div>
  `).join('')}</div>`;
}

function renderFiles(files) {
  const typeLabels = { legal_document: 'Documento Legal', certificate: 'Certificado', report: 'Reporte', other: 'Otro' };
  if (!files.length) return '<div class="empty-state"><i class="bi bi-file-earmark-x"></i>No hay documentos disponibles.</div>';
  return `<div style="display:flex;flex-direction:column;gap:0.5rem">${files.map(f => `
    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;background:var(--gn-bg);border-radius:8px;border:1px solid var(--gn-border)">
        <i class="bi bi-file-earmark-pdf" style="font-size:1.2rem;color:#ef4444"></i>
        <div style="flex:1">
            <div style="font-weight:600;font-size:0.88rem">${escHtml(f.file_url.split('/').pop() || f.file_url)}</div>
            <div style="font-size:0.78rem;color:var(--gn-muted)">${typeLabels[f.file_type] || f.file_type} · ${new Date(f.uploaded_at).toLocaleDateString('es-CO')}</div>
        </div>
        <a href="${escHtml(f.file_url)}" target="_blank" class="btn-outline-gn" style="font-size:0.8rem"><i class="bi bi-download"></i> Descargar</a>
    </div>
  `).join('')}</div>`;
}

function renderQuote(p) {
  return `
  <div class="card-panel">
      <div style="font-weight:700;font-size:1rem;margin-bottom:0.75rem">Resumen de la cotización</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem">
          <div><div style="font-size:0.78rem;color:var(--gn-muted)">Monto total</div><div style="font-weight:700;font-size:1.1rem">${formatCOP(p.quoted_amount)}</div></div>
          <div><div style="font-size:0.78rem;color:var(--gn-muted)">Árboles objetivo</div><div style="font-weight:700">${(p.tree_quantity || 0).toLocaleString()}</div></div>
          <div><div style="font-size:0.78rem;color:var(--gn-muted)">Especie</div><div style="font-weight:700">${escHtml(p.species_name || '—')}</div></div>
      </div>
      <div style="background:var(--gn-bg);border-radius:8px;padding:1rem;font-size:0.85rem;line-height:1.7;white-space:pre-wrap">
          ${escHtml(p.ai_draft_text || 'Marco lógico no disponible.')}
      </div>
  </div>`;
}

window.switchTab = function (tab) {
  const tabs = ['evidencias', 'documentos', 'cotizacion'];
  document.querySelectorAll('.gn-tab').forEach((t, i) => t.classList.toggle('active', tabs[i] === tab));
  document.querySelectorAll('.gn-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
};

load();
