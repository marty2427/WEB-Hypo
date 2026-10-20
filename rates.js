/*
 * Aktuální orientační sazby hypoték.
 *
 * Tohle je JEDINÉ místo, kde se sazby mění. Web z nich počítá rozpětí splátky.
 *  - ltv80 = úvěr do 80 % hodnoty nemovitosti
 *  - ltv90 = úvěr nad 80 % a do 90 % hodnoty nemovitosti
 *  - min / max = rozpětí nabídek bank, avg = průměrná (nejpravděpodobnější) sazba
 *
 * Zdroj aktuálních hodnot: průměrné nabídkové sazby bank dle Swiss Life Hypoindexu
 * (říjen 2026: průměr 5,79 %, fixace 1 rok 5,42 %, fixace 10 let 6,35 % do 80 % LTV).
 * Fixace 3, 5 a 7 let jsou dopočtené odhady. Později se budou plnit z interních
 * informací (e-maily s aktuálními sazbami bank).
 */
window.HYPO_RATES = {
  // Datum poslední úpravy sazeb (interní údaj). Web návštěvníkům ukazuje vždy dnešní datum.
  updated: "2026-10-08",
  sourceNote:
    "Orientační rozpětí vychází z průměrných nabídkových sazeb českých bank (Swiss Life Hypoindex, říjen 2026). Konkrétní sazba závisí na bance, vaší bonitě a poměru úvěru k hodnotě nemovitosti.",
  defaultFixation: 5,
  fixations: [
    { years: 3,  ltv80: { min: 4.99, avg: 5.55, max: 6.09 }, ltv90: { min: 5.29, avg: 5.85, max: 6.39 } },
    { years: 5,  ltv80: { min: 5.19, avg: 5.75, max: 6.29 }, ltv90: { min: 5.49, avg: 6.05, max: 6.59 } },
    { years: 7,  ltv80: { min: 5.39, avg: 5.95, max: 6.49 }, ltv90: { min: 5.69, avg: 6.25, max: 6.79 } },
    { years: 10, ltv80: { min: 5.79, avg: 6.35, max: 6.89 }, ltv90: { min: 6.09, avg: 6.65, max: 7.19 } }
  ]
};
