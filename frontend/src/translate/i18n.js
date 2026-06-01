import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { messages } from "./languages";

// Detectar idioma de forma segura (sem depender de localStorage que pode ser bloqueado)
let detectedLng = "pt";
try {
  const stored = localStorage.getItem("i18nextLng");
  if (stored) {
    const short = stored.substring(0, 2);
    if (messages[short]) {
      detectedLng = short;
    }
  }
} catch (e) {
  // localStorage bloqueado pelo Tracking Prevention - mantém "pt" como padrão
  // NÃO usar navigator.language pois pode retornar "en" e quebrar a experiência
}

i18n
  .use(initReactI18next)
  .init({
    debug: false,
    lng: detectedLng,
    fallbackLng: "pt",
    defaultNS: ["translations"],
    ns: ["translations"],
    resources: messages,
  });

// Salvar mudança de idioma quando possível
i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem("i18nextLng", lng);
  } catch (e) {
    // storage bloqueado, ignora
  }
});

export { i18n };
