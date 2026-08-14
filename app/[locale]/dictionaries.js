import "server-only";

export const locales = ["bg", "en"];
export const defaultLocale = "bg";

const dictionaries = {
  bg: () => import("../../dictionaries/bg.json").then((m) => m.default),
  en: () => import("../../dictionaries/en.json").then((m) => m.default),
};

export const hasLocale = (locale) => locales.includes(locale);

export const getDictionary = async (locale) => dictionaries[locale]();
