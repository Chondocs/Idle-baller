/**
 * Buzzer Dynasty — jeu idle de basket (équipes et joueurs fictifs).
 *
 * Organisation du fichier :
 *   1. Configuration et textes      4. Ligue : matchs, saisons, Hall of Fame
 *   2. Données et utilitaires       5. Sauvegarde et chargement
 *   3. Joueurs et économie          6. Rendu, actions, boucle de jeu
 *
 * Aucune dépendance : script classique (pas de module) pour fonctionner aussi en file://.
 * Le dictionnaire de textes est dans i18n.js (chargé avant ce fichier).
 */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const SAVE_KEY = "buzzer-dynasty-v2",
    LANG_KEY = "buzzer-lang";
  const TICK = 18,
    G = 14,
    ROSTER_MAX = 8,
    HOF_TITLES = 6,
    HOF_RINGS = 3,
    HOF_PTS = 100000;
  const DEF_M = "Loire Pionniers",
    DEF_F = "Loire Pionnières";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lang = "fr";
  try {
    const l = localStorage.getItem(LANG_KEY);
    if (l === "fr" || l === "en") lang = l;
  } catch (e) {}

  /* ========== 1. Configuration et textes ========== */
  function ord(n) {
    if (lang === "fr") return n === 1 ? (S && S.fem ? "1re" : "1er") : n + "e";
    const m = n % 100;
    if (m >= 11 && m <= 13) return n + "th";
    return n + ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
  }
  const DICT = buildDict({ fmt, ord });
  function T(k, ...a) {
    let v = DICT[lang][k];
    if (v === undefined) v = DICT.fr[k];
    if (Array.isArray(v)) v = v[S && S.fem ? 1 : 0];
    return typeof v === "function" ? v(...a) : v;
  }

  /* ========== 2. Données et utilitaires ========== */
  const FIRST_M = [
    "Malo",
    "Théo",
    "Ibrahim",
    "Jonas",
    "Kenzo",
    "Lucas",
    "Matteo",
    "Noé",
    "Samir",
    "Tidiane",
    "Yanis",
    "Andrés",
    "Dario",
    "Emre",
    "Hugo",
    "Ilan",
    "Jules",
    "Karim",
    "Léandre",
    "Marek",
    "Nils",
    "Omar",
    "Paulo",
    "Rayan",
    "Silas",
    "Tomas",
    "Viktor",
    "Wassim",
    "Zacharie",
    "Amadou",
    "Bastien",
    "Cyril",
    "Dorian",
    "Elias",
    "Félix",
    "Gaspard",
    "Hakim",
    "Ivan",
    "Joaquim",
    "Kilian",
  ];
  const FIRST_F = [
    "Léa",
    "Emma",
    "Inès",
    "Camille",
    "Manon",
    "Jade",
    "Lina",
    "Maëlle",
    "Nora",
    "Sofia",
    "Anaïs",
    "Clara",
    "Fatou",
    "Ilona",
    "Jeanne",
    "Kenza",
    "Louane",
    "Maya",
    "Naomi",
    "Océane",
    "Prisca",
    "Rania",
    "Salomé",
    "Tess",
    "Yasmine",
    "Zoé",
    "Aïssatou",
    "Béatrice",
    "Chloé",
    "Daria",
    "Eva",
    "Fanny",
    "Gwen",
    "Hana",
    "Iris",
    "Julia",
    "Katia",
    "Laura",
    "Mia",
    "Nadia",
  ];
  const LAST = [
    "Marchetti",
    "Okafor",
    "Lemaire",
    "Duval",
    "Haddad",
    "Novak",
    "Sorel",
    "Vidal",
    "Kessler",
    "Diallo",
    "Brassac",
    "Moreau",
    "Lefèvre",
    "Varga",
    "Mbaye",
    "Roussel",
    "Ferrand",
    "Bellamy",
    "Ouedraogo",
    "Pasquier",
    "Ivanov",
    "Delmas",
    "Quintana",
    "Berthier",
    "Salvi",
    "Nguyen",
    "Kowalski",
    "Lacroix",
    "Mendes",
    "Aubry",
    "Fontaine",
    "Rosales",
    "Thibault",
    "Hamidi",
    "Perrin",
    "Estrada",
    "Lombard",
    "Gauthier",
    "Sylla",
    "Wójcik",
    "Cordier",
    "Barros",
    "Vasseur",
  ];
  const TEAMS_M = [
    "Vallombre Corbeaux",
    "Port-Sable Marées",
    "Haut-Brasier Forgerons",
    "Lacombe Hérons",
    "Mont-Cerf Rafales",
    "Saint-Orme Bisons",
    "Clairval Tonnerre",
  ];
  const TEAMS_F = [
    "Vallombre Corneilles",
    "Port-Sable Marées",
    "Haut-Brasier Forgeronnes",
    "Lacombe Aigrettes",
    "Mont-Cerf Rafales",
    "Saint-Orme Panthères",
    "Clairval Tempêtes",
  ];
  const UPG = [
    { id: "slots", base: 2500, g: 4.5, max: 3 },
    { id: "shoot", base: 25, g: 1.45 },
    { id: "coach", base: 80, g: 1.5 },
    { id: "arena", base: 150, g: 1.6 },
    { id: "train", base: 300, g: 1.7, max: 10 },
    { id: "form", base: 500, g: 1.75, max: 10 },
    { id: "scout", base: 400, g: 1.7, max: 15 },
    { id: "agent", base: 600, g: 1.8, max: 10 },
    { id: "recr", base: 800, g: 2.4, max: 5 },
    { id: "fans", base: 350, g: 1.65, max: 10 },
    { id: "mascot", base: 250, g: 1.6, max: 8 },
    { id: "reval", base: 2e6, g: 2 },
  ];
  const UPG0 = () => ({
    slots: 0,
    shoot: 0,
    coach: 0,
    arena: 0,
    train: 0,
    form: 0,
    scout: 0,
    agent: 0,
    recr: 0,
    fans: 0,
    mascot: 0,
    reval: 0,
  });
  const slotsMax = () => Math.min(ROSTER_MAX, 5 + S.upg.slots);
  const hofOpen = () => S.hofUnlocked || S.rings >= HOF_TITLES || S.legends.length > 0;
  const TURBO_SEASON = 4; // saison de chaque ère à partir de laquelle x10 est disponible
  const GOAT = { t: 100, l: 100, p: 1e11 };

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function gauss() {
    let u = 0,
      v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function fmt(n) {
    if (!isFinite(n)) return "0";
    const a = Math.abs(n),
      fr = lang === "fr",
      loc = fr ? "fr-FR" : "en-US";
    const u = fr
      ? [
          [1e12, " Bn"],
          [1e9, " Md"],
          [1e6, " M"],
          [1e3, " k"],
        ]
      : [
          [1e12, "T"],
          [1e9, "B"],
          [1e6, "M"],
          [1e3, "K"],
        ];
    for (const [v, s] of u)
      if (a >= v) return (n / v).toLocaleString(loc, { maximumFractionDigits: 2 }) + s;
    return n.toLocaleString(loc, { maximumFractionDigits: a < 10 ? 1 : 0 });
  }
  let _id = Date.now() + Math.floor(Math.random() * 1000);
  const uid = () => "p" + (_id++).toString(36);
  const nm = (p) => p.first + " " + p.last;
  const tier = (r) => (r >= 80 ? "t4" : r >= 60 ? "t3" : r >= 40 ? "t2" : "t1");

  let hofList = false,
    saveVal = "",
    duelBox = "",
    duelMine = "",
    duelRes = null,
    importing = false;
  let S = null,
    tab = "court",
    armed = null,
    armT = 0;
  const C = { pps: 0, click: 0, rating: 0 };
  const bb = { show: false, next: performance.now() + rnd(40000, 80000), until: 0 };
  let lastTap = 0,
    streak = 0,
    fireUntil = 0;

  /* ========== 3. Joueurs et économie ========== */
  /* Un joueur = une seule note (r) ; tout le reste en découle. */
  function genPlayer(o) {
    const p = {
      id: uid(),
      first: o.first || pick(S.fem ? FIRST_F : FIRST_M),
      last: o.last || pick(LAST),
      age: o.age,
      r: clamp(Math.round(o.r), 8, 97),
      pot: 0,
      peak: 0,
      seasons: 0,
      rings: 0,
      pts: 0,
      hof: false,
      son: o.son || null,
      egg: !!o.egg,
    };
    const up =
      o.age <= 21 ? rnd(8, 22) : o.age <= 25 ? rnd(3, 10) : o.age <= 29 ? rnd(0, 4) : rnd(0, 1);
    p.pot = o.egg ? 99 : clamp(p.r + up + (o.potBonus || 0), p.r, 95);
    p.peak = p.r;
    return p;
  }
  const startRoster = () => [19, 21, 20, 22, 23].map((a) => genPlayer({ r: 25, age: a }));
  function genProspects() {
    const out = [],
      f = S.upg.form,
      n = 3 + S.upg.recr;
    const avg = S.roster.length ? S.roster.reduce((t, p) => t + p.r, 0) / S.roster.length : 20;
    for (let i = 0; i < n; i++) {
      const o = {
        // Les profils sont légèrement au-dessus du niveau moyen de l'effectif (la formation augmente l'écart).
        r: clamp(Math.round(avg + 2 + f * 0.5 + rnd(-5, 5)), 18, 88),
        age: rnd(18, 30),
      };
      if (S.legends.length && Math.random() < 0.3) {
        const L = pick(S.legends);
        o.last = L.last;
        o.son = L.first + " " + L.last;
        o.r += 4;
        o.potBonus = 6;
        o.age = rnd(18, 21);
      }
      out.push(genPlayer(o));
    }
    // Easter egg : à recrutement maximal, 1 % de chance de tomber sur le créateur du jeu.
    const taken = S.roster.some((p) => p.egg) || S.legends.some((l) => l.egg);
    if (
      !S.fem &&
      S.upg.recr >= UPG.find((u) => u.id === "recr").max &&
      !taken &&
      Math.random() < 0.01
    ) {
      out[rnd(0, out.length - 1)] = genPlayer({
        first: "Charles",
        last: "Nourry",
        r: 90,
        age: rnd(19, 22),
        egg: true,
      });
    }
    return out;
  }
  function signCost(p) {
    let c = 3 * Math.pow(1.14, p.r) * (1 + Math.max(0, p.pot - p.r) * 0.03);
    if (p.age >= 31) c *= 0.7;
    c *= (1 - 0.05 * S.upg.agent) * 0.9 * (1 + STRIKE_PRICE * S.strikes);
    return Math.max(10, Math.round(c));
  }
  const upCost = (u) => Math.round(0.9 * u.base * Math.pow(u.g, S.upg[u.id]));
  /* Revalorisation : +1 de note (et de potentiel) pour un joueur qui a atteint son potentiel. */
  const REVAL_COST = 10; // x le coût de recrutement
  const REVAL_EVENT_COST = 20; // x le coût de recrutement, quand le joueur l'exige
  const REVAL_CAP = 100;
  const REVAL_CAP_EGG = 110;
  const REVAL_EVENT_CHANCE = 0.8; // répartie entre tous les joueurs de l'effectif
  const REVAL_AI_STEP = 10; // +1 de niveau adverse toutes les 10 revalorisations
  const revCap = (p) => (p.egg ? REVAL_CAP_EGG : REVAL_CAP);
  const canReval = (p) => p.r >= p.pot && p.r < revCap(p);
  const revDoneNow = (p) => p.rvS === S.seasonN; // déjà revalorisé par toi cette saison
  const revCost = (p) => REVAL_COST * signCost(p);
  const rerollCost = () => Math.round(0.9 * Math.max(20, C.pps * 15) * (1 + S.rerolls * 0.5));

  /* ---------- économie : plus la note est haute, plus il marque ---------- */
  const DIFF = 0.62;
  const UNL = { roster: 100, club: 1000, season: 5000 };
  const BASE_PPS = 0.26;
  const pp = (r) => DIFF * 0.033 * Math.pow(r / 10, 3);
  const legacy = () => 1 + S.legends.length * 0.1;
  const titleMult = () => Math.pow(1.5, S.rings);
  /* Caisse de Care : on y verse des points ; plus elle est remplie, plus le bonus d'ère grossit. */
  const CARE_CAPS = [1e9, 1e10, 1e11, 1e12, 1e13]; // 5 caisses successives, chacune 10 fois plus grosse
  const CARE_AMOUNTS = [1e5, 5e7, 1e8, 2.5e8]; // montants proposés (x10 à chaque caisse)
  const careDone = () => S.careTier >= CARE_CAPS.length;
  /** Avancement total : 1 par caisse remplie + la fraction de la caisse en cours (+0,1 % par millième). */
  const careFrac = () => S.careTier + (careDone() ? 0 : S.care / CARE_CAPS[S.careTier]);
  const eraBonus = () => 0.5 * (S.era - 1) * (1 + careFrac());
  const eraMult = () => 1 + eraBonus();
  const mult = () => (1 + 0.12 * S.upg.coach) * titleMult() * legacy() * eraMult();
  const flat = () => BASE_PPS + (S.upg.arena ? DIFF * 3 * Math.pow(S.upg.arena, 1.25) : 0);
  function recalc() {
    let b = 0,
      sum = 0;
    S.roster.forEach((p) => {
      b += pp(p.r);
      sum += p.r;
    });
    C.pps = S.epidemic ? 0 : (b + flat()) * mult(); // huis clos : plus de revenus passifs
    C.click =
      DIFF *
      (1 + 1.5 * S.upg.shoot + 0.06 * C.pps) *
      legacy() *
      eraMult() *
      (performance.now() < fireUntil ? 2 : 1);
    C.rating = (sum + (ROSTER_MAX - S.roster.length) * 15) / ROSTER_MAX + 1.5 * S.upg.scout;
  }
  function gain(g) {
    S.pts += g;
    S.total += g;
  }

  /* ========== 4. Ligue ========== */
  function newSeason() {
    const teams = [{ name: S.name, w: 0, l: 0, pf: 0, pa: 0, ovr: 0 }];
    (S.fem ? TEAMS_F : TEAMS_M).forEach((n) =>
      teams.push({ name: n, w: 0, l: 0, pf: 0, pa: 0, ovr: rnd(-7, 7) }),
    );
    return {
      off: true,
      n: S.seasonN,
      phase: "reg",
      game: 0,
      sched: shuffle([1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7]),
      teams,
      po: null,
      champ: null,
    };
  }
  /**
   * Niveau moyen des adversaires. Il progresse avec les résultats du club (S.aiBoost) :
   * rien si on rate les playoffs, un peu si on s'y qualifie, davantage avec un titre.
   * Il ne descend jamais sous 92 % de la note de l'équipe, pour qu'un club dominant reste défié.
   */
  const AI_BASE = 34,
    AI_BOOST_PLAYOFFS = 2,
    AI_BOOST_TITLE = 5,
    AI_BOOST_MAX = 60;
  const aiLevel = () => {
    const b = Math.floor(S.revCnt / REVAL_AI_STEP);
    return Math.min(95 + b, Math.max(AI_BASE + S.aiBoost + b, 0.92 * C.rating));
  };
  const teamR = (i) => (i === 0 ? C.rating : aiLevel() + S.season.teams[i].ovr);
  function simGame(ra, rb, me) {
    let p = 1 / (1 + Math.exp(-(ra - rb) / 5));
    if (me) p = Math.min(0.97, p * 1.1);
    const aWin = Math.random() < p;
    const base = Math.round(74 + ((ra + rb) / 2) * 0.2 + rnd(-5, 7));
    const win = base + Math.max(1, Math.round(Math.abs(gauss()) * 7) + 1);
    return aWin ? { a: win, b: base, aWin: true } : { a: base, b: win, aWin: false };
  }
  const duelAI = (a, b) => (simGame(teamR(a), teamR(b)).aWin ? a : b);
  function ranked(se) {
    return se.teams
      .map((t, i) => i)
      .sort((x, y) => {
        const A = se.teams[x],
          B = se.teams[y];
        return B.w - A.w || B.pf - B.pa - (A.pf - A.pa) || x - y;
      });
  }
  function applyResult(se, a, b, r) {
    const A = se.teams[a],
      B = se.teams[b];
    A.pf += r.a;
    A.pa += r.b;
    B.pf += r.b;
    B.pa += r.a;
    if (r.aWin) {
      A.w++;
      B.l++;
    } else {
      B.w++;
      A.l++;
    }
  }
  function log(key, a, k) {
    S.log.unshift({ key, a: a || [], k: k || "" });
    if (S.log.length > 40) S.log.length = 40;
  }
  /* Le match à venir est tiré au coup d'envoi : le tableau d'affichage le joue en direct. */
  function prepNext() {
    recalc();
    if (!S.un.roster) {
      S.cur = null;
      return;
    }
    const se = S.season;
    let opp;
    if (!S.un.season) {
      opp = rnd(1, 7);
      S.cur = { opp, lab: { k: "friendly" }, friendly: true, r: simGame(C.rating, teamR(opp)) };
      return;
    }
    if (se.phase === "reg") {
      opp = se.sched[se.game];
      S.cur = {
        opp,
        lab: { k: "day", n: se.game + 1 },
        r: rig(simGame(C.rating, teamR(opp), true)),
      };
    } else if (se.phase === "po") {
      const po = se.po;
      if (po.round === 0) {
        const m = po.semis.find((x) => x.includes(0));
        opp = m[0] === 0 ? m[1] : m[0];
      } else opp = po.final[1];
      S.cur = {
        opp,
        lab: { k: po.round === 0 ? "semi" : "final" },
        r: rig(simGame(C.rating, teamR(opp), true)),
      };
    } else S.cur = null;
  }
  function regGame() {
    const se = S.season,
      opp = S.cur.opp,
      r = S.cur.r;
    applyResult(se, 0, opp, r);
    const others = shuffle([1, 2, 3, 4, 5, 6, 7].filter((i) => i !== opp));
    for (let i = 0; i < 6; i += 2) {
      const a = others[i],
        b = others[i + 1];
      applyResult(se, a, b, simGame(teamR(a), teamR(b)));
    }
    se.game++;
    S.last = {
      lab: { k: "day", n: se.game },
      a: S.name,
      b: se.teams[opp].name,
      sa: r.a,
      sb: r.b,
      win: r.aWin,
    };
    log("L_game", [se.game, r.aWin, r.a, r.b, se.teams[opp].name], r.aWin ? "good" : "bad");
    gain(C.pps * (r.aWin ? 40 * (1 + 0.25 * S.upg.fans) : 12));
    if (se.game >= G) startPlayoffs();
  }
  function startPlayoffs() {
    const se = S.season,
      order = ranked(se),
      top = order.slice(0, 4);
    se.rank = order.indexOf(0) + 1;
    se.po = {
      round: 0,
      semis: [
        [top[0], top[3]],
        [top[1], top[2]],
      ],
      final: null,
    };
    if (!top.includes(0)) {
      finishSeason(duelAI(duelAI(top[0], top[3]), duelAI(top[1], top[2])), "out");
      return;
    }
    se.phase = "po";
    log("L_po", [se.rank], "gold");
  }
  function poGame() {
    const se = S.season,
      po = se.po,
      opp = S.cur.opp,
      r = S.cur.r;
    if (po.round === 0) {
      const other = po.semis.find((m) => !m.includes(0));
      S.last = {
        lab: { k: "semi" },
        a: S.name,
        b: se.teams[opp].name,
        sa: r.a,
        sb: r.b,
        win: r.aWin,
      };
      const ow = duelAI(other[0], other[1]);
      if (r.aWin) {
        po.round = 1;
        po.final = [0, ow];
        gain(C.pps * 90 * (1 + 0.25 * S.upg.fans));
        log("L_semiW", [r.a, r.b], "good");
      } else {
        log("L_semiL", [r.a, r.b], "bad");
        finishSeason(duelAI(opp, ow), "semi");
      }
    } else {
      S.last = {
        lab: { k: "final" },
        a: S.name,
        b: se.teams[opp].name,
        sa: r.a,
        sb: r.b,
        win: r.aWin,
      };
      if (r.aWin) finishSeason(0, "champ");
      else {
        log("L_finalL", [r.a, r.b], "bad");
        finishSeason(opp, "final");
      }
    }
  }
  function finishSeason(champ, res) {
    const se = S.season,
      t = se.teams[0];
    se.phase = "off";
    se.champ = champ;
    const boost = champ === 0 ? AI_BOOST_TITLE : res === "out" ? 0 : AI_BOOST_PLAYOFFS;
    S.aiBoost = Math.min(AI_BOOST_MAX, S.aiBoost + boost);
    S.history.push({ n: se.n, champ: se.teams[champ].name, res, rec: `${t.w}-${t.l}`, era: S.era });
    if (S.history.length > 30) S.history.shift();
    if (champ === 0) {
      S.rings++;
      S.titlesAll++;
      S.eraTitles++;
      if (S.rings >= HOF_TITLES) S.hofUnlocked = true;
      S.roster.forEach((p) => {
        p.rings++;
      });
      gain(C.pps * 300);
      log("L_champ", [S.rings], "gold");
      toast(S.rings === HOF_TITLES ? T("T_hofUnlock") : T("T_champ"));
    } else log("L_other", [se.teams[champ].name]);
  }
  function progress(p) {
    const t = S.upg.train;
    let d;
    if (p.age <= 24) d = rnd(1, 4) + (Math.random() < Math.min(0.6, t * 0.1) ? 1 : 0);
    else if (p.age <= 29) d = rnd(-1, 2);
    else if (p.age <= 33) d = -rnd(0, 2);
    else d = -rnd(1, 3);
    if (d < 0 && Math.random() < t * 0.06) d = 0;
    if (d > 0) d = Math.min(d, Math.max(0, p.pot - p.r)); // jamais au-dessus du potentiel
    p.r = clamp(p.r + d, 5, Math.max(99, revCap(p)));
    p.peak = Math.max(p.peak, p.r);
  }
  function offseason() {
    const retired = [];
    S.epidemic = false; // l'épidémie ne dure qu'une saison
    S.roster.forEach((p) => {
      p.age++;
      p.seasons++;
      progress(p);
    });
    S.roster = S.roster.filter((p) => {
      const r =
        p.age >= 39 ||
        (p.age >= 34 && Math.random() < 0.25 + (p.age - 34) * 0.15 + (p.r < 55 ? 0.2 : 0));
      if (r) retired.push(p);
      return !r;
    });
    retired.forEach((p) => {
      syncLegend(p);
      log("L_retire", [nm(p)]);
    });
    S.seasonN++;
    S.eraSeason++;
    S.rerolls = 0;
    S.prospects = genProspects();
    S.season = newSeason();
    S.last = null;
    log("L_draft", [S.seasonN]);
    rollEvent();
    rollReval();
  }
  /* Entrée au Hall of Fame dès que les critères sont remplis, sans attendre la retraite. */
  /** Met à jour la fiche Hall of Fame d'un joueur avec ses statistiques actuelles. */
  function syncLegend(p) {
    const L = S.legends.find((l) => l.id === p.id);
    if (!L) return;
    L.peak = p.peak;
    L.rings = p.rings;
    L.pts = Math.round(p.pts);
    L.seasons = p.seasons + 1;
  }
  function checkHof() {
    let any = false;
    S.roster.forEach((p) => {
      if (!p.hof && p.rings >= HOF_RINGS && (p.pts || 0) >= HOF_PTS) {
        p.hof = true;
        S.hofUnlocked = true; // la première entrée au Hall of Fame débloque l'onglet pour de bon
        any = true;
        S.legends.push({
          id: p.id,
          first: p.first,
          last: p.last,
          peak: p.peak,
          rings: p.rings,
          pts: Math.round(p.pts),
          seasons: p.seasons + 1,
          egg: p.egg,
          era: S.era,
        });
        log("L_hofIn", [nm(p)], "gold");
        toast(T("T_hofIn", nm(p).toUpperCase()));
      }
    });
    if (any) {
      recalc();
      renderAll();
    }
  }
  function playTick() {
    if (!S.un.roster) return;
    if (!S.cur) prepNext();
    if (!S.un.season) {
      const c = S.cur;
      if (c) {
        S.last = {
          lab: { k: "friendly" },
          a: S.name,
          b: S.season.teams[c.opp].name,
          sa: c.r.a,
          sb: c.r.b,
          win: c.r.aWin,
        };
      }
      prepNext();
      renderInfo();
      updateLive();
      return;
    }
    const ph = S.season.phase;
    if (ph === "reg") regGame();
    else if (ph === "po") poGame();
    else offseason();
    prepNext();
    if (ph === "off") renderAll();
    else {
      renderInfo();
      renderSeason();
      renderTabs();
    }
    updateLive();
  }
  const popQ = [];
  function checkUnlocks() {
    for (const k of ["roster", "club", "season"]) {
      if (!S.un[k] && S.total >= UNL[k]) {
        S.un[k] = true;
        if (k === "roster" || k === "season") {
          S.timer = TICK;
          S.cur = null;
          if (k === "season") {
            S.season = newSeason();
            S.last = null;
            log("L_welcome");
          }
          prepNext();
        }
        popQ.push(k);
        renderAll();
        showNextPop();
        save();
      }
    }
  }
  function showNextPop() {
    const p = $("#pop");
    if (!p.hidden || !popQ.length) return;
    const k = popQ.shift();
    $("#popT").textContent = T("pop_" + k + "_t");
    $("#popB").textContent = T("pop_" + k + "_b");
    p.hidden = false;
    setHdr();
  }
  function lockPanel(k, title) {
    const th = UNL[k],
      pct = Math.min(100, Math.round((S.total / th) * 100));
    return panel(
      `${title} <small>${T("lkLabel")}</small>`,
      `<div class="card"><p>${T("unlockAt", fmt(th))}</p><div class="meter"><i style="width:${pct}%"></i></div></div>`,
    );
  }
  function syncName() {
    if (S.name === DEF_M || S.name === DEF_F) S.name = S.fem ? DEF_F : DEF_M;
    $("#teamName").value = S.name;
  }
  function startCareer(fem) {
    S.fem = fem;
    syncName();
    S.roster = startRoster();
    S.prospects = genProspects();
    S.season = newSeason();
    S.last = null;
    S.timer = TICK;
    S.rerolls = 0;
    S.pending = false;
    S.cur = null;
    if (S.era > 1) log("L_era", [S.era, eraMult().toFixed(2)], "gold");
    else log("L_welcome");
    prepNext();
    $("#pick").hidden = true;
    tab = "court";
    renderAll();
    toTop();
    save();
  }
  function newEra() {
    S.roster.forEach(syncLegend);
    S.era++;
    S.eraSeason = 1;
    S.aiBoost = 0;
    S.strike = 0;
    S.strikes = 0;
    S.epidemic = false;
    S.event = null;
    S.evtQ = null;
    S.revTok = 0;
    S.revCnt = 0;
    S.eraTitles = 0;
    S.rings = 0;
    S.pts = 0;
    S.rerolls = 0;
    S.upg = UPG0();
    S.seasonN++;
    S.roster = [];
    S.prospects = [];
    S.last = null;
    S.cur = null;
    S.season = newSeason();
    S.pending = true;
    showPick();
    renderAll();
  }
  function newState() {
    S = {
      v: 2,
      titlesAll: 0,
      hofUnlocked: false,
      name: DEF_M,
      fem: false,
      pending: true,
      pts: 0,
      total: 0,
      un: { roster: false, club: false, season: false },
      era: 1,
      eraSeason: 1,
      aiBoost: 0,
      care: 0,
      careTier: 0,
      strike: 0,
      strikes: 0,
      epidemic: false,
      evtCool: 0,
      event: null,
      evtQ: null,
      revTok: 0,
      revCnt: 0,
      seasonN: 1,
      rings: 0,
      eraTitles: 0,
      legends: [],
      history: [],
      speed: 1,
      upg: UPG0(),
      roster: [],
      prospects: [],
      rerolls: 0,
      log: [],
      last: null,
      cur: null,
      timer: TICK,
      t: Date.now(),
      season: null,
    };
    S.roster = startRoster();
    S.prospects = genProspects();
    S.season = newSeason();
    return S;
  }
  function save() {
    if (importing) return;
    try {
      S.t = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    } catch (e) {}
  }
  function load() {
    try {
      const j = localStorage.getItem(SAVE_KEY);
      if (j) {
        const o = JSON.parse(j);
        if (o && o.v === 2 && o.season && o.roster) {
          if (!o.slotsMig) {
            o.upg = o.upg || {};
            o.upg.slots = Math.max(
              o.upg.slots || 0,
              Math.min(3, Math.max(0, (o.roster || []).length - 5)),
            );
            o.slotsMig = true;
          }
          o.upg = Object.assign(UPG0(), o.upg);
          o.upg.slots = Math.min(3, o.upg.slots || 0);
          if (o.roster.length > ROSTER_MAX) {
            o.roster.sort((a, b) => b.r - a.r);
            o.roster.length = ROSTER_MAX;
          }
          if (o.season && !o.season.off) {
            o.season.off = true;
            o.season.teams.forEach((t, i) => {
              if (i) t.ovr = rnd(-7, 7);
            });
          }
          if (!o.un) o.un = { roster: true, club: true, season: true };
          o.fem = !!o.fem;
          o.strike = o.strike || 0;
          o.strikes = o.strikes || 0;
          o.epidemic = !!o.epidemic;
          o.evtCool = o.evtCool || 0;
          o.event = o.event || null;
          o.evtQ = o.evtQ || null;
          o.revTok = o.revTok || 0;
          o.revCnt = o.revCnt || 0;
          o.care = o.care || 0;
          o.careTier = o.careTier || 0;
          // Anciennes légendes sans ère : celles encore dans l'effectif datent de l'ère en cours
          // (l'effectif est vidé à chaque ère), les autres sont affichées « Ère pré-merge ».
          (o.legends || []).forEach((L) => {
            if (L.era || L.eraMax) return;
            if (o.roster.some((p) => p.id === L.id)) L.era = o.era;
            else L.eraMax = o.era;
          });
          o.roster.forEach((p) => {
            if (p.pot < p.r) p.pot = p.r; // anciennes sauvegardes : potentiel dépassé
          });
          if (o.aiBoost == null) o.aiBoost = Math.min(30, 1.5 * ((o.eraSeason || 1) - 1));
          o.titlesAll = Math.max(o.titlesAll || 0, o.rings || 0);
          if (o.eraTitles != null && o.rings > o.eraTitles) o.rings = o.eraTitles;
          o.hofUnlocked = !!o.hofUnlocked || o.rings >= HOF_TITLES || (o.legends || []).length > 0;
          o.pending = !!o.pending;
          return o;
        }
      }
    } catch (e) {}
    return null;
  }

  /* ========== Événements aléatoires ========== */
  const EVENT_CHANCE = 0.17; // tirage à chaque fin de saison
  const EVENT_CHAIN_CHANCE = 0.01; // chance d'un événement la saison suivant un autre
  const EVENT_MIN_SEASON = 3; // jamais avant la saison 3 d'une ère
  const STRIKE_LOSSES = 5;
  const STRIKE_PRICE = 0.2; // +20 % sur les signatures, par grève, jusqu'à la fin de l'ère
  const FIRE_UPGRADES = ["coach", "train", "form", "scout", "mascot"];

  /** Transforme un résultat de match en défaite tant que la grève dure. */
  function rig(r) {
    if (S.strike <= 0) return r;
    S.strike--;
    return r.aWin ? { a: r.b, b: r.a, aWin: false } : r;
  }
  const bestPlayer = () => S.roster.reduce((a, b) => (b.r > a.r ? b : a));

  /** Chaque événement : poids de tirage, condition, et effet (renvoie les données du popup). */
  const EVENTS = [
    {
      id: "strike",
      w: 28,
      make() {
        S.strike += STRIKE_LOSSES;
        S.strikes++;
        if (S.cur && !S.cur.friendly) S.cur.r = rig(S.cur.r);
        return {};
      },
    },
    {
      id: "epidemic",
      w: 28,
      make() {
        S.epidemic = true;
        return {};
      },
    },
    {
      id: "fire",
      w: 14,
      ok: () => FIRE_UPGRADES.some((k) => S.upg[k] > 0),
      make() {
        FIRE_UPGRADES.forEach((k) => (S.upg[k] = 0));
        return {};
      },
    },
    {
      id: "bet",
      w: 15,
      ok: () => S.roster.length >= 2,
      make() {
        const p = pick(S.roster);
        const legend = S.legends.find((l) => l.id === p.id);
        if (legend) {
          syncLegend(p);
          legend.banned = true;
        }
        S.roster = S.roster.filter((x) => x.id !== p.id);
        return { name: nm(p), hof: !!legend };
      },
    },
    {
      id: "transfer",
      w: 15,
      ok: () => S.roster.length >= 2,
      make() {
        const p = bestPlayer();
        return {
          pid: p.id,
          name: nm(p),
          r: p.r,
          price: Math.max(1000, 4 * signCost(p), 600 * C.pps),
        };
      },
    },
  ];

  function revalue(p) {
    p.r++;
    p.pot = p.r;
    p.peak = Math.max(p.peak, p.r);
    p.rv = (p.rv || 0) + 1;
    S.revCnt++;
    syncLegend(p);
  }
  /** Fin de saison : un joueur au plafond de son potentiel peut exiger une revalorisation (ou partir). */
  function rollReval() {
    if (!S.un.season || S.roster.length < 2) return;
    const last = S.seasonN - 1; // saison qui vient de se terminer
    const pool = S.roster.filter((p) => canReval(p) && p.rvS !== last);
    if (!pool.length || Math.random() >= (REVAL_EVENT_CHANCE * pool.length) / S.roster.length)
      return;
    const p = pick(pool);
    const ev = {
      t: "reval",
      pid: p.id,
      name: nm(p),
      r: p.r,
      price: REVAL_EVENT_COST * signCost(p),
    };
    log("L_event", ["reval"], "bad");
    if (S.event) S.evtQ = ev;
    else {
      S.event = ev;
      showEvent();
    }
  }
  /** Tire au sort un événement en fin de saison (au plus un tous les deux ans, jamais en début d'ère). */
  function rollEvent() {
    const chance = S.evtCool > 0 ? EVENT_CHAIN_CHANCE : EVENT_CHANCE;
    if (S.evtCool > 0) S.evtCool--;
    if (!S.un.season || S.eraSeason < EVENT_MIN_SEASON || Math.random() >= chance) return;
    const pool = EVENTS.filter((e) => !e.ok || e.ok());
    let x = Math.random() * pool.reduce((t, e) => t + e.w, 0);
    const ev = pool.find((e) => (x -= e.w) < 0) || pool[0];
    S.evtCool = 1;
    S.event = Object.assign({ t: ev.id }, ev.make());
    log("L_event", [ev.id], "bad");
    recalc();
    showEvent();
  }
  /** Affiche le popup de l'événement en cours ; le jeu reste en pause tant qu'il est ouvert. */
  function showEvent() {
    const e = S.event;
    if (!e) return;
    $("#evtT").textContent = T("evt_" + e.t + "_t");
    $("#evtB").textContent = T("evt_" + e.t + "_b", e);
    $("#evtBtns").innerHTML =
      e.t === "reval"
        ? `<button class="btn pri big" data-act="evtyes" data-cost="${e.price}" data-block="0">${T("evtReval", fmt(e.price))}</button><button class="btn big" data-act="evtno">${T("evtLeave")}</button>`
        : e.t === "transfer"
          ? `<button class="btn pri big" data-act="evtyes">${T("evtYes")}</button><button class="btn big" data-act="evtno">${T("evtNo")}</button>`
          : `<button class="btn pri big" data-act="evtok">${T("popOk")}</button>`;
    $("#evt").hidden = false;
    setHdr();
  }
  function closeEvent(sell) {
    const e = S.event;
    if (e && sell && e.t === "transfer") {
      const p = S.roster.find((x) => x.id === e.pid);
      if (p && S.roster.length > 1) {
        syncLegend(p);
        S.roster = S.roster.filter((x) => x.id !== p.id);
        gain(e.price);
        toast(T("T_sold", fmt(e.price).toUpperCase()));
      }
    }
    if (e && e.t === "reval") {
      const p = S.roster.find((x) => x.id === e.pid);
      if (p && sell && S.pts >= e.price) {
        S.pts -= e.price;
        revalue(p);
        toast(T("T_reval", nm(p), p.r));
      } else if (p) {
        syncLegend(p);
        S.roster = S.roster.filter((x) => x.id !== p.id);
        toast(T("T_left", nm(p)));
      }
    }
    S.event = S.evtQ;
    S.evtQ = null;
    $("#evt").hidden = !S.event;
    if (S.event) showEvent();
    recalc();
    renderAll();
    save();
  }

  /* ========== 6. Rendu, actions, boucle ========== */

  /* ---------- avatars pixel ---------- */
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function avatar(p) {
    const h = hash(p.id);
    const skin = p.egg ? "#f1c27d" : ["#f1c27d", "#e0a96d", "#c68642", "#8d5524", "#5c3a1e"][h % 5];
    const hair = p.egg
      ? "#3b2314"
      : ["#111", "#3b2314", "#111", "#7a4a21", "#d9b13b"][(h >> 3) % 5];
    const hs = (h >> 6) % 3;
    let hairR;
    if (S.fem)
      hairR =
        hs === 0
          ? '<rect x="3" y="0" width="6" height="2"/><rect x="2" y="2" width="1" height="6"/><rect x="9" y="2" width="1" height="6"/>'
          : hs === 1
            ? '<rect x="2" y="0" width="8" height="3"/><rect x="2" y="3" width="1" height="4"/><rect x="9" y="3" width="1" height="4"/>'
            : '<rect x="3" y="0" width="6" height="2"/><rect x="9" y="2" width="2" height="3"/>';
    else
      hairR =
        hs === 0
          ? '<rect x="3" y="0" width="6" height="2"/>'
          : hs === 1
            ? '<rect x="2" y="0" width="8" height="3"/>'
            : '<rect x="3" y="1" width="6" height="1"/>';
    return `<svg class="av" viewBox="0 0 12 14" aria-hidden="true">
    <rect x="3" y="2" width="6" height="5" fill="${skin}"/><rect x="5" y="7" width="2" height="1" fill="${skin}"/>
    <g fill="${hair}">${hairR}</g>
    <rect x="4" y="4" width="1" height="1" fill="#000"/><rect x="7" y="4" width="1" height="1" fill="#000"/>
    <rect x="2" y="8" width="8" height="6" fill="#e2231a"/><rect x="0" y="8" width="2" height="4" fill="${skin}"/><rect x="10" y="8" width="2" height="4" fill="${skin}"/>
    <rect x="5" y="9" width="2" height="3" fill="#ffd21f"/>
  </svg>`;
  }

  /* ---------- drapeaux ---------- */
  function flag(l, id) {
    if (l === "fr")
      return `<svg class="flag" viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>`;
    return `<svg class="flag" viewBox="0 0 60 30" aria-hidden="true"><clipPath id="fs${id}"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="ft${id}"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#fs${id})"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#ft${id})" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>`;
  }

  /* ---------- vues ---------- */
  const panel = (title, body) =>
    `<div class="panel"><h2 class="ph">${title}</h2><div class="pb">${body}</div></div>`;
  const labText = (l, old) => (!l ? old || "" : l.k === "day" ? T("day", l.n, G) : T(l.k));
  function boardHtml() {
    const se = S.season,
      c = S.cur,
      L = S.last,
      t = se.teams[0];
    const head = !S.un.season
      ? T("friendlyHead")
      : c
        ? `${T("seasonN", se.n)} · ${labText(c.lab, c.label)}`
        : `${T("seasonN", se.n)} · ${T("offseason")}`;
    const last = L ? T("lastMatch", L.win, L.sa, L.sb) : T("noMatch");
    return `<div class="panel board" id="board"><h2 class="ph">${esc(head)}</h2><div class="pb">
    <div class="b-clock"><span class="b-qtr" id="bQtr">Q1</span><span class="b-time" id="bTime">48:00</span></div>
    <div class="b-teams">
      <div class="b-team"><span class="tn home">${esc(S.name)}</span><span class="sc" id="scA">0</span></div>
      <span class="b-vs">VS</span>
      <div class="b-team"><span class="tn">${esc(c ? se.teams[c.opp].name : "—")}</span><span class="sc" id="scB">0</span></div>
    </div>
    <div class="b-last">${esc(last)}</div>
    <div class="b-facts"><span>${T("f_rating")} <b>${C.rating.toFixed(1).replace(".", lang === "fr" ? "," : ".")}</b></span><span>${T("f_shot")} <b>+${fmt(C.click)}</b></span>${S.un.season ? `<span>${T("f_record")} <b>${T("rec", t.w, t.l)}</b></span><span>${T("f_titles")} <b>${S.rings}</b></span>` : ""}</div></div></div>`;
  }
  function updateBoard() {
    const a = $("#scA");
    if (!a) return;
    const c = S.cur;
    if (!c) {
      a.textContent = "--";
      $("#scB").textContent = "--";
      $("#bTime").textContent = "--:--";
      $("#bQtr").textContent = T("qBreak");
      return;
    }
    const prog = clamp(1 - S.timer / TICK, 0, 1);
    a.textContent = Math.floor(c.r.a * Math.pow(prog, 0.96));
    $("#scB").textContent = Math.floor(c.r.b * Math.pow(prog, 1.04));
    const rem = Math.round((1 - prog) * 2880);
    $("#bTime").textContent =
      String(Math.floor(rem / 60)).padStart(2, "0") + ":" + String(rem % 60).padStart(2, "0");
    $("#bQtr").textContent = prog >= 1 ? T("qEnd") : "Q" + Math.min(4, Math.floor(prog * 4) + 1);
  }
  function plRow(p, mode, i) {
    const prod = pp(p.r) * mult();
    const tags =
      (p.son ? `<span class="tag">${T("sonOf")} ${esc(p.son.toUpperCase())}</span>` : "") +
      (p.hof ? '<span class="tag">HOF</span>' : "") +
      (p.rings
        ? `<span class="tag"><span class="tx">${T("ringsTag", p.rings)}</span><span class="ts">★${p.rings}</span></span>`
        : "");
    let act;
    if (mode === "prospect") {
      const c = signCost(p);
      act = `<button class="btn pri" data-act="sign" data-i="${i}" data-cost="${c}" data-block="${S.roster.length >= slotsMax() ? 1 : 0}">${T("sign")} ${fmt(c)}</button>`;
    } else
      act = `<button class="btn ghost" data-act="release" data-id="${p.id}">${T("release")}</button>`;
    const rv =
      mode !== "prospect" && S.revTok > 0 && canReval(p) && revDoneNow(p)
        ? `<button class="btn sm" disabled>${T("revDone")}</button>`
        : mode !== "prospect" && S.revTok > 0 && canReval(p)
          ? `<button class="btn pri sm" data-act="reval" data-id="${p.id}" data-cost="${revCost(p)}" data-block="0">${T("revalBtn", fmt(revCost(p)))}</button>`
          : "";
    return `<article class="pl${p.rings ? " has-rings" : ""}">${avatar(p)}
    <div class="pl-id"><strong>${esc(nm(p))}${p.rv ? `<span class="rvstar" title="${T("revTip", p.rv)}">★</span>` : ""}${tags}</strong><small>${T("age", p.age)} · ${T("pot")} ${p.pot}</small><em>+${fmt(prod)}/s${mode === "prospect" ? "" : '<span class="mq"> · ' + fmt(p.pts || 0) + " " + T("scored") + "</span>"}</em>${rv}</div>
    <div class="pl-r"><span class="rt ${tier(p.r)}">${p.r}</span>${act}</div></article>`;
  }
  /* Insère le nouveau contenu avant de retirer l'ancien : la hauteur ne s'effondre jamais, le défilement reste en place. */
  function setHtml(el, html) {
    const old = Array.from(el.childNodes);
    el.insertAdjacentHTML("beforeend", html);
    old.forEach((n) => n.remove());
  }
  function renderInfo() {
    setHtml($("#info"), S.un.roster ? boardHtml() : "");
    updateBoard();
  }
  function renderRoster() {
    if (!S.un.roster) {
      setHtml($("#sec-roster"), lockPanel("roster", T("roster")));
      return;
    }
    const list = S.roster.slice().sort((a, b) => b.r - a.r);
    const rows =
      list.map((p) => plRow(p, "roster")).join("") +
      Array.from(
        { length: Math.max(0, slotsMax() - list.length) },
        () => `<div class="slot">${T("free")}</div>`,
      ).join("") +
      (ROSTER_MAX - Math.max(slotsMax(), list.length) > 0
        ? `<div class="slot" style="opacity:.55">${T("slotLock", ROSTER_MAX - Math.max(slotsMax(), list.length))}</div>`
        : "");
    const rc = rerollCost();
    const pros =
      S.prospects.map((p, i) => plRow(p, "prospect", i)).join("") ||
      `<p class="hint">${T("noProspect")}</p>`;
    setHtml(
      $("#sec-roster"),
      `<div class="rs">` +
        panel(
          `${T("roster")} <small>${list.length}/${slotsMax()}</small>`,
          (S.upg.reval > 0 || S.revTok > 0 ? `<p class="hint">${T("revLeft", S.revTok)}</p>` : "") +
            `<div class="list">${rows}</div>`,
        ) +
        panel(
          T("scouting"),
          `<div class="list">${pros}</div><button class="btn" data-act="reroll" data-cost="${rc}" data-block="0">${T("reroll", fmt(rc))}</button>`,
        ) +
        `</div>`,
    );
  }
  function carePanel() {
    if (S.era < 2) {
      return panel(
        `${T("careTitle")} <small>${T("lkLabel")}</small>`,
        `<div class="card"><p>${T("careLock")}</p></div>`,
      );
    }
    if (careDone()) {
      return panel(T("careTitle"), `<div class="card"><p>${T("careEnd")}</p></div>`);
    }
    const cap = CARE_CAPS[S.careTier],
      scale = Math.pow(10, S.careTier),
      left = cap - S.care;
    const btns = CARE_AMOUNTS.map((a) => {
      const amt = a * scale;
      return `<button class="btn" data-act="care" data-amt="${amt}" data-cost="${Math.min(amt, left)}" data-block="0">${fmt(amt)}</button>`;
    }).join("");
    return panel(
      `${T("careTitle")} <small>${T("careTier", S.careTier + 1, CARE_CAPS.length)}</small>`,
      `<div class="card"><p>${T("careTxt", fmt(cap / 1000))}</p>
      <small>${fmt(S.care)} / ${fmt(cap)}</small>
      <div class="meter"><i style="width:${Math.min(100, (S.care / cap) * 100)}%"></i></div>
      <div class="care-btns">${btns}</div></div>`,
    );
  }
  function renderClub() {
    if (!S.un.club) {
      setHtml($("#sec-club"), lockPanel("club", T("facilities")));
      return;
    }
    setHtml(
      $("#sec-club"),
      panel(
        T("facilities"),
        `<div class="list">${UPG.map((u) => {
          const l = S.upg[u.id],
            c = upCost(u),
            maxed = u.max && l >= u.max;
          const lk = !S.un.season && (u.id === "scout" || u.id === "fans");
          if (lk)
            return `<article class="up lk" data-lk="${T("lkSeason")}"><div><strong>${T("u_" + u.id)}</strong><span class="lvl">${T("lvl", 0)}</span><p>${T("d_" + u.id, 0)}</p></div><button class="btn pri" disabled>${fmt(c)}</button></article>`;
          return `<article class="up"><div><strong>${T("u_" + u.id)}</strong><span class="lvl">${T("lvl", l)}</span><p>${T("d_" + u.id, l)}</p></div>
      <button class="btn pri" data-act="buy" data-u="${u.id}" data-cost="${c}" data-block="${maxed ? 1 : 0}">${maxed ? T("max") : fmt(c)}</button></article>`;
        }).join("")}</div>`,
      ) + carePanel(),
    );
  }
  function renderSeason() {
    const focus = document.activeElement && document.activeElement.id;
    if (focus === "saveBox" || focus === "duelBox") return;
    if (!S.un.season) {
      setHtml($("#sec-season"), lockPanel("season", T("standings")) + duelPanel() + partiePanel());
      return;
    }
    const se = S.season,
      order = ranked(se);
    const rows = order
      .map((i, r) => {
        const t = se.teams[i],
          d = t.pf - t.pa;
        return `<tr class="${i === 0 ? "me" : ""} ${r === 3 ? "cut" : ""}"><td>${r + 1}</td><td>${esc(i === 0 ? S.name : t.name)}</td><td>${t.w}</td><td>${t.l}</td><td>${d > 0 ? "+" : ""}${d}</td></tr>`;
      })
      .join("");
    const next =
      se.phase === "reg"
        ? se.sched
            .slice(se.game, se.game + 4)
            .map((i, k) => `<li>${T("dayShort", se.game + k + 1)} · ${esc(se.teams[i].name)}</li>`)
            .join("")
        : "";
    const status =
      se.phase === "off" && se.champ != null
        ? T("champIs", se.teams[se.champ].name)
        : se.phase === "po"
          ? T("poOn")
          : T("poNote");
    const logs = S.log
      .slice(0, 12)
      .map((e) => `<li class="${e.k}">${esc(e.key ? T(e.key, ...e.a) : e.t)}</li>`)
      .join("");
    setHtml(
      $("#sec-season"),
      panel(
        `${T("standings")} <small>${T("seasonN", se.n)}</small>`,
        `<p class="hint">${status}</p><div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>${T("th_team")}</th><th>${T("th_w")}</th><th>${T("th_l")}</th><th>${T("th_d")}</th></tr></thead><tbody>${rows}</tbody></table></div>${next ? `<ul class="log">${next}</ul>` : ""}`,
      ) +
        panel(T("journal"), `<ul class="log">${logs}</ul>`) +
        duelPanel() +
        partiePanel(),
    );
  }

  /* ---------- Duel : même match chez les deux joueurs grâce à une seed commune ---------- */
  const DUEL_VER = 1;
  function mulberry32(a) {
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function duelMake() {
    recalc();
    const top = S.roster
      .slice()
      .sort((a, b) => b.r - a.r)
      .slice(0, 3)
      .map(nm);
    const o = { v: DUEL_VER, n: S.name, r: Math.round(C.rating * 10) / 10, p: top };
    return "BDV:" + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  }
  function duelParse(raw) {
    const at = raw.lastIndexOf("BDV:");
    if (at < 0) return null;
    const code = raw.slice(at).replace(/\s+/g, "");
    try {
      const o = JSON.parse(decodeURIComponent(escape(atob(code.slice(4)))));
      const ok =
        o.v === DUEL_VER &&
        typeof o.n === "string" &&
        o.n.length <= 40 &&
        typeof o.r === "number" &&
        o.r >= 0 &&
        o.r <= 500 &&
        Array.isArray(o.p) &&
        o.p.length <= 3 &&
        o.p.every((x) => typeof x === "string" && x.length <= 40);
      return ok ? { n: o.n, r: o.r, p: o.p, code } : null;
    } catch (e) {
      return null;
    }
  }
  /* Les deux joueurs trient les deux codes dans le même ordre : même seed, mêmes matchs.
     Série au meilleur des 7 : chaque match a sa propre seed (code A | code B | n° du match). */
  const DUEL_WINS = 4;
  function duelGame(A, B, k) {
    const rnd01 = mulberry32(hashStr(A.code + "|" + B.code + "|" + k));
    const p = Math.round((1 / (1 + Math.exp(-(A.r - B.r) / 5))) * 1e6) / 1e6;
    const aWin = rnd01() < p;
    let g = -6;
    for (let n = 0; n < 12; n++) g += rnd01();
    const base = Math.round(74 + ((A.r + B.r) / 2) * 0.2 + Math.floor(rnd01() * 13) - 5);
    const win = base + Math.max(1, Math.round(Math.abs(g) * 7) + 1);
    return aWin ? { a: win, b: base } : { a: base, b: win };
  }
  function duelPlay(mine, theirs) {
    const [A, B] = mine.code <= theirs.code ? [mine, theirs] : [theirs, mine];
    const games = [];
    let wa = 0,
      wb = 0;
    while (wa < DUEL_WINS && wb < DUEL_WINS) {
      const r = duelGame(A, B, games.length + 1);
      games.push(r);
      if (r.a > r.b) wa++;
      else wb++;
    }
    return { A, B, games, wa, wb, me: mine.code };
  }
  function duelResult(d) {
    const meA = d.me === d.A.code,
      won = meA ? d.wa > d.wb : d.wb > d.wa;
    const rows = d.games
      .map(
        (g, i) =>
          `<tr><td>${i + 1}</td><td${g.a > g.b ? ' class="me"' : ""}>${g.a}</td><td${g.b > g.a ? ' class="me"' : ""}>${g.b}</td></tr>`,
      )
      .join("");
    return `<p class="hint"><b>${T(won ? "duelWin" : "duelLoss")}</b> ${d.wa} - ${d.wb} · ${T("duelSame")}</p><div class="scroll"><table class="tbl"><thead><tr><th>${T("duelGameN")}</th><th>${esc(d.A.n)}</th><th>${esc(d.B.n)}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function duelPanel() {
    return panel(
      T("duelT"),
      `<div class="card"><p>${T("duelTxt")}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="duelcode">${T("duelCopy")}</button></div>
      <textarea id="duelBox" rows="3" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="${esc(T("duelPh"))}" style="width:100%;background:#000;color:var(--white);border:2px solid var(--blue);border-radius:4px;padding:8px;font:13px/1.3 monospace;resize:vertical">${esc(duelBox)}</textarea>
      <button class="btn pri" data-act="duelgo">${T("duelGo")}</button>${duelRes ? duelResult(duelRes) : ""}</div>`,
    );
  }
  function partiePanel() {
    return panel(
      T("gameP"),
      `<div class="card"><p>${T("saveNote")}</p><p>${T("sv_help")}</p><textarea id="saveBox" rows="3" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="${esc(T("sv_ph"))}" style="width:100%;background:#000;color:var(--white);border:2px solid var(--blue);border-radius:4px;padding:8px;font:13px/1.3 monospace;resize:vertical">${esc(saveVal)}</textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="export">${T("sv_exp")}</button><button class="btn pri" data-act="import">${armed === "import" ? T("sv_sure") : T("sv_imp")}</button></div>
      <button class="btn ghost" data-act="reset">${armed === "reset" ? T("resetConfirm") : T("resetBtn")}</button></div>`,
    );
  }
  let hofShown = false; // état du Hall of Fame au dernier affichage de l'onglet
  function renderLegends() {
    hofShown = hofOpen();
    if (!hofOpen()) {
      const pct = Math.round((S.rings / HOF_TITLES) * 100);
      setHtml(
        $("#sec-legends"),
        panel(
          `${T("hof")} <small>${T("locked")}</small>`,
          `<div class="card"><p>${T("lockTxt", S.rings, HOF_TITLES)}</p><div class="meter"><i style="width:${pct}%"></i></div></div>`,
        ),
      );
      return;
    }
    const hof = S.legends
      .slice()
      .reverse()
      .slice(0, hofList ? 999 : 3)
      .map((L) => {
        const live = S.roster.find((x) => x.id === L.id);
        const rings = live ? live.rings : L.rings,
          pts = live ? live.pts : L.pts,
          seasons = live ? live.seasons + 1 : L.seasons;
        return `<article${L.banned ? ` class="banned" data-ban="${T("banned")}"` : ""}><div><strong>${esc(L.first + " " + L.last)}</strong><br><small>${L.era ? T("eraOf", L.era) : T("eraUpTo", L.eraMax)} · ${T("peakLine", live ? live.peak : L.peak, fmt(pts || 0), seasons)}${live ? " · " + T("active") : ""}</small></div><span class="tag">${T("ringsTag", rings)}</span></article>`;
      })
      .join("");
    const hist = S.history
      .slice(-8)
      .reverse()
      .map((h) => {
        const rk =
          { Champion: "champ", Finaliste: "final", "Demi-finale": "semi", "Hors playoffs": "out" }[
            h.res
          ] || h.res;
        return `<li class="${rk === "champ" ? "gold" : ""}">${esc(T("hist", h.n, T("res_" + rk), h.rec, h.champ))}</li>`;
      })
      .join("");
    const can = S.rings >= HOF_TITLES;
    setHtml(
      $("#sec-legends"),
      panel(
        `${T("heritage")} <small>${T("heritSub", fmt(titleMult() * legacy() * eraMult()))}</small>`,
        `<p class="hint">${T("heritTxt", S.rings, fmt(titleMult()), S.legends.length, S.era)}</p>`,
      ) +
        panel(
          `${T("hof")} <button class="btn ghost" data-act="hoflist" aria-expanded="${hofList}" style="padding:4px 10px;min-height:30px;color:var(--yellow)">${S.legends.length} ${hofList ? "▾" : "▸"}</button>`,
          `<p class="hint">${T("hofRule", HOF_RINGS, fmt(HOF_PTS))}</p><div class="hof">${hof || `<p class="hint">${T("noLegend")}</p>`}</div>`,
        ) +
        panel(T("palmares"), `<ul class="log">${hist || `<li>${T("noSeason")}</li>`}</ul>`) +
        panel(
          T("eraTitle"),
          `<div class="card"><p>${T("eraTxt")}</p>
      <button class="btn pri" data-act="era" ${can ? "" : "disabled"}>${armed === "era" ? T("eraConfirm") : T("eraBtn")}</button>
      ${can ? "" : `<p>${T("eraLock", Math.min(S.rings, HOF_TITLES), HOF_TITLES)}</p>`}</div>`,
        ) +
        goatPanel() +
        coffeePanel(),
    );
  }
  function goatPanel() {
    const row = (k, v, g, f) =>
      `<div><div class="pl-id"><strong>${T(k)}</strong><small>${f(v)} / ${f(g)}</small></div><div class="meter"><i style="width:${Math.min(100, (v / g) * 100)}%"></i></div></div>`;
    const done = S.titlesAll >= GOAT.t && S.legends.length >= GOAT.l && S.total >= GOAT.p;
    return panel(
      `${T("goat")} <small>${done ? "★" : ""}</small>`,
      `<div class="card"><p>${done ? T("goatDone") : T("goatTxt")}</p>` +
        row("g_t", S.titlesAll, GOAT.t, fmt) +
        row("g_l", S.legends.length, GOAT.l, fmt) +
        row("g_p", S.total, GOAT.p, fmt) +
        `</div>`,
    );
  }
  const COFFEE_URL = "https://buymeacoffee.com/chondo";
  /** Petite tasse en pixel art, dessinée pour le jeu. */
  const COFFEE_ICON = `<svg class="cup" viewBox="0 0 12 12" aria-hidden="true"><path fill="#000" d="M2 4h6v5H2zM8 5h2v1h1v2h-1v1H8V8h1V6H8zM1 10h8v1H1z"/><path fill="#c68642" d="M3 5h4v1H3z"/><path fill="#e2231a" d="M3 1h1v2H3zM5 0h1v3H5z"/></svg>`;
  function coffeePanel() {
    return panel(
      T("coffeeTitle"),
      `<div class="card"><p>${T("coffeeTxt")}</p><a class="btn pri coffee" href="${COFFEE_URL}" target="_blank" rel="noopener noreferrer">${COFFEE_ICON}<span>${T("coffeeBtn")}</span></a></div>`,
    );
  }
  const TABS = ["court", "roster", "club", "season", "legends"];
  function renderTabs() {
    setHtml(
      $("#tabs"),
      TABS.map((k) => {
        const key = k === "legends" ? "tab_hof" : "tab_" + k;
        const ul = (k === "roster" || k === "club") && !S.un[k],
          lock = (k === "legends" && !hofOpen()) || ul || (k === "season" && !S.un.season);
        const sub = ul
          ? "<br><small>" + fmt(UNL[k]) + "</small>"
          : k === "season" && !S.un.season
            ? "<br><small>" + fmt(UNL.season) + "</small>"
            : "";
        return `<button data-tab="${k}"${k === tab ? ' aria-current="page"' : ""}${lock ? ' aria-disabled="true"' : ""}>${k === "legends" && lock ? T(key) + " " + S.rings + "/" + HOF_TITLES : T(key) + sub}</button>`;
      }).join(""),
    );
    document
      .querySelectorAll(".sec")
      .forEach((s) => s.classList.toggle("on", s.dataset.sec === tab));
    $("#view").dataset.cur = tab;
  }
  function renderAll() {
    const y = $("#app").scrollTop;
    recalc();
    renderInfo();
    renderRoster();
    renderClub();
    renderSeason();
    renderLegends();
    renderTabs();
    updateLive();
    setHdr();
    $("#app").scrollTop = y;
  }
  function setHdr() {
    const r = document.documentElement.style;
    r.setProperty("--hdr", $(".top").offsetHeight + "px");
    r.setProperty("--tabsH", $(".tabs").offsetHeight + "px");
    r.setProperty("--appH", $("#app").clientHeight + "px");
  }
  function toTop() {
    $("#app").scrollTop = 0;
  }
  function refreshAfford() {
    document.querySelectorAll("[data-cost]").forEach((el) => {
      el.disabled = el.dataset.block === "1" || S.pts < +el.dataset.cost;
    });
  }
  function updateLive() {
    if (hofOpen() !== hofShown) {
      // Le Hall of Fame vient de se débloquer : on redessine la page et l'onglet.
      renderLegends();
      renderTabs();
    }
    $("#pts").textContent = fmt(S.pts);
    $("#pps").textContent = "+" + fmt(C.pps) + "/s";
    {
      let t = T("eraTag", S.era, S.eraSeason);
      if (S.un.season) {
        const o = ranked(S.season),
          rk = o.indexOf(0) + 1,
          me = S.season.teams[0];
        t += " · " + ord(rk) + " · " + me.w + "-" + me.l;
      }
      $("#eraTag").textContent = t;
    }
    updateBoard();
    $("#bb").hidden = !bb.show;
    const fire = performance.now() < fireUntil;
    $("#fireTag").hidden = !fire;
    $("#shoot").classList.toggle("fire", fire);
    const x10 = S.eraSeason >= TURBO_SEASON;
    $('[data-speed="10"]').hidden = !x10;
    if (!x10 && S.speed === 10) S.speed = 5;
    document
      .querySelectorAll("[data-speed]")
      .forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.speed === S.speed)));
    refreshAfford();
  }
  let tt = 0;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove("show"), 3200);
  }
  function arm(id) {
    armed = id;
    renderAll();
    clearTimeout(armT);
    armT = setTimeout(() => {
      armed = null;
      renderAll();
    }, 3000);
  }
  function showPick() {
    applyStatic();
    $("#pick").hidden = false;
    setHdr();
  }

  /* ---------- langue ---------- */
  function applyStatic() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i]").forEach((el) => {
      el.textContent = T(el.dataset.i);
    });
    document.querySelectorAll("[data-i-aria]").forEach((el) => {
      el.setAttribute("aria-label", T(el.dataset.iAria));
    });
    $("#langBtn").innerHTML = flag(lang, "b");
    document
      .querySelectorAll("[data-lang]")
      .forEach((b) => b.setAttribute("aria-current", String(b.dataset.lang === lang)));
  }
  function setLang(l) {
    lang = l;
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch (e) {}
    applyStatic();
    renderAll();
  }
  function closeMenu() {
    $("#langMenu").hidden = true;
    $("#langBtn").setAttribute("aria-expanded", "false");
  }

  /* ---------- tir ---------- */
  function floatText(x, y, v) {
    const w = $("#courtWrap");
    const f = document.createElement("div");
    f.className = "float";
    f.textContent = "+" + fmt(v);
    w.appendChild(f);
    const t0 = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    f.style.transform = t0;
    if (reduce) {
      setTimeout(() => f.remove(), 500);
      return;
    }
    const a = f.animate(
      [
        { transform: t0, opacity: 1 },
        { transform: `translate(${x}px,${y - 36}px) translate(-50%,-50%)`, opacity: 0 },
      ],
      { duration: 650, easing: "ease-out" },
    );
    a.onfinish = () => f.remove();
  }
  function shoot() {
    const now = performance.now();
    if (now < fireUntil) streak = 0;
    else {
      streak = now - lastTap < 700 ? streak + 1 : 1;
      if (streak >= 10) {
        fireUntil = now + 6000 + 2000 * S.upg.mascot;
        streak = 0;
      }
    }
    lastTap = now;
    recalc();
    const v = C.click;
    gain(v);
    const w = $("#courtWrap"),
      btn = $("#shoot"),
      hp = $("#hoop");
    const W = w.getBoundingClientRect(),
      B = btn.getBoundingClientRect(),
      H = hp.getBoundingClientRect();
    const sx = B.left + B.width / 2 - W.left,
      sy = B.top + B.height / 2 - W.top,
      ex = H.left - W.left,
      ey = H.top - W.top;
    if (reduce || w.querySelectorAll(".fly").length > 5) {
      floatText(ex, ey + 24, v);
      return;
    }
    const f = document.createElement("div");
    f.className = "fly";
    w.appendChild(f);
    const mx = (sx + ex) / 2 + rnd(-24, 24),
      my = Math.min(sy, ey) - 40;
    const a = f.animate(
      [
        { transform: `translate(${sx}px,${sy}px) translate(-50%,-50%) scale(1)` },
        { transform: `translate(${mx}px,${my}px) translate(-50%,-50%) scale(.85)`, offset: 0.5 },
        { transform: `translate(${ex}px,${ey}px) translate(-50%,-50%) scale(.6)` },
      ],
      { duration: 480, easing: "cubic-bezier(.3,.6,.5,1)" },
    );
    a.onfinish = () => {
      f.remove();
      floatText(ex, ey + 24, v);
    };
  }

  /**
   * Décode un code de sauvegarde collé par l'utilisateur.
   * Tolère les espaces, guillemets, codes collés à la suite et caractères parasites au début ou
   * à la fin : la longueur annoncée après "~" permet de retrouver le bon morceau.
   * @returns {{save: object|null, why: string}} la sauvegarde, ou la raison de l'échec
   */
  function parseSave(raw) {
    if (!raw) return { save: null, why: "vide" };
    const at = raw.lastIndexOf("BD2:");
    let v = at >= 0 ? raw.slice(at + 4) : raw;
    const tail = v.match(/~(\d+)\s*["']?\s*$/);
    if (tail) v = v.slice(0, tail.index);
    const pad = (v.match(/=*\s*$/) || [""])[0].replace(/\s/g, "").length;
    v = v.replace(/[^A-Za-z0-9+/]/g, "");
    const want = tail ? +tail[1] - pad : 0;
    const cands = [v];
    if (tail && v.length > want) cands.push(v.slice(v.length - want), v.slice(0, want));
    for (const c of cands) {
      try {
        const o = JSON.parse(decodeURIComponent(escape(atob(c))));
        if (o && o.v === 2 && o.season && o.roster) return { save: o, why: "" };
      } catch (e) {}
    }
    if (tail && v.length < want)
      return { save: null, why: `incomplet : ${v.length + pad}/${tail[1]} car.` };
    return { save: null, why: `illisible, ${v.length + pad} car.` };
  }

  /** Copie un texte sans ouvrir le clavier : API presse-papiers, sinon textarea readonly hors écran. */
  async function copyText(txt) {
    try {
      await navigator.clipboard.writeText(txt);
      return true;
    } catch (e) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.readOnly = true;
      ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, txt.length);
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* ---------- actions ---------- */
  function act(a, el) {
    switch (a) {
      case "lang": {
        const m = $("#langMenu");
        m.hidden = !m.hidden;
        $("#langBtn").setAttribute("aria-expanded", String(!m.hidden));
        break;
      }
      case "shoot":
        shoot();
        updateLive();
        break;
      case "bb": {
        recalc();
        const g = C.pps * 40 + C.click * 5;
        gain(g);
        bb.show = false;
        bb.next = performance.now() + rnd(60000, 110000);
        el.hidden = true;
        toast(T("T_beater", fmt(g).toUpperCase()));
        updateLive();
        break;
      }
      case "sign": {
        const i = +el.dataset.i,
          p = S.prospects[i];
        if (!p) return;
        const c = signCost(p);
        if (S.roster.length >= slotsMax()) {
          toast(T("T_full"));
          return;
        }
        if (S.pts < c) return;
        S.pts -= c;
        S.roster.push(p);
        S.prospects.splice(i, 1);
        log("L_sign", [nm(p)], "good");
        toast(T("T_signs", nm(p).toUpperCase()));
        renderAll();
        break;
      }
      case "reroll": {
        const c = rerollCost();
        if (S.pts < c) return;
        S.pts -= c;
        S.rerolls++;
        S.prospects = genProspects();
        renderAll();
        break;
      }
      case "release": {
        const id = el.dataset.id;
        if (S.roster.length <= 1) {
          toast(T("T_keep"));
          return;
        }
        const p = S.roster.find((x) => x.id === id);
        S.roster = S.roster.filter((x) => x.id !== id);
        if (p) {
          syncLegend(p);
          log("L_release", [nm(p)]);
        }
        renderAll();
        break;
      }
      case "evtok":
        closeEvent(false);
        break;
      case "evtyes":
        closeEvent(true);
        break;
      case "evtno":
        closeEvent(false);
        break;
      case "care": {
        if (careDone()) return;
        const cap = CARE_CAPS[S.careTier];
        const give = Math.min(+el.dataset.amt, cap - S.care, S.pts);
        if (give <= 0) return;
        S.pts -= give;
        S.care += give;
        if (S.care >= cap - 0.5) {
          S.care = 0;
          S.careTier++;
          popQ.push("care" + S.careTier);
          showNextPop();
        }
        renderAll();
        save();
        break;
      }
      case "buy": {
        const u = UPG.find((x) => x.id === el.dataset.u);
        if (!u) return;
        const c = upCost(u);
        if (S.pts < c) return;
        S.pts -= c;
        S.upg[u.id]++;
        if (u.id === "reval") S.revTok++;
        renderAll();
        break;
      }
      case "reval": {
        const p = S.roster.find((x) => x.id === el.dataset.id);
        if (!p || !canReval(p) || revDoneNow(p) || S.revTok < 1) return;
        const c = revCost(p);
        if (S.pts < c) return;
        S.pts -= c;
        S.revTok--;
        revalue(p);
        p.rvS = S.seasonN;
        toast(T("T_reval", nm(p), p.r));
        renderAll();
        break;
      }
      case "duelcode": {
        duelMine = duelMake();
        copyText(duelMine).then((ok) => toast(T(ok ? "sv_copied" : "sv_made")));
        break;
      }
      case "duelgo": {
        const box = $("#duelBox");
        duelBox = (box && box.value) || duelBox;
        const theirs = duelParse(duelBox);
        if (!theirs) {
          toast(T("duelBad"));
          return;
        }
        duelRes = duelPlay(duelParse(duelMake()), theirs);
        renderSeason();
        break;
      }
      case "export": {
        save();
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
        // Le suffixe ~n permet de détecter un code coupé au collage.
        saveVal = "BD2:" + b64 + "~" + b64.length;
        renderSeason(); // affiche le code, sans donner le focus (pas de clavier sur mobile)
        copyText(saveVal).then((ok) => toast(T(ok ? "sv_copied" : "sv_made")));
        break;
      }
      case "import": {
        const b = $("#saveBox");
        const { save: o, why } = parseSave(((b && b.value) || saveVal).trim());
        if (!o) {
          toast(T("sv_bad") + " (" + why + ")");
          return;
        }
        if (armed !== "import") {
          arm("import");
          return;
        }
        armed = null;
        importing = true;
        try {
          localStorage.setItem(SAVE_KEY, JSON.stringify(o));
          toast(T("sv_ok"));
          setTimeout(() => location.reload(), 600);
        } catch (e) {
          toast(T("sv_bad"));
        }
        break;
      }
      case "popok":
        $("#pop").hidden = true;
        showNextPop();
        break;
      case "hoflist":
        hofList = !hofList;
        renderLegends();
        break;
      case "era":
        if (armed !== "era") {
          arm("era");
          return;
        }
        armed = null;
        newEra();
        break;
      case "reset":
        if (armed !== "reset") {
          arm("reset");
          return;
        }
        armed = null;
        try {
          localStorage.removeItem(SAVE_KEY);
        } catch (e) {}
        newState();
        tab = "court";
        showPick();
        renderAll();
        toTop();
        break;
    }
  }
  document.addEventListener("dblclick", (e) => {
    if (!/INPUT|TEXTAREA/.test(e.target.tagName)) e.preventDefault();
  });
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".lang")) closeMenu();
    const pk = e.target.closest("[data-pick]");
    if (pk) {
      startCareer(pk.dataset.pick === "f");
      return;
    }
    const lg = e.target.closest("[data-lang]");
    if (lg) {
      setLang(lg.dataset.lang);
      closeMenu();
      return;
    }
    const tb = e.target.closest("[data-tab]");
    if (tb) {
      const k = tb.dataset.tab;
      if ((k === "roster" || k === "club") && !S.un[k]) {
        toast(T("T_unlock", fmt(UNL[k])));
        return;
      }
      if (k === "legends" && !hofOpen()) {
        toast(T("T_hofLocked", S.rings, HOF_TITLES));
        return;
      }
      tab = k;
      renderTabs();
      toTop();
      return;
    }
    const sp = e.target.closest("[data-speed]");
    const speedBar = $(".speed");
    if (sp) {
      // Mobile : le premier appui déplie les vitesses, le second choisit et replie.
      if (matchMedia("(max-width: 899px)").matches && !speedBar.classList.contains("open")) {
        speedBar.classList.add("open");
        return;
      }
      S.speed = +sp.dataset.speed;
      speedBar.classList.remove("open");
      updateLive();
      return;
    }
    speedBar.classList.remove("open");
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    act(el.dataset.act, el);
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "saveBox") saveVal = e.target.value;
    if (e.target.id === "duelBox") duelBox = e.target.value;
  });
  $("#teamName").addEventListener("input", (e) => {
    S.name = e.target.value.trim() || (S.fem ? DEF_F : DEF_M);
    S.season.teams[0].name = S.name;
  });

  /* ---------- boucle ---------- */
  function away(sec) {
    recalc();
    const g = C.pps * Math.min(sec, 7200) * 0.5;
    gain(g);
    if (sec > 20) toast(T("T_away", fmt(g).toUpperCase()));
  }
  let lastT = performance.now(),
    acc = 0,
    saveAcc = 0;
  function frame() {
    const now = performance.now();
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (S.pending || S.event) return;
    if (S.speed === 0) {
      acc += dt;
      if (acc > 0.25) {
        acc = 0;
        updateLive();
      }
      return;
    }
    if (dt > 3) {
      away(dt);
      dt = 0.1;
    }
    dt *= S.speed;
    recalc();
    gain(C.pps * dt);
    {
      const m = mult() * dt;
      S.roster.forEach((p) => {
        if (!S.epidemic) p.pts = (p.pts || 0) + pp(p.r) * m;
      });
    }
    S.timer -= dt;
    if (S.timer <= 0) {
      S.timer = TICK;
      playTick();
    }
    if (!bb.show && now > bb.next) {
      bb.show = true;
      bb.until = now + 9000;
    } else if (bb.show && now > bb.until) {
      bb.show = false;
      bb.next = now + rnd(50000, 100000);
    }
    acc += dt;
    if (acc > 0.25 * S.speed) {
      acc = 0;
      checkUnlocks();
      checkHof();
      updateLive();
    }
    saveAcc += dt;
    if (saveAcc > 5 * S.speed) {
      saveAcc = 0;
      save();
    }
  }

  /* ---------- démarrage ---------- */
  S = load() || newState();
  if (![1, 2, 3, 5, 10].includes(S.speed)) S.speed = 1;
  $("#langMenu").innerHTML =
    `<button data-lang="fr">${flag("fr", "m1")}<span>Français</span></button><button data-lang="en">${flag("en", "m2")}<span>English</span></button>`;
  applyStatic();
  $("#teamName").value = S.name;
  recalc();
  if (!S.cur && S.season.phase !== "off") prepNext();
  if (!S.pending) {
    const d = (Date.now() - S.t) / 1000;
    if (d > 30) {
      const g = C.pps * Math.min(d, 7200) * 0.5;
      gain(g);
      setTimeout(() => toast(T("T_away", fmt(g).toUpperCase())), 500);
    }
  }
  renderAll();
  if (S.pending) showPick();
  else if (S.event) showEvent();
  setInterval(frame, 100);
  window.addEventListener("resize", setHdr);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHdr);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !S.pending) save();
  });
  window.addEventListener("pagehide", () => {
    if (!S.pending) save();
  });
})();
