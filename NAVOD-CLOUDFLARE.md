# Zveřejnění webu přes Cloudflare – všechno udělá Cowork

**Co uděláte vy:** zkopírujete celý text v rámečku níže a vložíte ho do Coworku.
Nic dalšího nastavovat nemusíte. Cowork vše provede sám a zeptá se vás jen na údaje,
které nemůže znát (jméno, telefon, kam chodí poptávky, případně doména).

Výsledek: web poběží na adrese typu `https://web-hypo.pages.dev` (zdarma), případně
na vaší vlastní doméně. Každá další změna v repozitáři se na webu objeví automaticky.

---

## Zadání pro Cowork (zkopírujte celé)

```text
Zveřejni můj web s hypoteční kalkulačkou na internetu přes Cloudflare Pages.
Udělej všechno sám v prohlížeči od začátku do konce. Mě se ptej jen na údaje,
které opravdu nemůžeš zjistit sám, a to nejlépe všechno najednou na začátku.
Nic neplať, používej jen bezplatné tarify.

O webu:
- Repozitář na GitHubu: marty2427/WEB-Hypo
- Hotový web je ve větvi: claude/admiring-galileo-rps00e
- Je to čistě statický web (index.html, styles.css, app.js, config.js, rates.js,
  složka assets). Nic se nesestavuje, není potřeba žádný build.

Na začátku se mě zeptej (jednou zprávou) na:
1. Název webu (teď „HypoRadar“).
2. Moje jméno, jak se má zobrazovat na webu.
3. Telefon, který má být na webu.
4. E-mail, na který mají chodit poptávky z formuláře.
5. Jestli mám vlastní doménu, kterou chci použít (a u koho je registrovaná).
   Pokud žádnou nemám, použij jen bezplatnou adresu *.pages.dev.

Postup:
1. GitHub: v repozitáři marty2427/WEB-Hypo vytvoř hlavní větev „main“ z větve
   claude/admiring-galileo-rps00e (pokud „main“ už existuje, slouč do ní tuto větev
   přes pull request) a nastav „main“ jako výchozí větev repozitáře.
2. GitHub: ve větvi main uprav soubor config.js:
   - brand = název webu,
   - advisorName = moje jméno,
   - phone = telefon,
   - formEndpoint vyplníš v kroku 4.
   Změnu ulož (Commit changes přímo do main).
3. Cloudflare: otevři https://dash.cloudflare.com (pokud nemám účet, založ ho
   na Free tarifu). Jdi do Workers & Pages → Create → záložka Pages →
   Connect to Git. Propoj GitHub a povol přístup jen k repozitáři WEB-Hypo.
   Nastavení projektu:
   - Project name: web-hypo (pokud je obsazený, zvol podobný)
   - Production branch: main
   - Framework preset: None
   - Build command: nech prázdné
   - Build output directory: /
   Klikni na Save and Deploy a počkej na dokončení.
4. Poptávky z formuláře: na https://formspree.io založ bezplatný účet a nový
   formulář, cílový e-mail = e-mail z mé odpovědi. Adresu formuláře
   (https://formspree.io/f/...) vlož do config.js do formEndpoint ve větvi main
   a ulož. Cloudflare web automaticky znovu nasadí.
5. Vlastní doména (jen pokud ji mám): v projektu na Cloudflare otevři
   Custom domains → Set up a custom domain a přidej ji (www i bez www).
   Pokud je doména u jiného registrátora, přihlas se k němu a nastav DNS
   záznamy přesně podle toho, co ukáže Cloudflare (obvykle CNAME na *.pages.dev).
6. Kontrola: otevři výslednou adresu, ověř, že se stránka načte, kalkulačka
   počítá (zkus nový úvěr i refinancování) a vypadá dobře i v úzkém (mobilním)
   okně. Odešli zkušební poptávku a ověř, že dorazila na můj e-mail
   (první poptávku je ve Formspree potřeba potvrdit – potvrď ji).

Pokud narazíš na přihlášení, ověřovací kód nebo potvrzovací e-mail, vyřeš to
sám, pokud k tomu máš přístup (např. moje e-mailová schránka nebo přihlášený
prohlížeč). Mě požádej, jen když to jinak nejde.

Na konci mi pošli:
- odkaz na hotový web,
- co jsi kde nastavil (účty, projekt, doména),
- kde budu v budoucnu měnit sazby (soubor rates.js v repozitáři).
```

---

## Pro představu: co Cowork nastaví

| Kde | Co |
| --- | --- |
| GitHub | větev `main` s hotovým webem, vyplněný `config.js` |
| Cloudflare Pages | projekt `web-hypo` napojený na GitHub, bez buildu, výstup `/` |
| Formspree | formulář, který posílá poptávky z webu na váš e-mail |
| Doména (volitelně) | připojená v Cloudflare, HTTPS automaticky |

Sazby se později mění v souboru `rates.js`. Po uložení změny do větve `main`
je Cloudflare do minuty nasadí na web.
