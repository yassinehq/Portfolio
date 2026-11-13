/* =========================================================
   Portfolio — Yassine Mahjoubi
   Un réseau de neurones 3D : mes compétences (entrées)
   mènent au métier que je vise (sortie).
   ========================================================= */
import * as THREE from 'three';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------------------------------------------------------
   1. Projets
   --------------------------------------------------------- */
const PROJECTS = [
    {
        id: 'f1',
        title: 'F1 Data Pipeline',
        kind: 'Data engineering',
        desc: "Les données de chaque Grand Prix collectées, nettoyées et publiées automatiquement.",
        intro: "Projet data de bout en bout : chaque lundi, le pipeline récupère le dernier Grand Prix, le nettoie, le stocke et met à jour un dashboard en ligne.",
        cover: 'img/f1-pipeline.webp',
        gallery: [['img/f1-pipeline.webp', 'Dashboard F1 Data Pipeline']],
        points: [
            "Collecte via FastF1 : résultats, chaque tour de chaque pilote, pneus et arrêts aux stands",
            "Nettoyage : détection des tours faussés (stands, Safety Car, VSC) et reconstruction des relais de pneus",
            "Stockage DuckDB avec un chargement incrémental et idempotent, sans aucun doublon",
            "Contrôles qualité testés avec pytest, automatisation complète via GitHub Actions",
            "Dashboard Streamlit : classement cumulé, rythme de course, stratégies pneus, duel entre pilotes"
        ],
        tags: ['Python', 'SQL', 'DuckDB', 'Streamlit', 'GitHub Actions'],
        links: [
            ['Voir la démo live', 'https://yaseen-f1-data.streamlit.app'],
            ['Voir le code', 'https://github.com/yassinehq/f1-data-pipeline']
        ]
    },
    {
        id: 'ferrari',
        title: 'Ferrari, Executive Performance',
        kind: 'Business intelligence',
        desc: "Dashboard Power BI sur les performances financières, commerciales et géographiques de Ferrari, 2023 à 2025.",
        intro: "Analyse de la performance financière et commerciale de Ferrari sur 2023-2025, construite à partir des rapports annuels publiés par le groupe.",
        cover: 'img/ferrari-1.webp',
        gallery: [
            ['img/ferrari-1.webp', "Vue d'ensemble exécutive"],
            ['img/ferrari-2.webp', 'Ventes et géographie'],
            ['img/ferrari-3.webp', 'Performance financière']
        ],
        points: [
            "Vue exécutive : chiffre d'affaires, bénéfice net, free cash-flow, EBITDA, EBIT, livraisons",
            "Ventes par zone : EMEA, Amériques, Chine/Hong Kong/Taïwan, reste de l'Asie-Pacifique",
            "Suivi de la croissance du CA, des marges opérationnelles et de la génération de cash",
            "Mesures DAX pour les marges, les variations et la valeur par véhicule"
        ],
        note: "Source des données : rapports annuels et documents financiers de Ferrari N.V.",
        tags: ['Power BI', 'DAX', 'Excel'],
        links: [['Documents financiers de Ferrari', 'https://www.ferrari.com/en-EN/corporate/financial-documents']]
    },
    {
        id: 'stage',
        title: 'Gestion interne, Très Union',
        kind: 'Stage, application web',
        desc: "Application de gestion pour un organisme éducatif : fiches élèves, feuilles de présence, sessions et intervenants.",
        intro: "Application interne développée en stage pour digitaliser la gestion administrative d'un organisme éducatif.",
        cover: 'img/stage-seances.webp',
        gallery: [
            ['img/stage-seances.webp', 'Gestion des séances'],
            ['img/stage-eleves.webp', 'Liste des élèves (floutée)'],
            ['img/stage-intervenants.webp', 'Gestion des intervenants']
        ],
        points: [
            "Fiches élèves consultables et modifiables via des fenêtres dynamiques",
            "Feuilles de présence générées automatiquement en Word, regroupées par classe",
            "Gestion des sessions de formation et des intervenants",
            "Export des déclarations d'heures des intervenants",
            "Migration des données existantes depuis Access vers MySQL"
        ],
        note: "Développé dans un cadre professionnel : le site n'est pas public et les données personnelles des captures sont floutées.",
        tags: ['PHP', 'MySQL', 'Docker'],
        links: []
    },
    {
        id: 'portfolio',
        title: 'Portfolio, première version',
        kind: 'Web, cloud',
        desc: "Mon premier site personnel, déployé sur Azure avec Azure DevOps.",
        intro: "La première version de mon portfolio, hébergée sur Azure et déployée avec Azure DevOps.",
        cover: 'img/portfolio-v1.webp',
        gallery: [['img/portfolio-v1.webp', 'Première version du portfolio']],
        points: [
            "Site statique en HTML, CSS et JavaScript",
            "Déploiement sur Azure App Service via Azure DevOps"
        ],
        tags: ['HTML', 'CSS', 'JavaScript', 'Azure', 'Azure DevOps'],
        links: [['Voir le site', 'https://yaseen.azurewebsites.net/']]
    },
    {
        id: 'calc',
        title: 'Calculatrice',
        kind: 'Web',
        desc: "Application interactive développée en JavaScript pur.",
        intro: "Une calculatrice interactive écrite en JavaScript, sans librairie.",
        cover: 'img/calculatrice.webp',
        gallery: [['img/calculatrice.webp', 'Calculatrice']],
        points: [
            "Interface en HTML et CSS, logique de calcul en JavaScript pur",
            "Versionnée avec Git et publiée sur GitHub Pages"
        ],
        tags: ['HTML', 'CSS', 'JavaScript', 'Git'],
        links: [['Ouvrir la calculatrice', 'https://yassinehq.github.io/calculator/']]
    }
];

