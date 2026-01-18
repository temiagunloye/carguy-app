/**
 * Garage Manager Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {

    // Elements
    const statusBadge = document.getElementById('data-status');
    const elTotal = document.getElementById('total-signups');
    const elCurrent = document.getElementById('current-users');
    const elNew24h = document.getElementById('new-users-24h');
    const elShares24h = document.getElementById('share-links-24h');
    const elTikTok = document.getElementById('kpi-tiktok');
    const elConversion = document.getElementById('kpi-conversion');

    try {
        // Fetch Data
        const res = await fetch('/api/stats');
        const data = await res.json();

        // status check
        if (data.mode === 'demo') {
            statusBadge.textContent = 'DEMO MODE (Firebase Missing)';
            statusBadge.className = 'status-badge demo';
        } else {
            statusBadge.textContent = 'LIVE DATA (Firebase)';
            statusBadge.className = 'status-badge live';
        }

        // Summary Stats
        const summary = data.summary || {};
        if (elTotal) elTotal.textContent = summary.totalSignups || 0;
        if (elCurrent) elCurrent.textContent = summary.currentUsers || 0;
        if (elNew24h) elNew24h.textContent = summary.newUsers24h || 0;
        if (elShares24h) elShares24h.textContent = summary.shareLinks24h || 0;
        if (elConversion) elConversion.textContent = (summary.conversionRate || 0) + '%';

        // TikTok KPI
        const tiktokCount = data.sources && (data.sources['TikTok'] || data.sources['tiktok'] || 0);
        if (elTikTok) elTikTok.textContent = tiktokCount;

        // Render Charts
        if (data.roles) renderRoleChart(data.roles);
        if (data.sources) renderSourceChart(data.sources);

        // Render Table
        if (data.recent) renderTable(data.recent);

        // Render New Sections
        if (data.funnel) renderFunnel(data.funnel);
        if (data.acquisition) renderAcquisition(data.acquisition);

    } catch (err) {
        console.error(err);
        if (statusBadge) {
            statusBadge.textContent = 'ERROR';
            statusBadge.style.color = 'red';
        }
    }
});

function renderRoleChart(rolesData) {
    const canvas = document.getElementById('roleChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(rolesData),
            datasets: [{
                data: Object.values(rolesData),
                backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#6b7280'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9ca3af' } }
            }
        }
    });
}

function renderSourceChart(sourceData) {
    const canvas = document.getElementById('sourceChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(sourceData),
            datasets: [{
                label: 'Signups',
                data: Object.values(sourceData),
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderTable(recentData) {
    const tableBody = document.getElementById('recent-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    recentData.forEach(row => {
        const tr = document.createElement('tr');
        const dateObj = new Date(row.date);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let device = 'Desktop';
        if (row.userAgent && /mobile|android|iphone/i.test(row.userAgent)) {
            device = 'Mobile';
        }

        tr.innerHTML = `
            <td class="text-muted" style="white-space:nowrap; font-size: 12px;">${dateStr}</td>
            <td>${row.email}</td>
            <td><span class="role-badge">${row.role}</span></td>
            <td>
                <div style="font-size:12px; font-weight:600;">${row.source || 'Direct'}</div>
                <div style="font-size:10px; color:#666; max-width:150px; overflow:hidden; text-overflow:ellipsis;">${row.referrer || '-'}</div>
            </td>
            <td style="font-size:12px; color:#888;">${device}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderFunnel(funnel) {
    const container = document.getElementById('funnel-container');
    if (!container) return;

    container.innerHTML = `
        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
            <div style="font-size:12px; color:#888;">Visitors (Est)</div>
            <div style="font-weight:bold;">${funnel.visitors}</div>
        </div>
        <div style="text-align:center; font-size:16px;">↓</div>
        <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:8px;">
            <div style="font-size:12px; color:#ccc;">CTA Clicks (Est)</div>
            <div style="font-weight:bold;">${funnel.ctaClicks}</div>
        </div>
        <div style="text-align:center; font-size:16px;">↓</div>
        <div style="background:var(--success); color:black; padding:10px; border-radius:8px;">
            <div style="font-size:12px; font-weight:bold;">Signups</div>
            <div style="font-weight:bold; font-size:18px;">${funnel.signups}</div>
        </div>
    `;
}

function renderAcquisition(acquisition) {
    const list = document.getElementById('channel-list');
    if (!list) return;

    list.innerHTML = '';
    acquisition.slice(0, 5).forEach(channel => {
        const li = document.createElement('li');
        li.style.cssText = 'display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);';
        li.innerHTML = `
            <span>${channel.name}</span>
            <span style="color:#aaa;">${channel.count} (${channel.percent}%)</span>
        `;
        list.appendChild(li);
    });
}
