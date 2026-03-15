import { apiGet, requireAuth, getStatusBadge, getStatusLabel, formatCOP } from "../../js/utils/api.js";

const user = requireAuth('admin');

// Set admin info
const initials = user.email?.substring(0, 2).toUpperCase() || 'AD';
document.getElementById('adminAvatar').textContent = initials;
document.getElementById('adminName').textContent = user.email || 'Administrador';
document.getElementById('userAvatar').textContent = initials;
document.getElementById('lastUpdated').textContent = 'Actualizado hace un momento';

async function loadDashboard() {
    try {
        const [projectsRes, quotesRes] = await Promise.all([
            apiGet('/api/projects'),
            apiGet('/api/quotes')
        ]);

        const projects = projectsRes.data || [];
        const quotes = quotesRes.data || [];

        // Stats
        const pending = quotes.filter(q => q.status === 'pending' || q.status === 'reviewed').length;
        const inProgress = projects.filter(p => p.status === 'in_progress').length;
        const completed = projects.filter(p => p.status === 'completed').length;
        const cancelled = projects.filter(p => p.status === 'cancelled').length;

        document.getElementById('statPending').textContent = pending;
        document.getElementById('statInProgress').textContent = inProgress;
        document.getElementById('statCompleted').textContent = completed;
        document.getElementById('statCancelled').textContent = cancelled;

        // Projects table
        const tbody = document.getElementById('projectsTableBody');
        if (projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gn-muted);padding:2rem">No hay proyectos aún.</td></tr>';
        } else {
            tbody.innerHTML = projects.slice(0, 8).map(p => {
                const pct = p.tree_quantity ? Math.min(100, Math.round((p.trees_planted / p.tree_quantity) * 100)) : 0;
                return `
                <tr style="cursor:pointer" onclick="location.href='proyecto-detalle?id=${p.id}'">
                    <td style="color:var(--gn-muted);font-size:0.82rem">GN-${String(p.id).padStart(4, '0')}</td>
                    <td>
                        <div style="font-weight:600">${escHtml(p.name)}</div>
                        <div style="font-size:0.78rem;color:var(--gn-muted)">${escHtml(p.start_date ? p.start_date.substring(0, 10) : '—')}</div>
                    </td>
                    <td>${escHtml(p.company_name || '—')}</td>
                    <td><span class="badge-status ${getStatusBadge(p.status)}">${getStatusLabel(p.status)}</span></td>
                    <td>
                        <div style="display:flex;align-items:center;gap:0.5rem">
                            <div class="progress-gn"><div class="progress-gn-fill" style="width:${pct}%"></div></div>
                            <span style="font-size:0.8rem;font-weight:600">${pct}%</span>
                        </div>
                    </td>
                    <td style="font-weight:600">🌱 ${(p.trees_planted || 0).toLocaleString()}</td>
                </tr>`;
            }).join('');
        }

        // Priority items
        const priorityList = document.getElementById('priorityList');
        const items = [];
        quotes.filter(q => q.status === 'pending').forEach(q => {
            items.push({ type: 'info', text: `Cotización GN-${String(q.id).padStart(4, '0')} lista para revisión humana` });
        });
        projects.filter(p => p.status === 'in_progress' && (p.evidence_count || 0) === 0).forEach(p => {
            items.push({ type: 'warning', text: `Proyecto ${p.name}: evidencia mensual pendiente para auditoría` });
        });

        if (items.length === 0) {
            priorityList.innerHTML = '<div style="color:var(--gn-muted);font-size:0.85rem;text-align:center;padding:1rem;">✓ Sin acciones prioritarias</div>';
        } else {
            priorityList.innerHTML = items.slice(0, 4).map(item => `
                <div class="priority-item priority-${item.type}">
                    <i class="bi bi-${item.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    <span>${escHtml(item.text)}</span>
                </div>
            `).join('');
        }

        // Chart
        renderChart(projects);

    } catch (e) {
        console.error(e);
    }
}

function renderChart(projects) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6.push({ label: months[d.getMonth()], month: d.getMonth(), year: d.getFullYear() });
    }

    const labels = last6.map(m => m.label);
    const projectCounts = last6.map(m => {
        return projects.filter(p => {
            if (!p.start_date) return false;
            const d = new Date(p.start_date);
            return d.getMonth() === m.month && d.getFullYear() === m.year;
        }).length;
    });

    const ctx = document.getElementById('chartEvolucion');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Proyectos', data: projectCounts, borderColor: '#198754', backgroundColor: 'rgba(25,135,84,0.1)', tension: 0.4, fill: true },
                { label: 'Evidencias', data: projectCounts.map(v => Math.max(0, v - 1)), borderColor: '#3b82f6', backgroundColor: 'transparent', tension: 0.4, borderDash: [4, 4] }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

loadDashboard();
