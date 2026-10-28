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
    // doba splatnosti si pamatujeme zvlášť pro každý typ úvěru
    yearsByType: { new: 30, refi: 30, consumer: 5 },
    summary: ""
  };

  /* ---------- Statické texty ---------- */
  // Návštěvník vidí vždy dnešní datum.
  const updatedText = new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  $$("[data-rates-updated]").forEach((el) => (el.textContent = updatedText));
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

  // Sazby spotřebitelských úvěrů v sekci Sazby
  const CONS = RATES.consumer;
  $("[data-crate=min]").textContent = "od " + pct(CONS.min);
  $("[data-crate=avg]").textContent = pct(CONS.avg);
  $("[data-crate=max]").textContent = "kolem " + pct(CONS.max);

  // Meze doby splatnosti a popisky stupnice podle typu úvěru
  const YEARS = {
    new: { min: 5, max: 30, scale: [5, 15, 30] },
    refi: { min: 1, max: 30, scale: [1, 15, 30] },
    consumer: { min: 1, max: CONS.maxYears || 10, scale: [1, 5, CONS.maxYears || 10] }
  };

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
  ["price", "own", "balance", "value", "income", "cloan"].forEach(bindMoney);

  // Úprava „Potřebujete si půjčit“: cena nemovitosti zůstává, dopočítají se vlastní zdroje
  const loanInput = $("#loan");
  loanInput.addEventListener("input", () => {
    const price = parseNum($("#price").value);
    const own = Math.max(price - Math.min(parseNum(loanInput.value), price), 0);
    $("#own").value = nf.format(own);
    $("#own-range").value = own;
    paintRange($("#own-range"));
    update();
  });
  loanInput.addEventListener("blur", () => {
    const price = parseNum($("#price").value);
    loanInput.value = nf.format(Math.min(parseNum(loanInput.value), price));
  });

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
      state.yearsByType[state.type] = state.years;
      state.type = r.value;
      state.years = state.yearsByType[state.type];
      update();
    })
  );

  /* ---------- Srovnání dvou úvěrů ---------- */
  const cmp = $("#compare");
  const cmpIn = (k, f) => $(`#c${k}-${f}`);
  let cmpTouched = false;
  const fmtRate = (n) => n.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function prefillCompare() {
    if (cmpTouched) return;
    const amount = nf.format(parseNum($("#cloan").value));
    ["a", "b"].forEach((k) => {
      cmpIn(k, "amount").value = amount;
      cmpIn(k, "years").value = state.years;
    });
    cmpIn("a", "rate").value = fmtRate(CONS.avg);
    cmpIn("b", "rate").value = fmtRate(CONS.min);
  }

  function signed(n) {
    const r = Math.round(n);
    if (r === 0) return "0 Kč";
    return (r > 0 ? "+" : "−") + kc(Math.abs(r));
  }

  function renderCompare() {
    const read = (k) => {
      const amount = parseNum(cmpIn(k, "amount").value);
      const rate = Math.min(parseNum(cmpIn(k, "rate").value), 50);
      const yrs = Math.min(Math.max(Math.round(parseNum(cmpIn(k, "years").value)), 1), 30);
      const pay = annuity(amount, rate, yrs);
      const total = pay * yrs * 12;
      return { ok: amount > 0, pay, total, over: Math.max(total - amount, 0) };
    };
    const a = read("a");
    const b = read("b");
    const set = (key, val) => ($(`[data-cmp="${key}"]`).textContent = val);
    const ok = a.ok && b.ok;
    for (const [row, f] of [["pay", "pay"], ["total", "total"], ["over", "over"]]) {
      set(`${row}-a`, a.ok ? kc(a[f]) : "—");
      set(`${row}-b`, b.ok ? kc(b[f]) : "—");
      set(`${row}-d`, ok ? signed(b[f] - a[f]) : "—");
      const cell = $(`[data-cmp="${row}-d"]`);
      cell.classList.toggle("is-better", ok && b[f] - a[f] < -0.5);
      cell.classList.toggle("is-worse", ok && b[f] - a[f] > 0.5);
    }

    const verdict = $('[data-cmp="verdict"]');
    if (!ok) {
      verdict.textContent = "Zadejte výši obou úvěrů.";
      return;
    }
    const dp = Math.round(b.pay - a.pay);
    const dov = Math.round(b.over - a.over);
    if (Math.abs(dov) < 1 && Math.abs(dp) < 1) {
      verdict.textContent = "Oba úvěry vycházejí stejně.";
      return;
    }
    const [win, lose, payDiff] = dov <= 0 ? ["B", "A", -dp] : ["A", "B", dp];
    const saved = kc(Math.abs(dov));
    verdict.innerHTML =
      payDiff >= 0
        ? `<strong>Výhodnější je úvěr ${win}:</strong> splátka je o ${kc(payDiff)} nižší a celkem přeplatíte o <strong>${saved}</strong> méně než u úvěru ${lose}.`
        : `<strong>Celkově výhodnější je úvěr ${win}:</strong> měsíční splátka je sice o ${kc(-payDiff)} vyšší, ale celkem přeplatíte o <strong>${saved}</strong> méně než u úvěru ${lose}.`;
  }

  cmp.addEventListener("toggle", () => {
    if (cmp.open) {
      prefillCompare();
      renderCompare();
    }
  });
  $$(".cmp__grid input").forEach((input) => {
    input.addEventListener("input", () => {
      cmpTouched = true;
      renderCompare();
    });
    input.addEventListener("blur", () => {
      if (input.value.trim() === "") return;
      const n = parseNum(input.value);
      if (input.id.endsWith("rate")) input.value = fmtRate(Math.min(n, 50));
      else if (input.id.endsWith("years")) input.value = Math.min(Math.max(Math.round(n), 1), 30);
      else input.value = nf.format(n);
      renderCompare();
    });
  });

  /* ---------- Výpočet ---------- */
  function update() {
    const isNew = state.type === "new";
    const isConsumer = state.type === "consumer";
    $$("[data-mode]").forEach((el) => (el.hidden = el.dataset.mode !== state.type));
    $("[data-years-label]").textContent = state.type === "refi" ? "Zbývající doba splácení" : "Doba splatnosti";
    $$("[data-show]").forEach((el) => (el.hidden = !el.dataset.show.split(" ").includes(state.type)));
    $$("[data-hide]").forEach((el) => (el.hidden = el.dataset.hide.split(" ").includes(state.type)));
    // Meze splatnosti: hypotéka 5–30 let, refinancování 1–30, spotřebitelský úvěr 1–10
    const lim = YEARS[state.type];
    yearsRange.min = lim.min;
    yearsRange.max = lim.max;
    $$("[data-scale] span").forEach((el, i) => (el.textContent = years(lim.scale[i])));
    state.years = Math.min(Math.max(state.years, lim.min), lim.max);
    yearsRange.value = state.years;
    yearsInput.value = state.years;
    paintRange(yearsRange);
    $$("[data-fix]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.fix === state.fixation)));

    let loan, value;
    if (isConsumer) {
      value = 0;
      loan = parseNum($("#cloan").value);
    } else if (isNew) {
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
    if (isNew) {
      if (document.activeElement !== loanInput) loanInput.value = nf.format(loan);
    } else if (!isConsumer) {
      $("[data-loan-refi]").textContent = kc(loan);
    }
    $$("[data-ltv-chip]").forEach((chip) => {
      chip.textContent = "LTV " + Math.round(ltv) + " %";
      chip.className = "chip" + (ltv > ltvLimit ? " chip--bad" : ltv > 80 ? " chip--warn" : "");
    });

    const fx = fixationFor(state.fixation);
    const band = isConsumer ? CONS : bandFor(fx, ltv);
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
    $("[data-r-term-label]").textContent = isConsumer ? "Splatnost" : "Fixace / splatnost";
    $("[data-r-term]").textContent = isConsumer ? years(yrs) : years(state.fixation) + " / " + years(yrs);
    $("[data-to-contact]").textContent = isConsumer ? "Chci nejlepší nabídku úvěru" : "Chci přesnou nabídku od bank";
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
    if (!isConsumer && loan > 0 && value > 0 && ltv > ltvLimit) {
      const missing = roundTo(loan - (value * ltvLimit) / 100, 1000);
      alert.hidden = false;
      alert.innerHTML = isNew
        ? `Banky běžně půjčí nejvýše <strong>${ltvLimit} %</strong> hodnoty nemovitosti. Chybí vám cca <strong>${kc(missing)}</strong> vlastních zdrojů – ozvěte se, často se dá vyřešit např. zástavou další nemovitosti.`
        : `Úvěr přesahuje <strong>${ltvLimit} %</strong> hodnoty nemovitosti. Ozvěte se, řešení se často najde.`;
    } else {
      alert.hidden = true;
    }

    renderRatesTable();

    if (isConsumer) {
      prefillCompare();
      if (cmp.open) renderCompare();
    }

    // Shrnutí pro poptávku
    const lines = isConsumer
      ? [`Spotřebitelský úvěr`, `výše ${kc(loan)}`]
      : isNew
        ? [`Nový úvěr – ${state.purpose.toLowerCase()}`, `cena nemovitosti ${kc(value)}`, `úvěr ${kc(loan)} (LTV ${Math.round(ltv)} %)`]
        : [`Refinancování`, `zůstatek ${kc(loan)}`, `hodnota nemovitosti ${kc(value)} (LTV ${Math.round(ltv)} %)`];
    lines.push(`splatnost ${years(yrs)}`);
    if (!isConsumer) lines.push(`fixace ${years(state.fixation)}`);
    if (loan > 0) lines.push(`orientační splátka ${nf.format(roundTo(pay.min, 100))} – ${kc(roundTo(pay.max, 100))}`);
    if (income > 0) lines.push(`příjem domácnosti ${kc(income)}`);
    if (young && !isConsumer) lines.push("žadatel do 36 let");
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
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn.textContent;
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

    // Robot vyplnil skryté pole: tváříme se, že je hotovo, ale nic neposíláme.
    if ($("#l-botcheck").checked) {
      submitBtn.hidden = true;
      $("[data-form-success]").hidden = false;
      return;
    }
    if (!CONFIG.formEndpoint && !CONFIG.email) {
      err.textContent = "Formulář zatím není propojený. Zavolejte prosím na telefon výše.";
      err.hidden = false;
      return;
    }

    const data = {
      jmeno: $("#l-name").value.trim(),
      telefon: $("#l-phone").value.trim(),
      email: email.value.trim(),
      zprava: $("#l-msg").value.trim(),
      vypocet: state.summary
    };
    if (CONFIG.formAccessKey) Object.assign(data, { access_key: CONFIG.formAccessKey, subject: (state.type === "consumer" ? "Poptávka úvěru – " : "Poptávka hypotéky – ") + data.jmeno, from_name: CONFIG.brand || "Web" });

    submitBtn.disabled = true;
    submitBtn.textContent = "Odesílám…";
    try {
      if (CONFIG.formEndpoint) {
        const res = await fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data)
        });
        const reply = await res.json().catch(() => ({}));
        if (!res.ok || reply.success === false) throw new Error(res.status);
      } else {
        const body = `Jméno: ${data.jmeno}\nTelefon: ${data.telefon}\nE-mail: ${data.email}\n\nVýpočet: ${data.vypocet}\n\n${data.zprava}`;
        location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Poptávka hypotéky – " + data.jmeno)}&body=${encodeURIComponent(body)}`;
      }
      submitBtn.hidden = true;
      $("[data-form-success]").hidden = false;
    } catch {
      err.textContent = "Odeslání se nepodařilo. Zkuste to prosím znovu, nebo zavolejte.";
      err.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  });

  update();
})();
