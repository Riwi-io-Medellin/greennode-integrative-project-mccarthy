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

function calcProgress(treesPlanted, treeQuantity, evidenceCount) {
  const treePct = treeQuantity > 0 ? Math.min(1, (treesPlanted || 0) / treeQuantity) : 0;
  const evPct = Math.min(1, (evidenceCount || 0) / 5);
  return Math.min(100, Math.round((treePct * 0.7 + evPct * 0.3) * 100));
}

window.logout = logoutFn;
requireAuth('admin');
initSidebar();

const params = new URLSearchParams(location.search);
const projectId = params.get('id');
let project = null;

async function load() {
  try {
    if (!projectId) { location.href = '/admin/proyectos'; return; }
    const res = await apiGet(`/api/projects/${projectId}`);
    console.log('[proyecto-detalle] API response:', res);
    project = res?.data;
    if (!project) { location.href = '/admin/proyectos'; return; }
    render();
  } catch (err) {
    console.error('[proyecto-detalle] Error cargando proyecto:', err);
    document.getElementById('projectContent').innerHTML =
      `<div class="empty-state" style="color:#ef4444"><i class="bi bi-exclamation-triangle"></i> Error cargando proyecto. Revisa la consola.</div>`;
  }
}

function render() {
  const p = project;
  const pct = calcProgress(p.trees_planted, p.tree_quantity, p.evidence_count);
  const stepMap = { quotation: 1, in_progress: 3, completed: 4, cancelled: 2 };
  const s = stepMap[p.status] || 1;
  const isActive = p.status === 'in_progress';

  document.getElementById('projectContent').innerHTML = `
    <div class="detail-header">
        <a href="/admin/proyectos" class="btn-back"><i class="bi bi-arrow-left"></i></a>
        <div>
            <div style="color:var(--gn-muted);font-size:0.82rem">GN-${String(p.id).padStart(4, '0')}</div>
            <div class="d-flex align-items-center gap-3">
                <h2 style="margin:0;font-size:1.4rem;font-weight:700">${escHtml(p.name)}</h2>
                <span class="badge-status ${getStatusBadge(p.status)}">${getStatusLabel(p.status)}</span>
            </div>
        </div>
        <div class="ms-auto d-flex gap-2 flex-wrap align-items-center">
            <select id="statusSelect" class="form-select form-select-sm" style="width:auto" onchange="updateStatus(this.value)">
                <option value="quotation" ${p.status === 'quotation' ? 'selected' : ''}>Cotización</option>
                <option value="in_progress" ${p.status === 'in_progress' ? 'selected' : ''}>En Progreso</option>
                <option value="completed" ${p.status === 'completed' ? 'selected' : ''}>Completado</option>
                <option value="cancelled" ${p.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
            </select>
            ${isActive ? `
            <button class="btn-primary-gn" data-bs-toggle="modal" data-bs-target="#modalEvidence"><i class="bi bi-camera"></i> Evidencia</button>
            <button class="btn-outline-gn" data-bs-toggle="modal" data-bs-target="#modalDocument" style="background:#fff"><i class="bi bi-file-earmark-plus"></i> Documento</button>
            ` : ''}
        </div>
    </div>

    <div class="lifecycle-steps">
        ${[['Cotización IA', 1], ['Validación', 2], ['En Progreso', 3], ['Completado', 4]]
      .map(([label, n], i, arr) => `
        <div class="step-item">
            <div class="step-circle ${s > n ? 'done' : s === n ? 'active' : ''}">${s > n ? '✓' : n}</div>
            <span class="step-label ${s === n ? 'active' : ''}">${label}</span>
        </div>
        ${i < arr.length - 1 ? `<div class="step-connector ${s > n ? 'done' : ''}"></div>` : ''}
      `).join('')}
    </div>

    <div class="mini-stat-grid">
        <div class="mini-stat">
            <div class="mini-stat-label">Progreso global</div>
            <div class="mini-stat-value">${pct}%</div>
            <div style="margin-top:0.4rem"><div class="progress-gn-full"><div class="progress-gn-fill" style="width:${pct}%"></div></div></div>
        </div>
        <div class="mini-stat">
            <div class="mini-stat-label d-flex align-items-center justify-content-between">
                Árboles sembrados
                <button onclick="editTreesPlanted()" style="background:none;border:none;cursor:pointer;color:var(--gn-green);padding:0;font-size:0.85rem" title="Actualizar árboles">
                    <i class="bi bi-pencil-square"></i>
                </button>
            </div>
            <div class="mini-stat-value" id="treesPlantedValue">${(p.trees_planted || 0).toLocaleString()}</div>
            <div class="mini-stat-sub">de ${(p.tree_quantity || 0).toLocaleString()} objetivo</div>
        </div>
        <div class="mini-stat">
            <div class="mini-stat-label">Evidencias</div>
            <div class="mini-stat-value">${p.evidence_count || 0}/5</div>
            <div class="mini-stat-sub">fotos registradas</div>
        </div>
        <div class="mini-stat">
            <div class="mini-stat-label">Empresa</div>
            <div style="font-size:0.95rem;font-weight:700;margin-top:0.4rem">${escHtml(p.company_name || '—')}</div>
            <div class="mini-stat-sub">${escHtml(p.territory_name || '—')}</div>
        </div>
    </div>

    <div class="gn-tabs">
        <div class="gn-tab active" onclick="switchTab('evidencias')">
            <i class="bi bi-camera"></i> Evidencias
            ${p.evidences?.length ? `<span style="background:#059669;color:#fff;border-radius:999px;font-size:0.7rem;padding:1px 7px;margin-left:4px">${p.evidences.length}</span>` : ''}
        </div>
        <div class="gn-tab" onclick="switchTab('documentos')">
            <i class="bi bi-file-earmark"></i> Documentos
            ${p.files?.length ? `<span style="background:#ef4444;color:#fff;border-radius:999px;font-size:0.7rem;padding:1px 7px;margin-left:4px">${p.files.length}</span>` : ''}
        </div>
        <div class="gn-tab" onclick="switchTab('cotizacion')">
            <i class="bi bi-file-text"></i> Cotización
        </div>
    </div>

    <div class="gn-tab-content active" id="tab-evidencias">${renderEvidences(p.evidences || [], isActive)}</div>
    <div class="gn-tab-content" id="tab-documentos">${renderFiles(p.files || [], isActive)}</div>
    <div class="gn-tab-content" id="tab-cotizacion">${renderQuote(p)}</div>
  `;
}

