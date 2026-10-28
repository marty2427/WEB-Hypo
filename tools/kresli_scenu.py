"""Vykreslí krajinu v úvodu stránky (dům, garáž s autem, bazén, louka s jezírkem)
a vloží ji do index.html mezi značky <!--SCENA--> a <!--/SCENA-->.

Spuštění:  python3 tools/kresli_scenu.py
"""
import math
import random
import re
from pathlib import Path

random.seed(7)
W, H = 2400, 720
# Dům se kreslí v původních (místních) souřadnicích a zvětší se kolem základny.
S = 1.5
HOUSE = f"translate(1380 608) scale({S}) translate(-880 -608)"


def hill_y(x, pts):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= x <= x1:
            t = (1 - math.cos((x - x0) / (x1 - x0) * math.pi)) / 2
            return y0 + (y1 - y0) * t
    return pts[-1][1]


def hill_path(pts, fill):
    d = f"M0 {pts[0][1]}" + "".join(f" L{x} {hill_y(x, pts):.0f}" for x in range(0, W + 1, 20))
    return f'<path d="{d} V{H} H0Z" fill="{fill}"/>'


def tree(x, base, s, c1, c2):
    return (f'<g><rect x="{x-2.5*s:.0f}" y="{base-38*s:.0f}" width="{5*s:.0f}" height="{38*s:.0f}" fill="#9c7a5b"/>'
            f'<circle cx="{x:.0f}" cy="{base-48*s:.0f}" r="{22*s:.0f}" fill="{c1}"/>'
            f'<circle cx="{x-14*s:.0f}" cy="{base-36*s:.0f}" r="{15*s:.0f}" fill="{c1}"/>'
            f'<circle cx="{x+15*s:.0f}" cy="{base-37*s:.0f}" r="{16*s:.0f}" fill="{c2}"/>'
            f'<circle cx="{x+4*s:.0f}" cy="{base-62*s:.0f}" r="{14*s:.0f}" fill="{c2}"/></g>')


