/* =========================================================
   Formes cibles du nuage de particules.
   Chaque forme = N points (positions, couleurs, taille, phase d'impulsion),
   obtenus en échantillonnant des géométries Three.js simples
   (MeshSurfaceSampler) ou des segments. Même N partout : le morphing
   consiste juste à changer de texture cible.
   ========================================================= */
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { SKILLS, JOBS, GROUP_HEX } from './data.js';

/* ---------- Générateur pseudo-aléatoire déterministe (même forme à chaque visite) ---------- */
export function rng(seed = 1) {
    let s = seed >>> 0 || 1;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/* ---------- Une forme : tableaux prêts à devenir des textures ----------
   pos : xyz + taille (w) · col : rgb + impulsion (w : position le long d'un segment, -1 sinon) */
export class Shape {
    constructor(n) {
        this.n = n;
        this.pos = new Float32Array(n * 4);
        this.col = new Float32Array(n * 4);
        this.cursor = 0;
    }
    add(x, y, z, size, color, pulse = -1) {
        if (this.cursor >= this.n) return;
        const i = this.cursor++ * 4;
        this.pos[i] = x; this.pos[i + 1] = y; this.pos[i + 2] = z; this.pos[i + 3] = size;
        this.col[i] = color.r; this.col[i + 1] = color.g; this.col[i + 2] = color.b; this.col[i + 3] = pulse;
    }
    /* les particules restantes (arrondis) sont réparties au hasard sur celles déjà posées */
    fill(rand) {
        const placed = this.cursor;
        while (this.cursor < this.n) {
            const j = Math.floor(rand() * placed) * 4, i = this.cursor++ * 4;
            for (let k = 0; k < 4; k++) { this.pos[i + k] = this.pos[j + k]; this.col[i + k] = this.col[j + k]; }
        }
        return this;
    }
}

/* ---------- Parties d'une forme ----------
   { mesh, color, size, share } : surface échantillonnée
   { segments: [[a, b], ...], color, size, share, pulse: true } : points le long de segments
   share = part du total de particules (les parts sont normalisées) */
export function build(n, parts, seed = 7) {
    const rand = rng(seed);
    const shape = new Shape(n);
    const total = parts.reduce((s, p) => s + p.share, 0);
    const tmp = new THREE.Vector3();
    parts.forEach(p => {
        const count = Math.floor(n * p.share / total);
        const color = p.color instanceof THREE.Color ? p.color : new THREE.Color(p.color);
        const jitter = p.jitter ?? 0;
        if (p.mesh) {
            p.mesh.updateMatrixWorld(true);
            const sampler = new MeshSurfaceSampler(p.mesh).build();
            for (let i = 0; i < count; i++) {
                sampler.sample(tmp);
                tmp.applyMatrix4(p.mesh.matrixWorld);
                const c = p.colorAt ? p.colorAt(tmp) : color;
                shape.add(tmp.x + (rand() - .5) * jitter, tmp.y + (rand() - .5) * jitter, tmp.z + (rand() - .5) * jitter, p.size * (0.7 + rand() * 0.6), c, p.tag ?? -1);
            }
        } else if (p.segments) {
            const lens = p.segments.map(([a, b]) => a.distanceTo(b));
            const L = lens.reduce((s, l) => s + l, 0);
            p.segments.forEach(([a, b], k) => {
                const m = Math.round(count * lens[k] / L);
                for (let i = 0; i < m; i++) {
                    const t = rand();
                    tmp.lerpVectors(a, b, t);
                    const c = p.colorAt ? p.colorAt(tmp, k) : color;
                    shape.add(tmp.x + (rand() - .5) * jitter, tmp.y + (rand() - .5) * jitter, tmp.z + (rand() - .5) * jitter, p.size * (0.6 + rand() * 0.7), c, p.pulse ? k + Math.min(t, 0.999) : -1);
                }
            });
        } else if (p.points) {
            p.points.forEach(q => shape.add(q.x, q.y, q.z, p.size, color));
        }
    });
    return shape.fill(rand);
}

/* ---------- Nuage dispersé (intro) ---------- */
export function scatter(n, radius = 40, seed = 3) {
    const rand = rng(seed);
    const shape = new Shape(n);
    const c = new THREE.Color(0x8d8fc4);
    for (let i = 0; i < n; i++) {
        const u = rand() * 2 - 1, a = rand() * Math.PI * 2, r = radius * Math.cbrt(0.3 + rand() * 0.7);
        const s = Math.sqrt(1 - u * u);
        shape.add(s * Math.cos(a) * r, u * r * 0.7, s * Math.sin(a) * r - 10, 0.5 + rand() * 0.5, c);
    }
    return shape;
}

/* ---------- Réseau de neurones ----------
   Topologie partagée par le hero (replié) et la section compétences (déplié).
   Renvoie aussi les nœuds et arêtes (pour les étiquettes HTML et les synapses). */
export function networkLayout({ spread = 1, curl = 1, xGap = 6.4, yScale = 1, base = null } = {}) {
    const nodes = [], edges = [];
    const arc = (t, amp, back) => Math.cos(t * Math.PI) * amp * curl - back * curl;
    const layer = (count, x, h, amp, kind, seed, data) => Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        const n = {
            kind, i,
            pos: new THREE.Vector3(x + (kind === 'hid' ? Math.sin(i * 2.3 + seed) * 0.5 : 0), -t * h * spread * yScale, arc(t, amp, amp * 0.45) + (kind === 'hid' ? Math.sin(i * 1.7 + seed) * 1.0 : 0)),
            ...(data ? data(i) : {})
        };
        nodes.push(n); return n;
    });
    const X0 = -xGap * 1.55, X1 = xGap * 1.45;
    const inputs = layer(SKILLS.length, X0, 15, 5.0, 'in', 0, i => ({ skill: SKILLS[i], color: new THREE.Color(GROUP_HEX[SKILLS[i].g]), r: 0.58 }));
    const h1 = layer(8, X0 + xGap, 12, 4.2, 'hid', 0.3, () => ({ color: new THREE.Color(0xb8b9e6), r: 0.3 }));
    const h2 = layer(6, X0 + xGap * 2, 9, 3.4, 'hid', 1.1, () => ({ color: new THREE.Color(0xb8b9e6), r: 0.3 }));
    const outs = JOBS.map((j, i) => {
        const n = { kind: 'out', i, job: j, pos: new THREE.Vector3(X1, [4.6, -1.8, -6.8][i] * spread * yScale, (j.main ? 1.6 : -1.2) * curl), color: new THREE.Color(0xfff3dc), r: j.main ? 0.85 : 0.5 };
        nodes.push(n); return n;
    });
    const link = (a, b) => { const e = { a, b, i: edges.length }; edges.push(e); return e; };
    if (base) {
        // mêmes arêtes que le layout de base (même ordre de nœuds) : le morphing garde chaque particule sur sa synapse
        base.edges.forEach(e => link(nodes[base.nodes.indexOf(e.a)], nodes[base.nodes.indexOf(e.b)]));
        nodes.forEach(n => { n.out = edges.filter(e => e.a === n); });
    } else {
        inputs.forEach(n => { n.out = h1.map(h => ({ h, d: h.pos.distanceTo(n.pos) })).sort((p, q) => p.d - q.d).slice(0, 3).map(o => link(n, o.h)); });
        h1.forEach(n => { n.out = h2.map(h => link(n, h)); });
        h2.forEach(n => { n.out = outs.map(o => link(n, o)); });
    }
    return { nodes, edges, inputs, h1, h2, outs };
}