function renderEvidences(evs, canAdd) {
  let btn = '';
  if (canAdd) {
    if (evs.length >= 5) {
      btn = `<div class="mb-3 d-flex align-items-center gap-3">
        <button class="btn-primary-gn" disabled style="opacity:0.45;cursor:not-allowed"><i class="bi bi-camera"></i> Añadir evidencia</button>
        <span style="font-size:0.82rem;color:#6b7280"><i class="bi bi-info-circle"></i> Límite de evidencias alcanzado (5/5)</span>
      </div>`;
    } else {
      btn = `<div class="mb-3"><button class="btn-primary-gn" data-bs-toggle="modal" data-bs-target="#modalEvidence"><i class="bi bi-camera"></i> Añadir evidencia</button></div>`;
    }
  }
  if (!evs.length) return btn + '<div class="empty-state"><i class="bi bi-camera"></i>No hay evidencias cargadas aún.</div>';
  return btn + `<div class="evidence-grid">${evs.map(e => `
    <div class="evidence-item">
        <img src="${escHtml(e.evidence_url)}" class="evidence-img" style="cursor:zoom-in"
            onclick="window.open('${escHtml(e.evidence_url)}','_blank')"
            onerror="this.src='https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=200&fit=crop'" />
        <div class="evidence-caption">${escHtml(e.description || 'Sin descripción')} · ${new Date(e.evidence_date).toLocaleDateString('es-CO')}</div>
    </div>`).join('')}</div>`;
}

function renderFiles(files, canAdd) {
  const typeLabels = { legal_document: 'Documento Legal', certificate: 'Certificado', report: 'Reporte', other: 'Otro' };
  const btn = canAdd
    ? `<div class="mb-3"><button class="btn-primary-gn" data-bs-toggle="modal" data-bs-target="#modalDocument"><i class="bi bi-file-earmark-plus"></i> Subir documento</button></div>`
    : '';
  if (!files.length) return btn + '<div class="empty-state"><i class="bi bi-file-earmark-x"></i>No hay documentos subidos.</div>';
  return btn + `<div class="d-flex flex-column gap-2">${files.map(f => `
    <div class="d-flex align-items-center gap-3 p-3" style="background:var(--gn-bg);border-radius:8px;border:1px solid var(--gn-border)">
        <i class="bi bi-file-earmark-pdf" style="font-size:1.4rem;color:#ef4444;flex-shrink:0"></i>
        <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(f.file_url.split('/').pop())}</div>
            <div style="font-size:0.75rem;color:var(--gn-muted)">${typeLabels[f.file_type] || f.file_type} · ${new Date(f.uploaded_at).toLocaleDateString('es-CO')}</div>
        </div>
        <a href="${escHtml(f.file_url)}" target="_blank" download class="btn-outline-gn" style="font-size:0.8rem;white-space:nowrap"><i class="bi bi-download"></i> Descargar</a>
    </div>`).join('')}</div>`;
}

