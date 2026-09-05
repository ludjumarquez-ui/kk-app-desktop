// ================== DATA MASTER ==================
async function applyDataFilter() {
    const period = document.getElementById('data-filter-periode').value;
    const customDiv = document.getElementById('data-custom-range');
    if (period === 'custom') {
        customDiv.classList.remove('hidden');
    } else {
        customDiv.classList.add('hidden');
    }
    await renderMasterTable();
}

async function renderMasterTable() {
    try {
        const allLaporan = await getLaporan();
        const laporan = currentUser.role === 'admin' ? allLaporan : allLaporan.filter(l => l.wilayah === currentUser.wilayah);

        const period = document.getElementById('data-filter-periode').value;
        let from, to;
        if (period === 'custom') {
            from = document.getElementById('data-date-from').value;
            to = document.getElementById('data-date-to').value;
        } else if (period !== 'all') {
            ({ from, to } = getDateRange(period));
        }

        let filtered = laporan;
        if (period !== 'all') {
            filtered = filtered.filter(l => isDateInRange(l.tanggal, from, to));
        }

        const search = document.getElementById('filter-search').value.toLowerCase();
        const filterKL = document.getElementById('filter-kl').value;
        const filterStatus = document.getElementById('filter-status').value;

        if (filterKL !== 'ALL') filtered = filtered.filter(l => l.kl_snapshot === filterKL);
        if (filterStatus !== 'ALL') filtered = filtered.filter(l => l.status === filterStatus);
        if (search) filtered = filtered.filter(l => l.nama_snapshot.toLowerCase().includes(search) || l.nba.includes(search));

        const tbody = document.getElementById('table-master-body');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-400">Tidak ada data.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(act => `
            <tr class="hover:bg-slate-50 border-b border-slate-100">
                <td class="px-4 py-3"><div class="font-bold">${act.tanggal}</div><div class="text-[11px] text-slate-400">${act.jam}</div></td>
                <td class="px-4 py-3 font-semibold">${act.kl_snapshot}</td>
                <td class="px-4 py-3"><div class="font-bold">${act.nama_snapshot}</div><div class="text-[10px] text-slate-400">NBA: ${act.nba}</div></td>
                <td class="px-4 py-3"><span class="text-[10px] font-bold px-2 py-1 rounded ${act.status === 'BAYAR' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}">${act.status}</span></td>
                <td class="px-4 py-3 text-right font-bold">${act.nominal_bayar ? formatRupiah(act.nominal_bayar) : '-'}</td>
                <td class="px-4 py-3 text-center">${act.tanggal_janji || '-'}</td>
                <td class="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">${act.keterangan || '-'}</td>
                <td class="px-4 py-3 text-center">
                    <div class="flex justify-center gap-2">
                        ${act.foto_bukti ? `<button onclick="openModalFoto('${act.foto_bukti}', '${act.nama_snapshot}', '${act.tanggal}')" class="text-sky-600"><i class="fa-solid fa-image"></i></button>` : ''}
                        ${act.latitude ? `<a href="https://maps.google.com/?q=${act.latitude},${act.longitude}" target="_blank" class="text-emerald-600"><i class="fa-solid fa-map-location-dot"></i></a>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Render master table error:', err);
        alert('Gagal memuat data: ' + err.message);
    }
}

async function updateDropdowns() {
    try {
        const allLaporan = await getLaporan();
        const laporan = currentUser.role === 'admin' ? allLaporan : allLaporan.filter(l => l.wilayah === currentUser.wilayah);
        const klSet = new Set();
        laporan.forEach(item => klSet.add(item.kl_snapshot));
        const options = '<option value="ALL">Semua</option>' + Array.from(klSet).sort().map(kl => `<option value="${kl}">${kl}</option>`).join('');
        document.getElementById('filter-kl').innerHTML = options;
        document.getElementById('map-filter-kl').innerHTML = options;
    } catch (err) {
        console.error('Update dropdowns error:', err);
    }
}

async function exportToExcel() {
    try {
        // Logika sama seperti sebelumnya, bisa disalin dari kode asli
        // ...
    } catch (err) {
        alert('Gagal mengekspor Excel: ' + err.message);
    }
}