def scene():
    o = []
    A = o.append
    A(f'<svg class="hero__scene" viewBox="0 0 {W} {H}" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">')
    A('''<defs>
<linearGradient id="g-win" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0f2fe"/><stop offset="1" stop-color="#7dd3fc"/></linearGradient>
<linearGradient id="g-lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ad6c0"/><stop offset="1" stop-color="#6fc0a4"/></linearGradient>
<linearGradient id="g-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cbe9df"/><stop offset="1" stop-color="#b3dfd0"/></linearGradient>
<linearGradient id="g-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bae6fd"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>
<linearGradient id="g-pool" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a5f3fc"/><stop offset="1" stop-color="#06b6d4"/></linearGradient>
</defs>''')

    # kopce v dálce a jehličnany
    far = [(0, 540), (400, 505), (800, 522), (1200, 488), (1600, 508), (1860, 470), (2110, 486), (2400, 466)]
    mid = [(0, 594), (450, 562), (900, 582), (1350, 560), (1700, 575), (1960, 552), (2200, 563), (2400, 548)]
    A(hill_path(far, "#e1f1ec"))
    for x in range(10, W, 26):
        if random.random() < .55:
            h = random.uniform(16, 34)
            y = hill_y(x, far) + 4
            A(f'<polygon points="{x-h*.3:.0f},{y:.0f} {x:.0f},{y-h:.0f} {x+h*.3:.0f},{y:.0f}" fill="#c4e3d9"/>')
    A(hill_path(mid, "url(#g-mid)"))
    for x in [80, 230, 390, 560, 720, 900, 1060, 1230, 1640, 1780, 2240]:
        s = random.uniform(.7, 1.1)
        A(tree(x + random.uniform(-25, 25), hill_y(x, mid) + 6, s, "#8fcfba", "#a3dac7"))

    # tráva
    A(f'<path d="M0 662 C 500 628 1100 640 1600 618 S 2280 600 {W} 598 V{H} H0Z" fill="url(#g-lawn)"/>')

    # louka: trsy trávy a luční kvítí
    for _ in range(90):
        x = random.uniform(420, 1360)
        y = random.uniform(650, 712)
        if 1020 < x < 1340 and 640 < y < 712:
            continue
        h = random.uniform(6, 12)
        A(f'<path d="M{x-3:.0f} {y:.0f} L{x-5:.0f} {y-h:.0f} M{x:.0f} {y:.0f} L{x:.0f} {y-h-3:.0f} M{x+3:.0f} {y:.0f} L{x+5:.0f} {y-h:.0f}" stroke="#4fa585" stroke-width="2" stroke-linecap="round" fill="none"/>')
    for _ in range(70):
        x = random.uniform(420, 1360)
        y = random.uniform(648, 714)
        if 1020 < x < 1340 and 640 < y < 712:
            continue
        A(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(2,3.2):.1f}" fill="{random.choice(["#facc15","#f472b6","#ffffff","#c084fc","#fb923c"])}"/>')

    # jehličnany za bazénem
    for x, h, c in [(2338, 150, "#2f8f7c"), (2372, 118, "#3a9f8a"), (2404, 176, "#277a6a")]:
        A(f'<polygon points="{x-h*.28:.0f},606 {x},{606-h} {x+h*.28:.0f},606" fill="{c}"/><rect x="{x-4}" y="600" width="8" height="10" fill="#8b6b4f"/>')

    # zvířata (běhají za jezírkem; plní je scene.js)
    A('<g id="zvirata"></g>')

    # jezírko
    A('''<g class="pond">
<ellipse cx="1180" cy="678" rx="142" ry="30" fill="#5fae8f"/>
<ellipse cx="1180" cy="678" rx="130" ry="23" fill="url(#g-water)"/>
<ellipse cx="1150" cy="672" rx="60" ry="5" fill="#ffffff" opacity=".35" class="shimmer"/>
<ellipse cx="1225" cy="686" rx="34" ry="3" fill="#ffffff" opacity=".3" class="shimmer shimmer--2"/>
<ellipse cx="1120" cy="684" rx="16" ry="5" fill="#3f9d72"/><ellipse cx="1146" cy="690" rx="12" ry="4" fill="#4cae80"/>
<circle cx="1122" cy="682" r="3" fill="#f9a8d4"/>
<ellipse cx="1262" cy="676" rx="13" ry="4" fill="#3f9d72"/>
<g stroke="#4d7c5a" stroke-width="2.4" stroke-linecap="round">
<path d="M1052 684 L1048 646 M1060 686 L1060 640 M1068 684 L1072 650 M1300 682 L1304 650 M1308 680 L1308 644"/>
</g>
<g fill="#7c4a2d"><rect x="1045" y="644" width="5" height="14" rx="2.5"/><rect x="1058" y="638" width="5" height="14" rx="2.5"/><rect x="1306" y="642" width="5" height="14" rx="2.5"/></g>
</g>''')

    # dům, garáž s autem
    A(f'<g transform="{HOUSE}">')
    A('''<rect x="1150" y="436" width="18" height="52" fill="#475569"/>
<rect x="1010" y="486" width="190" height="122" fill="#ffffff"/>
<rect x="1010" y="486" width="190" height="10" fill="#e2e8f0"/>
<polygon points="990,494 1105,402 1220,494" fill="#334155"/>
<polyline points="990,494 1105,402 1220,494" fill="none" stroke="#1e293b" stroke-width="4" stroke-linejoin="round"/>
<circle cx="1105" cy="458" r="14" fill="url(#g-win)" stroke="#1e293b" stroke-width="3"/>
<rect x="1028" y="516" width="60" height="52" rx="3" fill="url(#g-win)" stroke="#cbd5e1" stroke-width="2"/>
<path d="M1058 516 V568 M1028 542 H1088" stroke="#ffffff" stroke-width="3"/>
<path d="M1034 560 L1052 522" stroke="#ffffff" stroke-width="3" opacity=".6"/>
<rect x="1120" y="530" width="34" height="78" rx="2" fill="#0f766e"/>
<rect x="1126" y="538" width="22" height="14" rx="2" fill="url(#g-win)"/>
<circle cx="1147" cy="574" r="2.5" fill="#fbbf24"/>
<rect x="1166" y="516" width="24" height="52" rx="3" fill="url(#g-win)" stroke="#cbd5e1" stroke-width="2"/>
<rect x="1200" y="528" width="118" height="80" fill="#f1f5f9"/>
<rect x="1194" y="519" width="130" height="11" rx="2" fill="#334155"/>
<rect x="1214" y="542" width="92" height="66" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
<path d="M1214 555 H1306 M1214 568 H1306 M1214 581 H1306 M1214 594 H1306" stroke="#cbd5e1" stroke-width="2"/>
<rect x="1010" y="600" width="308" height="8" fill="#cbd5e1"/>
<polygon points="1210,608 1310,608 1334,636 1194,636" fill="#d6dde5"/>
<polygon points="1120,608 1154,608 1176,636 1100,636" fill="#f8fafc" opacity=".85"/>
<ellipse cx="1260" cy="614" rx="56" ry="4" fill="#0f172a" opacity=".16"/>
<path d="M1204 606 L1206 592 Q1208 585 1217 584 L1232 583 L1245 571 Q1249 568 1255 568 L1281 568 Q1288 568 1292 573 L1301 583 L1309 584 Q1317 586 1317 594 L1317 606 Z" fill="#dc2626"/>
<path d="M1237 583 L1247 573 L1262 573 L1262 583 Z M1266 573 L1281 573 Q1286 573 1289 577 L1294 583 L1266 583 Z" fill="#bae6fd"/>
<path d="M1264 586 V603" stroke="#b91c1c" stroke-width="1.6"/>
<path d="M1209 594 H1314" stroke="#ffffff" stroke-width="1.4" opacity=".35"/>
<rect x="1312" y="589" width="5" height="4" rx="1" fill="#fde68a"/>
<rect x="1204" y="590" width="4" height="5" rx="1" fill="#7f1d1d"/>
<circle cx="1224" cy="606" r="9" fill="#1f2937"/><circle cx="1224" cy="606" r="4" fill="#cbd5e1"/>
<circle cx="1298" cy="606" r="9" fill="#1f2937"/><circle cx="1298" cy="606" r="4" fill="#cbd5e1"/>
<rect x="943" y="520" width="13" height="92" fill="#8b6b4f"/>
<path d="M949 560 L925 538 M950 548 L974 528" stroke="#8b6b4f" stroke-width="5" stroke-linecap="round"/>
<circle cx="950" cy="498" r="48" fill="#2f9e8a"/>
<circle cx="912" cy="520" r="34" fill="#28907d"/>
<circle cx="990" cy="522" r="36" fill="#3aae97"/>
<circle cx="954" cy="462" r="34" fill="#45b9a1"/>
<circle cx="972" cy="474" r="14" fill="#ffffff" opacity=".22"/>''')
    for x, r, c in [(1006, 15, "#3aae97"), (1030, 12, "#2f9e8a"), (1094, 10, "#45b9a1"), (1186, 11, "#2f9e8a"), (890, 14, "#2f9e8a")]:
        A(f'<circle cx="{x}" cy="{606-r*.4:.0f}" r="{r}" fill="{c}"/>')
    for _ in range(18):
        x = random.uniform(990, 1110)
        A(f'<circle cx="{x:.0f}" cy="{random.uniform(610, 626):.0f}" r="{random.uniform(1.6,2.6):.1f}" fill="{random.choice(["#f59e0b","#ec4899","#f87171","#facc15"])}"/>')
    # satelitní anténa (radar) na střeše
    A('''<g class="radar">
<path d="M1058 440 L1060 410" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>
<path d="M1049 440 H1068" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>
<ellipse cx="1066" cy="407" rx="19" ry="8" transform="rotate(-35 1066 407)" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
<ellipse cx="1066" cy="407" rx="11" ry="4.5" transform="rotate(-35 1066 407)" fill="#e2e8f0"/>
<path d="M1066 407 L1081 392" stroke="#475569" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="1081" cy="392" r="3" fill="#334155"/>
</g>''')
    A('</g>')

    # bazén
    A('''<g class="pool">
<polygon points="2058,632 2318,632 2346,684 2034,684" fill="#e7ecf1"/>
<polygon points="2070,638 2306,638 2330,678 2050,678" fill="url(#g-pool)"/>
<path d="M2090 650 Q2110 646 2130 650 T2170 650 M2200 664 Q2220 660 2240 664 T2280 664" stroke="#ffffff" stroke-width="2.4" fill="none" opacity=".7" class="shimmer"/>
<g stroke="#94a3b8" stroke-width="3" stroke-linecap="round"><path d="M2284 624 L2288 646 M2298 624 L2302 646 M2285 631 H2299 M2287 639 H2301"/></g>
<rect x="2100" y="616" width="46" height="8" rx="3" fill="#f8fafc" stroke="#cbd5e1"/>
<path d="M2104 624 V631 M2142 624 V631" stroke="#94a3b8" stroke-width="2.4"/>
<path d="M2190 572 V632" stroke="#64748b" stroke-width="3"/>
<path d="M2150 584 Q2190 556 2230 584 Z" fill="#ef4444"/>
<path d="M2170 584 Q2190 556 2190 556 Q2190 556 2210 584 Z" fill="#ffffff"/>
</g>''')
    A('</svg>')
    return "\n".join(o)