function renderQuote(p) {
  if (!p.quote_id) return '<div class="empty-state"><i class="bi bi-file-x"></i>Sin cotización vinculada.</div>';
  return `
  <div class="card-panel">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div style="font-weight:700;font-size:1rem">Marco Lógico validado</div>
          <button class="btn-primary-gn" onclick="downloadQuotePDF()" style="font-size:0.82rem">
              <i class="bi bi-file-earmark-pdf"></i> Descargar PDF
          </button>
      </div>
      <div style="white-space:pre-wrap;font-size:0.85rem;line-height:1.7;background:var(--gn-bg);padding:1rem;border-radius:8px;max-height:380px;overflow-y:auto">${escHtml(p.ai_draft_text || '—')}</div>
      <div class="row g-3 mt-2">
          <div class="col-4"><div style="font-size:0.75rem;color:var(--gn-muted)">Monto total</div><div style="font-weight:700">${formatCOP(p.quoted_amount)}</div></div>
          <div class="col-4"><div style="font-size:0.75rem;color:var(--gn-muted)">Especie</div><div style="font-weight:700">${escHtml(p.species_name || '—')}</div></div>
          <div class="col-4"><div style="font-size:0.75rem;color:var(--gn-muted)">Territorio</div><div style="font-weight:700">${escHtml(p.territory_name || '—')}</div></div>
      </div>
  </div>`;
}

