// ================== DASHBOARD ==================
let trendChartInstance = null;
let statusPieInstance = null;

async function initDashboard() {
    const period = document.getElementById('dashboard-filter-periode').value;
    let { from, to } = getDateRange(period);
    const customDiv = document.getElementById('custom-date-range');
    if (period === 'custom') {
        customDiv.classList.remove('hidden');
        const fromInput = document.getElementById('dashboard-date-from');
        const toInput = document.getElementById('dashboard-date-to');
        if (fromInput.value && toInput.value) {
            from = fromInput.value;
            to = toInput.value;
        }
    } else {
        customDiv.classList.add('hidden');
    }

    try {
        const allLaporan = await getLaporan();
        const laporan = currentUser.role === 'admin' ? allLaporan : allLaporan.filter(l => l.wilayah === currentUser.wilayah);
        const filtered = laporan.filter(l => isDateInRange(l.tanggal, from, to));

        let totalUang = 0, totalKunjungan = filtered.length, totalMacet = 0, totalJanji = 0;
        const statusCount = {};
        const klMap = {};
        const dateMap = {};
        filtered.forEach(act => {
            if (act.status === 'BAYAR') totalUang += Number(act.nominal_bayar) || 0;
            if (act.status.includes('TIDAK')) totalMacet++;
            if (act.status === 'JANJI BAYAR') totalJanji++;
            statusCount[act.status] = (statusCount[act.status] || 0) + 1;
            if (!klMap[act.kl_snapshot]) klMap[act.kl_snapshot] = { uang: 0, kunjungan: 0 };
            klMap[act.kl_snapshot].kunjungan++;
            if (act.status === 'BAYAR') klMap[act.kl_snapshot].uang += Number(act.nominal_bayar) || 0;
            dateMap[act.tanggal] = (dateMap[act.tanggal] || 0) + 1;
        });

        document.getElementById('dashboard-stats').innerHTML = `
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl"><i class="fa-solid fa-rupiah-sign"></i></div>
                <div><p class="text-xs font-semibold text-slate-500">Total Uang Masuk</p><h3 class="text-xl font-bold">${formatRupiah(totalUang)}</h3></div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xl"><i class="fa-solid fa-clipboard-check"></i></div>
                <div><p class="text-xs font-semibold text-slate-500">Kunjungan</p><h3 class="text-xl font-bold">${totalKunjungan}</h3></div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 text-xl"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div><p class="text-xs font-semibold text-slate-500">Macet/Tidak Ketemu</p><h3 class="text-xl font-bold">${totalMacet}</h3></div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-xl"><i class="fa-solid fa-calendar-days"></i></div>
                <div><p class="text-xs font-semibold text-slate-500">Janji Bayar</p><h3 class="text-xl font-bold">${totalJanji}</h3></div>
            </div>
        `;

        // Grafik tren
        const trendCtx = document.getElementById('dashboard-trend-chart').getContext('2d');
        if (trendChartInstance) trendChartInstance.destroy();
        const sortedDates = Object.keys(dateMap).sort();
        trendChartInstance = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Kunjungan',
                    data: sortedDates.map(d => dateMap[d]),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.2)',
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });

        // Pie status
        const pieCtx = document.getElementById('dashboard-status-pie').getContext('2d');
        if (statusPieInstance) statusPieInstance.destroy();
        statusPieInstance = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCount),
                datasets: [{
                    data: Object.values(statusCount),
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#f97316', '#8b5cf6', '#64748b']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Ranking staf
        const ranking = Object.entries(klMap).sort((a,b) => b[1].uang - a[1].uang);
        const rankingDiv = document.getElementById('dashboard-ranking');
        if (ranking.length === 0) {
            rankingDiv.innerHTML = '<p class="text-slate-400 text-sm">Belum ada data.</p>';
        } else {
            rankingDiv.innerHTML = ranking.slice(0, 9).map(([kl, data], i) => `
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl font-bold ${i === 0 ? 'text-yellow-500' : i===1 ? 'text-slate-400' : i===2 ? 'text-amber-600' : 'text-slate-300'}">#${i+1}</span>
                        <div>
                            <div class="font-bold">${kl}</div>
                            <div class="text-xs text-slate-500">${data.kunjungan} kunjungan</div>
                        </div>
                    </div>
                    <div class="font-bold text-brand-600">${formatRupiah(data.uang)}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Dashboard error:', err);
        alert('Gagal memuat dashboard: ' + err.message);
    }
}

function applyDashboardFilter() { initDashboard(); }
