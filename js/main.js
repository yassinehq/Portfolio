/* =========================================================
   Mise en scène du nuage : formes, intro, qualité adaptative,
   pose caméra du hero. (Les morphings au scroll viennent ensuite.)
   ========================================================= */
import * as THREE from 'three';
import { createScene } from './scene.js';
import { scatter, networkLayout, network } from './shapes.js';

const html = document.documentElement;
const canvas = document.getElementById('gl');
const skipBtn = document.getElementById('skipIntro');

export const scene = createScene(canvas);
window.portfolioScene = scene;   // pratique pour inspecter depuis la console
if (!scene) {
    html.classList.add('no-webgl');
    skipBtn?.remove();
} else {
    html.classList.add('webgl');
    const { reduceMotion, coarse } = scene;
    const narrow = innerWidth < 760;

    /* ---- Formes du hero ---- */
    const heroLayout = networkLayout({ spread: 0.8, curl: 1.25, xGap: 4.8 });
    scene.buildSim(narrow || coarse ? 128 : 192);
    scene.registerShape('scatter', n => scatter(n));
    scene.registerShape('hero', n => network(n, heroLayout));

    /* synapses : traits fins entre les nœuds, discrets */
    const ePos = new Float32Array(heroLayout.edges.length * 6);
    heroLayout.edges.forEach((e, i) => ePos.set([e.a.pos.x, e.a.pos.y, e.a.pos.z, e.b.pos.x, e.b.pos.y, e.b.pos.z], i * 6));
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    const lines = new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({ color: 0x9a9ddc, transparent: true, opacity: 0, depthWrite: false }));
    scene.root.add(lines);

    /* ---- Pose du hero : réseau à droite du texte, vu de trois quarts ---- */
    function layoutHero() {
        const w = innerWidth;
        if (w < 760) { scene.root.position.set(0, -2.5, -6); scene.root.scale.setScalar(0.7); }
        else if (w < 1100) { scene.root.position.set(4, -1, -4); scene.root.scale.setScalar(0.85); }
        else { scene.root.position.set(5.5, 0, 0); scene.root.scale.setScalar(1); }
        scene.pose.pos.set(0, 0, 30); scene.pose.look.set(0, 0, 0);
    }
    layoutHero();
    addEventListener('resize', layoutHero);

    /* ---- Intro : nuage dispersé → réseau (≤ 2 s), passable d'un clic ---- */
    let introDone = false;
    const endIntro = () => {
        if (introDone) return;
        introDone = true;
        scene.simU.uSpring.value = 18; scene.simU.uDamp.value = 0.86;
        skipBtn?.classList.add('gone');
        setTimeout(() => skipBtn?.remove(), 600);
        html.classList.add('intro-done');
    };
    scene.setTarget('hero');
    if (reduceMotion) {
        scene.teleport('hero');
        endIntro();
    } else {
        scene.teleport('scatter');
        // ressort plus souple le temps de converger, puis réglage normal
        scene.simU.uSpring.value = 7; scene.simU.uDamp.value = 0.9;
        setTimeout(endIntro, 2000);
        skipBtn?.addEventListener('click', () => { scene.teleport('hero'); endIntro(); });
    }
    scene.start();

    /* ---- Respiration du réseau + rotation très lente ---- */
    const baseRot = { x: 0.12, y: -0.38 };
    scene.onFrame = (dt, t) => {
        const sway = reduceMotion ? 0 : Math.sin(t * 0.2) * 0.12;
        scene.root.rotation.set(baseRot.x, baseRot.y + sway, 0);
        // les synapses apparaissent une fois le réseau formé
        const target = introDone ? 0.14 : 0;
        lines.material.opacity += (target - lines.material.opacity) * Math.min(1, dt * 2);
    };

    /* ---- Qualité : mesure après l'intro, puis réduction si besoin ---- */
    setTimeout(async () => {
        const fps = await scene.measure(1.2);
        html.dataset.fps = Math.round(fps);
        if (fps < 30) { scene.buildSim(96); scene.setMaxPR(1); }
        else if (fps < 45) { scene.buildSim(128); scene.setMaxPR(1); }
        html.dataset.particles = scene.N;
    }, reduceMotion ? 800 : 2600);
}
