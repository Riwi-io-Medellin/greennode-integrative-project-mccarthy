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

document.getElementById('adminName').textContent = user?.email || 'Admin';
document.getElementById('userAvatar').textContent = (user?.email || 'AD').substring(0, 2).toUpperCase();

let allQuotes = [];

async function loadQuotes() {
  const res = await apiGet('/api/quotes');
  allQuotes = res?.data || [];
  renderQuotes(allQuotes);
  document.getElementById('quoteSubtitle').textContent = `${allQuotes.length} cotizaciones en total`;
}

function renderQuotes(quotes) {
  const container = document.getElementById('quotesList');
  if (quotes.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="bi bi-file-earmark-x"></i>No hay cotizaciones aún.</div>';
    return;
  }
  container.innerHTML = quotes.map(q => `
    <div class="quote-card">
        <div class="quote-card-header">
            <div>
                <div class="quote-card-meta">
                    <span style="color:var(--gn-muted);font-size:0.82rem;font-weight:600">GN-${String(q.id).padStart(4, '0')}</span>
                    <span class="badge-status ${getStatusBadge(q.status)}">${getStatusLabel(q.status)}</span>
                    <span class="ai-badge"><i class="bi bi-stars"></i> IA</span>
                </div>
                <div style="font-size:1rem;font-weight:700">${escHtml(q.title)}</div>
                <div style="color:var(--gn-muted);font-size:0.83rem">${escHtml(q.company_name)} · ${escHtml(q.territory_city || '')}</div>
            </div>
            <div class="quote-card-amount">
                ${formatCOP(q.quoted_amount)}
                <small>${(q.tree_quantity || 0).toLocaleString()} árboles · ${escHtml(q.species_name || '')}</small>
            </div>
        </div>
        <div class="quote-card-footer">
            <div style="color:var(--gn-muted);font-size:0.82rem">
                <i class="bi bi-clock"></i> ${new Date(q.created_at).toLocaleDateString('es-CO')} · ${getStatusLabel(q.status)}
            </div>
            <div style="display:flex;gap:0.5rem">
                ${q.status === 'pending' || q.status === 'reviewed' ? `
                <button class="btn-primary-gn" onclick="location.href='/admin/validacion?quoteId=${q.id}'">
                    Ver Marco Lógico <i class="bi bi-arrow-right"></i>
                </button>` : ''}
                ${q.status === 'reviewed' ? `
                <button class="btn-outline-gn" onclick="sendQuote(${q.id})">
                    <i class="bi bi-send"></i> Enviar al cliente
                </button>` : ''}
            </div>
        </div>
    </div>
  `).join('');
}

window.sendQuote = async function (id) {
  const result = await Swal.fire({
    title: '¿Enviar cotización al cliente?',
    text: 'El cliente podrá ver y aceptar o rechazar esta cotización.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#198754',
    confirmButtonText: 'Sí, enviar',
    cancelButtonText: 'Cancelar',
  });
  if (!result.isConfirmed) return;
  await apiPatch(`/api/quotes/${id}/status`, { status: 'sent' });
  Swal.fire({ icon: 'success', title: 'Cotización enviada', confirmButtonColor: '#198754' });
  loadQuotes();
};

document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderQuotes(
    allQuotes.filter(qt =>
      qt.title?.toLowerCase().includes(q) || qt.company_name?.toLowerCase().includes(q),
    ),
  );
});

window.toggleDropdown = function () {
  document.getElementById('userDropdown').classList.toggle('show');
};
document.addEventListener('click', (e) => {
  if (!e.target.closest('#userAvatar'))
    document.getElementById('userDropdown').classList.remove('show');
});

loadQuotes();