export function network(n, layout, { nodeShare = 0.38, seed = 11 } = {}) {
    const parts = [];
    const sumR2 = layout.nodes.reduce((s, nd) => s + nd.r * nd.r, 0);
    layout.nodes.forEach(nd => {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(nd.r, 12, 8));
        mesh.position.copy(nd.pos);
        parts.push({ mesh, color: nd.color, size: nd.kind === 'out' ? 1.0 : 0.85, share: nodeShare * nd.r * nd.r / sumR2, jitter: 0.08, tag: -(2 + layout.nodes.indexOf(nd)) });
    });
    const synColor = new THREE.Color(0x7d80b8);
    parts.push({
        segments: layout.edges.map(e => [e.a.pos, e.b.pos]),
        color: synColor, size: 0.7, share: 1 - nodeShare, pulse: true, jitter: 0.12,
        colorAt: (p, k) => layout.edges[k].a.kind === 'in' ? layout.edges[k].a.color.clone().lerp(synColor, 0.55) : synColor
    });
    return build(n, parts, seed);
}

/* =========================================================
   Formes des chapitres
   ========================================================= */
const C = {
    data: 0xf4b76f, ml: 0xe891bd, dev: 0x93a6ff, tool: 0x7fd3c0, goal: 0xfff3dc, soft: 0xb8b9e6, mid: 0x8d8fc4
};
const meshAt = (geo, x = 0, y = 0, z = 0, rot = null) => {
    const m = new THREE.Mesh(geo);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    return m;
};

