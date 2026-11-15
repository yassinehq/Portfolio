/* =========================================================
   GLSL du nuage de particules.
   - sim*   : simulation GPGPU (vitesses puis positions), un texel = une particule
   - point* : rendu des particules (lecture de la texture de positions)
   ========================================================= */

export const quadVert = /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/* Pseudo-bruit léger pour la respiration (pas de texture nécessaire) */
const noise = /* glsl */`
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec3 breath(vec2 uv, float t) {
        float h = hash(uv), g = hash(uv + 7.3);
        return vec3(sin(t * 0.7 + h * 6.2832), cos(t * 0.55 + g * 6.2832), sin(t * 0.45 + (h + g) * 3.1416));
    }
`;

/* ---- Vitesses : ressort vers la cible + souris + respiration + amortissement ---- */
export const simVelFrag = /* glsl */`
    precision highp float;
    uniform sampler2D tPos, tVel, tTargetA, tTargetB;
    uniform float uMix, uTime, uDt, uSpring, uDamp, uBreath, uMouseRadius, uMouseForce, uBurst;
    uniform vec3 uMouse;
    varying vec2 vUv;
    ${noise}
    void main() {
        vec3 pos = texture2D(tPos, vUv).xyz;
        vec3 vel = texture2D(tVel, vUv).xyz;
        vec4 ta = texture2D(tTargetA, vUv), tb = texture2D(tTargetB, vUv);
        // chaque particule part avec un léger décalage : le morphing coule au lieu de sauter
        float h = hash(vUv * 3.1);
        float m = smoothstep(0.0, 1.0, clamp((uMix - h * 0.35) / 0.65, 0.0, 1.0));
        vec3 target = mix(ta.xyz, tb.xyz, m) + breath(vUv, uTime) * uBreath;

        vec3 acc = (target - pos) * uSpring;
        // la souris repousse dans un rayon, de plus en plus fort au centre
        vec3 d = pos - uMouse;
        float dist = length(d);
        float push = 1.0 - smoothstep(0.0, uMouseRadius, dist);
        acc += (dist > 1e-4 ? d / dist : vec3(0.0, 1.0, 0.0)) * push * push * uMouseForce;
        // dispersion globale (le « @ » du contact)
        vec3 bdir = pos + vec3(h - 0.5, hash(vUv + 1.7) - 0.5, hash(vUv + 4.2) - 0.5);
        acc += bdir / max(length(bdir), 1e-3) * uBurst;

        vel = (vel + acc * uDt) * pow(uDamp, uDt * 60.0);
        gl_FragColor = vec4(vel, 1.0);
    }
`;

/* ---- Positions : intégration ---- */
export const simPosFrag = /* glsl */`
    precision highp float;
    uniform sampler2D tPos, tVel;
    uniform float uDt;
    varying vec2 vUv;
    void main() {
        vec3 pos = texture2D(tPos, vUv).xyz;
        vec3 vel = texture2D(tVel, vUv).xyz;
        gl_FragColor = vec4(pos + vel * uDt, 1.0);
    }
`;

/* ---- Copie d'une texture (initialisation / passer l'intro) ---- */
export const copyFrag = /* glsl */`
    precision highp float;
    uniform sampler2D tSrc;
    varying vec2 vUv;
    void main() { gl_FragColor = vec4(texture2D(tSrc, vUv).xyz, 1.0); }
`;

/* ---- Rendu des particules ---- */
export const pointVert = /* glsl */`
    precision highp float;
    attribute vec2 ref;
    uniform sampler2D tPos, tVel, tColA, tColB, tSizeA, tSizeB, tAct;
    uniform float uMix, uTime, uPR, uSizeK, uFogNear, uFogFar, uPulse, uDim;
    uniform vec3 uActColor;
    varying vec3 vColor;
    varying float vAlpha, vGlow;
    void main() {
        vec3 pos = texture2D(tPos, ref).xyz;
        float speed = length(texture2D(tVel, ref).xyz);
        vec4 ca = texture2D(tColA, ref), cb = texture2D(tColB, ref);
        float size = mix(texture2D(tSizeA, ref).w, texture2D(tSizeB, ref).w, uMix);
        vColor = mix(ca.rgb, cb.rgb, uMix);

        // w de la couleur : -1 = rien ; >= 0 : synapse (partie entière = arête, fraction = position) ;
        // <= -2 : nœud (index = -w - 2). Sert aux impulsions et au chemin allumé au survol.
        float w = uMix < 0.5 ? ca.w : cb.w;
        float wave = 0.0, act = 0.0;
        if (w >= 0.0) {
            float t = fract(w);
            float phase = fract(uTime * 0.35 + fract(ref.x * 13.7 + ref.y * 7.9));
            wave = smoothstep(0.12, 0.0, abs(t - phase)) * uPulse;
            act = texture2D(tAct, vec2((floor(w) + 0.5) / 256.0, 0.5)).r;
        } else if (w <= -2.0) {
            act = texture2D(tAct, vec2((128.0 - w - 2.0 + 0.5) / 256.0, 0.5)).r;
        }
        // chemin actif : coloré et plus lumineux ; le reste s'estompe
        vColor = mix(vColor, uActColor, act * 0.75);
        vGlow = clamp(speed * 0.05, 0.0, 0.6) + wave + act * 0.5;
        vColor = mix(vColor, vec3(1.0, 0.97, 0.9), wave * 0.8);
        float dim = 1.0 - uDim * (1.0 - act) * 0.7;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        float depth = -mv.z;
        vAlpha = (1.0 - clamp((depth - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0)) * dim;
        gl_PointSize = max(1.0, size * uSizeK * uPR * (1.0 + wave * 0.8 + act * 0.35) / depth);
        gl_Position = projectionMatrix * mv;
    }
`;

export const pointFrag = /* glsl */`
    precision highp float;
    uniform float uFade;
    varying vec3 vColor;
    varying float vAlpha, vGlow;
    void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        // disque doux + halo discret : un faux glow, sans post-traitement
        float core = smoothstep(0.34, 0.1, d);
        float halo = smoothstep(0.5, 0.1, d) * (0.26 + vGlow * 0.5);
        float a = max(core, halo) * (0.35 + 0.65 * vAlpha) * uFade;
        gl_FragColor = vec4(vColor + vGlow * 0.35, a);
    }
`;
