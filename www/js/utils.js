// ================== UTILITAS ==================
function formatRupiah(angka) { return 'Rp ' + parseInt(angka || 0).toLocaleString('id-ID'); }

function showLoading(text) {
    document.getElementById('loading-text').innerText = text;
    document.getElementById('loading-overlay').classList.replace('hidden','flex');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.replace('flex','hidden');
}

function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDateRange(period) {
    const now = new Date();
    const today = getTodayStr();
    let from, to;
    switch(period) {
        case 'today': from = today; to = today; break;
        case 'week': {
            let d = new Date(); d.setDate(d.getDate()-6);
            from = d.toISOString().split('T')[0]; to = today; break;
        }
        case 'month':
            from = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`; to = today; break;
        case 'year':
            from = `${now.getFullYear()}-01-01`; to = today; break;
        default: from = to = today;
    }
    return { from, to };
}

function isDateInRange(dateStr, from, to) {
    if (!dateStr) return false;
    return dateStr >= from && dateStr <= to;
}
