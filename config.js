/*
 * Základní nastavení webu – jméno, kontakty a kam se posílají poptávky.
 */
window.HYPO_CONFIG = {
  brand: "HypoPlán",
  advisorName: "Ing. Martin Šváb – Majetkový a finanční konzultant",
  phone: "+420 777 55 25 30",
  // Záložní e-mail pro odeslání přes e-mailového klienta návštěvníka – použije se jen bez formEndpoint.
  // Nechán prázdný, aby adresa nebyla veřejně v kódu webu (sbírají je spamboti).
  email: "",
  // Volitelně: URL formulářové služby (např. Formspree), poptávka se pak odešle přímo z webu.
  formEndpoint: "https://api.web3forms.com/submit",
  // Veřejný přístupový klíč formuláře Web3Forms (určený k použití ve webu; poptávky chodí na e-mail nastavený ve Web3Forms).
  formAccessKey: "98d4e495-56e8-4491-8682-b805cc0122c0"
};
