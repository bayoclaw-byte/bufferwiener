// Using Leaflet with OpenStreetMap (no API key required)
let map;
let incidents = [];
let searchMarker = null;
let searchLocation = null;
let activeFilters = new Set();
let markers = [];

// Initialize
async function init() {
    // Load incidents
    const response = await fetch('incidents.json');
    incidents = await response.json();
    
    // Initialize map centered on Mexico
    map = L.map('map').setView([23.6, -102.5], 6);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    addIncidentMarkers();
    setupFilters();
    setupSearch();
    renderIncidentList();
}

// Add incident markers to map
function addIncidentMarkers() {
    incidents.forEach(incident => {
        const color = getIncidentColor(incident.type);
        
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [18, 18]
        });
        
        const marker = L.marker([incident.lat, incident.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <div class="marker-popup">
                    <h3>${incident.name_english}</h3>
                    <p><strong>Type:</strong> ${formatType(incident.type)}</p>
                    <p><strong>Original:</strong> ${incident.name_spanish}</p>
                    <p><strong>Coords:</strong> ${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}</p>
                </div>
            `);
        
        markers.push({ marker, incident });
    });
}

// Get color for incident type
function getIncidentColor(type) {
    const colors = {
        'FIRE': '#FF6B6B',
        'VEHICLE_BURNING': '#FFA500',
        'BLOCKADE': '#E53E3E',
        'AMBUSH': '#8B0000',
        'SHOOTOUT': '#DC143C',
        'CONFRONTATION': '#B22222',
        'CHECKPOINT': '#FFD700',
        'KIDNAPPING': '#4B0082',
        'ASSAULT': '#FF4500',
        'OTHER': '#666666'
    };
    return colors[type] || colors['OTHER'];
}

// Format type for display
function formatType(type) {
    return type.replace(/_/g, ' ');
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Setup type filters
function setupFilters() {
    const types = [...new Set(incidents.map(i => i.type))].sort();
    const container = document.getElementById('filter-btns');
    
    types.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn active';
        btn.textContent = formatType(type);
        btn.onclick = () => toggleFilter(type, btn);
        container.appendChild(btn);
        activeFilters.add(type);
    });
}

// Toggle filter
function toggleFilter(type, btn) {
    if (activeFilters.has(type)) {
        activeFilters.delete(type);
        btn.classList.remove('active');
    } else {
        activeFilters.add(type);
        btn.classList.add('active');
    }
    filterMarkers();
    renderIncidentList();
}

// Filter markers on map
function filterMarkers() {
    markers.forEach(({ marker, incident }) => {
        if (activeFilters.has(incident.type)) {
            marker.addTo(map);
        } else {
            marker.remove();
        }
    });
}

// Setup address search
function setupSearch() {
    const input = document.getElementById('address-search');
    let timeout;
    
    input.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => searchAddress(e.target.value), 500);
    });
}

// Search address using Nominatim (OpenStreetMap geocoding - free, no API key)
async function searchAddress(query) {
    if (!query || query.length < 3) {
        clearSearch();
        return;
    }
    
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=mx&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': 'MexicoIncidentsMap/1.0'
                }
            }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            setSearchLocation(lat, lng, data[0].display_name);
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
}

// Set search location
function setSearchLocation(lat, lng, placeName) {
    searchLocation = { lat, lng, name: placeName };
    
    // Remove old marker
    if (searchMarker) {
        searchMarker.remove();
    }
    
    // Add new marker
    const icon = L.divIcon({
        className: 'search-marker',
        html: '<div style="width: 20px; height: 20px; background-color: #3B82F6; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
        iconSize: [26, 26]
    });
    
    searchMarker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
            <div class="marker-popup">
                <h3>📍 Your Location</h3>
                <p>${placeName}</p>
            </div>
        `);
    
    // Calculate distances
    incidents.forEach(incident => {
        incident.distance = calculateDistance(lat, lng, incident.lat, incident.lng);
    });
    
    // Fly to location
    map.flyTo([lat, lng], 8, {
        duration: 2
    });
    
    // Show clear button
    document.getElementById('clear-btn').style.display = 'block';
    
    // Re-render list sorted by distance
    renderIncidentList();
}

// Clear search
function clearSearch() {
    if (searchMarker) {
        searchMarker.remove();
        searchMarker = null;
    }
    searchLocation = null;
    document.getElementById('address-search').value = '';
    document.getElementById('clear-btn').style.display = 'none';
    
    // Remove distances
    incidents.forEach(incident => {
        delete incident.distance;
    });
    
    renderIncidentList();
}

document.getElementById('clear-btn').addEventListener('click', clearSearch);

// Render incident list
function renderIncidentList() {
    const container = document.getElementById('incident-list');
    
    // Filter and sort
    let filtered = incidents.filter(i => activeFilters.has(i.type));
    
    if (searchLocation) {
        filtered.sort((a, b) => a.distance - b.distance);
    }
    
    // Update stats
    const stats = document.getElementById('stats');
    if (searchLocation) {
        const nearest = filtered[0];
        stats.innerHTML = `
            <div class="stat"><strong>${filtered.length}</strong> incidents shown</div>
            <div class="stat">Nearest: <strong>${nearest.distance.toFixed(1)} km</strong> away</div>
        `;
    } else {
        stats.innerHTML = `<div class="stat"><strong>${filtered.length}</strong> incidents shown</div>`;
    }
    
    // Render list
    container.innerHTML = filtered.slice(0, 50).map(incident => `
        <div class="incident-item" onclick="flyToIncident(${incident.lat}, ${incident.lng})">
            <div class="incident-name">
                ${incident.distance ? `<span class="distance-badge">${incident.distance.toFixed(1)} km</span>` : ''}
                ${incident.name_english}
            </div>
            <div class="incident-meta">
                ${formatType(incident.type)}
                ${incident.name_spanish !== incident.name_english ? ` • ${incident.name_spanish}` : ''}
            </div>
        </div>
    `).join('');
    
    if (filtered.length > 50) {
        container.innerHTML += `<div class="incident-meta" style="padding: 10px; text-align: center;">+ ${filtered.length - 50} more incidents</div>`;
    }
}

// Fly to incident on map
function flyToIncident(lat, lng) {
    map.flyTo([lat, lng], 12, {
        duration: 1.5
    });
}

// Initialize app
init();