def lights():
    """Rozsvícená okna a podsvícený bazén – zobrazí se jen v noci."""
    return f'''<svg class="hero__scene hero__lights" viewBox="0 0 {W} {H}" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
<defs>
<radialGradient id="g-glow"><stop offset="0" stop-color="#fbbf24" stop-opacity=".55"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
<radialGradient id="g-poolglow"><stop offset="0" stop-color="#22d3ee" stop-opacity=".6"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
</defs>
<g transform="{HOUSE}">
<ellipse cx="1100" cy="560" rx="150" ry="80" fill="url(#g-glow)"/>
<g fill="#fcd34d">
<rect x="1028" y="516" width="60" height="52" rx="3"/>
<rect x="1166" y="516" width="24" height="52" rx="3"/>
<circle cx="1105" cy="458" r="13"/>
<rect x="1126" y="538" width="22" height="14" rx="2"/>
</g>
<path d="M1058 516 V568 M1028 542 H1088" stroke="#b45309" stroke-width="2.5" opacity=".5"/>
<circle cx="1206" cy="536" r="4" fill="#fef3c7"/>
<ellipse cx="1206" cy="560" rx="20" ry="26" fill="url(#g-glow)"/>
</g>
<ellipse cx="2190" cy="658" rx="190" ry="50" fill="url(#g-poolglow)"/>
<polygon points="2070,638 2306,638 2330,678 2050,678" fill="#22d3ee" opacity=".75"/>
</svg>'''


