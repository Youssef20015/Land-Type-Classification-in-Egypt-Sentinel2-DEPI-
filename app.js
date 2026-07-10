/* ═══════════════════════════════════════════════════════
   GlobeClass — Main Application Logic
   Globe <-> Satellite Mode, real satellite capture,
   classification, sidebar navigation, history, charts.
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // Point to Render/Railway backend for production, use localhost for local testing
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API = isLocal ? 'http://127.0.0.1:5000' : 'https://globeclass-production.up.railway.app'; // <--- UPDATE THIS AFTER RAILWAY DEPLOYS

    // ─── DOM ─────────────────────────────────────────
    const fileInput        = document.getElementById('file-input');
    const uploadZone       = document.getElementById('upload-zone');
    const uploadDefault    = document.getElementById('upload-default');
    const uploadPreview    = document.getElementById('upload-preview');
    const uploadLoading    = document.getElementById('upload-loading');
    const previewImage     = document.getElementById('preview-image');
    const previewFilename  = document.getElementById('preview-filename');
    const previewSize      = document.getElementById('preview-size');
    const btnClassify      = document.getElementById('btn-classify');
    const btnClear         = document.getElementById('btn-clear');

    const capturedCard     = document.getElementById('captured-preview-card');
    const capturedImage    = document.getElementById('captured-image');
    const captureCoords    = document.getElementById('capture-coords');

    const resultCard       = document.getElementById('result-card');
    const resultEmpty      = document.getElementById('result-empty');
    const resultContent    = document.getElementById('result-content');
    const resultIcon       = document.getElementById('result-icon');
    const resultLabel      = document.getElementById('result-label');
    const resultDesc       = document.getElementById('result-desc');
    const resultConfidence = document.getElementById('result-confidence');
    const resultBar        = document.getElementById('result-bar');

    const breakdownCard    = document.getElementById('breakdown-card');
    const breakdownList    = document.getElementById('breakdown-list');
    const chartCard        = document.getElementById('chart-card');
    const chartCanvas      = document.getElementById('confidence-chart');
    const historyList      = document.getElementById('history-list');
    const historyEmpty     = document.getElementById('history-empty');
    const btnClearHistory  = document.getElementById('btn-clear-history');
    const samplesGrid      = document.getElementById('samples-grid');
    const btnLoadSamples   = document.getElementById('btn-load-samples');
    const sidebarStatus    = document.getElementById('sidebar-status');
    const deviceLabel      = document.getElementById('device-label');
    const footerDevice     = document.getElementById('footer-device');
    const modelSelect      = document.getElementById('model-select');
    const sidebarModelName = document.getElementById('sidebar-model-name');
    const sidebarModelAcc  = document.getElementById('sidebar-model-acc');
    const sidebarModelDesc = document.getElementById('sidebar-model-desc');

    // Mode elements
    const globeMode        = document.getElementById('globe-mode');
    const satelliteMode    = document.getElementById('satellite-mode');
    const transitionOverlay = document.getElementById('transition-overlay');
    const transitionText   = document.getElementById('transition-text');
    const btnOpenSat       = document.getElementById('btn-open-satellite');
    const btnBackGlobe     = document.getElementById('btn-back-globe');
    const btnCaptureSat    = document.getElementById('btn-capture-satellite');
    const modeGlobeBtn     = document.getElementById('mode-globe');
    const modeSatBtn       = document.getElementById('mode-satellite');

    // Map HUD
    const mapLat           = document.getElementById('map-lat');
    const mapLon           = document.getElementById('map-lon');
    const mapZoom          = document.getElementById('map-zoom');

    // HUD Progress Bar
    const hudProgressBar   = document.getElementById('hud-progress-bar');
    const hudProgressText  = document.getElementById('hud-progress-text');

    // ─── State ───────────────────────────────────────
    let selectedFile = null;
    let currentBase64 = null;       // Stores base64 of satellite capture or sample
    let currentBase64Label = null;  // Label for the current base64 image
    let classificationHistory = [];
    let confidenceChart = null;
    let leafletMap = null;
    let currentMode = 'globe';
    let satelliteInitialized = false;
    let selectedModel = 'resnet50';
    let modelConfigs = {};

    // ─── Init ────────────────────────────────────────
    fetchModelInfo();

    async function fetchModelInfo() {
        try {
            const r = await fetch(`${API}/api/model-info`);
            const d = await r.json();
            
            if (d.device) {
                if (deviceLabel) deviceLabel.textContent = `Device: ${d.device.toUpperCase()}`;
            }

            if (d.models) {
                d.models.forEach(m => {
                    modelConfigs[m.id] = m;
                });
                updateModelUI(selectedModel);
            }
        } catch (e) { console.warn('Model info fetch failed:', e); }
    }

    function updateModelUI(modelId) {
        const config = modelConfigs[modelId];
        if (!config) return;

        if (sidebarModelName) sidebarModelName.textContent = config.name;
        if (sidebarModelAcc) sidebarModelAcc.textContent = config.accuracy;
        if (sidebarModelDesc) sidebarModelDesc.textContent = config.desc;
        if (footerDevice) {
             const deviceStr = deviceLabel ? deviceLabel.textContent.replace('Device: ', '') : 'CPU';
             footerDevice.textContent = `${config.name} | ${deviceStr}`;
        }
        
        if (modelSelect && modelSelect.value !== modelId) {
            modelSelect.value = modelId;
        }
    }

    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            selectedModel = e.target.value;
            updateModelUI(selectedModel);
            if (sidebarStatus) {
                sidebarStatus.textContent = `Model Switched: ${modelConfigs[selectedModel].name}`;
                setTimeout(() => { sidebarStatus.textContent = 'AI Processing: Idle'; }, 3000);
            }
        });
    }

    // ═══════════════════════════════════════════════════
    //  MOBILE TOOLBAR
    // ═══════════════════════════════════════════════════

    const mobileToolbar     = document.getElementById('mobile-toolbar');
    const btnMobileMenu     = document.getElementById('btn-mobile-menu');
    let mobileMenuOpen = false;

    if (btnMobileMenu && mobileToolbar) {
        btnMobileMenu.addEventListener('click', () => {
            mobileMenuOpen = !mobileMenuOpen;
            if (mobileMenuOpen) {
                mobileToolbar.style.maxHeight = '300px';
                btnMobileMenu.querySelector('.material-symbols-outlined').textContent = 'close';
            } else {
                mobileToolbar.style.maxHeight = '0';
                btnMobileMenu.querySelector('.material-symbols-outlined').textContent = 'menu';
            }
        });
    }

    // Mobile search
    const mobileSearchInput   = document.getElementById('mobile-search-input');
    const mobileSearchResults = document.getElementById('mobile-search-results');
    let mobileSearchTimeout   = null;

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', () => {
            clearTimeout(mobileSearchTimeout);
            const q = mobileSearchInput.value.trim();
            if (q.length < 2) { mobileSearchResults.classList.add('hidden'); return; }
            mobileSearchTimeout = setTimeout(() => geocodeSearchMobile(q), 400);
        });
        document.addEventListener('click', (e) => {
            if (!mobileSearchInput.contains(e.target) && !mobileSearchResults.contains(e.target)) {
                mobileSearchResults.classList.add('hidden');
            }
        });
        mobileSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const first = mobileSearchResults.querySelector('.search-result-item');
                if (first) first.click();
            }
        });
    }

    async function geocodeSearchMobile(query) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
            const data = await res.json();
            if (!data.length) {
                mobileSearchResults.innerHTML = '<p class="text-[10px] text-slate-600 text-center py-3">No results found</p>';
                mobileSearchResults.classList.remove('hidden');
                return;
            }
            mobileSearchResults.innerHTML = '';
            data.forEach(place => {
                const item = document.createElement('div');
                item.className = 'search-result-item flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-primary/10 transition-colors border-b border-slate-800/10 last:border-0';
                item.innerHTML = `
                    <span class="material-symbols-outlined text-primary text-sm shrink-0">place</span>
                    <div class="min-w-0">
                        <p class="text-[11px] text-on-surface font-medium truncate">${place.display_name.split(',').slice(0, 3).join(',')}</p>
                        <p class="text-[9px] text-slate-600 font-mono">${parseFloat(place.lat).toFixed(4)}°, ${parseFloat(place.lon).toFixed(4)}°</p>
                    </div>
                `;
                item.addEventListener('click', () => {
                    const lat = parseFloat(place.lat);
                    const lon = parseFloat(place.lon);
                    mobileSearchInput.value = place.display_name.split(',').slice(0, 2).join(',');
                    mobileSearchResults.classList.add('hidden');
                    // Close mobile menu
                    closeMobileMenu();
                    switchToSatellite(lat, lon);
                });
                mobileSearchResults.appendChild(item);
            });
            mobileSearchResults.classList.remove('hidden');
        } catch (e) {
            mobileSearchResults.innerHTML = '<p class="text-[10px] text-error text-center py-3">Search failed</p>';
            mobileSearchResults.classList.remove('hidden');
        }
    }

    // Mobile coordinate input
    const mobileCoordLat = document.getElementById('mobile-coord-lat');
    const mobileCoordLon = document.getElementById('mobile-coord-lon');
    const mobileBtnGo    = document.getElementById('mobile-btn-go-coords');

    if (mobileBtnGo) {
        mobileBtnGo.addEventListener('click', () => {
            const lat = parseFloat(mobileCoordLat?.value);
            const lon = parseFloat(mobileCoordLon?.value);
            if (isNaN(lat) || isNaN(lon)) { alert('Enter valid latitude and longitude.'); return; }
            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) { alert('Coordinates out of range.'); return; }
            closeMobileMenu();
            switchToSatellite(lat, lon);
        });
    }
    if (mobileCoordLat) mobileCoordLat.addEventListener('keydown', (e) => { if (e.key === 'Enter' && mobileBtnGo) mobileBtnGo.click(); });
    if (mobileCoordLon) mobileCoordLon.addEventListener('keydown', (e) => { if (e.key === 'Enter' && mobileBtnGo) mobileBtnGo.click(); });

    // Mobile GPS button
    const mobileBtnMyLoc = document.getElementById('mobile-btn-my-location');
    if (mobileBtnMyLoc) {
        mobileBtnMyLoc.addEventListener('click', () => {
            if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
            mobileBtnMyLoc.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Locating...';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    mobileBtnMyLoc.innerHTML = '<span class="material-symbols-outlined text-sm">my_location</span> My Location';
                    closeMobileMenu();
                    switchToSatellite(pos.coords.latitude, pos.coords.longitude);
                },
                () => {
                    mobileBtnMyLoc.innerHTML = '<span class="material-symbols-outlined text-sm">my_location</span> My Location';
                    alert('Could not get your location. Please allow location access.');
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    // Mobile satellite button
    const mobileBtnSat = document.getElementById('mobile-btn-satellite');
    if (mobileBtnSat) {
        mobileBtnSat.addEventListener('click', () => {
            const coords = window.getGlobeCoords ? window.getGlobeCoords() : { lat: 30, lon: 31 };
            closeMobileMenu();
            if (currentMode !== 'satellite') switchToSatellite(coords.lat, coords.lon);
        });
    }

    function closeMobileMenu() {
        if (mobileToolbar) mobileToolbar.style.maxHeight = '0';
        if (btnMobileMenu) btnMobileMenu.querySelector('.material-symbols-outlined').textContent = 'menu';
        mobileMenuOpen = false;
    }

    // ═══════════════════════════════════════════════════
    //  SIDEBAR NAVIGATION — make all 3 links functional
    // ═══════════════════════════════════════════════════

    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;

            // Update active state
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            switch (section) {
                case 'hud':
                    // Scroll viewport into view (top of the page)
                    document.getElementById('viewport-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
                    break;

                case 'upload':
                    // Scroll to upload zone and focus it
                    uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Briefly flash the upload zone
                    uploadZone.classList.add('border-primary/60');
                    uploadZone.style.boxShadow = '0 0 30px rgba(94, 180, 255, 0.15)';
                    setTimeout(() => {
                        uploadZone.classList.remove('border-primary/60');
                        uploadZone.style.boxShadow = '';
                    }, 1500);
                    break;

                case 'samples':
                    // Scroll to the sample gallery card on the right panel
                    const samplesCard = document.getElementById('samples-card');
                    if (samplesCard) {
                        samplesCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Flash the card
                        samplesCard.style.borderColor = 'rgba(94, 180, 255, 0.4)';
                        samplesCard.style.boxShadow = '0 0 30px rgba(94, 180, 255, 0.15)';
                        setTimeout(() => {
                            samplesCard.style.borderColor = '';
                            samplesCard.style.boxShadow = '';
                        }, 1500);
                    }
                    break;
            }
        });
    });

    // ═══════════════════════════════════════════════════
    //  MODE SWITCHING: Globe <-> Satellite
    // ═══════════════════════════════════════════════════

    window.openSatelliteMode = function (lat, lon) {
        if (currentMode === 'satellite') return;
        switchToSatellite(lat || 30.0, lon || 31.0);
    };

    if (btnOpenSat) {
        btnOpenSat.addEventListener('click', () => {
            const coords = window.getGlobeCoords ? window.getGlobeCoords() : { lat: 30, lon: 31 };
            switchToSatellite(coords.lat, coords.lon);
        });
    }

    if (btnBackGlobe) btnBackGlobe.addEventListener('click', () => switchToGlobe());

    if (modeGlobeBtn) modeGlobeBtn.addEventListener('click', () => { if (currentMode !== 'globe') switchToGlobe(); });
    if (modeSatBtn) modeSatBtn.addEventListener('click', () => {
        const coords = window.getGlobeCoords ? window.getGlobeCoords() : { lat: 30, lon: 31 };
        if (currentMode !== 'satellite') switchToSatellite(coords.lat, coords.lon);
    });

    // ─── "Use My Location" — GPS Geolocation ────────
    const btnMyLocation = document.getElementById('btn-my-location');
    if (btnMyLocation) {
        btnMyLocation.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by your browser.');
                return;
            }
            btnMyLocation.disabled = true;
            btnMyLocation.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Locating...';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    btnMyLocation.disabled = false;
                    btnMyLocation.innerHTML = '<span class="material-symbols-outlined">my_location</span> Use My Location';
                    switchToSatellite(lat, lon);
                },
                (error) => {
                    btnMyLocation.disabled = false;
                    btnMyLocation.innerHTML = '<span class="material-symbols-outlined">my_location</span> Use My Location';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            alert('Location access was denied. Please allow location permission in your browser settings.');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            alert('Location information is unavailable.');
                            break;
                        case error.TIMEOUT:
                            alert('Location request timed out. Please try again.');
                            break;
                        default:
                            alert('An error occurred while getting your location.');
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }

    // ═══════════════════════════════════════════════════
    //  SEARCH DESTINATION — Nominatim Geocoding
    // ═══════════════════════════════════════════════════

    const searchInput   = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchTimeout   = null;

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const q = searchInput.value.trim();
            if (q.length < 2) { searchResults.classList.add('hidden'); return; }

            // Debounce 400ms to avoid hammering the API
            searchTimeout = setTimeout(() => geocodeSearch(q), 400);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });

        // Allow Enter to pick the first result
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const first = searchResults.querySelector('.search-result-item');
                if (first) first.click();
            }
        });
    }

    async function geocodeSearch(query) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
            const data = await res.json();

            if (!data.length) {
                searchResults.innerHTML = '<p class="text-[10px] text-slate-600 text-center py-3">No results found</p>';
                searchResults.classList.remove('hidden');
                return;
            }

            searchResults.innerHTML = '';
            data.forEach(place => {
                const item = document.createElement('div');
                item.className = 'search-result-item flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-primary/10 transition-colors border-b border-slate-800/10 last:border-0';
                item.innerHTML = `
                    <span class="material-symbols-outlined text-primary text-sm shrink-0">place</span>
                    <div class="min-w-0">
                        <p class="text-[11px] text-on-surface font-medium truncate">${place.display_name.split(',').slice(0, 3).join(',')}</p>
                        <p class="text-[9px] text-slate-600 font-mono">${parseFloat(place.lat).toFixed(4)}°, ${parseFloat(place.lon).toFixed(4)}°</p>
                    </div>
                `;
                item.addEventListener('click', () => {
                    const lat = parseFloat(place.lat);
                    const lon = parseFloat(place.lon);
                    searchInput.value = place.display_name.split(',').slice(0, 2).join(',');
                    searchResults.classList.add('hidden');
                    // Also populate the manual coordinate fields
                    const coordLat = document.getElementById('coord-lat');
                    const coordLon = document.getElementById('coord-lon');
                    if (coordLat) coordLat.value = lat.toFixed(4);
                    if (coordLon) coordLon.value = lon.toFixed(4);
                    switchToSatellite(lat, lon);
                });
                searchResults.appendChild(item);
            });
            searchResults.classList.remove('hidden');
        } catch (e) {
            console.warn('Geocode search failed:', e);
            searchResults.innerHTML = '<p class="text-[10px] text-error text-center py-3">Search failed — try again</p>';
            searchResults.classList.remove('hidden');
        }
    }

    // ═══════════════════════════════════════════════════
    //  MANUAL COORDINATES INPUT
    // ═══════════════════════════════════════════════════

    const coordLatInput = document.getElementById('coord-lat');
    const coordLonInput = document.getElementById('coord-lon');
    const btnGoCoords   = document.getElementById('btn-go-coords');

    if (btnGoCoords) {
        btnGoCoords.addEventListener('click', goToManualCoords);
    }
    // Allow Enter key in coordinate fields
    if (coordLatInput) coordLatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') goToManualCoords(); });
    if (coordLonInput) coordLonInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') goToManualCoords(); });

    function goToManualCoords() {
        const lat = parseFloat(coordLatInput?.value);
        const lon = parseFloat(coordLonInput?.value);

        if (isNaN(lat) || isNaN(lon)) {
            alert('Please enter valid latitude and longitude values.');
            return;
        }
        if (lat < -90 || lat > 90) {
            alert('Latitude must be between -90 and 90.');
            return;
        }
        if (lon < -180 || lon > 180) {
            alert('Longitude must be between -180 and 180.');
            return;
        }
        switchToSatellite(lat, lon);
    }
    function switchToSatellite(lat, lon) {
        currentMode = 'satellite';
        if (modeGlobeBtn) { modeGlobeBtn.classList.remove('bg-primary/20', 'text-primary'); modeGlobeBtn.classList.add('text-slate-500'); }
        if (modeSatBtn) { modeSatBtn.classList.add('bg-primary/20', 'text-primary'); modeSatBtn.classList.remove('text-slate-500'); }

        transitionText.textContent = 'Switching to Live Satellite...';
        transitionOverlay.classList.remove('opacity-0');
        transitionOverlay.classList.add('opacity-100');

        setTimeout(() => {
            globeMode.classList.add('opacity-0', 'pointer-events-none');
            globeMode.classList.remove('z-10'); globeMode.classList.add('z-0');
            satelliteMode.classList.remove('opacity-0', 'pointer-events-none');
            satelliteMode.classList.add('z-10'); satelliteMode.classList.remove('z-0');
            initOrUpdateMap(lat, lon);
            setTimeout(() => { transitionOverlay.classList.add('opacity-0'); transitionOverlay.classList.remove('opacity-100'); }, 300);
        }, 600);
    }

    function switchToGlobe() {
        currentMode = 'globe';
        if (modeGlobeBtn) { modeGlobeBtn.classList.add('bg-primary/20', 'text-primary'); modeGlobeBtn.classList.remove('text-slate-500'); }
        if (modeSatBtn) { modeSatBtn.classList.remove('bg-primary/20', 'text-primary'); modeSatBtn.classList.add('text-slate-500'); }

        transitionText.textContent = 'Returning to Globe...';
        transitionOverlay.classList.remove('opacity-0');
        transitionOverlay.classList.add('opacity-100');

        setTimeout(() => {
            satelliteMode.classList.add('opacity-0', 'pointer-events-none');
            satelliteMode.classList.remove('z-10'); satelliteMode.classList.add('z-0');
            globeMode.classList.remove('opacity-0', 'pointer-events-none');
            globeMode.classList.add('z-10'); globeMode.classList.remove('z-0');
            setTimeout(() => { transitionOverlay.classList.add('opacity-0'); transitionOverlay.classList.remove('opacity-100'); }, 300);
        }, 600);
    }

    // ═══════════════════════════════════════════════════
    //  LEAFLET SATELLITE MAP
    // ═══════════════════════════════════════════════════

    function initOrUpdateMap(lat, lon) {
        if (!satelliteInitialized) {
            leafletMap = L.map('satellite-map', {
                center: [lat, lon], zoom: 14,
                zoomControl: false, attributionControl: false,
            });
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19, attribution: 'ESRI World Imagery',
            }).addTo(leafletMap);
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19, opacity: 0.6,
            }).addTo(leafletMap);
            L.control.zoom({ position: 'topright' }).addTo(leafletMap);
            leafletMap.on('moveend', updateMapHUD);
            leafletMap.on('zoomend', updateMapHUD);
            satelliteInitialized = true;
        } else {
            leafletMap.setView([lat, lon], leafletMap.getZoom());
        }
        setTimeout(() => { leafletMap.invalidateSize(); updateMapHUD(); }, 100);
    }

    function updateMapHUD() {
        if (!leafletMap) return;
        const c = leafletMap.getCenter(); const z = leafletMap.getZoom();
        if (mapLat) mapLat.textContent = c.lat.toFixed(4) + '\u00B0';
        if (mapLon) mapLon.textContent = c.lng.toFixed(4) + '\u00B0';
        if (mapZoom) mapZoom.textContent = z;
    }

    // ═══════════════════════════════════════════════════
    //  SATELLITE CAPTURE
    // ═══════════════════════════════════════════════════

    if (btnCaptureSat) {
        btnCaptureSat.addEventListener('click', async () => {
            if (!leafletMap) return;
            const center = leafletMap.getCenter();
            const zoom = leafletMap.getZoom();
            const lat = center.lat, lon = center.lng;

            btnCaptureSat.disabled = true;
            btnCaptureSat.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Fetching...';
            sidebarStatus.textContent = 'AI Processing: Capturing...';

            try {
                const res = await fetch(`${API}/api/satellite-capture?lat=${lat}&lon=${lon}&zoom=${zoom}`);
                const data = await res.json();
                if (data.error) { alert('Capture error: ' + data.error); return; }

                // Show captured image in results
                if (capturedCard && capturedImage) {
                    capturedImage.src = data.image_base64;
                    capturedCard.classList.remove('hidden');
                    if (captureCoords) captureCoords.textContent = `${lat.toFixed(4)}\u00B0, ${lon.toFixed(4)}\u00B0 | Zoom ${zoom}`;
                }

                // Show in preview area for Classify/Clear
                showBase64Preview(data.image_base64, `Satellite ${lat.toFixed(2)}\u00B0, ${lon.toFixed(2)}\u00B0`);

                // Classify immediately
                sidebarStatus.textContent = 'AI Processing: Classifying...';
                await classifyBase64(data.image_base64, `Satellite ${lat.toFixed(2)}\u00B0, ${lon.toFixed(2)}\u00B0`);
            } catch (e) {
                alert('Error: ' + e.message);
            } finally {
                btnCaptureSat.disabled = false;
                btnCaptureSat.innerHTML = '<span class="material-symbols-outlined">photo_camera</span> Capture &amp; Classify';
            }
        });
    }

    // ═══════════════════════════════════════════════════
    //  FILE UPLOAD — with proper file input visibility
    // ═══════════════════════════════════════════════════

    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone.addEventListener('dragleave', () => { uploadZone.classList.remove('drag-over'); });
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault(); uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

    function handleFile(f) {
        if (!f.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
        selectedFile = f;
        currentBase64 = null;
        currentBase64Label = null;
        showFilePreview(f);
    }

    function showFilePreview(f) {
        const r = new FileReader();
        r.onload = (e) => {
            previewImage.src = e.target.result;
            previewFilename.textContent = f.name;
            previewSize.textContent = formatBytes(f.size);
            // IMPORTANT: hide the file input so it doesn't block Classify/Clear buttons
            fileInput.style.display = 'none';
            uploadDefault.classList.add('hidden');
            uploadLoading.classList.add('hidden');
            uploadPreview.classList.remove('hidden');
        };
        r.readAsDataURL(f);
    }

    // Show preview for a base64 image (satellite capture or sample)
    function showBase64Preview(b64, label) {
        previewImage.src = b64;
        previewFilename.textContent = label || 'Captured Image';
        previewSize.textContent = '-';
        currentBase64 = b64;
        currentBase64Label = label;
        selectedFile = null;
        // Hide file input so buttons are clickable
        fileInput.style.display = 'none';
        uploadDefault.classList.add('hidden');
        uploadLoading.classList.add('hidden');
        uploadPreview.classList.remove('hidden');
    }

    // ─── CLEAR button ────────────────────────────────
    btnClear.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetUpload();
    });

    function resetUpload() {
        selectedFile = null;
        currentBase64 = null;
        currentBase64Label = null;
        fileInput.value = '';
        previewImage.src = '';
        uploadPreview.classList.add('hidden');
        uploadLoading.classList.add('hidden');
        uploadDefault.classList.remove('hidden');
        // Restore file input visibility
        fileInput.style.display = '';

        // Also clear captured preview
        if (capturedCard) capturedCard.classList.add('hidden');

        // Reset result card
        resultEmpty.classList.remove('hidden');
        resultContent.classList.add('hidden');
        resultCard.classList.remove('has-result');
        breakdownCard.classList.add('hidden');
        chartCard.classList.add('hidden');
        resultBar.style.width = '0%';
        sidebarStatus.textContent = 'AI Processing: Idle';
        setHUDProgress(0, 'Ready to classify');
    }

    // ─── CLASSIFY button ─────────────────────────────
    btnClassify.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (selectedFile) {
            // Classify uploaded file
            classifyFile(selectedFile);
        } else if (currentBase64) {
            // Classify the stored base64 image (satellite capture or sample)
            classifyBase64(currentBase64, currentBase64Label || 'Image');
        } else {
            alert('No image to classify. Upload an image or capture from satellite view.');
        }
    });

    // ═══════════════════════════════════════════════════
    //  CLASSIFICATION
    // ═══════════════════════════════════════════════════

    async function classifyFile(f) {
        showLoadingState();
        try {
            const fd = new FormData(); 
            fd.append('image', f);
            fd.append('model', selectedModel);
            const r = await fetch(`${API}/api/classify`, { method: 'POST', body: fd });
            const d = await r.json();
            if (d.error) { alert('Error: ' + d.error); showFilePreview(f); return; }
            displayResults(d);
            addToHistory(f.name, d);
        } catch (e) { alert('Network error: ' + e.message); }
        finally {
            showFilePreview(f);
            sidebarStatus.textContent = 'AI Processing: Complete';
            setHUDProgress(100, 'Classification complete!');
        }
    }

    async function classifyBase64(b64, label) {
        showLoadingState();
        try {
            const raw = b64.includes(',') ? b64.split(',')[1] : b64;
            const r = await fetch(`${API}/api/classify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    image_base64: raw,
                    model: selectedModel
                }),
            });
            const d = await r.json();
            if (d.error) { alert('Error: ' + d.error); return; }

            showBase64Preview(b64, label);
            displayResults(d);
            addToHistory(label || 'Capture', d);
            sidebarStatus.textContent = 'AI Processing: Complete';
            setHUDProgress(100, 'Classification complete!');
        } catch (e) { alert('Error: ' + e.message); }
        finally { uploadLoading.classList.add('hidden'); }
    }

    function showLoadingState() {
        uploadPreview.classList.add('hidden');
        uploadDefault.classList.add('hidden');
        uploadLoading.classList.remove('hidden');
        sidebarStatus.textContent = 'AI Processing: Active';
        startHUDAnimation();
    }

    // ─── HUD Progress Bar Control ─────────────────────
    function startHUDAnimation() {
        if (hudProgressBar) {
            hudProgressBar.style.width = '0%';
            hudProgressBar.classList.add('hud-bar-active', 'hud-bar-filling');
        }
        if (hudProgressText) hudProgressText.textContent = 'Neural network processing...';
    }

    function setHUDProgress(pct, text) {
        if (hudProgressBar) {
            hudProgressBar.classList.remove('hud-bar-active', 'hud-bar-filling');
            hudProgressBar.style.width = pct + '%';
            if (pct >= 100) {
                hudProgressBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
            } else if (pct === 0) {
                hudProgressBar.style.background = '';
            }
        }
        if (hudProgressText) hudProgressText.textContent = text || '';
    }

    // ═══════════════════════════════════════════════════
    //  DISPLAY RESULTS
    // ═══════════════════════════════════════════════════

    function displayResults(data) {
        const t = data.results[0];
        resultEmpty.classList.add('hidden');
        resultContent.classList.remove('hidden');
        resultCard.classList.add('has-result');

        resultIcon.textContent = t.icon;
        resultIcon.style.color = t.color;
        resultLabel.textContent = t.label;
        resultDesc.textContent = t.description;
        resultConfidence.textContent = t.confidence.toFixed(1) + '%';
        requestAnimationFrame(() => { resultBar.style.width = t.confidence + '%'; });

        // Breakdown
        breakdownCard.classList.remove('hidden');
        breakdownList.innerHTML = '';
        data.results.forEach((r, i) => {
            const el = document.createElement('div');
            el.className = `breakdown-item animate-fade-in-up ${i === 0 ? 'top-result' : ''}`;
            el.style.animationDelay = `${i * 40}ms`;
            el.innerHTML = `
                <span class="material-symbols-outlined text-base" style="color: ${r.color};">${r.icon}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-0.5">
                        <span class="text-[11px] font-bold truncate ${i === 0 ? 'text-on-surface' : 'text-slate-400'}">${r.label}</span>
                        <span class="text-[11px] font-mono ${i === 0 ? 'text-primary' : 'text-slate-500'}">${r.confidence.toFixed(2)}%</span>
                    </div>
                    <div class="breakdown-bar-track">
                        <div class="breakdown-bar-fill" style="width: ${r.confidence}%; background: ${r.color};"></div>
                    </div>
                </div>
            `;
            breakdownList.appendChild(el);
        });

        updateChart(data.results);
    }

    // ═══════════════════════════════════════════════════
    //  CHART
    // ═══════════════════════════════════════════════════

    function updateChart(results) {
        chartCard.classList.remove('hidden');
        if (confidenceChart) confidenceChart.destroy();
        confidenceChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: results.map(r => r.label),
                datasets: [{
                    data: results.map(r => r.confidence),
                    backgroundColor: results.map(r => r.color + '40'),
                    borderColor: results.map(r => r.color),
                    borderWidth: 1, borderRadius: 3
                }],
            },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#151a21', titleColor: '#f1f3fc', bodyColor: '#a8abb3',
                        borderColor: '#44484f', borderWidth: 1,
                        callbacks: { label: (c) => c.raw.toFixed(2) + '%' }
                    }
                },
                scales: {
                    x: { max: 100, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { size: 9 } } },
                    y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9, family: 'Inter' } } },
                },
            },
        });
    }

    // ═══════════════════════════════════════════════════
    //  HISTORY
    // ═══════════════════════════════════════════════════

    function addToHistory(name, data) {
        const t = data.results[0];
        classificationHistory.unshift({
            filename: name, label: t.label, confidence: t.confidence,
            color: t.color, icon: t.icon, timestamp: new Date()
        });
        renderHistory();
    }

    function renderHistory() {
        if (!classificationHistory.length) { historyEmpty.classList.remove('hidden'); return; }
        historyEmpty.classList.add('hidden');
        historyList.innerHTML = '';
        classificationHistory.forEach((e) => {
            const el = document.createElement('div');
            el.className = 'history-item animate-fade-in-up';
            el.innerHTML = `
                <span class="material-symbols-outlined text-sm" style="color: ${e.color};">${e.icon}</span>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-on-surface truncate">${e.label}
                        <span class="text-slate-500 font-normal">- ${e.confidence.toFixed(1)}%</span></p>
                    <p class="text-[10px] text-slate-600 truncate">${e.filename} | ${formatTime(e.timestamp)}</p>
                </div>
            `;
            historyList.appendChild(el);
        });
    }

    btnClearHistory.addEventListener('click', () => {
        classificationHistory = [];
        historyList.innerHTML = '<p class="text-xs text-slate-600 text-center py-3">No classifications yet</p>';
    });

    // ═══════════════════════════════════════════════════
    //  SAMPLE GALLERY
    // ═══════════════════════════════════════════════════

    btnLoadSamples.addEventListener('click', async () => {
        btnLoadSamples.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span> Loading...';
        try {
            const r = await fetch(`${API}/api/sample-images`);
            const d = await r.json();
            if (d.samples && d.samples.length) {
                samplesGrid.innerHTML = '';
                d.samples.forEach((s) => {
                    const el = document.createElement('div');
                    el.className = 'sample-thumb';
                    el.title = `Classify: ${s.label}`;
                    el.innerHTML = `<img src="${s.base64}" alt="${s.label}" /><div class="label">${s.label}</div>`;
                    el.addEventListener('click', () => {
                        showBase64Preview(s.base64, s.label);
                        classifyBase64(s.base64, s.label);
                    });
                    samplesGrid.appendChild(el);
                });
            } else {
                samplesGrid.innerHTML = '<p class="col-span-5 text-xs text-slate-600 text-center py-3">No samples found.</p>';
            }
        } catch (e) {
            samplesGrid.innerHTML = '<p class="col-span-5 text-xs text-error text-center py-3">Failed to load.</p>';
        }
    });

    // ─── Utils ───────────────────────────────────────
    function formatBytes(b) {
        return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
    }
    function formatTime(d) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }

})();