window.switchTab = function (tab) {
  const tabs = ['evidencias', 'documentos', 'cotizacion'];
  document.querySelectorAll('.gn-tab').forEach((t, i) => t.classList.toggle('active', tabs[i] === tab));
  document.querySelectorAll('.gn-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
};

window.updateStatus = async function (status) {
  await apiPatch(`/api/projects/${projectId}/status`, { status });
  Swal.fire({ icon: 'success', title: 'Estado actualizado', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
  load();
};

window.editTreesPlanted = async function () {
  const p = project;
  const current = p.trees_planted || 0;
  const max = p.tree_quantity || 999999;

  const { value, isConfirmed } = await Swal.fire({
    title: 'Actualizar árboles sembrados',
    html: `
      <div style="font-size:0.85rem;color:#6b7280;margin-bottom:0.75rem">
          Objetivo: <strong>${max.toLocaleString()}</strong> árboles
      </div>
      <input id="swal-trees-input" type="number" min="0" max="${max}" step="1"
          value="${current}"
          class="swal2-input"
          style="font-size:1.1rem;text-align:center" />`,
    confirmButtonColor: '#059669',
    confirmButtonText: 'Guardar',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    preConfirm: () => {
      const v = parseInt(document.getElementById('swal-trees-input').value, 10);
      if (isNaN(v) || v < 0) { Swal.showValidationMessage('Ingresa un número >= 0'); return false; }
      if (v > max) { Swal.showValidationMessage(`No puede superar ${max.toLocaleString()} árboles`); return false; }
      return v;
    },
  });

  if (!isConfirmed || value === undefined) return;

  const res = await apiPatch(`/api/projects/${projectId}/progress`, { trees_planted: value });
  if (!res?.success) {
    Swal.fire({ icon: 'error', title: 'Error', text: res?.message || 'No se pudo actualizar.', confirmButtonColor: '#ef4444' });
    return;
  }

  project.trees_planted = value;
  const newPct = calcProgress(value, project.tree_quantity, project.evidence_count);
  document.getElementById('treesPlantedValue').textContent = value.toLocaleString();
  const fill = document.querySelector('.progress-gn-fill');
  const allValues = document.querySelectorAll('.mini-stat-value');
  if (fill) fill.style.width = `${newPct}%`;
  if (allValues[0]) allValues[0].textContent = `${newPct}%`;

  Swal.fire({ icon: 'success', title: 'Actualizado', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
};

// ---- Modales (Bootstrap) ----
window.previewEvidenceFile = function (input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('evidencePreviewImg').src = e.target.result;
    document.getElementById('evidenceFileName').textContent = file.name;
    document.getElementById('evidencePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
};

window.showDocName = function (input) {
  const file = input.files[0];
  document.getElementById('docFileName').textContent = file ? `✓ ${file.name}` : '';
};

window.submitEvidence = async function () {
  const file = document.getElementById('evidenceFile').files[0];
  const desc = document.getElementById('evidenceDesc').value.trim();
  if (!file) return Swal.fire({ icon: 'warning', title: 'Selecciona una imagen', confirmButtonColor: '#198754' });

  const btn = document.getElementById('btnSubmitEvidence');
  btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Subiendo...';

  const fd = new FormData();
  fd.append('file', file);
  fd.append('project_id', projectId);
  fd.append('description', desc);

  try {
    const r = await fetch('/api/evidence', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: fd,
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.message);

    bootstrap.Modal.getInstance(document.getElementById('modalEvidence'))?.hide();
    document.getElementById('evidenceFile').value = '';
    document.getElementById('evidenceDesc').value = '';
    document.getElementById('evidencePreview').style.display = 'none';
    Swal.fire({ icon: 'success', title: 'Evidencia subida', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
    await load();
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Error al subir', text: e.message, confirmButtonColor: '#ef4444' });
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="bi bi-upload"></i> Subir evidencia';
  }
};

window.submitDocument = async function () {
  const file = document.getElementById('docFile').files[0];
  const type = document.getElementById('docType').value;
  if (!file) return Swal.fire({ icon: 'warning', title: 'Selecciona un archivo', confirmButtonColor: '#198754' });

  const btn = document.getElementById('btnSubmitDoc');
  btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Subiendo...';

  const fd = new FormData();
  fd.append('file', file);
  fd.append('project_id', projectId);
  fd.append('file_type', type);

  try {
    const r = await fetch('/api/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: fd,
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.message);

    bootstrap.Modal.getInstance(document.getElementById('modalDocument'))?.hide();
    document.getElementById('docFile').value = '';
    document.getElementById('docFileName').textContent = '';
    Swal.fire({ icon: 'success', title: 'Documento subido', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
    load();
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Error al subir', text: e.message, confirmButtonColor: '#ef4444' });
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="bi bi-upload"></i> Subir documento';
  }
};

window.downloadQuotePDF = function () {
  const p = project; if (!p) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const M = 20, W = 210;
  let y = 20;

  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, W, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('GreenNode', M, 14);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Plataforma B2B de Reforestación', M, 21);
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN OFICIAL', W - M, 14, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`GN-${String(p.quote_id || p.id).padStart(4, '0')}`, W - M, 21, { align: 'right' });
  doc.text(new Date().toLocaleDateString('es-CO'), W - M, 27, { align: 'right' });

  y = 45;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text(p.name || 'Proyecto de Reforestación', M, y); y += 8;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Empresa: ${p.company_name || '—'} · ${p.territory_name || '—'}, ${p.territory_city || ''}`, M, y); y += 12;

  doc.setTextColor(30, 30, 30);
  const totalAmt = p.quoted_amount ? Number(p.quoted_amount) : null;
  const subtotalAmt = totalAmt ? totalAmt / 1.5 : null;
  const fmtPDF = (n) => `COP $${Math.round(n).toLocaleString('es-CO')}`;
  const rows = [
    ...(subtotalAmt ? [
      ['Subtotal', fmtPDF(subtotalAmt)],
      ['Gastos operativos (50%)', fmtPDF(subtotalAmt * 0.5)],
      ['Total aprobado', totalAmt ? fmtPDF(totalAmt) : '—'],
    ] : [
      ['Monto total aprobado', totalAmt ? fmtPDF(totalAmt) : '—'],
    ]),
    ['Árboles a sembrar', `${(p.tree_quantity || 0).toLocaleString()} árboles`],
    ['Especie', p.species_name || '—'],
    ['Territorio', `${p.territory_name || '—'} (${p.territory_city || '—'})`],
    ['Estado del proyecto', getStatusLabel(p.status)],
    ['Fecha de inicio', p.start_date ? new Date(p.start_date).toLocaleDateString('es-CO') : '—'],
  ];
  doc.setFillColor(243, 250, 246);
  doc.rect(M, y - 4, W - M * 2, rows.length * 8 + 6, 'F');
  doc.setDrawColor(200, 230, 210);
  doc.rect(M, y - 4, W - M * 2, rows.length * 8 + 6, 'S');
  rows.forEach(([label, val]) => {
    doc.setTextColor(label === 'Total aprobado' ? 5 : 30, label === 'Total aprobado' ? 150 : 30, label === 'Total aprobado' ? 105 : 30);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(label + ':', M + 4, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.text(val, M + 65, y + 1); y += 8;
  });
  doc.setTextColor(30, 30, 30);
  y += 8;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text('Marco Lógico Validado', M, y); y += 5;
  doc.setDrawColor(5, 150, 105);
  doc.line(M, y, W - M, y); y += 6;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.splitTextToSize(p.ai_draft_text || '—', W - M * 2).forEach(line => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(line, M, y); y += 5.5;
  });

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(160, 160, 160);
    doc.text('GreenNode · greennode.co', M, 290);
    doc.text(`Página ${i} de ${total}`, W - M, 290, { align: 'right' });
  }
  doc.save(`GreenNode-Cotizacion-GN${String(p.quote_id || p.id).padStart(4, '0')}.pdf`);
};

load();
