// ================== IMPORT LAPORAN MOBILE ==================
async function handleImportJSON(input) {
    const files = input.files;
    if (files.length === 0) return;
    showLoading("Memproses Impor File...");
    let totalImported = 0;
    try {
        for (let i = 0; i < files.length; i++) {
            const text = await files[i].text();
            const data = JSON.parse(text);
            if (data.metadata && data.aktivitas) {
                const aktivitas = data.aktivitas.map(act => ({
                    ...act,
                    wilayah: act.wilayah || 'BOAWAE',
                    latitude: act.latitude || act.lat || null,
                    longitude: act.longitude || act.lng || null,
                    foto_bukti: act.foto_bukti || act.foto || null
                }));
                await saveLaporan(aktivitas);
                totalImported += aktivitas.length;
            }
        }
        await updateGlobalHeader();
        hideLoading();
        alert(`Impor Selesai!\nSistem memproses ${totalImported} data.`);
        switchTab('tab-dashboard');
    } catch (err) {
        hideLoading();
        alert('Gagal mengimpor file: ' + err.message);
    }
}
