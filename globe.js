/* ═══════════════════════════════════════════════════════
   Three.js 3D Earth Globe — Zoom, Rotate, Satellite Transition
   ═══════════════════════════════════════════════════════ */

(function () {
    const container = document.getElementById('earth-canvas-container');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    // Use fallback dimensions to avoid 0/0 aspect ratio crash on mobile
    const initW = container.clientWidth || 400;
    const initH = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(45, initW / initH, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });

    renderer.setSize(initW, initH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for mobile performance
    container.appendChild(renderer.domElement);

    // Force proper resize once layout settles (critical for mobile)
    function forceResize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
    }
    setTimeout(forceResize, 100);
    setTimeout(forceResize, 500);
    setTimeout(forceResize, 1500);

    // ─── Lighting ─────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    const fill = new THREE.DirectionalLight(0x5eb4ff, 0.3);
    fill.position.set(-5, -2, -3);
    scene.add(fill);

    // ─── Textures ─────────────────────────────────────
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    const earthGeo = new THREE.SphereGeometry(2, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
        map:         loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
        bumpMap:     loader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
        bumpScale:   0.05,
        specularMap: loader.load('https://unpkg.com/three-globe/example/img/earth-water.png'),
        specular:    new THREE.Color('grey'),
        shininess:   5,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    const cloudGeo = new THREE.SphereGeometry(2.03, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
        map: loader.load('https://unpkg.com/three-globe/example/img/earth-clouds.png'),
        transparent: true, opacity: 0.35,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(clouds);

    // Glow
    const glowGeo = new THREE.SphereGeometry(2.1, 64, 64);
    const glowMat = new THREE.ShaderMaterial({
        uniforms: {
            glowColor:  { value: new THREE.Color(0x5eb4ff) },
            viewVector: { value: camera.position },
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(0.7 - dot(vNormal, vNormel), 4.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, 1.0);
            }
        `,
        side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // ─── Camera & Zoom ────────────────────────────────
    const MIN_ZOOM = 2.6;
    const MAX_ZOOM = 10;
    const DEFAULT_ZOOM = 6;
    let cameraDistance = DEFAULT_ZOOM;
    camera.position.z = cameraDistance;

    // ─── Derived Lat/Lon ──────────────────────────────
    // We track a virtual lat/lon from rotation
    let virtualLat = 30.0;   // Egypt default
    let virtualLon = 31.0;

    // ─── Drag State ───────────────────────────────────
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let hasDragged = false;
    const autoRotateSpeed = 0.001;

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasDragged = false;
        previousMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - previousMouse.x;
        const dy = e.clientY - previousMouse.y;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged = true;

        const toRad = (a) => a * Math.PI / 180;
        const q = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(toRad(dy * 0.4), toRad(dx * 0.4), 0, 'XYZ')
        );
        earth.quaternion.multiplyQuaternions(q, earth.quaternion);
        clouds.quaternion.multiplyQuaternions(q, clouds.quaternion);

        // Update virtual coordinates
        virtualLon = ((virtualLon - dx * 0.2) % 360 + 360) % 360;
        if (virtualLon > 180) virtualLon -= 360;
        virtualLat = Math.max(-85, Math.min(85, virtualLat + dy * 0.15));

        updateCoordinateDisplays();
        previousMouse = { x: e.clientX, y: e.clientY };
    });

    // ─── Click to open satellite ──────────────────────
    container.addEventListener('click', () => {
        if (hasDragged) return; // Don't trigger on drag release
        if (typeof window.openSatelliteMode === 'function') {
            window.openSatelliteMode(virtualLat, virtualLon);
        }
    });

    // ─── Scroll to Zoom ───────────────────────────────
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        cameraDistance += e.deltaY > 0 ? 0.3 : -0.3;
        cameraDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cameraDistance));
        camera.position.z = cameraDistance;
        updateZoomUI();
    }, { passive: false });

    // ─── Touch ────────────────────────────────────────
    let touchDist0 = 0, touchZoom0 = cameraDistance;
    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            touchDist0 = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchZoom0 = cameraDistance;
        } else if (e.touches.length === 1) {
            isDragging = true;
            previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });
    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length === 2) {
            const d = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            cameraDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, touchZoom0 * (touchDist0 / d)));
            camera.position.z = cameraDistance;
            updateZoomUI();
        } else if (e.touches.length === 1 && isDragging) {
            const dx = e.touches[0].clientX - previousMouse.x;
            const dy = e.touches[0].clientY - previousMouse.y;
            const toRad = (a) => a * Math.PI / 180;
            const q = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(toRad(dy * 0.4), toRad(dx * 0.4), 0, 'XYZ')
            );
            earth.quaternion.multiplyQuaternions(q, earth.quaternion);
            clouds.quaternion.multiplyQuaternions(q, clouds.quaternion);
            virtualLon = ((virtualLon - dx * 0.2) % 360 + 360) % 360;
            if (virtualLon > 180) virtualLon -= 360;
            virtualLat = Math.max(-85, Math.min(85, virtualLat + dy * 0.15));
            updateCoordinateDisplays();
            previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, { passive: false });
    container.addEventListener('touchend', () => { isDragging = false; });

    // ─── UI ───────────────────────────────────────────
    function updateCoordinateDisplays() {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('lat-val', Math.abs(virtualLat).toFixed(4));
        set('lon-val', Math.abs(virtualLon).toFixed(4));
        set('lat-dir', virtualLat >= 0 ? 'N' : 'S');
        set('lon-dir', virtualLon >= 0 ? 'E' : 'W');
        set('lat-val-2', Math.abs(virtualLat).toFixed(2) + '\u00B0');
        set('lon-val-2', Math.abs(virtualLon).toFixed(2) + '\u00B0');
    }

    function updateZoomUI() {
        const pct = ((MAX_ZOOM - cameraDistance) / (MAX_ZOOM - MIN_ZOOM)) * 100;
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        const setStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };

        set('zoom-level', pct.toFixed(0) + '%');
        setStyle('zoom-bar', 'width', pct + '%');

        const btn = document.getElementById('btn-open-satellite');
        const hint = document.getElementById('capture-hint');
        if (pct >= 95) {
            // Auto-open satellite mode at max zoom
            if (btn) btn.classList.remove('hidden');
            if (hint) hint.classList.add('hidden');

            // Show the "My Location" button too
            const locBtn = document.getElementById('btn-my-location');
            if (locBtn) locBtn.classList.remove('hidden');

            if (pct >= 98 && typeof window.openSatelliteMode === 'function') {
                window.openSatelliteMode(virtualLat, virtualLon);
            }
        } else if (pct > 50) {
            if (btn) btn.classList.remove('hidden');
            if (hint) hint.classList.add('hidden');
            const locBtn = document.getElementById('btn-my-location');
            if (locBtn) locBtn.classList.remove('hidden');
        } else {
            if (btn) btn.classList.add('hidden');
            if (hint) hint.classList.remove('hidden');
            const locBtn = document.getElementById('btn-my-location');
            if (locBtn) locBtn.classList.add('hidden');
        }
    }

    // ─── Resize ───────────────────────────────────────
    window.addEventListener('resize', forceResize);
    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', () => { setTimeout(forceResize, 200); });

    // ─── Animate ──────────────────────────────────────
    function animate() {
        requestAnimationFrame(animate);
        if (!isDragging) {
            earth.rotation.y += autoRotateSpeed;
            clouds.rotation.y += autoRotateSpeed * 1.1;
            // Slowly drift virtual longitude with auto-rotation
            virtualLon = ((virtualLon + autoRotateSpeed * 5) % 360 + 360) % 360;
            if (virtualLon > 180) virtualLon -= 360;
        }
        glowMat.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, earth.position);
        renderer.render(scene, camera);
    }
    animate();

    // ─── Expose globals ───────────────────────────────
    window.getGlobeCoords = () => ({ lat: virtualLat, lon: virtualLon });
    window.captureGlobeView = () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); };

    // Initial UI
    updateCoordinateDisplays();
    updateZoomUI();
})();
