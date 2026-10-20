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
  const yearWord = (n) => (n === 1 ? "rok" : n < 5 ? "roky" : "let");
  const years = (n) => n + " " + yearWord(n);
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
    purpose: "Koupě bytu",
    years: 30,
    summary: ""
  };

  /* ---------- Statické texty ---------- */
  // Návštěvník vidí vždy dnešní datum.
  const updatedText = new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
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
          `<td><span class="r-range">${pct(b.min).replace(" %", "")} – ${pct(b.max)}</span><span class="r-avg">průměr ${pct(b.avg)}</span></td>`;
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
  ["price", "own", "balance", "value", "income"].forEach(bindMoney);

  /* ---------- Doba splatnosti (u refinancování i ručně) ---------- */
  const yearsRange = $("#years");
  const yearsInput = $("#years-input");
  const clampYears = (n) => Math.min(Math.max(Math.round(n), +yearsRange.min), +yearsRange.max);
  yearsRange.addEventListener("input", () => {
    state.years = +yearsRange.value;
    yearsInput.value = state.years;
    update();
  });
  yearsInput.addEventListener("input", () => {
    const n = parseNum(yearsInput.value);
    if (n >= +yearsRange.min && n <= +yearsRange.max) {
      state.years = Math.round(n);
      yearsRange.value = state.years;
      update();
    }
  });
  yearsInput.addEventListener("blur", () => {
    state.years = clampYears(parseNum(yearsInput.value) || state.years);
    yearsInput.value = state.years;
    yearsRange.value = state.years;
    update();
  });

  /* ---------- Kliknutím do pole se označí celý obsah, rovnou se dá přepsat ---------- */
  $$(".money input").forEach((input) => {
    let fresh = false;
    input.addEventListener("focus", () => {
      fresh = true;
      input.select();
      setTimeout(() => fresh && input.select(), 0);
    });
    input.addEventListener("mouseup", (e) => {
      if (fresh) e.preventDefault();
      fresh = false;
    });
    input.addEventListener("input", () => (fresh = false));
    input.addEventListener("blur", () => (fresh = false));
  });

  /* ---------- Rozbalovací výběr (účel úvěru) ---------- */
  $$("[data-select]").forEach((wrap) => {
    const btn = $(".select__btn", wrap);
    const list = $(".select__menu", wrap);
    const opts = $$("[role=option]", list);
    let active = 0;

    const setActive = (i) => {
      active = (i + opts.length) % opts.length;
      opts.forEach((o, j) => o.classList.toggle("is-active", j === active));
      list.setAttribute("aria-activedescendant", opts[active].id);
    };
    const open = () => {
      wrap.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      setActive(Math.max(opts.findIndex((o) => o.getAttribute("aria-selected") === "true"), 0));
      list.focus({ preventScroll: true });
    };
    const close = (refocus = true) => {
      wrap.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      if (refocus) btn.focus({ preventScroll: true });
    };
    const choose = (i) => {
      opts.forEach((o, j) => o.setAttribute("aria-selected", String(j === i)));
      state.purpose = opts[i].dataset.value;
      $("[data-select-value]", wrap).textContent = state.purpose;
      close();
      update();
    };

    btn.addEventListener("click", () => (wrap.classList.contains("is-open") ? close() : open()));
    btn.addEventListener("keydown", (e) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        open();
      }
    });
    list.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") setActive(active + 1);
      else if (e.key === "ArrowUp") setActive(active - 1);
      else if (e.key === "Home") setActive(0);
      else if (e.key === "End") setActive(opts.length - 1);
      else if (e.key === "Enter" || e.key === " ") choose(active);
      else if (e.key === "Escape") close();
      else if (e.key === "Tab") return close(false);
      else return;
      e.preventDefault();
    });
    opts.forEach((o, i) => {
      o.addEventListener("click", () => choose(i));
      o.addEventListener("mousemove", () => setActive(i));
    });
    document.addEventListener("click", (e) => {
      if (wrap.classList.contains("is-open") && !wrap.contains(e.target)) close(false);
    });
  });

  $("#young").addEventListener("change", update);

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
    $$("[data-show]").forEach((el) => (el.hidden = el.dataset.show !== state.type));
    // U refinancování může zbývat i méně než 5 let
    yearsRange.min = isNew ? 5 : 1;
    $(".scale span").textContent = years(+yearsRange.min);
    if (isNew && state.years < 5) state.years = 5;
    yearsRange.value = state.years;
    yearsInput.value = state.years;
    paintRange(yearsRange);
    $$("[data-fix]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.fix === state.fixation)));

    let loan, value;
    if (isNew) {
      value = parseNum($("#price").value);
      loan = Math.max(value - parseNum($("#own").value), 0);
    } else {
      value = parseNum($("#value").value);
      loan = parseNum($("#balance").value);
    }

    const yrs = state.years;
    $("#years-out").textContent = years(yrs);
    $("[data-years-unit]").textContent = yearWord(yrs);

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
        : `Úvěr přesahuje <strong>${ltvLimit} %</strong> hodnoty nemovitosti. Ozvěte se, řešení se často najde.`;
    } else {
      alert.hidden = true;
    }

    renderRatesTable();

    // Shrnutí pro poptávku
    const lines = isNew
      ? [`Nový úvěr – ${state.purpose.toLowerCase()}`, `cena nemovitosti ${kc(value)}`, `úvěr ${kc(loan)} (LTV ${Math.round(ltv)} %)`]
      : [`Refinancování`, `zůstatek ${kc(loan)}`, `hodnota nemovitosti ${kc(value)} (LTV ${Math.round(ltv)} %)`];
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