/* ---------------------------------------------------------
   2. Compétences : chacune mène aux métiers visés
      (poids = à quel point elle sert ce métier, de 0 à 1)
   --------------------------------------------------------- */
const JOBS = [
    { id: 'ds', label: 'Data scientist', note: 'mon objectif', main: true },
    { id: 'de', label: 'Data engineer',  note: 'mon objectif', main: true },
    { id: 'da', label: 'Data analyst',   note: 'aussi possible' }
];
const GROUPS = { data: 'Data', ml: 'Machine learning', dev: 'Développement', tool: 'Outils' };
const SKILLS = [
    { id: 'python',  label: 'Python',         g: 'data', w: { ds: 1, de: .9, da: .9 },  p: ['f1'] },
    { id: 'sql',     label: 'SQL',            g: 'data', w: { ds: .7, de: 1, da: 1 },   p: ['f1', 'stage'] },
    { id: 'duckdb',  label: 'DuckDB',         g: 'data', w: { ds: .5, de: 1, da: .5 },  p: ['f1'] },
    { id: 'powerbi', label: 'Power BI',       g: 'data', w: { ds: .2, de: .2, da: 1 },  p: ['ferrari'] },
    { id: 'dax',     label: 'DAX',            g: 'data', w: { ds: .1, de: .1, da: .9 }, p: ['ferrari'] },
    { id: 'excel',   label: 'Excel',          g: 'data', w: { ds: .3, de: .1, da: .8 }, p: ['ferrari'] },
    { id: 'streamlit', label: 'Streamlit',    g: 'data', w: { ds: .7, de: .4, da: .7 }, p: ['f1'] },
    { id: 'sklearn', label: 'scikit-learn',   g: 'ml',   w: { ds: 1, de: .2, da: .5 },  p: [], extra: "mes projets d'apprentissage (Iris, Breast Cancer, California Housing)" },
    { id: 'mysql',   label: 'MySQL',          g: 'dev',  w: { ds: .4, de: .8, da: .6 }, p: ['stage'] },
    { id: 'php',     label: 'PHP',            g: 'dev',  w: { ds: .1, de: .4, da: .1 }, p: ['stage'] },
    { id: 'js',      label: 'JavaScript',     g: 'dev',  w: { ds: .1, de: .3, da: .2 }, p: ['calc', 'portfolio'] },
    { id: 'git',     label: 'Git',            g: 'tool', w: { ds: .7, de: .9, da: .5 }, p: ['f1', 'calc'] },
    { id: 'actions', label: 'GitHub Actions', g: 'tool', w: { ds: .3, de: 1, da: .2 },  p: ['f1'] },
    { id: 'docker',  label: 'Docker',         g: 'tool', w: { ds: .3, de: 1, da: .2 },  p: ['stage'] }
];
const GROUP_HEX = { data: 0xf4b76f, ml: 0xe891bd, dev: 0x93a6ff, tool: 0x7fd3c0 };

