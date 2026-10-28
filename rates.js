/*
 * Aktuální orientační sazby hypoték.
 *
 * Tohle je JEDINÉ místo, kde se sazby mění. Web z nich počítá rozpětí splátky.
 *  - ltv80 = úvěr do 80 % hodnoty nemovitosti
 *  - ltv90 = úvěr nad 80 % a do 90 % hodnoty nemovitosti
 *  - min / max = rozpětí nabídek bank, avg = průměrná (nejpravděpodobnější) sazba
 *
 * Zdroj aktuálních hodnot: Swiss Life Hypoindex, říjen 2026 (zveřejněno 7. 10. 2026),
 * průměr 5,79 %. Do 80 % LTV: 3 roky 5,53 %, 5 let 5,84 %, 10 let 6,35 %;
 * nad 80 % LTV: 3 roky 5,84 %, 5 let 6,15 %, 10 let 6,61 %.
 * Odhady: fixace 7 let (průměr 5 a 10 let) a hodnoty min/max (průměr ∓ 0,55 p. b.).
 * Sazby každý týden kontroluje naplánovaná úloha „Týdenní aktualizace sazeb hypoték“.
 *
 * Spotřebitelské úvěry (consumer): avg = průměrná sazba nových úvěrů na spotřebu dle ČNB
 * (srpen 2026: 7,99 %), min = nejnižší běžná nabídka velkých bank (Česká spořitelna od 4,39 %,
 * Air Bank od 4,4 %, Komerční banka od 4,69 %; říjen 2026), max = odhad vyšších nabídek
 * (avg + (avg − min)). Splatnost až 10 let.
 */
window.HYPO_RATES = {
  // Datum poslední úpravy sazeb (interní údaj). Web návštěvníkům ukazuje vždy dnešní datum.
  updated: "2026-10-20",
  sourceNote:
    "Orientační rozpětí vychází z průměrných nabídkových sazeb českých bank (Swiss Life Hypoindex, říjen 2026). Konkrétní sazba závisí na bance, vaší bonitě a poměru úvěru k hodnotě nemovitosti.",
  defaultFixation: 5,
  consumer: { updated: "2026-10-28", min: 4.39, avg: 7.99, max: 11.59, maxYears: 10 },
  fixations: [
    { years: 3,  ltv80: { min: 4.98, avg: 5.53, max: 6.08 }, ltv90: { min: 5.29, avg: 5.84, max: 6.39 } },
    { years: 5,  ltv80: { min: 5.29, avg: 5.84, max: 6.39 }, ltv90: { min: 5.60, avg: 6.15, max: 6.70 } },
    { years: 7,  ltv80: { min: 5.55, avg: 6.10, max: 6.65 }, ltv90: { min: 5.83, avg: 6.38, max: 6.93 } },
    { years: 10, ltv80: { min: 5.80, avg: 6.35, max: 6.90 }, ltv90: { min: 6.06, avg: 6.61, max: 7.16 } }
  ]
};
