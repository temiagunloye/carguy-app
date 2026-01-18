document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('crmBody');
    const searchInput = document.getElementById('searchInput');
    const roleFilter = document.getElementById('roleFilter');
    const planFilter = document.getElementById('planFilter');
    const countSpan = document.getElementById('count');
    const pipelineValueEl = document.getElementById('pipeline-value');
    const activeLeadsEl = document.getElementById('active-leads');

    let allLeads = [];

    const PLAN_VALUES = {
        'Basic': 0,
        'Pro': 120,    // $10/mo * 12
        'Premium': 240 // $20/mo * 12
    };

    // Fetch Data
    async function fetchLeads() {
        try {
            const res = await fetch('/api/leads?limit=200');
            const data = await res.json();

            if (data.leads) {
                allLeads = data.leads;
                renderTable(allLeads);
                updateStats(allLeads);
            } else {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem;">No leads found.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: #ff6b6b;">Failed to load data.</td></tr>';
        }
    }

    // Update Stats
    function updateStats(leads) {
        let totalValue = 0;
        let activeCount = 0;

        leads.forEach(lead => {
            if (lead.status !== 'Lost' && lead.status !== 'Archived') {
                activeCount++;
                const planStart = (lead.planInterest || 'Basic').split(' ')[0]; // Handle "Basic (Free)"
                totalValue += PLAN_VALUES[planStart] || 0;
            }
        });

        pipelineValueEl.innerText = totalValue.toLocaleString();
        activeLeadsEl.innerText = activeCount;
    }

    // Update Status API
    window.updateStatus = async (email, newStatus) => {
        try {
            await fetch('/api/update_lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, status: newStatus })
            });
            // Optimistic update
            const lead = allLeads.find(l => l.email === email);
            if (lead) lead.status = newStatus;
            updateStats(allLeads); // Re-calc stats

            // Visual feedback
            const select = document.getElementById(`status-${email.replace(/[^a-zA-Z0-9]/g, '')}`);
            if (select) {
                select.style.borderColor = '#22c55e';
                setTimeout(() => select.style.borderColor = 'rgba(255,255,255,0.1)', 1000);
            }

        } catch (err) {
            console.error('Update failed', err);
            alert('Failed to update status');
        }
    };

    // Render Table
    function renderTable(leads) {
        tableBody.innerHTML = '';
        countSpan.innerText = leads.length;

        if (leads.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; opacity: 0.5;">No matching results</td></tr>';
            return;
        }

        leads.forEach(lead => {
            const date = new Date(lead.createdAt).toLocaleDateString();
            const role = lead.role || '-';
            const plan = lead.planInterest || 'Basic';
            const idea = lead.carBuild || '-';
            const source = lead.source || 'Direct';
            const status = lead.status || 'new';

            let planClass = 'badge-basic';
            if (plan === 'Pro') planClass = 'badge-pro';
            if (plan === 'Premium') planClass = 'badge-premium';

            // Safe ID for DOM
            const safeId = lead.email.replace(/[^a-zA-Z0-9]/g, '');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color: #666; font-size: 0.8em;">${date}</td>
                <td>
                    <select id="status-${safeId}" onchange="window.updateStatus('${lead.email}', this.value)" 
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 2px 5px; border-radius: 4px; font-size: 0.8em;">
                        <option value="new" ${status === 'new' ? 'selected' : ''}>🔵 New</option>
                        <option value="contacted" ${status === 'contacted' ? 'selected' : ''}>🟡 Contacted</option>
                        <option value="qualified" ${status === 'qualified' ? 'selected' : ''}>🟣 Qualified</option>
                        <option value="won" ${status === 'won' ? 'selected' : ''}>🟢 Won</option>
                        <option value="lost" ${status === 'lost' ? 'selected' : ''}>❌ Lost</option>
                    </select>
                </td>
                <td style="font-weight: 500;">${lead.email}</td>
                <td>${role}</td>
                <td><span class="badge-plan ${planClass}">${plan}</span></td>
                <td style="max-width: 200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${idea}">${idea}</td>
                <td style="font-size:0.9em; opacity:0.8;">
                    ${source}<br>
                    <span style="font-size:0.8em; color:#666;">${lead.content || ''}</span>
                </td>
                <td>
                    <a href="mailto:${lead.email}" style="text-decoration:none; color:inherit; font-size: 1.2em;">✉️</a>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Filter Logic
    function filterLeads() {
        const query = searchInput.value.toLowerCase();
        const role = roleFilter.value;
        const plan = planFilter.value;

        const filtered = allLeads.filter(lead => {
            const matchesSearch = (lead.email || '').toLowerCase().includes(query) ||
                (lead.carBuild || '').toLowerCase().includes(query);
            const matchesRole = role === 'all' || lead.role === role;
            const matchesPlan = plan === 'all' || (lead.planInterest || 'Basic') === plan;

            return matchesSearch && matchesRole && matchesPlan;
        });

        renderTable(filtered);
        updateStats(filtered);
    }

    // Event Listeners
    searchInput.addEventListener('input', filterLeads);
    roleFilter.addEventListener('change', filterLeads);
    planFilter.addEventListener('change', filterLeads);

    // Init
    fetchLeads();
});