/* ---------------------------------------------------------
   3. Le réseau 3D
   --------------------------------------------------------- */
const brain = (() => {
    const box = document.getElementById('stage');
    const brainEl = document.getElementById('brain');
    const canvas = document.getElementById('net');
    const labelsEl = document.getElementById('labels');
    const info = document.getElementById('info');
    const infoDefault = info.innerHTML;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
        document.documentElement.classList.add('no-webgl');
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    const root = new THREE.Group();
    scene.add(root);

    /* ---- Disposition : 4 couches de gauche à droite ---- */
    const nodes = [];
    const inputs = SKILLS.map((s, i) => {
        const t = i / (SKILLS.length - 1) - 0.5;        // -0.5 → 0.5
        const y = -t * 15;
        const z = Math.cos(t * Math.PI) * 2.2 - 1.2;    // légère courbe vers l'avant
        const n = { kind: 'in', skill: s, pos: new THREE.Vector3(-10.5 + Math.abs(t) * 1.6, y, z), color: new THREE.Color(GROUP_HEX[s.g]), size: 1.15 };
        nodes.push(n); return n;
    });
    const hidden = (count, x, spread, seed) => Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        const n = {
            kind: 'hid',
            pos: new THREE.Vector3(x, -t * spread, Math.sin(i * 1.7 + seed) * 2.4),
            color: new THREE.Color(0xb8b9e6), size: 0.8
        };
        nodes.push(n); return n;
    });
    const h1 = hidden(8, -3.6, 12, 0.3);
    const h2 = hidden(6, 2.6, 9, 1.1);
    const outs = JOBS.map((j, i) => {
        // les deux métiers visés en grand, le data analyst plus bas et plus petit
        const y = [4.2, -2.4, -7.2][i];
        const n = { kind: 'out', job: j, pos: new THREE.Vector3(9.2, y, j.main ? 1.2 : -0.4), color: new THREE.Color(0xfff3dc), size: j.main ? 2.4 : 1.3 };
        nodes.push(n); return n;
    });

    /* ---- Connexions ---- */
    const edges = [];
    const link = (a, b, w = 1) => { const e = { a, b, w, glow: 0, color: new THREE.Color(0xb8b9e6) }; edges.push(e); return e; };
    // chaque compétence alimente les 3 neurones cachés les plus proches
    inputs.forEach(n => {
        n.out = h1.map(h => ({ h, d: h.pos.distanceTo(n.pos) })).sort((a, b) => a.d - b.d).slice(0, 3).map(o => link(n, o.h));
    });
    h1.forEach(n => { n.out = h2.map(h => link(n, h)); });
    h2.forEach(n => { n.out = outs.map(o => link(n, o)); });

    /* ---- Chemin d'une compétence jusqu'aux métiers ---- */
    function pathOf(inNode) {
        const set = new Set();
        for (const e1 of inNode.out) {
            set.add(e1);
            for (const e2 of e1.b.out) {
                set.add(e2);
                for (const e3 of e2.b.out) set.add(e3);
            }
        }
        return set;
    }

    /* ---- Géométries ---- */
    const N = nodes.length;
    const nPos = new Float32Array(N * 3), nCol = new Float32Array(N * 3), nSize = new Float32Array(N), nGlow = new Float32Array(N);
    nodes.forEach((n, i) => {
        n.base = n.pos.clone();
        nSize[i] = n.size;
        n.glow = 0; n.dim = 0;
    });
    const nGeo = new THREE.BufferGeometry();
    nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
    nGeo.setAttribute('aColor', new THREE.BufferAttribute(nCol, 3));
    nGeo.setAttribute('aSize', new THREE.BufferAttribute(nSize, 1));
    nGeo.setAttribute('aGlow', new THREE.BufferAttribute(nGlow, 1));
    const uniforms = { uPR: { value: 1 }, uScale: { value: 1 } };
    const nMat = new THREE.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`
            attribute vec3 aColor; attribute float aSize; attribute float aGlow;
            uniform float uPR; uniform float uScale;
            varying vec3 vColor; varying float vGlow;
            void main() {
                vColor = aColor; vGlow = aGlow;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = aSize * (11.0 + aGlow * 5.0) * uPR * uScale;
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */`
            varying vec3 vColor; varying float vGlow;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float disc = smoothstep(0.24, 0.20, d);
                float halo = smoothstep(0.5, 0.2, d) * (0.10 + vGlow * 0.35);
                vec3 c = mix(vColor, vec3(1.0), disc * 0.15 * vGlow);
                gl_FragColor = vec4(c, max(disc * 0.95, halo));
            }`
    });
    const points = new THREE.Points(nGeo, nMat);
    points.renderOrder = 2;
    root.add(points);

    const E = edges.length;
    const ePos = new Float32Array(E * 6), eCol = new Float32Array(E * 8);
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    eGeo.setAttribute('color', new THREE.BufferAttribute(eCol, 4));
    const lines = new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }));
    root.add(lines);

    /* ---- Impulsions : de petites lueurs qui vont des compétences aux métiers ---- */
    const MAXP = 60;
    const pulses = [];
    const pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3), pSize = new Float32Array(MAXP), pGlow = new Float32Array(MAXP);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));
    pGeo.setAttribute('aGlow', new THREE.BufferAttribute(pGlow, 1));
    const pPoints = new THREE.Points(pGeo, nMat);
    pPoints.renderOrder = 3;
    root.add(pPoints);

    function spawnPulse(inNode) {
        if (pulses.length >= MAXP) return;
        // chemin pondéré : on choisit le métier selon le poids de la compétence
        const w = inNode.skill.w;
        let r = Math.random() * JOBS.reduce((s, j) => s + w[j.id], 0);
        let target = outs[outs.length - 1];
        for (const o of outs) { r -= w[o.job.id]; if (r <= 0) { target = o; break; } }
        const e1 = inNode.out[Math.floor(Math.random() * inNode.out.length)];
        const e2 = e1.b.out[Math.floor(Math.random() * e1.b.out.length)];
        const e3 = e2.b.out.find(e => e.b === target);
        pulses.push({ hops: [e1, e2, e3], k: 0, t: 0, color: inNode.color, speed: 0.9 + Math.random() * 0.4 });
    }

    /* ---- Étiquettes HTML (texte net et lisible) ---- */
    const labelFor = (n, html, cls) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lbl ' + cls;
        b.innerHTML = html;
        labelsEl.appendChild(b);
        n.el = b;
        return b;
    };
    inputs.forEach(n => {
        const b = labelFor(n, n.skill.label, 'in');
        b.dataset.g = n.skill.g;
        b.setAttribute('aria-label', `${n.skill.label}, ${GROUPS[n.skill.g]}`);
        b.addEventListener('mouseenter', () => setActive(n));
        b.addEventListener('focus', () => setActive(n, true));
        b.addEventListener('click', () => setActive(n, true));
    });
    outs.forEach(n => {
        const b = labelFor(n, `${n.job.label}<small>${n.job.note}</small>`, 'out' + (n.job.main ? ' main' : ''));
        b.tabIndex = -1;
        b.addEventListener('click', () => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }));
    });

    /* ---- Sélection d'une compétence ---- */
    let active = null, locked = false, activePath = new Set();
    function setActive(n, lock = false) {
        if (n === active && !lock) return;
        active = n; locked = lock && !!n;
        activePath = n ? pathOf(n) : new Set();
        inputs.forEach(m => {
            m.el.classList.toggle('on', m === n);
            m.el.classList.toggle('dim', !!n && m !== n);
        });
        outs.forEach(o => o.el.classList.toggle('lit', !!n && n.skill.w[o.job.id] >= 0.7));
        if (!n) { info.innerHTML = infoDefault; return; }

        const s = n.skill;
        const projects = s.p.map(id => PROJECTS.find(p => p.id === id)).filter(Boolean);
        const used = projects.length
            ? `Utilisé dans <strong>${projects.map(p => p.title).join('</strong>, <strong>')}</strong>`
            : `Utilisé dans ${s.extra}`;
        info.innerHTML = `
            <h3>${s.label}</h3>
            <div class="bars">
                ${JOBS.map(j => `<span>${j.label}</span><span class="bar"><span style="width:${Math.round(s.w[j.id] * 100)}%"></span></span>`).join('')}
            </div>
            <p class="used">${used}.</p>
            ${projects.length ? `<button type="button" class="pill small" data-skill="${s.id}">Voir ces projets</button>` : ''}`;
        // une vague de lueurs part de la compétence
        for (let i = 0; i < 4; i++) setTimeout(() => spawnPulse(n), i * 140);
    }
    info.addEventListener('click', e => {
        const b = e.target.closest('[data-skill]');
        if (b) filterProjects(SKILLS.find(s => s.id === b.dataset.skill));
    });

    /* ---- Survol / toucher directement sur le canvas ---- */
    const tmp = new THREE.Vector3();
    function project(n) {
        tmp.copy(n.pos).applyMatrix4(root.matrixWorld).project(camera);
        return { x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H, z: tmp.z };
    }
    function pick(clientX, clientY) {
        const r = box.getBoundingClientRect();
        const x = clientX - r.left, y = clientY - r.top;
        let best = null, bd = 28;
        for (const n of inputs) {
            const s = project(n);
            const d = Math.hypot(s.x - x, s.y - y);
            if (d < bd) { bd = d; best = n; }
        }
        return best;
    }

    /* ---- Rotation à la souris / au doigt ---- */
    const rot = { x: 0, y: 0, tx: 0, ty: 0 };
    let drag = null, moved = false;
    canvas.addEventListener('pointerdown', e => {
        drag = { x: e.clientX, y: e.clientY, rx: rot.tx, ry: rot.ty, id: e.pointerId };
        moved = false;
    });
    addEventListener('pointermove', e => {
        if (drag && e.pointerId === drag.id) {
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            if (Math.abs(dx) + Math.abs(dy) > 4) {
                moved = true;
                brainEl.classList.add('dragging');
                if (e.pointerType !== 'touch' || Math.abs(dx) > Math.abs(dy)) {
                    rot.ty = clamp(drag.ry + dx * 0.006, -0.75, 0.75);
                    rot.tx = clamp(drag.rx + dy * 0.004, -0.35, 0.35);
                }
            }
            return;
        }
        if (e.target === canvas && !locked) {
            const n = pick(e.clientX, e.clientY);
            if (n) setActive(n);
        }
    }, { passive: true });
    addEventListener('pointerup', e => {
        if (drag && !moved && e.target === canvas) {
            const n = pick(e.clientX, e.clientY);
            setActive(n, !!n);
        }
        drag = null;
        brainEl.classList.remove('dragging');
    });

    /* ---- Mise en page : le réseau remplit la scène, étiquettes comprises ---- */
    let W = 1, H = 1, narrow = false;
    const X0 = -10.5, X1 = 9.2;                  // étendue horizontale du réseau
    const fovK = () => 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    function applyLayout(yScale) {
        nodes.forEach((n, i) => {
            n.pos.set(n.base.x, n.base.y * yScale, n.base.z);
            nPos.set([n.pos.x, n.pos.y, n.pos.z], i * 3);
        });
        edges.forEach((e, i) => ePos.set([e.a.pos.x, e.a.pos.y, e.a.pos.z, e.b.pos.x, e.b.pos.y, e.b.pos.z], i * 6));
        nGeo.attributes.position.needsUpdate = true;
        eGeo.attributes.position.needsUpdate = true;
    }
    function resize() {
        const r = box.getBoundingClientRect();
        W = Math.max(1, r.width); H = Math.max(1, r.height);
        narrow = W < 640;
        const PR = Math.min(devicePixelRatio || 1, 2);
        renderer?.setPixelRatio(PR);
        renderer?.setSize(W, H, false);
        uniforms.uPR.value = PR;
        camera.aspect = W / H;

        // place prise par les étiquettes à gauche et à droite
        const L = Math.max(...inputs.map(n => n.el.offsetWidth)) + 24;
        // sur écran étroit, les métiers s'affichent sous leur nœud : il faut moins de place à droite
        const R = narrow ? Math.max(...outs.map(n => n.el.offsetWidth)) / 2 + 12 : Math.max(...outs.map(n => n.el.offsetWidth)) + 40;
        const ppu = Math.max(3, (W - L - R) / (X1 - X0));      // pixels par unité
        const visW = W / ppu, visH = H / ppu;
        let dist = visW / (fovK() * camera.aspect);
        // on étire le réseau en hauteur pour remplir la scène (utile sur mobile)
        let yScale = Math.min(narrow ? 3.4 : 2.6, (visH * 0.86) / 15.5);
        if (yScale < 1) { yScale = 1; dist = (15.5 / 0.86) / fovK(); }
        applyLayout(yScale);
        const ppuReal = W / (dist * fovK() * camera.aspect);
        camera.position.set(X0 - L / ppuReal + (dist * fovK() * camera.aspect) / 2, 0, dist);
        uniforms.uScale.value = Math.min(1.25, Math.max(0.7, ppuReal / 34));
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(box);
    document.fonts?.ready.then(resize);
    resize();

    /* ---- Boucle (en pause quand le hero n'est pas visible) ---- */
    let visible = true, last = performance.now(), spawnT = 0;
    new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        if (visible) { last = performance.now(); requestAnimationFrame(loop); }
    }).observe(box);

    const dimColor = new THREE.Color(0x8d8fc4);
    function loop(now) {
        if (!visible) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const t = now / 1000;

        // rotation : légère oscillation au repos + celle choisie par la personne
        const sway = reduceMotion ? 0 : Math.sin(t * 0.25) * 0.12;
        rot.y += (rot.ty + sway - 0.18 - rot.y) * Math.min(1, dt * 4);
        rot.x += (rot.tx + 0.06 - rot.x) * Math.min(1, dt * 4);
        if (!drag) { rot.ty *= Math.exp(-dt * 0.25); rot.tx *= Math.exp(-dt * 0.25); }
        root.rotation.set(rot.x, rot.y, 0);
        root.updateMatrixWorld();

        // lueurs spontanées, plus fréquentes depuis la compétence active
        if (!reduceMotion && renderer) {
            spawnT -= dt;
            if (spawnT <= 0) {
                spawnT = active ? 0.35 : 0.7;
                spawnPulse(active || inputs[Math.floor(Math.random() * inputs.length)]);
            }
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            const e = p.hops[p.k];
            p.t += dt * p.speed * 6 / e.a.pos.distanceTo(e.b.pos);
            if (p.t >= 1) {
                e.glow = 1;
                e.b.glow = Math.min(1, e.b.glow + 0.6);
                p.k++; p.t = 0;
                if (p.k >= p.hops.length) pulses.splice(i, 1);
            }
        }

        // nœuds
        nodes.forEach((n, i) => {
            n.glow *= Math.exp(-dt * 2.5);
            let target = 0;
            if (active) {
                if (n === active) target = 1;
                else if (n.kind === 'out') target = active.skill.w[n.job.id] * 0.9;
                else if (n.kind === 'in') target = -1;
            }
            n.dim += (target - n.dim) * Math.min(1, dt * 6);
            const g = Math.max(n.glow, Math.max(0, n.dim));
            nGlow[i] = g;
            const c = tmpC.copy(n.color);
            if (n.dim < 0) c.lerp(dimColor, -n.dim * 0.7);
            nCol[i * 3] = c.r; nCol[i * 3 + 1] = c.g; nCol[i * 3 + 2] = c.b;
        });
        nGeo.attributes.aColor.needsUpdate = true;
        nGeo.attributes.aGlow.needsUpdate = true;

        // connexions : discrètes au repos, colorées sur le chemin actif
        edges.forEach((e, i) => {
            e.glow *= Math.exp(-dt * 2);
            const on = activePath.has(e);
            const c = on ? active.color : e.color;
            const a = on ? 0.55 : (active ? 0.05 : 0.11) + e.glow * 0.3;
            for (let k = 0; k < 2; k++) {
                const o = i * 8 + k * 4;
                eCol[o] = c.r; eCol[o + 1] = c.g; eCol[o + 2] = c.b; eCol[o + 3] = a;
            }
        });
        eGeo.attributes.color.needsUpdate = true;

        // impulsions
        for (let i = 0; i < MAXP; i++) {
            const p = pulses[i];
            if (!p) { pSize[i] = 0; continue; }
            const e = p.hops[p.k];
            tmp.lerpVectors(e.a.pos, e.b.pos, p.t);
            pPos.set([tmp.x, tmp.y, tmp.z], i * 3);
            pCol.set([p.color.r, p.color.g, p.color.b], i * 3);
            pSize[i] = 0.45; pGlow[i] = 1;
        }
        pGeo.attributes.position.needsUpdate = true;
        pGeo.attributes.aColor.needsUpdate = true;
        pGeo.attributes.aSize.needsUpdate = true;
        pGeo.attributes.aGlow.needsUpdate = true;

        // étiquettes : suivent leur nœud
        for (const n of inputs.concat(outs)) {
            const s = project(n);
            const el = n.el;
            const w = el.offsetWidth, h = el.offsetHeight;
            const gap = n.kind === 'out' ? (n.job.main ? 26 : 18) : 14;
            let x, y = s.y - h / 2;
            if (n.kind === 'in') x = s.x - w - gap;
            else if (narrow) { x = clamp(s.x - w / 2, 4, W - w - 4); y = s.y + 12; }
            else x = s.x + gap;
            el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        }

        renderer?.render(scene, camera);
        requestAnimationFrame(loop);
    }
    const tmpC = new THREE.Color();
    requestAnimationFrame(loop);

    return { setActive };
})();

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
/* ---------------------------------------------------------
   4. Liste des projets, filtre par compétence, fiche
   --------------------------------------------------------- */
const list = document.getElementById('projectList');
const preview = document.getElementById('preview');
const previewImg = preview.querySelector('img');
const filterBar = document.getElementById('filter');

PROJECTS.forEach(p => {
    const li = document.createElement('li');
    li.className = 'project-row';
    li.dataset.id = p.id;
    li.innerHTML = `
        <button type="button" aria-haspopup="dialog">
            <span class="p-title">${p.title}</span>
            <span class="p-desc">${p.desc}<span class="p-skills">${p.tags.map(t => `<span>${t}</span>`).join('')}</span></span>
            <span class="p-kind">${p.kind}</span>
        </button>`;
    const btn = li.querySelector('button');
    btn.addEventListener('click', () => openSheet(p, btn));
    if (finePointer) {
        btn.addEventListener('mouseenter', () => { previewImg.src = p.cover; preview.classList.add('on'); });
        btn.addEventListener('mouseleave', () => preview.classList.remove('on'));
    }
    list.appendChild(li);
});

function filterProjects(skill) {
    document.getElementById('filterName').textContent = skill.label;
    filterBar.hidden = false;
    list.querySelectorAll('.project-row').forEach(r => r.classList.toggle('off', !skill.p.includes(r.dataset.id)));
    document.getElementById('projets').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}
document.getElementById('filterReset').addEventListener('click', () => {
    filterBar.hidden = true;
    list.querySelectorAll('.project-row').forEach(r => r.classList.remove('off'));
});

// l'aperçu suit le curseur
addEventListener('scroll', () => preview.classList.remove('on'), { passive: true });
if (finePointer) {
    let px = 0, py = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = e.clientX + 160; ty = e.clientY; }, { passive: true });
    (function follow() {
        px += (tx - px) * 0.18; py += (ty - py) * 0.18;
        preview.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
        requestAnimationFrame(follow);
    })();
}

const sheet = document.getElementById('sheet');
const panel = sheet.querySelector('.sheet-panel');
let lastFocus = null;

function openSheet(p, opener) {
    lastFocus = opener;
    document.getElementById('sheetKind').textContent = p.kind;
    document.getElementById('sheetTitle').textContent = p.title;
    document.getElementById('sheetIntro').textContent = p.intro;
    document.getElementById('sheetNote').textContent = p.note || '';
    document.getElementById('sheetGallery').innerHTML = p.gallery
        .map(([src, alt]) => `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${alt}" loading="lazy"></a>`).join('');
    document.getElementById('sheetPoints').innerHTML = p.points.map(t => `<li>${t}</li>`).join('');
    document.getElementById('sheetTags').innerHTML = p.tags.map(t => `<span>${t}</span>`).join('');
    document.getElementById('sheetLinks').innerHTML = p.links
        .map(([label, href]) => `<a class="pill" href="${href}" target="_blank" rel="noopener">${label}</a>`).join('');
    preview.classList.remove('on');
    sheet.hidden = false;
    document.body.classList.add('locked');
    panel.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
    panel.focus({ preventScroll: true });
}
function closeSheet() {
    sheet.classList.remove('open');
    document.body.classList.remove('locked');
    setTimeout(() => { sheet.hidden = true; }, 600);
    lastFocus?.focus({ preventScroll: true });
}
sheet.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
addEventListener('keydown', e => {
    if (sheet.hidden) return;
    if (e.key === 'Escape') closeSheet();
    if (e.key === 'Tab') {
        const f = [...panel.querySelectorAll('a, button')];
        if (!f.length) return;
        const first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
});

/* ---------------------------------------------------------
   5. Salutations multilingues (repris de l'ancienne version)
   --------------------------------------------------------- */
(function greetings() {
    const el = document.getElementById('greeting');
    const words = [
        'Bonjour, je suis Yassine.',
        "Hello, I'm Yassine.",
        '¡Hola! Soy Yassine.',
        'مرحبا، أنا ياسين.',
        'Ciao, sono Yassine.',
        'Hallo, ich bin Yassine.',
        'こんにちは、ヤシンです。',
        '안녕하세요, 야신입니다.'
    ];
    if (reduceMotion) return;
    let i = 0;
    setInterval(() => {
        el.classList.add('swap');
        setTimeout(() => {
            i = (i + 1) % words.length;
            el.textContent = words[i];
            el.dir = /[؀-ۿ]/.test(words[i]) ? 'rtl' : 'ltr';
            el.classList.remove('swap');
        }, 500);
    }, 3200);
})();
