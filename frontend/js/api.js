const API_BASE = '';

export function getToken() {
    return localStorage.getItem('token') || '';
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
}

export function requireAuth(role = null) {
    const user = getUser();
    const token = getToken();
    if (!user || !token) {
        window.location.replace('/login');
        return null;
    }
    if (role && user.role !== role) {
        if (user.role === 'admin') {
            window.location.replace('/admin/dashboard');
        } else {
            window.location.replace('/client/proyectos');
        }
        return null;
    }
    // Push a history state so the back button doesn't go back to login
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', () => {
        history.pushState(null, '', location.href);
    });
    return user;
}

export async function apiGet(path) {
    const res = await fetch(API_BASE + path, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.replace('/login');
        return null;
    }
    return res.json();
}

export async function apiPost(path, body) {
    const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(body)
    });
    return res.json();
}

export async function apiPatch(path, body) {
    const res = await fetch(API_BASE + path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(body)
    });
    return res.json();
}

export async function apiDelete(path) {
    const res = await fetch(API_BASE + path, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
}

export function getStatusBadge(status) {
    const map = {
        in_progress: 'badge-in-progress', completed: 'badge-completed',
        quotation: 'badge-quotation', cancelled: 'badge-cancelled',
        pending: 'badge-pending', reviewed: 'badge-reviewed',
        sent: 'badge-sent', accepted: 'badge-accepted', rejected: 'badge-rejected'
    };
    return map[status] || 'badge-pending';
}

export function getStatusLabel(status) {
    const map = {
        in_progress: 'En Progreso', completed: 'Completado',
        quotation: 'Cotización', cancelled: 'Cancelado',
        pending: 'Pendiente', reviewed: 'Revisado',
        sent: 'Enviado', accepted: 'Aceptado', rejected: 'Rechazado'
    };
    return map[status] || status;
}

export function formatCOP(amount) {
    if (!amount) return 'COP $0';
    return `COP $${Number(amount).toLocaleString('es-CO')}`;
}

export function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.replace('/login');
}

const SECTOR_LABELS = {
    mining: 'Minería', energy: 'Energía', construction: 'Construcción',
    food: 'Alimentos', manufacturing: 'Manufactura', services: 'Servicios',
    agriculture: 'Agricultura', transport: 'Transporte', other: 'Otro'
};

export async function openCompanyModal(user) {
    document.getElementById('__company-modal')?.remove();

    // Inject keyframes once
    if (!document.getElementById('__cmp-modal-style')) {
        const s = document.createElement('style');
        s.id = '__cmp-modal-style';
        s.textContent = `
            @keyframes __cmpFadeIn { from { opacity:0 } to { opacity:1 } }
            @keyframes __cmpSlideUp { from { opacity:0; transform:scale(0.93) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
            #__company-modal { animation: __cmpFadeIn 0.18s ease }
            #__company-modal > div { animation: __cmpSlideUp 0.22s cubic-bezier(.25,.8,.25,1) }
        `;
        document.head.appendChild(s);
    }

    const initials = (user?.companyName || 'ME').substring(0, 2).toUpperCase();

    const overlay = document.createElement('div');
    overlay.id = '__company-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:400px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.22);font-family:inherit;">

            <!-- Header verde -->
            <div style="background:linear-gradient(135deg,#2d6a4f 0%,#1b4332 100%);padding:2rem 1.5rem 1.5rem;text-align:center;position:relative;">
                <button id="__company-modal-close" style="position:absolute;top:0.75rem;right:0.75rem;background:rgba(255,255,255,0.15);border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;color:#fff;font-size:1rem;display:flex;align-items:center;justify-content:center;line-height:1;" aria-label="Cerrar">&#x2715;</button>
                <div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.5);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.7rem;font-weight:800;margin:0 auto 0.85rem;letter-spacing:1px;">${initials}</div>
                <div style="color:#fff;font-size:1.1rem;font-weight:700;line-height:1.3" id="__cmp-name">${escHtml(user?.companyName || '—')}</div>
                <div style="color:rgba(255,255,255,0.7);font-size:0.78rem;margin-top:0.3rem;">Perfil de empresa</div>
            </div>

            <!-- Cuerpo -->
            <div style="padding:1.25rem 1.5rem;" id="__cmp-fields">
                <div style="color:#6b7280;text-align:center;padding:1rem 0;font-size:0.88rem;">Cargando...</div>
            </div>

            <!-- Footer -->
            <div style="padding:0 1.5rem 1.25rem;">
                <button onclick="window.logout && window.logout()" style="width:100%;padding:0.65rem;background:#fff;border:1.5px solid #fee2e2;border-radius:10px;color:#ef4444;font-weight:600;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Cerrar sesión
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('__company-modal-close').addEventListener('click', () => overlay.remove());

    // Fetch fresh profile
    try {
        const res = await apiGet('/api/auth/profile');
        const p = res?.data;
        if (!p) throw new Error('no data');

        document.getElementById('__cmp-name').textContent = p.company_name || user?.companyName || '—';

        const row = (label, value) => value
            ? `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid #f3f4f6;font-size:0.87rem;">
                   <span style="color:#6b7280;flex-shrink:0;margin-right:1rem;">${label}</span>
                   <span style="font-weight:600;color:#111827;text-align:right;">${value}</span>
               </div>`
            : '';

        document.getElementById('__cmp-fields').innerHTML =
            row('Correo electrónico', escHtml(p.email)) +
            row('Sector', escHtml(SECTOR_LABELS[p.economic_sector] || p.economic_sector)) +
            row('Empleados', p.employee_count ? p.employee_count.toLocaleString('es-CO') : null) +
            row('Árboles comprometidos', p.total_trees_committed ? Number(p.total_trees_committed).toLocaleString('es-CO') : '0')
            || '<div style="color:#6b7280;text-align:center;font-size:0.85rem;padding:0.5rem 0;">Sin información adicional.</div>';
    } catch {
        document.getElementById('__cmp-fields').innerHTML =
            `<div style="color:#ef4444;text-align:center;font-size:0.85rem;padding:0.5rem 0;">No se pudo cargar el perfil.</div>`;
    }
}

export function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.getElementById('mainWrapper');
    const collapseBtn = document.getElementById('collapseBtn');
    if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            if (mainWrapper) mainWrapper.classList.toggle('collapsed');
        });
    }
}
