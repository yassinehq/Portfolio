/* =========================================================
   Scène plein écran : un nuage de particules simulé sur GPU.
   - deux textures d'état (positions, vitesses) mises à jour par ping-pong ;
   - une cible A et une cible B, un uMix entre les deux : le morphing ;
   - FloatType si le GPU sait y rendre, sinon HalfFloatType, sinon repli CSS ;
   - qualité adaptée aux FPS mesurés au démarrage ; pause onglet caché.
   ========================================================= */
import * as THREE from 'three';
import { quadVert, simVelFrag, simPosFrag, copyFrag, pointVert, pointFrag } from './shaders.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

export function createScene(canvas) {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    if (!renderer.capabilities.isWebGL2) { renderer.dispose(); return null; }

    /* ---- Type de texture utilisable comme cible de rendu ---- */
    const gl = renderer.getContext();
    const canRender = type => {
        const rt = new THREE.WebGLRenderTarget(4, 4, { type, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
        renderer.setRenderTarget(rt);
        const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        renderer.setRenderTarget(null);
        rt.dispose();
        return ok;
    };
    let stateType = null;
    if (renderer.extensions.has('EXT_color_buffer_float') && canRender(THREE.FloatType)) stateType = THREE.FloatType;
    else if ((renderer.extensions.has('EXT_color_buffer_half_float') || renderer.extensions.has('EXT_color_buffer_float')) && canRender(THREE.HalfFloatType)) stateType = THREE.HalfFloatType;
    if (!stateType) { renderer.dispose(); return null; }

    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;

    /* ---- Caméra et scène ---- */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    const pose = { pos: new THREE.Vector3(0, 0, 30), look: new THREE.Vector3(0, 0, 0) };
    const cur = { pos: pose.pos.clone(), look: pose.look.clone() };
    const root = new THREE.Group();
    scene.add(root);

    /* ---- Simulation GPGPU ---- */
    const simScene = new THREE.Scene();
    const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    simScene.add(quad);
    const simU = {
        tPos: { value: null }, tVel: { value: null }, tTargetA: { value: null }, tTargetB: { value: null },
        uMix: { value: 0 }, uTime: { value: 0 }, uDt: { value: 1 / 60 },
        uSpring: { value: 18 }, uDamp: { value: 0.86 }, uBreath: { value: reduceMotion ? 0 : 0.14 },
        uMouse: { value: new THREE.Vector3(999, 999, 999) }, uMouseRadius: { value: 3.6 }, uMouseForce: { value: 90 }, uBurst: { value: 0 }
    };
    const velMat = new THREE.ShaderMaterial({ uniforms: simU, vertexShader: quadVert, fragmentShader: simVelFrag });
    const posMat = new THREE.ShaderMaterial({ uniforms: simU, vertexShader: quadVert, fragmentShader: simPosFrag });
    const copyMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null } }, vertexShader: quadVert, fragmentShader: copyFrag });
    const runPass = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(simScene, simCam); renderer.setRenderTarget(null); };
    const makeRT = S => new THREE.WebGLRenderTarget(S, S, { type: stateType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false });

    /* ---- Rendu des particules ---- */
    const pointU = {
        tPos: simU.tPos, tVel: simU.tVel, tSizeA: simU.tTargetA, tSizeB: simU.tTargetB, tColA: { value: null }, tColB: { value: null }, uMix: simU.uMix, uTime: simU.uTime,
        uPR: { value: 1 }, uSizeK: { value: 120 }, uFogNear: { value: 20 }, uFogFar: { value: 60 }, uPulse: { value: reduceMotion ? 0 : 1 }
    };
    const pointMat = new THREE.ShaderMaterial({
        uniforms: pointU, vertexShader: pointVert, fragmentShader: pointFrag,
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
    });
    let points = null;

    /* ---- État : construit (ou reconstruit) pour une taille de texture S ---- */
    let S = 0, N = 0, rts = null, shapes = {}, pendingShape = null;
    const current = { a: null, b: null };
    function buildSim(size) {
        if (points) { root.remove(points); points.geometry.dispose(); }
        if (rts) Object.values(rts).forEach(r => r.dispose());
        S = size; N = S * S;
        rts = { pos0: makeRT(S), pos1: makeRT(S), vel0: makeRT(S), vel1: makeRT(S) };
        const refs = new Float32Array(N * 2);
        for (let i = 0; i < N; i++) { refs[i * 2] = ((i % S) + 0.5) / S; refs[i * 2 + 1] = (Math.floor(i / S) + 0.5) / S; }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); // requis par three, non utilisé
        geo.setAttribute('ref', new THREE.BufferAttribute(refs, 2));
        geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
        points = new THREE.Points(geo, pointMat);
        points.frustumCulled = false;
        root.add(points);
        // les formes déjà calculées sont régénérées à la nouvelle taille
        const old = shapes; shapes = {};
        Object.entries(old).forEach(([k, s]) => registerShape(k, s.make));
        // vitesses à zéro
        const zero = texOf(new Float32Array(N * 4));
        copyMat.uniforms.tSrc.value = zero;
        runPass(copyMat, rts.vel0); runPass(copyMat, rts.vel1);
        zero.dispose();
        if (current.a) { setTarget(current.a.key, current.b?.key ?? current.a.key, simU.uMix.value); teleport(current.a.key); }
    }
    function texOf(data) {
        const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.FloatType);
        t.minFilter = t.magFilter = THREE.NearestFilter;
        t.needsUpdate = true;
        return t;
    }
    /* une forme = { make(N) → Shape } ; les textures sont créées à l'enregistrement */
    function registerShape(key, make) {
        const sh = make(N);
        shapes[key] = { key, make, pos: texOf(sh.pos), col: texOf(sh.col), shape: sh };
        return shapes[key];
    }
    /* cible : A → B avec un mélange (0 = A, 1 = B) */
    function setTarget(a, b = a, mix = 0) {
        current.a = shapes[a]; current.b = shapes[b];
        simU.tTargetA.value = current.a.pos; simU.tTargetB.value = current.b.pos;
        pointU.tColA.value = current.a.col; pointU.tColB.value = current.b.col;
        simU.uMix.value = mix;
    }
    const setMix = v => { simU.uMix.value = v; };
    /* positions posées instantanément sur une forme (intro passée, reduced-motion) */
    function teleport(key) {
        copyMat.uniforms.tSrc.value = shapes[key].pos;
        runPass(copyMat, rts.pos0); runPass(copyMat, rts.pos1);
        const zero = texOf(new Float32Array(N * 4));
        copyMat.uniforms.tSrc.value = zero;
        runPass(copyMat, rts.vel0); runPass(copyMat, rts.vel1);
        zero.dispose();
    }

    /* ---- Taille, pixel ratio ---- */
    let W = 1, H = 1, PR = 1;
    function resize(maxPR = 1.5) {
        W = innerWidth; H = innerHeight;
        PR = Math.min(devicePixelRatio || 1, maxPR);
        renderer.setPixelRatio(PR);
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        pointU.uPR.value = PR;
        // taille des points : constante à l'écran quelle que soit la hauteur de fenêtre
        pointU.uSizeK.value = H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.032;
    }
    addEventListener('resize', () => resize(maxPR));
    let maxPR = 1.5;

    /* ---- Souris / toucher : projetée sur le plan de la forme (z = 0 du groupe) ---- */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
    const mouseTarget = new THREE.Vector3(999, 999, 999);
    let mouseActive = false, mouseEnabled = true;
    function pointTo(clientX, clientY) {
        if (!mouseEnabled) return;
        ndc.set(clientX / W * 2 - 1, -(clientY / H) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion), root.position);
        if (ray.ray.intersectPlane(plane, hit)) { root.worldToLocal(hit); mouseTarget.copy(hit); mouseActive = true; }
    }
    addEventListener('pointermove', e => pointTo(e.clientX, e.clientY), { passive: true });
    addEventListener('pointerdown', e => pointTo(e.clientX, e.clientY), { passive: true });
    addEventListener('pointerleave', () => { mouseActive = false; });
    document.addEventListener('mouseleave', () => { mouseActive = false; });
    if (coarse) addEventListener('touchend', () => { mouseActive = false; }, { passive: true });

    /* ---- Boucle ---- */
    let last = performance.now(), running = false, frame = 0, onFrame = null;
    let ping = 0;
    const clock = { t: 0 };
    function step(now) {
        const dt = Math.min(1 / 30, Math.max(1e-3, (now - last) / 1000));
        last = now;
        clock.t += dt;
        simU.uTime.value = clock.t;
        simU.uDt.value = dt;
        onFrame?.(dt, clock.t);

        // caméra : glisse vers la pose demandée
        const k = Math.min(1, dt * 3);
        cur.pos.lerp(pose.pos, k); cur.look.lerp(pose.look, k);
        camera.position.copy(cur.pos);
        camera.lookAt(cur.look);

        // souris : lissée, ou renvoyée très loin quand inactive
        const m = simU.uMouse.value;
        if (mouseActive) m.lerp(mouseTarget, Math.min(1, dt * 14)); else m.set(999, 999, 999);

        // simulation : vitesses puis positions (ping-pong)
        const pIn = ping ? rts.pos1 : rts.pos0, pOut = ping ? rts.pos0 : rts.pos1;
        const vIn = ping ? rts.vel1 : rts.vel0, vOut = ping ? rts.vel0 : rts.vel1;
        simU.tPos.value = pIn.texture; simU.tVel.value = vIn.texture;
        runPass(velMat, vOut);
        simU.tVel.value = vOut.texture;
        runPass(posMat, pOut);
        simU.tPos.value = pOut.texture;
        ping ^= 1;

        renderer.clear();
        renderer.render(scene, camera);
        frame++;
    }
    function start() { if (running) return; running = true; last = performance.now(); renderer.setAnimationLoop(step); }
    function stop() { running = false; renderer.setAnimationLoop(null); }
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

    /* ---- Qualité : mesure des FPS puis ajustement (taille de simulation, pixel ratio) ---- */
    function measure(seconds = 1.2) {
        return new Promise(res => {
            const f0 = frame, t0 = performance.now();
            const check = () => {
                const el = performance.now() - t0;
                if (el < seconds * 1000) return requestAnimationFrame(check);
                res((frame - f0) / (el / 1000));
            };
            requestAnimationFrame(check);
        });
    }

    resize();
    return {
        renderer, scene, camera, root, pose, simU, pointU,
        buildSim, registerShape, setTarget, setMix, teleport, start, stop, measure,
        get N() { return N; }, get S() { return S; }, get stateType() { return stateType; }, get rts() { return rts; }, get shapes() { return shapes; },
        set onFrame(f) { onFrame = f; },
        setMaxPR(v) { maxPR = v; resize(v); },
        setMouseEnabled(v) { mouseEnabled = v; if (!v) mouseActive = false; },
        reduceMotion, coarse
    };
}
