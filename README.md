# Hypoteční kalkulačka (WEB-Hypo)

Jednoduchý moderní web pro klienty a zájemce o hypotéku. Návštěvník zadá, zda chce
**nový úvěr** nebo **refinancování**, výši úvěru / hodnotu nemovitosti, dobu splatnosti
a fixaci – web mu okamžitě ukáže **orientační rozpětí měsíční splátky** podle aktuálních
sazeb bank a nabídne odeslání nezávazné poptávky.

Čistý statický web (HTML + CSS + JS), bez buildu a bez závislostí – stačí nahrát na
jakýkoli hosting (GitHub Pages, Netlify, Vercel, Wedos…), nebo otevřít `index.html`.

## Soubory

| Soubor | K čemu slouží |
| --- | --- |
| `index.html` | Struktura stránky |
| `styles.css` | Vzhled |
| `app.js` | Výpočet splátky, LTV, srovnání při refinancování, formulář |
| `rates.js` | **Aktuální sazby** – jediné místo, kde se mění |
| `config.js` | Jméno, telefon, e-mail a kam chodí poptávky |
| `scene.js` | Živá scéna v úvodu: slunce, měsíc, hvězdy, běhající srnky a zajíci |
| `tools/kresli_scenu.py` | Vykreslí krajinu (dům, garáž, bazén, louka) do `index.html` |

## Aktualizace sazeb

Upravte `rates.js`: pro každou fixaci rozpětí `min` / `avg` / `max`
zvlášť pro úvěry do 80 % LTV (`ltv80`) a nad 80 % LTV (`ltv90`).

Výchozí hodnoty vycházejí z veřejných průměrných nabídkových sazeb bank (Swiss Life
Hypoindex, říjen 2026). Do budoucna se mají plnit z interních informací – e-mailů
s aktuálními sazbami bank. Formát `rates.js` je navržený tak, aby ho šlo snadno
přepisovat automaticky (např. pravidelnou úlohou, která přečte e-maily se sazbami
a soubor aktualizuje).

Návštěvníkům se u sazeb vždy zobrazuje dnešní datum.

## Zveřejnění

Návod, jak web dostat online přes Cloudflare Pages (včetně zadání pro Cowork), je v
[NAVOD-CLOUDFLARE.md](NAVOD-CLOUDFLARE.md).

## Poptávkový formulář

V `config.js`:

- `email` – po odeslání se návštěvníkovi otevře e-mail s vyplněnou poptávkou na tuto adresu,
- `formEndpoint` – nebo URL formulářové služby (např. Formspree); poptávka se pak odešle
  přímo z webu bez e-mailového klienta (doporučeno).

## Spuštění lokálně

```bash
python3 -m http.server 8000
# a otevřít http://localhost:8000
```
