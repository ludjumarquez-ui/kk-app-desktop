// ================== AUTH & SESSION ==================
const ADMIN_NAME = "Ansel";
// Hash SHA-256 dari "Ansel12345" (dihitung saat pertama kali, kita hardcode hash-nya)
const ADMIN_PASSWORD_HASH = '020f0e518d8bd75aa81a1deaaed60a3a32da94932db125083c068c39691baa81'

let currentUser = null; // { nama, role, wilayah, token }

function getSessionToken() {
    return localStorage.getItem('session_token');
}

function setSession(user) {
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    currentUser = user;
    localStorage.setItem('session_token', token);
    localStorage.setItem('session_nama', user.nama);
    // Jangan simpan role/wilayah di localStorage
}

function clearSession() {
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_nama');
    currentUser = null;
}

async function validateSession() {
    const token = getSessionToken();
    const nama = localStorage.getItem('session_nama');
    if (!token || !nama) return false;

    // Cek apakah user masih ada dan status aktif
    if (nama === ADMIN_NAME) {
        currentUser = { nama: ADMIN_NAME, role: 'admin', wilayah: 'ALL', token };
        return true;
    } else {
        const users = await getUsers();
        const found = users.find(u => u.nama === nama);
        if (found && found.status === 'AKTIF') {
            currentUser = { nama: found.nama, role: 'kepala_cabang', wilayah: found.wilayah, token };
            return true;
        }
    }
    clearSession();
    return false;
}

async function handleLogin(e) {
    e.preventDefault();
    const nama = document.getElementById('login-nama').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!nama || !password) return;

    try {
        // Admin
        if (nama.toUpperCase() === ADMIN_NAME.toUpperCase()) {
            const hashedInput = CryptoJS.SHA256(password).toString();
            if (hashedInput === ADMIN_PASSWORD_HASH) {
                setSession({ nama: ADMIN_NAME, role: 'admin', wilayah: 'ALL' });
                document.getElementById('login-screen').classList.add('hidden');
                await initApp();
                return;
            } else {
                alert('Password salah.');
                return;
            }
        }

        // User cabang
        const users = await getUsers();
        const found = users.find(u => u.nama.toLowerCase() === nama.toLowerCase());
        if (!found) {
            alert('Akun tidak ditemukan.');
            return;
        }
        if (found.status === 'NONAKTIF') {
            alert('Akun dinonaktifkan. Hubungi admin.');
            return;
        }
        const hashedInput = CryptoJS.SHA256(password).toString();
        if (found.password === hashedInput) {
            setSession({ nama: found.nama, role: 'kepala_cabang', wilayah: found.wilayah });
            document.getElementById('login-screen').classList.add('hidden');
            await initApp();
        } else {
            alert('Password salah.');
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
}

function logout() {
    clearSession();
    document.getElementById('login-screen').classList.remove('hidden');
}

async function initApp() {
    if (!currentUser) {
        const valid = await validateSession();
        if (!valid) {
            document.getElementById('login-screen').classList.remove('hidden');
            return;
        }
    }
    document.getElementById('header-user').innerText = currentUser.nama;
    document.getElementById('sidebar-role').innerText = currentUser.role === 'admin' ? 'Kepala Kelalaian' : `Kepala Cabang ${currentUser.wilayah}`;
    renderSidebarMenu();
    await switchTab('tab-dashboard');
    await updateGlobalHeader();
}
