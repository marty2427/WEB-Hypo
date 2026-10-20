(() => {
  "use strict";

  // Živá scéna v úvodu: slunce putuje po obloze, po západu vyjde měsíc a hvězdy,
  // občas přes louku proběhne srnka nebo zajíc.
  const hero = document.querySelector(".hero");
  const scene = hero && hero.querySelector(".hero__scene");
  if (!scene) return;

  const sun = hero.querySelector("[data-sun]");
  const moon = hero.querySelector("[data-moon]");
  const stars = hero.querySelector("[data-stars]");
  const herd = scene.querySelector("#zvirata");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const DAY = 80; // délka dne v sekundách
  const NIGHT = 40; // délka noci v sekundách
  const START = 0.32; // stránka se otevře dopoledne

  /* ---------- Hvězdy ---------- */
  for (let i = 0; i < 70; i++) {
    const s = document.createElement("span");
    const size = Math.random() < 0.15 ? 2.6 : Math.random() * 1.4 + 1;
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 62}%;width:${size}px;height:${size}px;animation-delay:${(Math.random() * 4).toFixed(2)}s`;
    stars.appendChild(s);
  }

  /* ---------- Barvy oblohy podle výšky slunce ---------- */
  const SKY = [
    [0.0, "#0b1a33", "#1c3558"],
    [0.06, "#29305e", "#b9577a"],
    [0.14, "#7c8dc4", "#f4a465"],
    [0.3, "#cfe3f3", "#fde7cf"],
    [0.55, "#e6f2fb", "#ffffff"],
    [1.0, "#e3f0fa", "#ffffff"]
  ];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const [x, y] = [hex(a), hex(b)];
    return "rgb(" + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",") + ")";
  };
  const smooth = (e0, e1, x) => {
    const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
    return t * t * (3 - 2 * t);
  };
  function skyAt(alt) {
    for (let i = 1; i < SKY.length; i++) {
      if (alt <= SKY[i][0]) {
        const [a0, t0, b0] = SKY[i - 1];
        const [a1, t1, b1] = SKY[i];
        const t = (alt - a0) / (a1 - a0);
        return [mix(t0, t1, t), mix(b0, b1, t)];
      }
    }
    return [SKY.at(-1)[1], SKY.at(-1)[2]];
  }

  /* ---------- Dráha slunce a měsíce ---------- */
  let geo = null;
  function measure() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    const sh = scene.getBoundingClientRect().height;
    const narrow = w < 860;
    geo = {
      x0: w * (narrow ? 0.08 : 0.4),
      x1: w * 0.97,
      horizon: h - sh * (narrow ? 0.35 : 0.3),
      // na mobilu zůstává slunce i měsíc pod textem, nad krajinou
      peak: narrow ? h - sh + 22 : 34
    };
  }
  function place(el, s) {
    const x = geo.x0 + (geo.x1 - geo.x0) * s;
    const y = geo.horizon - (geo.horizon - geo.peak) * Math.sin(Math.PI * s);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
  }

  let lastVars = 0;
  function setSky(s, isDay, now) {
    const alt = isDay ? Math.sin(Math.PI * s) : 0;
    if (now - lastVars < 200) return;
    lastVars = now;
    const night = isDay ? 1 - smooth(0.03, 0.22, alt) : 1;
    const [top, bottom] = skyAt(alt);
    hero.style.setProperty("--sky-top", top);
    hero.style.setProperty("--sky-bottom", bottom);
    hero.style.setProperty("--night", night.toFixed(3));
    hero.style.setProperty("--warm", (isDay ? 1 - smooth(0.05, 0.4, alt) : 0).toFixed(3));
    hero.classList.toggle("is-night", night > 0.5);
  }

  /* ---------- Srnky a zajíci ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const ANIMALS = {
    srnka: {
      speed: 230, scale: 1.25, gait: 0.42,
      svg: `<g class="legs-a" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round" fill="none"><path d="M14 -24 L26 -4 M11 -24 L21 -2 M-14 -24 L-28 -6 M-11 -24 L-23 -4"/></g>
<g class="legs-b" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round" fill="none"><path d="M14 -24 L9 -3 M11 -24 L5 -5 M-14 -24 L-7 -3 M-11 -24 L-2 -5"/></g>
<ellipse cx="0" cy="-30" rx="22" ry="10" fill="#b7793f"/>
<ellipse cx="-2" cy="-25" rx="15" ry="4" fill="#d9a46b" opacity=".7"/>
<ellipse cx="-21" cy="-33" rx="4.5" ry="3.5" fill="#ffffff"/>
<path d="M13 -35 L21 -54 L29 -51 L22 -30 Z" fill="#b7793f"/>
<ellipse cx="28" cy="-54" rx="9" ry="5.5" fill="#b7793f" transform="rotate(12 28 -54)"/>
<ellipse cx="21" cy="-60" rx="5" ry="2.4" fill="#9a6232" transform="rotate(-35 21 -60)"/>
<circle cx="36" cy="-52" r="1.8" fill="#3b2412"/>
<circle cx="28" cy="-56" r="1.2" fill="#1f130a"/>`
    },
    zajic: {
      speed: 140, scale: 1.2, gait: 0.5,
      svg: `<g class="legs-a" fill="#8f7a6d"><ellipse cx="-6" cy="-3" rx="7" ry="2.6"/></g>
<g class="legs-b" fill="#8f7a6d"><ellipse cx="-11" cy="-5" rx="6" ry="2.6" transform="rotate(-30 -11 -5)"/></g>
<ellipse cx="0" cy="-10" rx="11" ry="8" fill="#a48d7f"/>
<circle cx="10" cy="-16" r="5.5" fill="#a48d7f"/>
<ellipse cx="8" cy="-26" rx="2" ry="7" fill="#a48d7f" transform="rotate(-12 8 -26)"/>
<ellipse cx="11.5" cy="-25" rx="2" ry="7" fill="#998174" transform="rotate(8 11.5 -25)"/>
<ellipse cx="8.3" cy="-26" rx=".9" ry="5" fill="#f3c6c6" transform="rotate(-12 8.3 -26)"/>
<circle cx="-11" cy="-11" r="3.4" fill="#ffffff"/>
<circle cx="12" cy="-17" r="1.1" fill="#1f130a"/>
<ellipse cx="9" cy="-3" rx="3.5" ry="2" fill="#8f7a6d"/>`
    }
  };
  const PATH = { from: 470, to: 1350, y: 654, fade: 70 };
  let runners = [];

  function spawn() {
    const kind = Math.random() < 0.5 ? "srnka" : "zajic";
    const count = kind === "srnka" && Math.random() < 0.45 ? 2 : 1;
    const dir = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < count; i++) {
      const g = document.createElementNS(NS, "g");
      g.innerHTML = ANIMALS[kind].svg;
      g.style.opacity = "0";
      herd.appendChild(g);
      runners.push({ g, kind, dir, born: performance.now() + i * 650, dy: i * 7 });
    }
  }

  function moveRunners(now) {
    runners = runners.filter((r) => {
      const a = ANIMALS[r.kind];
      const t = (now - r.born) / 1000;
      if (t < 0) return true;
      const dist = a.speed * t;
      const span = PATH.to - PATH.from;
      if (dist > span) {
        r.g.remove();
        return false;
      }
      const x = r.dir > 0 ? PATH.from + dist : PATH.to - dist;
      const phase = (t / a.gait) * Math.PI * 2;
      const lift = r.kind === "srnka" ? Math.abs(Math.sin(phase / 2)) * 9 : Math.max(0, Math.sin(phase)) * 13;
      const up = r.kind === "srnka" ? Math.sin(phase) > 0 : lift > 2;
      r.g.firstElementChild.style.opacity = up ? 0 : 1;
      r.g.children[1].style.opacity = up ? 1 : 0;
      r.g.style.opacity = Math.min(1, dist / PATH.fade, (span - dist) / PATH.fade).toFixed(2);
      r.g.setAttribute("transform", `translate(${x.toFixed(1)} ${(PATH.y + r.dy - lift).toFixed(1)}) scale(${r.dir * a.scale} ${a.scale})`);
      return true;
    });
  }

  let nextSpawn = performance.now() + 5000;

  /* ---------- Hlavní smyčka ---------- */
  let running = true;
  const t0 = performance.now() - START * DAY * 1000;

  function frame(now) {
    if (!running) return;
    const t = ((now - t0) / 1000) % (DAY + NIGHT);
    if (t < DAY) {
      const s = t / DAY;
      place(sun, s);
      sun.style.opacity = 1;
      moon.style.opacity = 0;
      setSky(s, true, now);
    } else {
      const s = (t - DAY) / NIGHT;
      place(moon, s);
      sun.style.opacity = 0;
      moon.style.opacity = (smooth(0, 0.06, s) * (1 - smooth(0.94, 1, s))).toFixed(3);
      setSky(s, false, now);
    }
    if (now > nextSpawn) {
      spawn();
      nextSpawn = now + 14000 + Math.random() * 18000;
    }
    moveRunners(now);
    requestAnimationFrame(frame);
  }

  measure();
  addEventListener("resize", measure);

  if (reduceMotion) {
    // Bez animací: klidné dopoledne.
    place(sun, 0.4);
    setSky(0.4, true, Infinity);
    return;
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      const wasRunning = running;
      running = entry.isIntersecting;
      if (running && !wasRunning) requestAnimationFrame(frame);
    }).observe(hero);
  }
  requestAnimationFrame(frame);
})();
