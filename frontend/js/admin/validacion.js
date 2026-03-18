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

requireAuth('admin');
initSidebar();

let currentQuoteId = null;

document.getElementById('validatedAmount').addEventListener('input', function () {
  const v = parseFloat(this.value);
  document.getElementById('amountHint').textContent = v ? `≈ ${formatCOP(v)}` : '';
});

const params = new URLSearchParams(location.search);
const preloadId = params.get('quoteId');

async function loadList() {
  const res = await apiGet('/api/quotes');
  const quotes = (res?.data || []).filter(q => ['pending', 'reviewed'].includes(q.status));
  document.getElementById('validSubtitle').textContent = `${quotes.length} marcos lógicos pendientes de revisión`;

  const list = document.getElementById('validationList');
  if (!quotes.length) {
    list.innerHTML = '<div class="empty-state"><i class="bi bi-check2-all"></i>No hay cotizaciones pendientes de validación. ✓</div>';
    return;
  }
  list.innerHTML = quotes.map(q => `
    <div class="quote-card">
        <div class="quote-card-header">
            <div>
                <div class="quote-card-meta">
                    <span style="color:var(--gn-muted);font-size:0.82rem;font-weight:600">GN-${String(q.id).padStart(4, '0')}</span>
                    <span class="badge-status ${getStatusBadge(q.status)}">${getStatusLabel(q.status)}</span>
                    <span class="ai-badge"><i class="bi bi-stars"></i> IA</span>
                </div>
                <div style="font-weight:700;font-size:1rem">${escHtml(q.title)}</div>
                <div style="color:var(--gn-muted);font-size:0.83rem">${escHtml(q.company_name)} · ${escHtml(q.territory_city || '')}</div>
                <div style="color:var(--gn-muted);font-size:0.8rem;margin-top:0.35rem">
                    <i class="bi bi-clock"></i> ${new Date(q.created_at).toLocaleDateString('es-CO')} ·
                    ${(q.tree_quantity || 0).toLocaleString()} árboles · ${formatCOP(q.quoted_amount)}
                </div>
            </div>
            <button class="btn-primary-gn" onclick="openDetail(${q.id})">
                Revisar <i class="bi bi-arrow-right"></i>
            </button>
        </div>
    </div>
  `).join('');

  if (preloadId) openDetail(parseInt(preloadId));
}

window.openDetail = async function (id) {
  currentQuoteId = id;
  const res = await apiGet(`/api/quotes/${id}`);
  const q = res?.data;
  if (!q) return;

  document.getElementById('detailCode').textContent = `GN-${String(q.id).padStart(4, '0')}`;
  document.getElementById('detailTitle').textContent = q.title;
  document.getElementById('detailBadge').textContent = getStatusLabel(q.status);
  document.getElementById('detailBadge').className = `badge-status ${getStatusBadge(q.status)}`;
  document.getElementById('aiDraftText').textContent = q.ai_draft_text || 'Sin borrador disponible.';
  document.getElementById('validatedText').value = q.ai_draft_text || '';
  document.getElementById('validatedAmount').value = q.quoted_amount || '';
  document.getElementById('amountHint').textContent = q.quoted_amount ? `≈ ${formatCOP(q.quoted_amount)}` : '';

  document.getElementById('listView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
};

window.showList = function () {
  document.getElementById('listView').style.display = 'block';
  document.getElementById('detailView').style.display = 'none';
  history.pushState({}, '', location.pathname);
};

window.saveValidation = async function () {
  const text = document.getElementById('validatedText').value.trim();
  const amount = document.getElementById('validatedAmount').value;
  if (!text) return Swal.fire({ icon: 'warning', title: 'Escribe el texto validado', confirmButtonColor: '#198754' });

  const r = await apiPatch(`/api/quotes/${currentQuoteId}/status`, {
    status: 'reviewed',
    ai_draft_text: text,
    quoted_amount: amount ? parseFloat(amount) : null,
  });
  if (r?.success === false) return Swal.fire({ icon: 'error', title: 'Error', text: r.message, confirmButtonColor: '#ef4444' });
  Swal.fire({ icon: 'success', title: 'Guardado', text: 'Cotización marcada como revisada con los cambios aplicados.', confirmButtonColor: '#198754' });
  showList();
  loadList();
};

window.sendToClient = async function () {
  const text = document.getElementById('validatedText').value.trim();
  const amount = document.getElementById('validatedAmount').value;
  if (!text) return Swal.fire({ icon: 'warning', title: 'Escribe el texto validado antes de enviar', confirmButtonColor: '#198754' });

  const conf = await Swal.fire({
    title: '¿Enviar al cliente?',
    text: 'Se guardarán todos los cambios (texto y monto) y el cliente podrá ver y aceptar la cotización.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#059669',
    confirmButtonText: 'Sí, enviar',
    cancelButtonText: 'Cancelar',
  });
  if (!conf.isConfirmed) return;

  const r = await fetch(`/api/quotes/${currentQuoteId}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ ai_draft_text: text, quoted_amount: amount ? parseFloat(amount) : null }),
  });
  const data = await r.json();
  if (!data?.success) return Swal.fire({ icon: 'error', title: 'Error', text: data?.message, confirmButtonColor: '#ef4444' });

  Swal.fire({ icon: 'success', title: '¡Enviado!', text: 'Cambios guardados y cotización enviada al cliente.', confirmButtonColor: '#059669' });
  showList();
  loadList();
};

window.rejectQuote = async function () {
  const conf = await Swal.fire({
    title: '¿Rechazar cotización?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Sí, rechazar',
    cancelButtonText: 'Cancelar',
  });
  if (!conf.isConfirmed) return;
  await apiPatch(`/api/quotes/${currentQuoteId}/status`, { status: 'rejected' });
  Swal.fire({ icon: 'success', title: 'Cotización rechazada', confirmButtonColor: '#198754' });
  showList();
  loadList();
};

loadList();
