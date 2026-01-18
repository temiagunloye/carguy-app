/**
 * Car Guy Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {

    // Elements
    const statusBadge = document.getElementById('data-status');
    const elTotal = document.getElementById('total-signups');
    // const elDaily = document.getElementById('daily-signups'); // Removed for new metrics space, or keep if grid allows
    // const elConv = document.getElementById('conversion-rate');
    // const elTopRole = document.getElementById('top-role');
    const elCurrent = document.getElementById('current-users');
    const elNew24h = document.getElementById('new-users-24h');
    const elShares24h = document.getElementById('share-links-24h');
    const tableBody = document.getElementById('recent-table-body');

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
        elTotal.textContent = data.summary.totalSignups;

        // New Metrics
        if (elCurrent) elCurrent.textContent = data.summary.currentUsers || 0;
        if (elNew24h) elNew24h.textContent = data.summary.newUsers24h || 0;
        if (elShares24h) elShares24h.textContent = data.summary.shareLinks24h || 0;

        /* 
        // Optional: Keep these if you kept the cards
        elDaily.textContent = data.summary.dailySignups;
        elConv.textContent = data.summary.conversionRate + '%';
        const roles = data.roles;
        const topRole = Object.keys(roles).reduce((a, b) => roles[a] > roles[b] ? a : b);
        elTopRole.textContent = topRole;
        */

        // Render Charts
        renderRoleChart(data.roles);
        renderSourceChart(data.sources);

        // Render Table
        renderTable(data.recent);

    } catch (err) {
        console.error(err);
        statusBadge.textContent = 'ERROR';
        statusBadge.style.color = 'red';
    }
});

function renderRoleChart(rolesData) {
    const ctx = document.getElementById('roleChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(rolesData),
            datasets: [{
                data: Object.values(rolesData),
                backgroundColor: [
                    '#3b82f6', // Blue
                    '#10b981', // Green
                    '#8b5cf6', // Purple
                    '#6b7280'  // Grey
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#9ca3af' }
                }
            }
        }
    });
}

function renderSourceChart(sourceData) {
    const ctx = document.getElementById('sourceChart').getContext('2d');
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
                y: {
                    beginAtZero: true,
                    grid: { color: '#374151' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderTable(recentData) {
    const tableBody = document.getElementById('recent-table-body');
    tableBody.innerHTML = '';

    recentData.forEach(row => {
        const tr = document.createElement('tr');

        // Format date and time
        const dateObj = new Date(row.date);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Smart device check
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
