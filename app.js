(() => {
  "use strict";

  const RATES = window.HYPO_RATES;
  const CONFIG = window.HYPO_CONFIG || {};

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const kc = (n) => nf.format(Math.round(n)) + " Kč";
  const pct = (n, d = 2) =>
    n.toLocaleString("cs-CZ", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
  const years = (n) => n + " " + (n === 1 ? "rok" : n < 5 ? "roky" : "let");
  const roundTo = (n, step) => Math.round(n / step) * step;
  const parseNum = (str) => {
    const n = parseFloat(String(str).replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  // Anuitní měsíční splátka
  function annuity(principal, ratePct, yrs) {
    const n = yrs * 12;
    const r = ratePct / 1200;
    if (principal <= 0 || n <= 0) return 0;
    if (r === 0) return principal / n;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
  }

  const fixationFor = (y) => RATES.fixations.find((f) => f.years === y) || RATES.fixations[0];
  const bandFor = (fx, ltv) => (ltv <= 80 ? fx.ltv80 : fx.ltv90);

  const state = {
    type: "new",
    fixation: RATES.defaultFixation || RATES.fixations[0].years,
    summary: ""
  };

  /* ---------- Statické texty ---------- */
  const updated = new Date(RATES.updated + "T00:00:00");
  const updatedText = updated.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  $$("[data-rates-updated]").forEach((el) => (el.textContent = updatedText));
  $("[data-rates-source]").textContent = RATES.sourceNote;
  if (CONFIG.brand) $$("[data-brand]").forEach((el) => (el.textContent = CONFIG.brand));
  $("[data-advisor]").textContent = CONFIG.advisorName || "";
  const phoneEl = $("[data-phone]");
  if (CONFIG.phone) {
    phoneEl.textContent = CONFIG.phone;
    phoneEl.href = "tel:" + CONFIG.phone.replace(/\s/g, "");
  } else {
    phoneEl.closest("p").hidden = true;
  }

  // Ukázková karta v úvodu
  const heroFx = fixationFor(5).ltv80;
  $("[data-hero-rate]").textContent = pct(heroFx.avg);
  $("[data-hero-pay]").textContent = "cca " + kc(roundTo(annuity(4e6, heroFx.avg, 30), 100)) + " / měsíc";

  /* ---------- Tabulka sazeb ---------- */
  function renderRatesTable() {
    $("#rates-body").innerHTML = RATES.fixations
      .map((f) => {
        const cell = (b) =>
          `<td><span class="r-range">${pct(b.min)} – ${pct(b.max)}</span><span class="r-avg">průměr ${pct(b.avg)}</span></td>`;
        const active = f.years === state.fixation ? ' class="is-active"' : "";
        return `<tr${active}><td>${years(f.years)}</td>${cell(f.ltv80)}${cell(f.ltv90)}</tr>`;
      })
      .join("");
  }

  /* ---------- Fixace ---------- */
  const fixWrap = $("#fixations");
  fixWrap.innerHTML = RATES.fixations
    .map((f) => `<button type="button" data-fix="${f.years}">${years(f.years)}</button>`)
    .join("");
  fixWrap.style.gridTemplateColumns = `repeat(${RATES.fixations.length}, 1fr)`;
  fixWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fix]");
    if (!btn) return;
    state.fixation = +btn.dataset.fix;
    update();
  });

  /* ---------- Peněžní pole + posuvníky ---------- */
  function paintRange(range) {
    const p = ((range.value - range.min) / (range.max - range.min)) * 100;
    range.style.setProperty("--p", p + "%");
  }

  function bindMoney(id) {
    const input = $("#" + id);
    const range = $("#" + id + "-range");
    input.addEventListener("input", () => {
      if (range) {
        range.value = parseNum(input.value);
        paintRange(range);
      }
      update();
    });
    input.addEventListener("blur", () => {
      if (input.value.trim() !== "") input.value = nf.format(parseNum(input.value));
    });
    if (range) {
      range.addEventListener("input", () => {
        input.value = nf.format(+range.value);
        paintRange(range);
        update();
      });
      paintRange(range);
    }
  }
  ["price", "own", "balance", "value", "topup", "income"].forEach(bindMoney);

  const curRate = $("#cur-rate");
  curRate.addEventListener("input", update);

  const yearsRange = $("#years");
  yearsRange.addEventListener("input", () => {
    paintRange(yearsRange);
    update();
  });
  paintRange(yearsRange);

  $("#young").addEventListener("change", update);
  $("#purpose").addEventListener("change", update);

  $$('input[name="type"]').forEach((r) =>
    r.addEventListener("change", () => {
      state.type = r.value;
      update();
    })
  );

  /* ---------- Výpočet ---------- */
  function update() {
    const isNew = state.type === "new";
    $$("[data-mode]").forEach((el) => (el.hidden = el.dataset.mode !== state.type));
    $("[data-years-label]").textContent = isNew ? "Doba splatnosti" : "Zbývající doba splácení";
    $$("[data-fix]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.fix === state.fixation)));

    let loan, value;
    if (isNew) {
      value = parseNum($("#price").value);
      loan = Math.max(value - parseNum($("#own").value), 0);
    } else {
      value = parseNum($("#value").value);
      loan = parseNum($("#balance").value) + parseNum($("#topup").value);
    }

    const yrs = +yearsRange.value;
    $("#years-out").textContent = years(yrs);

    const young = $("#young").checked;
    const ltvLimit = young ? 90 : 80;
    const ltv = value > 0 ? (loan / value) * 100 : 0;

    // LTV štítek a výše úvěru ve formuláři
    $(isNew ? "[data-loan-new]" : "[data-loan-refi]").textContent = kc(loan);
    $$("[data-ltv-chip]").forEach((chip) => {
      chip.textContent = "LTV " + Math.round(ltv) + " %";
      chip.className = "chip" + (ltv > ltvLimit ? " chip--bad" : ltv > 80 ? " chip--warn" : "");
    });

    const fx = fixationFor(state.fixation);
    const band = bandFor(fx, ltv);
    const pay = {
      min: annuity(loan, band.min, yrs),
      avg: annuity(loan, band.avg, yrs),
      max: annuity(loan, band.max, yrs)
    };

    $("[data-mobile-pay]").textContent = loan > 0 ? "cca " + kc(roundTo(pay.avg, 100)) : "—";
    if (loan <= 0) {
      $("[data-pay-range]").textContent = "—";
      $("[data-pay-avg]").textContent = "—";
    } else {
      $("[data-pay-range]").textContent =
        nf.format(roundTo(pay.min, 100)) + " – " + kc(roundTo(pay.max, 100));
      $("[data-pay-avg]").textContent = kc(roundTo(pay.avg, 100));
    }
    const pos = band.max > band.min ? ((band.avg - band.min) / (band.max - band.min)) * 100 : 50;
    $("[data-marker]").style.left = pos + "%";

    $("[data-r-loan]").textContent = kc(loan);
    $("[data-r-rate]").textContent = pct(band.min) + " – " + pct(band.max);
    $("[data-r-term]").textContent = years(state.fixation) + " / " + years(yrs);
    $("[data-r-ltv]").textContent = value > 0 ? Math.round(ltv) + " %" : "—";

    // Poměr splátky k příjmu
    const income = parseNum($("#income").value);
    const dstiRow = $("[data-dsti-row]");
    dstiRow.hidden = !(income > 0 && loan > 0);
    if (!dstiRow.hidden) {
      const dsti = (pay.avg / income) * 100;
      const [cls, txt] =
        dsti <= 35 ? ["ok", "v pořádku"] : dsti <= 45 ? ["warn", "na hraně"] : ["bad", "vysoká"];
      $("[data-r-dsti]").innerHTML = `${Math.round(dsti)} % <span class="tag tag--${cls}">${txt}</span>`;
    }

    // Upozornění na LTV
    const alert = $("[data-alert]");
    if (loan > 0 && value > 0 && ltv > ltvLimit) {
      const missing = roundTo(loan - (value * ltvLimit) / 100, 1000);
      alert.hidden = false;
      alert.innerHTML = isNew
        ? `Banky běžně půjčí nejvýše <strong>${ltvLimit} %</strong> hodnoty nemovitosti. Chybí vám cca <strong>${kc(missing)}</strong> vlastních zdrojů – ozvěte se, často se dá vyřešit např. zástavou další nemovitosti.`
        : `Úvěr přesahuje <strong>${ltvLimit} %</strong> hodnoty nemovitosti. Zkuste nižší navýšení, nebo se ozvěte – řešení se často najde.`;
    } else {
      alert.hidden = true;
    }

    // Srovnání se současnou splátkou (refinancování)
    const compare = $("[data-compare]");
    const cur = parseNum(curRate.value);
    if (!isNew && cur > 0 && loan > 0) {
      const curPay = annuity(parseNum($("#balance").value), cur, yrs);
      const diff = roundTo(curPay - pay.avg, 100);
      compare.hidden = false;
      compare.classList.toggle("is-up", diff < 0);
      compare.innerHTML =
        `Současná splátka při ${pct(cur)}: <strong>${kc(roundTo(curPay, 100))}</strong><br>` +
        (diff >= 0
          ? `Refinancováním můžete ušetřit cca <strong>${kc(diff)}</strong> měsíčně.`
          : `Při dnešních sazbách by splátka vzrostla o cca <strong>${kc(-diff)}</strong>. Porovnáním nabídek bank lze nárůst výrazně zmírnit.`);
    } else {
      compare.hidden = true;
    }

    // Jistina vs. úroky
    const total = pay.avg * yrs * 12;
    const interest = Math.max(total - loan, 0);
    const share = total > 0 ? (interest / total) * 100 : 0;
    $("[data-donut]").setAttribute("stroke-dasharray", `${share} ${100 - share}`);
    $("[data-r-principal]").textContent = kc(loan);
    $("[data-r-interest]").textContent = kc(roundTo(interest, 1000));
    $("[data-r-total]").textContent = kc(roundTo(total, 1000));

    renderRatesTable();

    // Shrnutí pro poptávku
    const lines = isNew
      ? [`Nový úvěr – ${$("#purpose").value.toLowerCase()}`, `cena nemovitosti ${kc(value)}`, `úvěr ${kc(loan)} (LTV ${Math.round(ltv)} %)`]
      : [`Refinancování`, `zůstatek ${kc(parseNum($("#balance").value))}`, `hodnota nemovitosti ${kc(value)}`, `nový úvěr ${kc(loan)} (LTV ${Math.round(ltv)} %)`];
    if (!isNew && cur > 0) lines.push(`současná sazba ${pct(cur)}`);
    lines.push(`splatnost ${years(yrs)}`, `fixace ${years(state.fixation)}`);
    if (loan > 0) lines.push(`orientační splátka ${nf.format(roundTo(pay.min, 100))} – ${kc(roundTo(pay.max, 100))}`);
    if (income > 0) lines.push(`příjem domácnosti ${kc(income)}`);
    if (young) lines.push("žadatel do 36 let");
    state.summary = lines.join(", ");
  }

  /* ---------- Mobilní lišta: viditelná, jen když je formulář na očích a výsledek ne ---------- */
  if ("IntersectionObserver" in window) {
    const bar = $("[data-mobilebar]");
    const seen = { form: false, result: false };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (seen[en.target === $("#calc-form") ? "form" : "result"] = en.isIntersecting));
      bar.classList.toggle("is-visible", seen.form && !seen.result);
    });
    io.observe($("#calc-form"));
    io.observe($("#vysledek"));
  }

  /* ---------- Poptávka ---------- */
  $("[data-to-contact]").addEventListener("click", () => {
    $("[data-summary]").hidden = false;
    $("[data-summary-text]").textContent = state.summary;
  });

  const form = $("#lead-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("[data-form-error]");
    const fields = ["#l-name", "#l-phone", "#l-email"].map((s) => $(s));
    fields.forEach((f) => f.classList.toggle("invalid", !f.value.trim()));
    const email = $("#l-email");
    if (email.value && !email.checkValidity()) email.classList.add("invalid");

    if (fields.some((f) => f.classList.contains("invalid"))) {
      err.textContent = "Vyplňte prosím jméno, telefon a platný e-mail.";
      err.hidden = false;
      return;
    }
    if (!$("#l-consent").checked) {
      err.textContent = "Pro odeslání je potřeba souhlas se zpracováním údajů.";
      err.hidden = false;
      return;
    }
    err.hidden = true;

    const data = {
      jmeno: $("#l-name").value.trim(),
      telefon: $("#l-phone").value.trim(),
      email: email.value.trim(),
      zprava: $("#l-msg").value.trim(),
      vypocet: state.summary
    };

    try {
      if (CONFIG.formEndpoint) {
        const res = await fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(res.status);
      } else if (CONFIG.email) {
        const body = `Jméno: ${data.jmeno}\nTelefon: ${data.telefon}\nE-mail: ${data.email}\n\nVýpočet: ${data.vypocet}\n\n${data.zprava}`;
        location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Poptávka hypotéky – " + data.jmeno)}&body=${encodeURIComponent(body)}`;
      }
      form.querySelector('button[type="submit"]').hidden = true;
      $("[data-form-success]").hidden = false;
    } catch {
      err.textContent = "Odeslání se nepodařilo. Zkuste to prosím znovu, nebo zavolejte.";
      err.hidden = false;
    }
  });

  update();
})();
