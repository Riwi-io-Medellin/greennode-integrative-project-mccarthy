import {
  apiGet,
  apiPost,
  requireAuth,
  escHtml,
  initSidebar,
  logout as logoutFn,
} from '../api.js';

window.logout = logoutFn;
requireAuth('admin');
initSidebar();

const typeLabels = {
  legal_document: 'Documento Legal',
  certificate: 'Certificado',
  report: 'Reporte',
  other: 'Otro',
};
let projects = [];
let allFiles = [];

async function load() {
  const pRes = await apiGet('/api/projects');
  projects = pRes?.data || [];

  const select = document.getElementById('projectFilter');
  projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `GN-${String(p.id).padStart(4, '0')} - ${p.name}`;
    select.appendChild(opt);
  });

  await loadFiles();
}

async function loadFiles(projectId = '') {
  if (projectId) {
    const res = await apiGet(`/api/files/${projectId}`);
    allFiles = (res?.data || []).map(f => ({
      ...f,
      projectName: projects.find(p => p.id == projectId)?.name,
    }));
  } else {
    const promises = projects.map(p =>
      apiGet(`/api/files/${p.id}`).then(r =>
        (r?.data || []).map(f => ({ ...f, projectName: p.name })),
      ),
    );
    const results = await Promise.all(promises);
    allFiles = results.flat();
  }
  renderFiles(allFiles);
}

function renderFiles(files) {
  const tbody = document.getElementById('filesTable');
  if (!files.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-4">No hay archivos.</td></tr>';
    return;
  }
  tbody.innerHTML = files.map(f => `
    <tr>
        <td style="font-weight:600;font-size:0.85rem"><i class="bi bi-file-earmark-pdf" style="color:#ef4444"></i> ${escHtml(f.file_url.split('/').pop() || f.file_url)}</td>
        <td>${typeLabels[f.file_type] || f.file_type}</td>
        <td>${escHtml(f.projectName || '—')}</td>
        <td>${escHtml(f.uploaded_by_email || '—')}</td>
        <td>${new Date(f.uploaded_at).toLocaleDateString('es-CO')}</td>
        <td><a href="${escHtml(f.file_url)}" target="_blank" class="btn-outline-gn" style="font-size:0.78rem"><i class="bi bi-download"></i></a></td>
    </tr>
  `).join('');
}

document.getElementById('projectFilter').addEventListener('change', (e) => loadFiles(e.target.value));

window.showAddFile = async function () {
  const opts = projects.map(p =>
    `<option value="${p.id}">GN-${String(p.id).padStart(4, '0')} - ${escHtml(p.name)}</option>`,
  ).join('');
  const { value } = await Swal.fire({
    title: 'Añadir archivo',
    html: `
      <select id="fpId" class="swal2-select"><option value="">Selecciona proyecto</option>${opts}</select>
      <input id="fpUrl" class="swal2-input" placeholder="URL del archivo" />
      <select id="fpType" class="swal2-select">
          <option value="legal_document">Documento Legal</option>
          <option value="certificate">Certificado</option>
          <option value="report">Reporte</option>
          <option value="other">Otro</option>
      </select>
    `,
    confirmButtonColor: '#198754',
    confirmButtonText: 'Añadir',
    showCancelButton: true,
    preConfirm: () => ({
      project_id: document.getElementById('fpId').value,
      file_url: document.getElementById('fpUrl').value.trim(),
      file_type: document.getElementById('fpType').value,
    }),
  });
  if (!value?.project_id || !value?.file_url) return;
  await apiPost('/api/files', {
    project_id: parseInt(value.project_id),
    file_url: value.file_url,
    file_type: value.file_type,
  });
  Swal.fire({ icon: 'success', title: 'Archivo añadido', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
  loadFiles(document.getElementById('projectFilter').value);
};

window.toggleDropdown = function () {
  document.getElementById('userDropdown').classList.toggle('show');
};
document.addEventListener('click', (e) => {
  if (!e.target.closest('#userAvatar'))
    document.getElementById('userDropdown').classList.remove('show');
});

load();
