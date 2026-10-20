# Jak dostat web online přes Cloudflare

Web je čistě statický (HTML, CSS, JS), nic se nesestavuje. Na Cloudflare Pages ho
proto stačí připojit k GitHubu a Cloudflare ho sám zveřejní. Hosting je zdarma
a každá další změna v repozitáři se na webu objeví automaticky během minuty.

Výsledek: web poběží na adrese typu `https://web-hypo.pages.dev` a volitelně
na vaší vlastní doméně (např. `www.vase-hypoteka.cz`).

---

## Než začnete

1. **Vyplňte `config.js`** (přímo na GitHubu: otevřít soubor → ikona tužky → upravit → *Commit changes*):
   - `brand` – název webu (teď je tam pracovní „HypoPlán“),
   - `advisorName` – vaše jméno,
   - `phone` – telefon,
   - `formEndpoint` – adresa, kam se pošle poptávka z formuláře (viz krok 5).
     Dokud není vyplněná ani ona, ani `email`, poptávky z webu nikam neodcházejí.
2. **Rozhodněte, ze které větve se bude web zveřejňovat.** Hotový web je teď ve větvi
   `claude/admiring-galileo-rps00e`. Doporučuji ho sloučit do hlavní větve `main`
   (pull request → *Merge*) a zveřejňovat z `main`. Případně lze v Cloudflare zvolit
   přímo tuto větev.

---

## Krok 1 – Účet na Cloudflare

1. Otevřete <https://dash.cloudflare.com/sign-up> a založte si účet (stačí e-mail a heslo, tarif Free).
2. Potvrďte e-mail.

## Krok 2 – Vytvoření projektu Pages

1. V Cloudflare dashboardu v levém menu otevřete **Workers & Pages** (bývá pod *Compute*).
2. Klikněte na **Create** / **Create application**.
3. Přepněte na záložku **Pages** (pokud ji nevidíte, dole bývá odkaz *Looking to deploy Pages? Get started*).
4. Zvolte **Connect to Git** (Importovat existující Git repozitář).
5. Přihlaste se ke **GitHubu** a povolte Cloudflare přístup k repozitáři **`WEB-Hypo`**
   (stačí vybrat jen tento jeden repozitář).
6. Vyberte repozitář `marty2427/WEB-Hypo` → **Begin setup**.

## Krok 3 – Nastavení sestavení

| Pole | Hodnota |
| --- | --- |
| Project name | `web-hypo` (bude součástí adresy `web-hypo.pages.dev`) |
| Production branch | `main` (nebo `claude/admiring-galileo-rps00e`) |
| Framework preset | **None** |
| Build command | *nechat prázdné* |
| Build output directory | `/` |

Klikněte na **Save and Deploy**. Za chvíli bude web běžet na `https://web-hypo.pages.dev`.

## Krok 4 – Vlastní doména (volitelné)

1. V projektu otevřete záložku **Custom domains** → **Set up a custom domain**.
2. Zadejte doménu, např. `www.vase-hypoteka.cz`.
3. Pokud doménu spravuje Cloudflare, DNS záznam se nastaví sám.
   Pokud je doména u jiného registrátora (Wedos, Forpsi, Active24…), přidejte u něj
   záznam **CNAME** `www` → `web-hypo.pages.dev`. Cloudflare ukáže přesné hodnoty.
4. HTTPS certifikát se vystaví automaticky (obvykle do několika minut).

## Krok 5 – Aby poptávky z formuláře chodily k vám

Nejjednodušší je bezplatná služba **Formspree**:

1. Na <https://formspree.io> si založte účet a vytvořte nový formulář (*New form*),
   jako cílový e-mail zadejte ten, kam chcete poptávky dostávat.
2. Zkopírujte adresu formuláře, vypadá jako `https://formspree.io/f/abcdwxyz`.
3. Vložte ji do `config.js` do `formEndpoint: "https://formspree.io/f/abcdwxyz"` a uložte.
4. Web se sám znovu zveřejní. Vyzkoušejte odeslat poptávku – první zprávu je ve Formspree
   potřeba potvrdit.

## Další úpravy

Cokoli změníte v repozitáři (sazby v `rates.js`, kontakty v `config.js`, texty v `index.html`)
a uložíte do zveřejňované větve, Cloudflare do minuty nasadí na web.

---

## Zadání pro Cowork (zkopírujte celé)

> Pomoz mi zveřejnit můj web s hypoteční kalkulačkou přes Cloudflare Pages. Postupuj
> v prohlížeči krok za krokem a u každého přihlášení, ověření (2FA) nebo platby se zastav
> a nech mě to udělat ručně. Nic neplať, používej jen tarif Free.
>
> 1. Na GitHubu otevři repozitář `marty2427/WEB-Hypo`. Pokud existuje otevřený pull request
>    z větve `claude/admiring-galileo-rps00e`, ukaž mi ho a zeptej se, jestli ho mám sloučit
>    do `main`. Pokud větev `main` neexistuje, zeptej se mě, jestli ji vytvořit z větve
>    `claude/admiring-galileo-rps00e`.
> 2. Otevři soubor `config.js` a zeptej se mě na název webu, moje jméno a telefon. Doplň je
>    a ulož (Commit changes přímo do zveřejňované větve).
> 3. Otevři https://dash.cloudflare.com. Pokud nemám účet, proveď mě registrací.
> 4. Jdi do Workers & Pages → Create → záložka Pages → Connect to Git. Propoj GitHub
>    a povol přístup jen k repozitáři `WEB-Hypo`.
> 5. Nastav: Project name `web-hypo`, Production branch `main` (nebo větev, kterou jsme
>    zvolili v bodě 1), Framework preset `None`, Build command prázdný,
>    Build output directory `/`. Pak Save and Deploy.
> 6. Počkej na dokončení nasazení, otevři adresu `*.pages.dev`, ověř, že se stránka načte
>    a kalkulačka počítá, a pošli mi odkaz.
> 7. Zeptej se mě, jestli chci připojit vlastní doménu. Pokud ano, nastav ji v projektu
>    v Custom domains a řekni mi přesně, jaký DNS záznam mám kde přidat.
> 8. Zeptej se mě, jestli chci, aby poptávky z formuláře chodily na e-mail přes Formspree.
>    Pokud ano, proveď mě založením formuláře na formspree.io, adresu formuláře vlož do
>    `config.js` do `formEndpoint` a ulož. Po nasazení odešli zkušební poptávku.
