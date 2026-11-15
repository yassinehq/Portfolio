/* =========================================================
   Le nuage au fil du scroll.
   - chaque section a une zone réservée (.stage) : la forme se cale dessus
     (position, échelle), quelle que soit la largeur d'écran ;
   - entre deux zones, GSAP ScrollTrigger fait avancer le mélange A → B
     et le groupe glisse d'une zone à l'autre ; Lenis lisse le défilement ;
   - la caméra fait un léger travelling, la souris une parallaxe ;
   - prefers-reduced-motion : pas de Lenis, formes posées d'un coup.
   ========================================================= */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);

export function initScroll(scene, stops, { labels, lines, onIntroDone } = {}) {
    const { reduceMotion } = scene;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---- Défilement : natif par défaut (réponse immédiate à la molette).
       Lenis reste disponible : ?smooth dans l'URL ou SMOOTH_SCROLL = true. ---- */
    const SMOOTH_SCROLL = false;
    let lenis = null;
    if (!reduceMotion && (SMOOTH_SCROLL || location.search.includes('smooth'))) {
        lenis = new Lenis({ lerp: 0.3, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(t => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
        // les liens d'ancre passent par Lenis
        document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            lenis.scrollTo(target, { offset: -40 });
        }));
    }

    /* ---- État courant : entre l'arrêt i et l'arrêt i+1, à la progression p ---- */
    const state = { i: 0, p: 0 };
    stops.forEach(s => { s.sel = s.el; s.el = typeof s.el === 'string' ? document.querySelector(s.el) : s.el; });
    function setState(i, p) {
        i = Math.max(0, Math.min(stops.length - 2, i));
        if (reduceMotion) {
            // pas de morphing animé : on bascule d'un coup à mi-chemin
            const snapped = p < 0.5 ? 0 : 1;
            if (state.i !== i || state.p !== snapped) {
                state.i = i; state.p = snapped;
                scene.setTarget(stops[i].shape, stops[i + 1].shape, snapped);
                scene.teleport(snapped ? stops[i + 1].shape : stops[i].shape);
            }
            return;
        }
        state.i = i; state.p = p;
        scene.setTarget(stops[i].shape, stops[i + 1].shape, smooth(p));
    }
    scene.setTarget(stops[0].shape, stops[1].shape, 0);

    for (let k = 1; k < stops.length; k++) {
        const s = stops[k];
        ScrollTrigger.create({
            trigger: s.trigger ? document.querySelector(s.trigger) : s.el,
            start: s.start ?? 'top 85%',
            end: s.end ?? 'top 30%',
            scrub: reduceMotion ? false : 0.15,
            onUpdate: self => setState(k - 1, self.progress),
            onToggle: self => { if (self.isActive) setState(k - 1, self.progress); }
        });
    }

    /* ---- Géométrie : où se trouve une zone, en unités monde, à la profondeur du groupe ---- */
    const fovTan = () => Math.tan(THREE.MathUtils.degToRad(scene.camera.fov / 2));
    const camZ = () => scene.camera.position.z;
    function anchorOf(stop, out) {
        if (!stop.el) stop.el = document.querySelector(stop.sel) || document.body;
        const r = stop.el.getBoundingClientRect();
        const H = innerHeight, W = innerWidth;
        const dist = camZ();
        const unitsPerPx = (2 * dist * fovTan()) / H;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        out.x = (cx - W / 2) * unitsPerPx + scene.camera.position.x;
        out.y = -(cy - H / 2) * unitsPerPx + scene.camera.position.y;
        // échelle : la forme (≈ 16 unités) tient dans la zone
        const fit = stop.fit ?? 1;
        out.s = fit ? Math.min(r.width, r.height) * unitsPerPx / 16 * fit : 1;
        if (!fit) { out.x = scene.camera.position.x; out.y = scene.camera.position.y; }
        return out;
    }
    const A = { x: 0, y: 0, s: 1 }, B = { x: 0, y: 0, s: 1 };
    const par = { x: 0, y: 0 };
    if (fine) addEventListener('pointermove', e => { par.x = e.clientX / innerWidth - 0.5; par.y = e.clientY / innerHeight - 0.5; }, { passive: true });

    /* ---- Dispersion du « @ » au survol (contact) ---- */
    let burst = 0;
    stops.forEach(s => {
        if (!s.burst) return;
        s.el.addEventListener('pointerenter', () => { burst = 1; });
        s.el.addEventListener('pointerdown', () => { burst = 1; });
    });

    /* ---- Chaque image : position, échelle, rotation, caméra, fondu ---- */
    let introT = 0;
    function update(dt, t) {
        const i = state.i, p = reduceMotion ? state.p : smooth(state.p);
        const a = stops[i], b = stops[i + 1];
        anchorOf(a, A); anchorOf(b, B);
        const narrow = innerWidth < 760;
        const g = scene.root;
        const sa = A.s * (a.scale ?? 1), sb = B.s * (b.scale ?? 1);
        const s = lerp(sa, sb, p);
        // sur mobile, le réseau est resserré en largeur, étiré en hauteur et décalé à droite
        // (place pour les étiquettes de compétences à gauche)
        const sx = lerp(a.net && narrow ? 0.78 : 1, b.net && narrow ? 0.78 : 1, p);
        const sy = lerp(a.stretch && narrow ? 1.15 : 1, b.stretch && narrow ? 1.15 : 1, p);
        const ox = lerp(a.net && narrow ? 2.0 : 0, b.net && narrow ? 2.0 : 0, p) * s;
        g.position.set(lerp(A.x, B.x, p) + ox, lerp(A.y, B.y, p), 0);
        g.scale.set(s * sx, s * sy, s);
        const sway = reduceMotion ? 0 : Math.sin(t * 0.2) * 0.08;
        const spin = reduceMotion ? 0 : t * 0.35;
        const rx = lerp(a.rot?.[0] ?? 0, b.rot?.[0] ?? 0, p);
        const ry = lerp((a.rot?.[1] ?? 0) + (a.spin ? spin : sway), (b.rot?.[1] ?? 0) + (b.spin ? spin : sway), p);
        g.rotation.set(rx, ry, 0);
        g.updateMatrixWorld();

        // caméra : travelling doux + parallaxe
        const ca = a.cam ?? [0, 0, 30], cb = b.cam ?? [0, 0, 30];
        scene.pose.pos.set(lerp(ca[0], cb[0], p) + par.x * 0.9, lerp(ca[1], cb[1], p) - par.y * 0.5, lerp(ca[2], cb[2], p));
        scene.pose.look.set(par.x * 0.3, -par.y * 0.15, 0);

        // fondu (nuage discret derrière À propos / Parcours), synapses et étiquettes du réseau
        scene.pointU.uFade.value = lerp(a.fade ?? 1, b.fade ?? 1, p);
        const net = lerp(a.net ? 1 : 0, b.net ? 1 : 0, p);
        if (lines) lines.material.opacity = net * (introT >= 1 ? 1 : introT);
        labels?.setMix(0);
        labels?.setEnabled(net > 0.4);
        labels?.setFade(Math.max(0, (net - 0.4) / 0.6));

        // souris : repousse seulement là où ça a du sens (réseau, @)
        scene.setMouseEnabled(!!(a.mouse || b.mouse));

        // dispersion : impulsion brève puis retour en ressort
        if (burst > 0) { scene.simU.uBurst.value = burst * 70; burst = Math.max(0, burst - dt * 4); }
        else scene.simU.uBurst.value = 0;
        if (introT < 1) introT += dt / 1.5;
    }
    return {
        update, state, lenis,
        refresh: () => ScrollTrigger.refresh(),
        introDone: () => { introT = Math.max(introT, 0.01); }
    };
}
