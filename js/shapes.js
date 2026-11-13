/* =========================================================
   Formes cibles du nuage de particules.
   Chaque forme = N points (positions, couleurs, taille, phase d'impulsion),
   obtenus en échantillonnant des géométries Three.js simples
   (MeshSurfaceSampler) ou des segments. Même N partout : le morphing
   consiste juste à changer de texture cible.
   ========================================================= */
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
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
                shape.add(tmp.x + (rand() - .5) * jitter, tmp.y + (rand() - .5) * jitter, tmp.z + (rand() - .5) * jitter, p.size * (0.7 + rand() * 0.6), c);
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
                    shape.add(tmp.x + (rand() - .5) * jitter, tmp.y + (rand() - .5) * jitter, tmp.z + (rand() - .5) * jitter, p.size * (0.6 + rand() * 0.7), c, p.pulse ? t : -1);
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
export function networkLayout({ spread = 1, curl = 1, xGap = 6.4, yScale = 1 } = {}) {
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
    const inputs = layer(SKILLS.length, X0, 15, 5.0, 'in', 0, i => ({ skill: SKILLS[i], color: new THREE.Color(GROUP_HEX[SKILLS[i].g]), r: 0.42 }));
    const h1 = layer(8, X0 + xGap, 12, 4.2, 'hid', 0.3, () => ({ color: new THREE.Color(0xb8b9e6), r: 0.3 }));
    const h2 = layer(6, X0 + xGap * 2, 9, 3.4, 'hid', 1.1, () => ({ color: new THREE.Color(0xb8b9e6), r: 0.3 }));
    const outs = JOBS.map((j, i) => {
        const n = { kind: 'out', i, job: j, pos: new THREE.Vector3(X1, [4.6, -1.8, -6.8][i] * spread * yScale, (j.main ? 1.6 : -1.2) * curl), color: new THREE.Color(0xfff3dc), r: j.main ? 0.85 : 0.5 };
        nodes.push(n); return n;
    });
    const link = (a, b) => { const e = { a, b, i: edges.length }; edges.push(e); return e; };
    inputs.forEach(n => { n.out = h1.map(h => ({ h, d: h.pos.distanceTo(n.pos) })).sort((p, q) => p.d - q.d).slice(0, 3).map(o => link(n, o.h)); });
    h1.forEach(n => { n.out = h2.map(h => link(n, h)); });
    h2.forEach(n => { n.out = outs.map(o => link(n, o)); });
    return { nodes, edges, inputs, h1, h2, outs };
}

export function network(n, layout, { nodeShare = 0.38, seed = 11 } = {}) {
    const parts = [];
    const sumR2 = layout.nodes.reduce((s, nd) => s + nd.r * nd.r, 0);
    layout.nodes.forEach(nd => {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(nd.r, 12, 8));
        mesh.position.copy(nd.pos);
        parts.push({ mesh, color: nd.color, size: nd.kind === 'out' ? 1.0 : 0.85, share: nodeShare * nd.r * nd.r / sumR2, jitter: 0.08 });
    });
    const synColor = new THREE.Color(0x7d80b8);
    parts.push({
        segments: layout.edges.map(e => [e.a.pos, e.b.pos]),
        color: synColor, size: 0.7, share: 1 - nodeShare, pulse: true, jitter: 0.12,
        colorAt: (p, k) => layout.edges[k].a.kind === 'in' ? layout.edges[k].a.color.clone().lerp(synColor, 0.55) : synColor
    });
    return build(n, parts, seed);
}
