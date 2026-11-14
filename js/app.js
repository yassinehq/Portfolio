/* =========================================================
   Interface : compétences (fiche avec barres), liste des projets,
   filtre par compétence, fiche projet, salutations.
   Le nuage de particules est lancé par ./main.js.
   ========================================================= */
import './main.js';
import { PROJECTS, JOBS, GROUPS, SKILLS } from './data.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------------------------------------------------------
   1. Compétences : puces HTML + fiche (barres de pertinence, projets)
   --------------------------------------------------------- */
const info = document.getElementById('info');
const infoDefault = info.innerHTML;
const chips = document.getElementById('skillChips');
let activeSkill = null, lockedSkill = false;

/* rend la fiche d'une compétence dans un élément donné (hero et section compétences) */
export function renderSkillInfo(el, s) {
    const projects = s.p.map(id => PROJECTS.find(p => p.id === id)).filter(Boolean);
    const used = projects.length
        ? `Utilisé dans <strong>${projects.map(p => p.title).join('</strong>, <strong>')}</strong>`
        : s.extra ? `Utilisé dans ${s.extra}` : 'Pratiqué en formation et en autonomie';
    el.innerHTML = `
        <h3>${s.label}</h3>
        <div class="bars">
            ${JOBS.map(j => `<span>${j.label}</span><span class="bar"><span style="width:${Math.round(s.w[j.id] * 100)}%"></span></span>`).join('')}
        </div>
        <p class="used">${used}.</p>
        ${projects.length ? `<button type="button" class="pill small" data-skill="${s.id}">Voir ces projets</button>` : ''}`;
}
export function showSkill(s, lock = false) {
    activeSkill = s; lockedSkill = lock && !!s;
    chips.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('on', !!s && c.dataset.id === s.id);
        c.classList.toggle('dim', !!s && c.dataset.id !== s.id);
    });
    if (!s) { info.innerHTML = infoDefault; return; }
    renderSkillInfo(info, s);
}
Object.entries(GROUPS).forEach(([g, label]) => {
    const group = document.createElement('div');
    group.className = 'chip-group';
    group.innerHTML = `<h4 data-g="${g}">${label}</h4>`;
    SKILLS.filter(s => s.g === g).forEach(s => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.dataset.id = s.id; b.dataset.g = g; b.textContent = s.label;
        b.addEventListener('mouseenter', () => { if (!lockedSkill) showSkill(s); });
        b.addEventListener('focus', () => showSkill(s, true));
        b.addEventListener('click', () => showSkill(s, true));
        group.appendChild(b);
    });
    chips.appendChild(group);
});
info.addEventListener('click', e => {
    const b = e.target.closest('[data-skill]');
    if (b) filterProjects(SKILLS.find(s => s.id === b.dataset.skill));
});

/* ---------------------------------------------------------
   2. Liste des projets, filtre par compétence, fiche
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

export function filterProjects(skill) {
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
   3. Salutations multilingues
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
