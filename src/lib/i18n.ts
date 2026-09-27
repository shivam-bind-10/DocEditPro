export type SupportedLanguage = "en" | "es" | "de" | "fr" | "hi";

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  privacyBadge: string;
  searchPlaceholder: string;
  pdfEditorButton: string;
  recentsButton: string;
  allTools: string;
  dropzoneTitle: string;
  dropzoneDesc: string;
  clearData: string;
}

export const DICTIONARIES: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: "DocEditPro",
    tagline: "Privacy-First PDF & Document Toolkit",
    privacyBadge: "100% Client-Side",
    searchPlaceholder: "Search tools...",
    pdfEditorButton: "PDF Editor",
    recentsButton: "Recents",
    allTools: "All Tools",
    dropzoneTitle: "Drop files here or click to browse",
    dropzoneDesc: "Files are processed entirely inside your browser. No server uploads.",
    clearData: "Clear My Data",
  },
  es: {
    appName: "DocEditPro",
    tagline: "Herramientas de PDF centradas en la privacidad",
    privacyBadge: "100% en el navegador",
    searchPlaceholder: "Buscar herramientas...",
    pdfEditorButton: "Editor de PDF",
    recentsButton: "Recientes",
    allTools: "Todas las herramientas",
    dropzoneTitle: "Arrastre los archivos aquí o haga clic para buscar",
    dropzoneDesc: "Los archivos se procesan completamente en su navegador.",
    clearData: "Borrar mis datos",
  },
  de: {
    appName: "DocEditPro",
    tagline: "Datenschutzorientiertes PDF-Toolkit",
    privacyBadge: "100% Client-seitig",
    searchPlaceholder: "Werkzeuge durchsuchen...",
    pdfEditorButton: "PDF-Editor",
    recentsButton: "Zuletzt verwendet",
    allTools: "Alle Werkzeuge",
    dropzoneTitle: "Dateien hier ablegen oder klicken",
    dropzoneDesc: "Dateien werden vollständig in Ihrem Browser verarbeitet.",
    clearData: "Meine Daten löschen",
  },
  fr: {
    appName: "DocEditPro",
    tagline: "Boîte à outils PDF respectueuse de la vie privée",
    privacyBadge: "100% Côté client",
    searchPlaceholder: "Rechercher des outils...",
    pdfEditorButton: "Éditeur PDF",
    recentsButton: "Récents",
    allTools: "Tous les outils",
    dropzoneTitle: "Déposez vos fichiers ici",
    dropzoneDesc: "Les fichiers sont traités directement dans votre navigateur.",
    clearData: "Effacer mes données",
  },
  hi: {
    appName: "DocEditPro",
    tagline: "गोपनीयता-प्रथम पीडीएफ और दस्तावेज़ टूलकिट",
    privacyBadge: "100% क्लाइंट-साइड",
    searchPlaceholder: "टूल्स खोजें...",
    pdfEditorButton: "पीडीएफ संपादक",
    recentsButton: "हालिया फाइलें",
    allTools: "सभी टूल्स",
    dropzoneTitle: "यहाँ फाइलें छोड़ें या ब्राउज़ करें",
    dropzoneDesc: "फाइलें पूरी तरह से आपके ब्राउज़र में प्रोसेस होती हैं।",
    clearData: "मेरा डेटा हटाएं",
  },
};

export function getTranslation(lang: SupportedLanguage = "en"): TranslationDictionary {
  return DICTIONARIES[lang] || DICTIONARIES.en;
}
