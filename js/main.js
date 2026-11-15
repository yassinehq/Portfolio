/* =========================================================
   Mise en scène du nuage : formes, intro, qualité adaptative,
   étiquettes du réseau, puis le fil du scroll (scroll.js).
   ========================================================= */
import * as THREE from 'three';
import { createScene } from './scene.js';
import { scatter, networkLayout, network, bars, database, keypad, screen, clusters, diamond, atSign } from './shapes.js';
import { createLabels } from './skills.js';
import { initScroll } from './scroll.js';

const html = document.documentElement;
const canvas = document.getElementById('gl');
const skipBtn = document.getElementById('skipIntro');

// ?nowebgl dans l'URL : force le repli sans WebGL (pour le tester)
export const scene = location.search.includes('nowebgl') ? null : createScene(canvas);
if (!scene) {
    html.classList.add('no-webgl');
    skipBtn?.remove();
} else {
    html.classList.add('webgl');
    const { reduceMotion, coarse } = scene;
    const narrow = innerWidth < 760;

    /* ---- Formes ---- */
    const heroLayout = networkLayout({ spread: 1.05, curl: 0.8, xGap: 5.2 });
    scene.buildSim(narrow || coarse ? 128 : 192);
    scene.registerShape('scatter', n => scatter(n));
    scene.registerShape('hero', n => network(n, heroLayout));
    scene.registerShape('bars', bars);
    scene.registerShape('database', database);
    scene.registerShape('screen', screen);
    scene.registerShape('keypad', keypad);
    scene.registerShape('clusters', clusters);
    scene.registerShape('diamond', diamond);
    scene.registerShape('at', atSign);

    /* synapses : traits fins entre les nœuds, colorés sur le chemin actif */
    const E = heroLayout.edges.length;
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(E * 6), 3));
    eGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(E * 8), 4));
    const lines = new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false }));
    lines.frustumCulled = false;
    scene.root.add(lines);

    /* ---- Étiquettes HTML du réseau (hero et compétences) ---- */
    const labels = createLabels(scene, [heroLayout, heroLayout], {
        layer: document.getElementById('netLabels'),
        infos: [document.getElementById('heroInfo')],
        lines
    });
    html.classList.add('labels-on');

    /* ---- Les arrêts du scroll : une zone, une forme, une pose ----
       (initialisé en microtâche : les chapitres projets sont créés par app.js après ce module) ---- */
    let scroll = null;
    const stops = [
        { el: '#heroStage', shape: 'hero', rot: [narrow ? 0.03 : 0.1, narrow ? -0.2 : -0.3], net: true, mouse: true, stretch: true, scale: 1.0, cam: [0, 0, 30] },
        { el: '#stage-ferrari', shape: 'bars', rot: [0.38, -0.65], trigger: '#ch-ferrari', cam: [1.2, 0.4, 29] },
        { el: '#stage-stage', shape: 'database', rot: [0.3, 0.5], trigger: '#ch-stage', cam: [-1, 0.3, 29.5] },
        { el: '#stage-portfolio', shape: 'screen', rot: [0.06, -0.3], trigger: '#ch-portfolio', cam: [0.8, 0, 30] },
        { el: '#stage-calc', shape: 'keypad', rot: [0.55, 0.25], trigger: '#ch-calc', cam: [-0.8, 0.6, 28.5] },
        { el: '#stage-ml', shape: 'clusters', rot: [0.3, -0.5], trigger: '#ch-ml', cam: [0.6, 0, 30.5] },
        { el: '#apropos', shape: 'scatter', fit: 0, fade: 0.35, cam: [0, 0, 34], start: 'top 70%', end: 'top 20%' },
        { el: '#parcours', shape: 'scatter', fit: 0, fade: 0.35, cam: [0, 0, 34], start: 'top 70%', end: 'top 20%' },
        { el: '#certStage', shape: 'diamond', rot: [0.18, 0], spin: true, trigger: '#certifications', cam: [0, 0.4, 29], scale: 1.1 },
        { el: '#contactStage', shape: 'at', rot: [0, 0], mouse: true, burst: true, trigger: '#contact', cam: [0, 0, 30], scale: 1.15 }
    ];

    /* ---- Intro : nuage dispersé → réseau (≤ 2 s), passable d'un clic ---- */
    let introDone = false;
    const endIntro = () => {
        if (introDone) return;
        introDone = true;
        scene.simU.uSpring.value = 18; scene.simU.uDamp.value = 0.86;
        skipBtn?.classList.add('gone');
        setTimeout(() => skipBtn?.remove(), 600);
        html.classList.add('intro-done');
        scroll?.introDone();
    };
    scene.setTarget('hero');
    if (reduceMotion) {
        scene.teleport('hero');
        endIntro();
    } else {
        scene.teleport('scatter');
        scene.simU.uSpring.value = 7; scene.simU.uDamp.value = 0.9;
        setTimeout(endIntro, 2000);
        skipBtn?.addEventListener('click', () => { scene.teleport(stops[scroll?.state.i ?? 0].shape); endIntro(); });
    }
    scene.start();

    /* ---- Chaque image : scroll.js place le groupe, puis les étiquettes suivent ---- */
    queueMicrotask(() => {
        scroll = initScroll(scene, stops, { labels, lines });
        if (introDone) scroll.introDone();
        scene.onFrame = (dt, t) => {
            scroll.update(dt, t);
            labels.update();
        };
        addEventListener('load', () => scroll.refresh());
        document.fonts?.ready.then(() => scroll.refresh());
    });

    /* ---- Qualité : mesure après l'intro, puis réduction si besoin ---- */
    setTimeout(async () => {
        const fps = await scene.measure(1.2);
        html.dataset.fps = Math.round(fps);
        if (fps < 30) { scene.buildSim(96); scene.setMaxPR(1); }
        else if (fps < 45) { scene.buildSim(128); scene.setMaxPR(1); }
        html.dataset.particles = scene.N;
    }, reduceMotion ? 800 : 2600);
}
