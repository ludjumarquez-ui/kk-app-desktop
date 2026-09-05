// ================== MANAJEMEN PENGGUNA & KEY ==================
async function renderUsersTable() {
    try {
        const users = await getUsers();
        const tbody = document.getElementById('users-table-body');
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-400">Belum ada pengguna.</td></tr>';
            return;
        }
        tbody.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-50 border-b border-slate-100">
                <td class="px-4 py-3 font-bold">${u.nama}</td>
                <td class="px-4 py-3">${u.wilayah}</td>
                <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-xs font-bold ${u.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${u.status}</span></td>
                <td class="px-4 py-3 text-center">
                    <div class="flex justify-center gap-2">
                        <button onclick="editUser('${u.nama}')" class="w-8 h-8 rounded bg-sky-100 text-sky-600 hover:bg-sky-200" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteUser('${u.nama}')" class="w-8 h-8 rounded bg-red-100 text-red-600 hover:bg-red-200" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Render users error:', err);
    }
}

function openAddUserModal() {
    document.getElementById('modal-user-title').innerText = 'Tambah Pengguna';
    document.getElementById('user-edit-name').value = '';
    document.getElementById('user-nama').value = '';
    document.getElementById('user-wilayah').value = 'BOAWAE';
    document.getElementById('user-password').value = '';
    document.getElementById('user-status').value = 'AKTIF';
    document.getElementById('modal-user').classList.remove('hidden');
    document.getElementById('modal-user').classList.add('flex');
}

async function editUser(nama) {
    try {
        const users = await getUsers();
        const user = users.find(u => u.nama === nama);
        if (!user) return;
        document.getElementById('modal-user-title').innerText = 'Edit Pengguna';
        document.getElementById('user-edit-name').value = user.nama;
        document.getElementById('user-nama').value = user.nama;
        document.getElementById('user-wilayah').value = user.wilayah;
        document.getElementById('user-password').value = ''; // kosongkan, jika diisi akan diubah
        document.getElementById('user-status').value = user.status;
        document.getElementById('modal-user').classList.remove('hidden');
        document.getElementById('modal-user').classList.add('flex');
    } catch (err) {
        alert('Gagal memuat data pengguna: ' + err.message);
    }
}

function closeUserModal() {
    document.getElementById('modal-user').classList.add('hidden');
    document.getElementById('modal-user').classList.remove('flex');
}

async function saveUser() {
    try {
        const editName = document.getElementById('user-edit-name').value;
        const nama = document.getElementById('user-nama').value.trim();
        const wilayah = document.getElementById('user-wilayah').value;
        const password = document.getElementById('user-password').value;
        const status = document.getElementById('user-status').value;

        if (!nama) return alert('Nama wajib diisi.');

        let passwordHash = '';
        if (editName) {
            const users = await getUsers();
            const existing = users.find(u => u.nama === editName);
            if (!existing) return alert('User tidak ditemukan');
            passwordHash = password ? CryptoJS.SHA256(password).toString() : existing.password;
        } else {
            if (!password) return alert('Password wajib diisi untuk pengguna baru.');
            passwordHash = CryptoJS.SHA256(password).toString();
        }

        const userObj = {
            nama: nama,
            role: 'kepala_cabang',
            wilayah: wilayah,
            password: passwordHash,
            status: status
        };

        if (editName && editName !== nama) {
            await deleteUserFromDB(editName);
        }
        await saveUserToDB(userObj);
        closeUserModal();
        await renderUsersTable();
        alert('Pengguna berhasil disimpan.');
    } catch (err) {
        alert('Gagal menyimpan pengguna: ' + err.message);
    }
}

async function deleteUser(nama) {
    try {
        if (!confirm(`Hapus pengguna ${nama}?`)) return;
        await deleteUserFromDB(nama);
        await renderUsersTable();
        alert('Pengguna dihapus.');
    } catch (err) {
        alert('Gagal menghapus pengguna: ' + err.message);
    }
}

// Export konfigurasi pengguna
async function exportUserConfig() {
    try {
        const users = await getUsers();
        if (users.length === 0) {
            alert('Tidak ada pengguna untuk diekspor.');
            return;
        }
        const config = {
            metadata: { app: "KK APP Desktop", type: "user_config", exported_at: new Date().toISOString() },
            users: users.map(u => ({ nama: u.nama, wilayah: u.wilayah, password: u.password, status: u.status }))
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `Konfigurasi_Pengguna_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    } catch (err) {
        alert('Gagal mengekspor konfigurasi: ' + err.message);
    }
}

function showImportConfigModal() {
    document.getElementById('modal-import-config').classList.remove('hidden');
    document.getElementById('modal-import-config').classList.add('flex');
}

function closeImportConfigModal() {
    document.getElementById('modal-import-config').classList.add('hidden');
    document.getElementById('modal-import-config').classList.remove('flex');
}

async function importConfigFile() {
    try {
        const fileInput = document.getElementById('config-file-input');
        if (!fileInput.files.length) {
            alert('Pilih file konfigurasi terlebih dahulu.');
            return;
        }
        const file = fileInput.files[0];
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.users || !Array.isArray(data.users)) {
            throw new Error('Format konfigurasi tidak valid.');
        }
        showLoading("Mengimpor konfigurasi...");
        for (const user of data.users) {
            await saveUserToDB(user);
        }
        hideLoading();
        closeImportConfigModal();
        alert(`Berhasil mengimpor ${data.users.length} pengguna. Silakan login.`);
        document.getElementById('login-screen').classList.remove('hidden');
    } catch (err) {
        hideLoading();
        alert('Gagal mengimpor: ' + err.message);
    }
}

// ================== GENERATOR KEY MOBILE (dari Excel) ==================
function encryptPayload(plainText) {
    return CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();
}

async function handleExcelImport() {
    // Salin dari kode asli dengan try-catch
}

function renderBulkKeysTable(keys) {
    // Salin dari kode asli
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => alert("Key disalin!"));
}

async function exportBulkKeysToJSON() {
    // Salin dari kode asli
}

async function renderKeysTable() {
    // Salin dari kode asli
}

async function deleteKeyConfirm(keyId) {
    // Salin dari kode asli
}
