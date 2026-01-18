document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('crmBody');
    const searchInput = document.getElementById('searchInput');
    const roleFilter = document.getElementById('roleFilter');
    const planFilter = document.getElementById('planFilter');
    const countSpan = document.getElementById('count');

    let allLeads = [];

    // Fetch Data
    async function fetchLeads() {
        try {
            const res = await fetch('/api/leads?limit=200');
            const data = await res.json();

            if (data.leads) {
                allLeads = data.leads;
                renderTable(allLeads);
            } else {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No leads found.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #ff6b6b;">Failed to load data.</td></tr>';
        }
    }

    // Render Table
    function renderTable(leads) {
        tableBody.innerHTML = '';
        countSpan.innerText = leads.length;

        if (leads.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; opacity: 0.5;">No matching results</td></tr>';
            return;
        }

        leads.forEach(lead => {
            const date = new Date(lead.createdAt).toLocaleDateString();
            const role = lead.role || '-';
            const plan = lead.planInterest || 'Basic';
            const idea = lead.carBuild || '-';
            const source = lead.source || 'Direct';

            let planClass = 'badge-basic';
            if (plan === 'Pro') planClass = 'badge-pro';
            if (plan === 'Premium') planClass = 'badge-premium';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color: #666; font-size: 0.8em;">${date}</td>
                <td style="font-weight: 500;">${lead.email}</td>
                <td>${role}</td>
                <td><span class="badge-plan ${planClass}">${plan}</span></td>
                <td style="max-width: 200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${idea}">${idea}</td>
                <td style="font-size:0.9em; opacity:0.8;">${source}</td>
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
    }

    // Event Listeners
    searchInput.addEventListener('input', filterLeads);
    roleFilter.addEventListener('change', filterLeads);
    planFilter.addEventListener('change', filterLeads);

    // Init
    fetchLeads();
});