/* Power BI : graphique à barres 3D (grille 6 × 4) sur un socle */
export function bars(n) {
    const rand = rng(21);
    const parts = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        const h = 1.2 + rand() * 5.5 + c * 0.35;
        const geo = new THREE.BoxGeometry(1.1, h, 1.1);
        parts.push({ mesh: meshAt(geo, (c - 2.5) * 1.8, h / 2 - 3.2, (r - 1.5) * 1.8), color: new THREE.Color(C.data).lerp(new THREE.Color(C.goal), (h / 8) * 0.8), size: 0.75, share: h });
    }
    parts.push({ mesh: meshAt(new THREE.BoxGeometry(12.4, 0.25, 8.6), 0, -3.35, 0), color: C.mid, size: 0.6, share: 18 });
    return build(n, parts, 22);
}

/* Application de gestion : cylindre de base de données (3 galettes) */
export function database(n) {
    const parts = [];
    for (let i = 0; i < 3; i++) {
        const y = (1 - i) * 2.6;
        parts.push({ mesh: meshAt(new THREE.CylinderGeometry(4.2, 4.2, 1.9, 48, 1, true), 0, y, 0), color: new THREE.Color(C.dev).lerp(new THREE.Color(C.soft), i * 0.2), size: 0.7, share: 10 });
        parts.push({ mesh: meshAt(new THREE.RingGeometry(0.2, 4.2, 48), 0, y + 0.95, 0, [-Math.PI / 2, 0, 0]), color: new THREE.Color(C.dev).lerp(new THREE.Color(C.goal), 0.35), size: 0.7, share: 6 });
    }
    parts.push({ mesh: meshAt(new THREE.RingGeometry(0.2, 4.2, 48), 0, -2.6 - 0.95, 0, [Math.PI / 2, 0, 0]), color: C.dev, size: 0.6, share: 4 });
    return build(n, parts, 23);
}

/* Calculatrice : clavier 4 × 5 et bandeau d'affichage */
export function keypad(n) {
    const parts = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
        const wide = r === 4 && c === 0;
        if (r === 4 && c === 1) continue;
        const geo = new THREE.BoxGeometry(wide ? 3.6 : 1.6, 0.6, 1.4);
        parts.push({ mesh: meshAt(geo, (c - 1.5) * 2.0 + (wide ? 1 : 0), -r * 1.9 + 1.2, 0), color: c === 3 ? C.data : C.tool, size: 0.7, share: wide ? 2 : 1 });
    }
    parts.push({ mesh: meshAt(new THREE.BoxGeometry(7.8, 2.2, 0.6), 0, 4.2, 0), color: C.goal, size: 0.7, share: 5 });
    parts.push({ mesh: meshAt(new THREE.BoxGeometry(9, 14.2, 0.3), 0, -2.2, -0.6), color: new THREE.Color(C.mid).multiplyScalar(0.8), size: 0.5, share: 10 });
    return build(n, parts, 24);
}

/* Premier portfolio : un écran sur son pied, dalle en grille de « pixels » */
export function screen(n) {
    const parts = [];
    const frame = (w, h, x, y) => parts.push({ mesh: meshAt(new THREE.BoxGeometry(w, h, 0.5), x, y, 0), color: C.soft, size: 0.65, share: w * h });
    frame(13, 0.5, 0, 4.25); frame(13, 0.5, 0, -4.25); frame(0.5, 9, -6.25, 0); frame(0.5, 9, 6.25, 0);
    const pts = [];
    for (let i = 0; i < 26; i++) for (let j = 0; j < 17; j++) pts.push(new THREE.Vector3(-5.6 + i * 0.45, 3.6 - j * 0.45, 0.05));
    parts.push({ points: pts, color: C.ml, size: 0.55, share: 26 });
    parts.push({ mesh: meshAt(new THREE.BoxGeometry(11, 1.1, 0.2), 0, 3.0, 0.1), color: C.goal, size: 0.6, share: 8 });
    parts.push({ mesh: meshAt(new THREE.BoxGeometry(4.6, 3.2, 0.2), -2.9, 0.1, 0.1), color: C.dev, size: 0.6, share: 8 });
    parts.push({ mesh: meshAt(new THREE.BoxGeometry(4.6, 3.2, 0.2), 2.9, 0.1, 0.1), color: C.data, size: 0.6, share: 8 });
    parts.push({ mesh: meshAt(new THREE.CylinderGeometry(0.5, 0.7, 2.4, 12), 0, -5.6, 0), color: C.soft, size: 0.6, share: 3 });
    parts.push({ mesh: meshAt(new THREE.CylinderGeometry(3.2, 3.2, 0.3, 32), 0, -6.9, 0), color: C.soft, size: 0.6, share: 5 });
    return build(n, parts, 25);
}

