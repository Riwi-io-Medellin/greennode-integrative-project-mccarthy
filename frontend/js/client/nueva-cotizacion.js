import {
  apiGet,
  apiPost,
  requireAuth,
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

let currentStep = 1;
let territories = [];
let allSpecies = [];
let selectedTerritory = null;
let selectedSpecies = null;

console.log(
  '[nueva-cotizacion] user.employeeCount:',
  user?.employeeCount,
  '→ árboles estimados:',
  (user?.employeeCount || 1) * 2,
);

// Paso 1 — mostrar info de empresa
document.getElementById('companyDisplayName').textContent = user?.companyName || '—';
const sectorLabels = { mining: 'Minería', energy: 'Energía', construction: 'Construcción', food: 'Alimentos' };
document.getElementById('companyDisplayMeta').textContent =
  `${sectorLabels[user?.economicSector] || 'Sector'} · ${user?.employeeCount || '—'} empleados`;

// Cargar territorios
async function loadTerritories() {
  const res = await apiGet('/api/territories');
  territories = res?.data || [];
  const container = document.getElementById('territoriesList');
  container.innerHTML = territories.map(t => `
    <div class="territory-option" onclick="selectTerritory(${t.id})" id="terr-${t.id}" data-id="${t.id}">
        <div style="font-weight:600">${escHtml(t.name)}</div>
        <div style="font-size:0.8rem;color:var(--gn-muted)">${escHtml(t.city)} · Cap: ${(t.seedling_capacity || 0).toLocaleString()} plántulas</div>
    </div>
  `).join('');
}

window.selectTerritory = function (id) {
  selectedTerritory = territories.find(t => t.id === id);
  document.querySelectorAll('.territory-option').forEach(el => el.classList.remove('selected'));
  document.getElementById(`terr-${id}`).classList.add('selected');
  const btn = document.getElementById('btnNextStep2');
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
  btn.disabled = false;
};

window.validateStep3 = function () {
  const title = document.getElementById('projectTitle').value.trim();
  if (!title) {
    Swal.fire({ icon: 'warning', title: 'Escribe un título para el proyecto', confirmButtonColor: '#198754' });
    return;
  }
  goStep(4);
  loadSpecies();
};

async function loadSpecies() {
  const res = await apiGet(`/api/species/by-territory/${selectedTerritory.id}`);
  allSpecies = res?.data || [];
  const container = document.getElementById('speciesList');
  if (!allSpecies.length) {
    container.innerHTML = '<div class="empty-state"><i class="bi bi-tree"></i>No hay especies disponibles para este territorio.</div>';
    return;
  }
  container.innerHTML = allSpecies.map(s => `
    <div class="species-option" onclick="selectSpecies(${s.id})" id="sp-${s.id}">
        <div class="species-radio"></div>
        <div>
            <div style="font-weight:600">${escHtml(s.name)}</div>
            <div style="font-size:0.78rem;color:var(--gn-muted)">${escHtml(s.ecosystem_service || '')}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:auto;white-space:nowrap">
            <div class="species-survival">${s.survival_rate}% supervivencia</div>
            ${s.unit_price ? `<div style="font-size:0.78rem;color:var(--gn-muted);margin-top:2px">$${Number(s.unit_price).toLocaleString('es-CO')} / unidad</div>` : ''}
        </div>
    </div>
  `).join('');
}

window.selectSpecies = function (id) {
  document.querySelectorAll('.species-option').forEach(el => el.classList.remove('selected'));
  document.getElementById(`sp-${id}`).classList.add('selected');
  selectedSpecies = allSpecies.find(s => s.id === id) || { id };
  const btn = document.getElementById('btnNextStep4');
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
  btn.disabled = false;
};

window.goStep = function (step) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`step${step}`).classList.add('active');
  currentStep = step;
  updateStepNav(step);

  if (step === 3 && selectedTerritory) {
    document.getElementById('territoryDetail').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <div><strong>Territorio:</strong> ${escHtml(selectedTerritory.name)}</div>
          <div><strong>Ciudad:</strong> ${escHtml(selectedTerritory.city)}</div>
          <div><strong>Capacidad:</strong> ${(selectedTerritory.seedling_capacity || 0).toLocaleString()} plántulas</div>
          <div><strong>Dificultad de acceso:</strong> ${escHtml(selectedTerritory.access_difficulty || '—')}</div>
          <div><strong>Disponibilidad de agua:</strong> ${escHtml(selectedTerritory.water_availability || '—')}</div>
          <div><strong>Árboles estimados:</strong> ${((user?.employeeCount || 1) * 2).toLocaleString()}</div>
      </div>
    `;
  }

  if (step === 5) buildSummary();
};

function updateStepNav(step) {
  for (let i = 1; i <= 5; i++) {
    const circle = document.getElementById(`sn${i}`);
    const label = document.getElementById(`sl${i}`);
    circle.classList.remove('done', 'active');
    label.classList.remove('active');
    if (i < step) {
      circle.classList.add('done');
      circle.textContent = '✓';
    } else if (i === step) {
      circle.classList.add('active');
      circle.textContent = i;
    } else {
      circle.textContent = i;
    }
    if (i === step) label.classList.add('active');
    if (i < 5) {
      const line = document.getElementById(`sl-${i}`);
      line?.classList.toggle('done', i < step);
    }
  }
}

function buildSummary() {
  const title = document.getElementById('projectTitle').value.trim();
  const desc = document.getElementById('projectDesc').value.trim();
  const trees = (user?.employeeCount || 1) * 2;
  const unitPrice = selectedSpecies?.unit_price ? Number(selectedSpecies.unit_price) : null;
  const subtotal = unitPrice ? unitPrice * trees : null;
  const fmtCOP = (n) => `COP $${n.toLocaleString('es-CO')}`;

  document.getElementById('confirmSummary').innerHTML = `
    <div class="summary-row"><span style="color:var(--gn-muted)">Empresa</span><strong>${escHtml(user?.companyName || '—')}</strong></div>
    <div class="summary-row"><span style="color:var(--gn-muted)">Título del proyecto</span><strong>${escHtml(title)}</strong></div>
    <div class="summary-row"><span style="color:var(--gn-muted)">Territorio</span><strong>${escHtml(selectedTerritory?.name || '—')}</strong></div>
    <div class="summary-row"><span style="color:var(--gn-muted)">Especie</span><strong>${escHtml(selectedSpecies?.name || '—')}</strong></div>
    <div class="summary-row"><span style="color:var(--gn-muted)">Árboles estimados</span><strong>${trees.toLocaleString()}</strong></div>
    ${unitPrice ? `<div class="summary-row"><span style="color:var(--gn-muted)">Precio por unidad</span><strong>$${unitPrice.toLocaleString('es-CO')}</strong></div>` : ''}
    ${subtotal ? `
    <div class="summary-row"><span style="color:var(--gn-muted)">Subtotal</span><strong>${fmtCOP(subtotal)}</strong></div>
    <div class="summary-row"><span style="color:var(--gn-muted)">Gastos operativos (50%)</span><strong>${fmtCOP(subtotal * 0.5)}</strong></div>
    <div class="summary-row" style="border-top:2px solid var(--gn-green);margin-top:0.25rem;padding-top:0.5rem"><span style="font-weight:700">Total estimado</span><strong style="color:var(--gn-green);font-size:1rem">${fmtCOP(subtotal * 1.5)}</strong></div>
    ` : ''}
    <div class="summary-row"><span style="color:var(--gn-muted)">Descripción</span><span>${escHtml(desc || 'Sin descripción')}</span></div>
  `;
}

window.submitQuote = async function () {
  const title = document.getElementById('projectTitle').value.trim();
  const desc = document.getElementById('projectDesc').value.trim();
  if (!selectedTerritory || !selectedSpecies?.id || !title) {
    Swal.fire({ icon: 'warning', title: 'Completa todos los campos', confirmButtonColor: '#198754' });
    return;
  }

  document.getElementById('submitText').style.display = 'none';
  document.getElementById('submitLoading').style.display = 'flex';
  document.getElementById('btnSubmit').disabled = true;

  const res = await apiPost('/api/quotes', {
    territory_id: selectedTerritory.id,
    species_id: selectedSpecies.id,
    title,
    description: desc,
    tree_quantity: (user?.employeeCount || 1) * 2,
  });

  document.getElementById('submitText').style.display = 'flex';
  document.getElementById('submitLoading').style.display = 'none';
  document.getElementById('btnSubmit').disabled = false;

  if (res?.success) {
    Swal.fire({
      icon: 'success',
      title: '¡Cotización creada!',
      html: `La IA generó el Marco Lógico técnico.<br><br><strong>${res.data?.tree_quantity?.toLocaleString()} árboles</strong> estimados.<br>El equipo revisará y enviará la cotización pronto.`,
      confirmButtonColor: '#198754',
      confirmButtonText: 'Ver cotizaciones',
    }).then(() => (location.href = '/client/cotizaciones'));
  } else {
    Swal.fire({ icon: 'error', title: 'Error', text: res?.message || 'No se pudo crear la cotización.', confirmButtonColor: '#198754' });
  }
};

loadTerritories();
