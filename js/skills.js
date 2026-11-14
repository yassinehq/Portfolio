/* =========================================================
   Étiquettes HTML du réseau (texte net, accessible) + survol :
   le chemin d'une compétence s'allume jusqu'aux métiers, la fiche
   affiche les barres de pertinence et les projets.
   ========================================================= */
import * as THREE from 'three';
import { GROUPS } from './data.js';
import { renderSkillInfo, filterProjects } from './app.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * @param scene   l'objet renvoyé par createScene
 * @param layout  networkLayout(...) : nodes, edges, inputs, outs
 * @param opts    { layer: élément fixe recevant les étiquettes, info: élément fiche, hint: HTML au repos, lines: LineSegments des synapses }
 */
export function createLabels(scene, layout, { layer, info, lines }) {
    const infoDefault = info.innerHTML;
    const tmp = new THREE.Vector3();
    let enabled = true, W = innerWidth, H = innerHeight;
    addEventListener('resize', () => { W = innerWidth; H = innerHeight; });

    /* ---- Étiquettes ---- */
    const make = (n, html, cls) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lbl ' + cls;
        b.innerHTML = html;
        layer.appendChild(b);
        n.el = b;
        return b;
    };
    layout.inputs.forEach(n => {
        const b = make(n, n.skill.label, 'in');
        b.dataset.g = n.skill.g;
        b.setAttribute('aria-label', `${n.skill.label}, ${GROUPS[n.skill.g]}`);
        b.addEventListener('mouseenter', () => { if (!locked) setActive(n); });
        b.addEventListener('mouseleave', () => { if (!locked) scheduleReset(); });
        b.addEventListener('focus', () => setActive(n, true));
        b.addEventListener('blur', () => { if (locked && active === n) { locked = false; scheduleReset(); } });
        b.addEventListener('click', e => { e.stopPropagation(); setActive(n, true); });
    });
    layout.outs.forEach(n => {
        const b = make(n, `${n.job.label}<small>${n.job.note}</small>`, 'out' + (n.job.main ? ' main' : ''));
        b.tabIndex = -1;
        b.addEventListener('click', () => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }));
    });
    // un clic ailleurs relâche la sélection
    addEventListener('pointerdown', e => { if (locked && !e.target.closest('.lbl, .info')) { locked = false; setActive(null); } });

    /* ---- Chemin d'une compétence jusqu'aux métiers ---- */
    function pathOf(n) {
        const set = new Set();
        for (const e1 of n.out) { set.add(e1.i); for (const e2 of e1.b.out) { set.add(e2.i); for (const e3 of e2.b.out) set.add(e3.i); } }
        return set;
    }
    let active = null, locked = false, resetT = 0;
    const edgeCol = new Float32Array(layout.edges.length * 8);
    function paintLines(n) {
        const path = n ? pathOf(n) : null;
        const c = n ? n.color : new THREE.Color(0x9a9ddc);
        layout.edges.forEach((e, i) => {
            const on = path?.has(e.i);
            const a = on ? 0.5 : (n ? 0.03 : 0.12);
            for (let k = 0; k < 2; k++) { const o = i * 8 + k * 4; edgeCol[o] = c.r; edgeCol[o + 1] = c.g; edgeCol[o + 2] = c.b; edgeCol[o + 3] = a; }
        });
        lines.geometry.attributes.color.needsUpdate = true;
    }
    function setActive(n, lock = false) {
        clearTimeout(resetT);
        if (n === active && !lock) return;
        active = n; locked = lock && !!n;
        layout.inputs.forEach(m => { m.el.classList.toggle('on', m === n); m.el.classList.toggle('dim', !!n && m !== n); });
        layout.outs.forEach(o => o.el.classList.toggle('lit', !!n && n.skill.w[o.job.id] >= 0.7));
        if (n) {
            const path = pathOf(n);
            const levels = layout.nodes.map(nd => nd === n ? 1 : nd.kind === 'out' ? n.skill.w[nd.job.id] : nd.kind === 'hid' && [...path].some(i => layout.edges[i].b === nd) ? 0.6 : 0);
            scene.setActivity([...path], levels, n.color);
            scene.pointU.uDim.value = 1;
            renderSkillInfo(info, n.skill);
        } else {
            scene.setActivity([], [], null);
            scene.pointU.uDim.value = 0;
            info.innerHTML = infoDefault;
        }
        paintLines(n);
    }
    function scheduleReset() { clearTimeout(resetT); resetT = setTimeout(() => { if (!locked) setActive(null); }, 350); }
    info.addEventListener('click', e => {
        const b = e.target.closest('[data-skill]');
        if (b && active) filterProjects(active.skill);
    });
    paintLines(null);

    /* ---- Survol direct d'un amas (sans passer par l'étiquette) ---- */
    function project(n) {
        tmp.copy(n.pos);
        scene.root.localToWorld(tmp).project(scene.camera);
        return { x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H, z: tmp.z };
    }
    if (matchMedia('(hover: hover)').matches) addEventListener('pointermove', e => {
        if (!enabled || locked || e.target.closest('.lbl, .info, a, button')) return;
        let best = null, bd = 34;
        for (const n of layout.inputs) { const s = project(n); const d = Math.hypot(s.x - e.clientX, s.y - e.clientY); if (d < bd) { bd = d; best = n; } }
        if (best) setActive(best); else if (active && !locked) scheduleReset();
    }, { passive: true });

    /* ---- Placement à chaque image ---- */
    const narrow = () => W < 760;
    function update() {
        if (!enabled) return;
        const nr = narrow();
        for (const n of layout.inputs.concat(layout.outs)) {
            const s = project(n);
            const el = n.el, w = el.offsetWidth, h = el.offsetHeight;
            const gap = n.kind === 'out' ? (n.job.main ? 30 : 22) : 18;
            let x, y = s.y - h / 2;
            if (n.kind === 'in') x = s.x - w - gap;
            else if (nr) { x = s.x - w / 2; y = s.y + 16; }
            else x = s.x + gap;
            x = clamp(x, 4, W - w - 4); y = clamp(y, 4, H - h - 4);
            el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        }
    }
    function setEnabled(v) {
        enabled = v;
        layer.classList.toggle('hidden', !v);
        if (!v) { locked = false; setActive(null); }
    }
    return { update, setActive, setEnabled, get active() { return active; } };
}