def beacon():
    """Blikající světlo antény a vysílané vlny – svítí ve dne i v noci (bez stmavení)."""
    cx, cy = 1081, 392
    waves = []
    for i, r in enumerate((12, 21, 30)):
        a0, a1 = math.radians(-65), math.radians(0)
        x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        waves.append(f'<path class="beacon__wave beacon__wave--{i+1}" d="M{x0:.1f} {y0:.1f} A{r} {r} 0 0 1 {x1:.1f} {y1:.1f}"/>')
    return (f'<svg class="hero__scene hero__beacon" viewBox="0 0 {W} {H}" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">\n'
            f'<g transform="{HOUSE}">\n'
            f'<g fill="none" stroke="#0d9488" stroke-width="3.4" stroke-linecap="round">{"".join(waves)}</g>\n'
            f'<circle class="beacon__glow" cx="{cx}" cy="{cy}" r="10" fill="#f87171"/>\n'
            f'<circle class="beacon__led" cx="{cx}" cy="{cy}" r="3.6" fill="#ef4444"/>\n'
            '</g>\n</svg>')


html_path = Path(__file__).resolve().parent.parent / "index.html"
html = html_path.read_text()
block = "<!--SCENA-->\n" + scene() + "\n" + lights() + "\n" + beacon() + "\n<!--/SCENA-->"
html, n = re.subn(r"<!--SCENA-->.*?<!--/SCENA-->", lambda _: block, html, flags=re.S)
assert n == 1, "V index.html chybí značky <!--SCENA--> a <!--/SCENA-->"
html_path.write_text(html)
print("Scéna vložena do index.html")
