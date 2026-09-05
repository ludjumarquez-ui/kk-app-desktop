// ================== INISIALISASI & NAVIGASI ==================
function renderSidebarMenu() {
    const menuContainer = document.getElementById('sidebar-menu');
    let items = [
        { id: 'tab-dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
        { id: 'tab-map', icon: 'fa-map-location-dot', label: 'Peta' },
        { id: 'tab-data', icon: 'fa-table-list', label: 'Data Master' },
    ];
    if (currentUser.role === 'admin') {
        items.push({ id: 'tab-users', icon: 'fa-users', label: 'Manajemen Pengguna' });
        items.push({ id: 'tab-import', icon: 'fa-cloud-arrow-up', label: 'Import Laporan' });
        items.push({ id: 'tab-backup', icon: 'fa-database', label: 'Backup/Restore' });
    }
    menuContainer.innerHTML = items.map(item => `
        <button onclick="switchTab('${item.id}')" id="nav-${item.id}" class="sidebar-item w-full flex items-center gap-3 px-4 py-3 text-slate-300 rounded-xl text-sm font-semibold transition">
            <i class="fa-solid ${item.icon} w-5"></i> ${item.label}
        </button>
    `).join('');
}

async function switchTab(tabId) {
    showLoading("Memuat...");
    try {
        document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
        document.getElementById(tabId).classList.remove('hidden');

        document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
        const nav = document.getElementById('nav-' + tabId);
        if (nav) nav.classList.add('active');

        const titles = {
            'tab-dashboard': 'Dashboard & Analisis',
            'tab-users': 'Manajemen Pengguna & Key',
            'tab-map': 'Peta Pemantauan',
            'tab-data': 'Data Master',
            'tab-backup': 'Backup & Restore',
            'tab-import': 'Impor Laporan'
        };
        document.getElementById('page-title').innerText = titles[tabId] || 'Dashboard';
        document.getElementById('header-subtitle').innerText = currentUser.role === 'admin' ? 'Akses penuh semua data' : `Wilayah: ${currentUser.wilayah}`;

        if (tabId === 'tab-dashboard') {
            await initDashboard();
        } else if (tabId === 'tab-users') {
            if (currentUser.role !== 'admin') return;
            await renderUsersTable();
            await renderKeysTable();
        } else if (tabId === 'tab-map') {
            await updateDropdowns();
            setTimeout(async () => { if (!map) initMap(); map.invalidateSize(); await updateMap(); }, 200);
        } else if (tabId === 'tab-data') {
            await updateDropdowns();
            await renderMasterTable();
        }
    } catch (err) {
        console.error('Switch tab error:', err);
        alert('Gagal memuat tab: ' + err.message);
    } finally {
        hideLoading();
    }
}

// Modal foto
function openModalFoto(base64, nama, waktu) {
    document.getElementById('modal-img-target').src = base64;
    document.getElementById('modal-foto-nama').innerText = nama;
    document.getElementById('modal-foto-waktu').innerText = waktu;
    document.getElementById('modal-foto').classList.replace('hidden', 'flex');
}

function closeModalFoto() {
    document.getElementById('modal-foto').classList.replace('flex', 'hidden');
}

// Backup & Restore
async function backupDatabase() {
    try {
        showLoading("Menyiapkan backup...");
        const laporan = await getLaporan();
        const keys = await getKeys();
        const users = await getUsers();
        const backup = { metadata: { exported_at: new Date().toISOString(), version: DB_VERSION }, laporan, keys, users };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `Backup_KSP_Boawae_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        hideLoading();
    } catch (err) {
        hideLoading();
        alert('Gagal backup: ' + err.message);
    }
}

async function restoreDatabase() {
    try {
        const fileInput = document.getElementById('restore-file-input');
        if (!fileInput.files.length) return alert('Pilih file backup terlebih dahulu.');
        const file = fileInput.files[0];
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.laporan || !data.keys || !data.users) throw new Error('Format tidak valid');
        showLoading("Restore data...");
        await clearAllData();
        await saveLaporan(data.laporan);
        for (const k of data.keys) await saveKey(k);
        for (const u of data.users) await saveUserToDB(u);
        hideLoading();
        alert('Restore berhasil! Aplikasi akan dimuat ulang.');
        location.reload();
    } catch (err) {
        hideLoading();
        alert('Gagal restore: ' + err.message);
    }
}

// Update header
async function updateGlobalHeader() {
    try {
        const laporan = await getLaporan();
        document.getElementById('badge-total-transaksi').innerText = `${laporan.length.toLocaleString()} Transaksi`;
    } catch (err) {
        console.error('Update header error:', err);
    }
}

// Inisialisasi saat window load
window.onload = async function() {
    try {
        const valid = await validateSession();
        if (valid) {
            document.getElementById('login-screen').classList.add('hidden');
            await initApp();
        } else {
            document.getElementById('login-screen').classList.remove('hidden');
        }
        await updateGlobalHeader();
    } catch (err) {
        console.error('Init error:', err);
        alert('Gagal menginisialisasi aplikasi: ' + err.message);
    }
};
