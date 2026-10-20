(() => {
  "use strict";

  // Doplní kontakty z config.js na stránku Zásady ochrany osobních údajů.
  const CONFIG = window.HYPO_CONFIG || {};
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  if (CONFIG.brand) $$("[data-brand]").forEach((el) => (el.textContent = CONFIG.brand));
  if (CONFIG.advisorName) $$("[data-advisor]").forEach((el) => (el.textContent = CONFIG.advisorName));

  $$("[data-phone]").forEach((el) => {
    el.textContent = CONFIG.phone || "—";
    if (CONFIG.phone) el.href = "tel:" + CONFIG.phone.replace(/\s/g, "");
  });

  const [user, domain] = CONFIG.privacyEmail || [];
  $$("[data-privacy-email]").forEach((el) => {
    if (!user || !domain) return;
    const a = document.createElement("a");
    a.href = "mailto:" + user + "@" + domain;
    a.textContent = user + "@" + domain;
    el.replaceChildren(a);
  });
})();
