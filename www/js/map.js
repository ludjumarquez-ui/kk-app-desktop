// ================== PETA ==================
let map = null;
let markersLayer = null;

function initMap() {
    map = L.map('map').setView([-8.7392, 121.1563], 9);
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' });
    const satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' });
    satelite.addTo(map);
    L.control.layers({"Satelit HD": satelite, "Peta Jalan": osm}).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
}

async function updateMap() {
    if (!map) return;
    markersLayer.clearLayers();
    try {
        const allLaporan = await getLaporan();
        const laporan = currentUser.role === 'admin' ? allLaporan : allLaporan.filter(l => l.wilayah === currentUser.wilayah);
        const filterWilayah = document.getElementById('map-filter-wilayah').value;
        const filterKL = document.getElementById('map-filter-kl').value;
        const filterDate = document.getElementById('map-filter-date').value;

        const filtered = laporan.filter(act => {
            return (filterWilayah === 'ALL' || act.wilayah === filterWilayah) &&
                   (filterKL === 'ALL' || act.kl_snapshot === filterKL) &&
                   (!filterDate || act.tanggal === filterDate) &&
                   act.latitude && act.longitude;
        });

        if (filtered.length === 0) return;
        const bounds = [];
        filtered.forEach(act => {
            const lat = parseFloat(act.latitude), lng = parseFloat(act.longitude);
            if (isNaN(lat) || isNaN(lng)) return;
            bounds.push([lat, lng]);
            const color = act.status === 'BAYAR' ? 'text-emerald-500' : act.status === 'JANJI BAYAR' ? 'text-amber-500' : 'text-red-500';
            const icon = L.divIcon({ className: 'custom-map-marker', html: `<i class="fa-solid fa-location-dot ${color}"></i>`, iconSize: [30,42], iconAnchor: [15,42] });
            L.marker([lat,lng], {icon}).addTo(markersLayer).bindPopup(`<b>${act.nama_snapshot}</b><br>Status: ${act.status}<br>Karyawan: ${act.kl_snapshot}<br>Wilayah: ${act.wilayah || '-'}`);
        });
        map.fitBounds(bounds, { padding: [50,50] });
    } catch (err) {
        console.error('Map update error:', err);
        alert('Gagal memperbarui peta: ' + err.message);
    }
}