/* Machine learning : nuage de points séparé en amas colorés (classification) */
export function clusters(n) {
    const rand = rng(26);
    const shape = new Shape(n);
    const centers = [
        { p: new THREE.Vector3(-4.5, 2.5, 0), c: new THREE.Color(C.ml), s: 2.2 },
        { p: new THREE.Vector3(4, 3, -1.5), c: new THREE.Color(C.data), s: 1.9 },
        { p: new THREE.Vector3(-1, -3.5, 1), c: new THREE.Color(C.dev), s: 2.4 },
        { p: new THREE.Vector3(5, -3, 1.5), c: new THREE.Color(C.tool), s: 1.6 }
    ];
    const gauss = () => { let u = 0, v = 0; while (u === 0) u = rand(); while (v === 0) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const perCluster = Math.floor(n * 0.9 / centers.length);
    centers.forEach(k => {
        for (let i = 0; i < perCluster; i++) shape.add(k.p.x + gauss() * k.s, k.p.y + gauss() * k.s * 0.8, k.p.z + gauss() * k.s * 0.8, 0.9 + rand() * 0.5, k.c);
    });
    const grey = new THREE.Color(C.mid);
    for (let i = 0; i < n * 0.05; i++) shape.add((rand() - 0.5) * 15, (rand() - 0.5) * 11, (rand() - 0.5) * 6, 0.8, grey);
    for (let i = 0; i < n * 0.05; i++) {
        const t = rand() * 14 - 7;
        if (rand() < 0.5) shape.add(t, -6.2, -2, 0.6, grey); else shape.add(-7.5, t * 0.8, -2, 0.6, grey);
    }
    return shape.fill(rand);
}

/* Certification : diamant taille brillant (enveloppe convexe de ses sommets) */
export function diamond(n) {
    const pts = [];
    const ring = (r, y, k, off = 0) => { for (let i = 0; i < k; i++) { const a = (i / k) * Math.PI * 2 + off; pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); } };
    ring(2.6, 3.2, 8, Math.PI / 8);
    ring(4.4, 1.9, 16);
    ring(5.0, 1.2, 16, Math.PI / 16);
    ring(4.6, 0.6, 16);
    pts.push(new THREE.Vector3(0, -5.2, 0));
    const geo = new ConvexGeometry(pts);
    const goal = new THREE.Color(C.goal), warm = new THREE.Color(C.data);
    return build(n, [{ mesh: meshAt(geo, 0, 0.6, 0), color: C.goal, size: 0.75, share: 1, jitter: 0.03,
        colorAt: p => goal.clone().lerp(warm, 0.25 + 0.25 * Math.sin(p.x * 1.3 + p.z * 0.9)) }], 27);
}

/* Contact : un « @ » en tube (boucle intérieure + spirale) */
export function atSign(n) {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const a = Math.PI * 0.5 + (i / 60) * Math.PI * 2.1; pts.push(new THREE.Vector3(Math.cos(a) * 2.1 + 0.3, Math.sin(a) * 2.1, 0)); }
    for (let i = 1; i <= 110; i++) { const t = i / 110; const a = -Math.PI * 0.1 - t * Math.PI * 1.55; const r = 2.6 + t * 2.6; pts.push(new THREE.Vector3(Math.cos(a) * r + 0.3, Math.sin(a) * r, Math.sin(t * Math.PI) * 0.6)); }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.55, 10, false);
    const goal = new THREE.Color(C.goal), warm = new THREE.Color(C.data);
    return build(n, [{ mesh: meshAt(tube, 0, 0, 0), color: C.goal, size: 0.8, share: 1, jitter: 0.05,
        colorAt: p => goal.clone().lerp(warm, Math.max(0, Math.min(1, (p.x + 5) / 10)) * 0.6) }], 28);
}
