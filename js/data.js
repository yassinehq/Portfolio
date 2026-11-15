/* Données du portfolio : projets, métiers visés, compétences et leurs poids. */

export const PROJECTS = [
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
    },
    {
        id: 'ml',
        title: 'Projets machine learning',
        kind: 'Data science',
        desc: "Classification et régression avec scikit-learn : Iris, Breast Cancer, California Housing.",
        intro: "Mes projets d'apprentissage en machine learning : préparer les données, entraîner des modèles, les évaluer et comprendre ce qu'ils apprennent.",
        cover: null,
        gallery: [],
        points: [
            "Classification : Iris et Breast Cancer (régression logistique, k plus proches voisins, forêts aléatoires)",
            "Régression : California Housing (régression linéaire, arbres, validation croisée)",
            "Préparation des données avec pandas, évaluation avec les métriques de scikit-learn"
        ],
        soon: "Dépôt GitHub en cours de publication.",
        tags: ['Python', 'scikit-learn'],
        links: []
    }
];

/* ---------------------------------------------------------
   2. Compétences : chacune mène aux métiers visés
      (poids = à quel point elle sert ce métier, de 0 à 1)
   --------------------------------------------------------- */
export const JOBS = [
    { id: 'ds', label: 'Data scientist', note: 'mon objectif', main: true },
    { id: 'de', label: 'Data engineer',  note: 'mon objectif', main: true },
    { id: 'da', label: 'Data analyst',   note: 'aussi possible' }
];
export const GROUPS = { data: 'Data', ml: 'Machine learning', dev: 'Développement', tool: 'Outils' };
export const SKILLS = [
    { id: 'python',  label: 'Python',         g: 'data', w: { ds: 1, de: .9, da: .9 },  p: ['ml'] },
    { id: 'sql',     label: 'SQL',            g: 'data', w: { ds: .7, de: 1, da: 1 },   p: ['stage'] },
    { id: 'powerbi', label: 'Power BI',       g: 'data', w: { ds: .2, de: .2, da: 1 },  p: ['ferrari'] },
    { id: 'dax',     label: 'DAX',            g: 'data', w: { ds: .1, de: .1, da: .9 }, p: ['ferrari'] },
    { id: 'excel',   label: 'Excel',          g: 'data', w: { ds: .3, de: .1, da: .8 }, p: ['ferrari'] },
    { id: 'sklearn', label: 'scikit-learn',   g: 'ml',   w: { ds: 1, de: .2, da: .5 },  p: ['ml'] },
    { id: 'mysql',   label: 'MySQL',          g: 'dev',  w: { ds: .4, de: .8, da: .6 }, p: ['stage'] },
    { id: 'php',     label: 'PHP',            g: 'dev',  w: { ds: .1, de: .4, da: .1 }, p: ['stage'] },
    { id: 'js',      label: 'JavaScript',     g: 'dev',  w: { ds: .1, de: .3, da: .2 }, p: ['calc', 'portfolio'] },
    { id: 'git',     label: 'Git',            g: 'tool', w: { ds: .7, de: .9, da: .5 }, p: ['calc'] },
    { id: 'docker',  label: 'Docker',         g: 'tool', w: { ds: .3, de: 1, da: .2 },  p: ['stage'] }
];
export const GROUP_HEX = { data: 0xf4b76f, ml: 0xe891bd, dev: 0x93a6ff, tool: 0x7fd3c0 };
