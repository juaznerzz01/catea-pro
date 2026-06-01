import OpenAI from "openai";
import CompaniesSettings from "../../models/CompaniesSettings";
import Prompt from "../../models/Prompt";

interface TranslateResult {
  translatedText: string;
  detectedLanguage: string;
}

// Cache de instâncias OpenAI por companyId
const openaiInstances: Map<number, OpenAI> = new Map();

/**
 * Obtém a API key para tradução.
 * Prioridade: CompaniesSettings.translateApiKey → primeiro Prompt.apiKey
 */
const getApiKey = async (companyId: number): Promise<string | null> => {
  try {
    // 1. Tentar CompaniesSettings
    const settings = await CompaniesSettings.findOne({
      where: { companyId },
      attributes: ["translateApiKey", "autoTranslate"]
    });

    if (settings?.getDataValue("autoTranslate") !== "enabled") {
      return null;
    }

    const settingsKey = settings?.getDataValue("translateApiKey");
    if (settingsKey) return settingsKey;

    // 2. Fallback: primeiro Prompt da empresa
    const prompt = await Prompt.findOne({
      where: { companyId },
      attributes: ["apiKey"],
      order: [["id", "ASC"]]
    });

    return prompt?.apiKey || null;
  } catch (err) {
    console.error("[TranslateService] Erro ao buscar API key:", err);
    return null;
  }
};

const getOpenAI = async (companyId: number): Promise<OpenAI | null> => {
  if (openaiInstances.has(companyId)) {
    return openaiInstances.get(companyId)!;
  }

  const apiKey = await getApiKey(companyId);
  if (!apiKey) return null;

  const instance = new OpenAI({ apiKey });
  openaiInstances.set(companyId, instance);
  return instance;
};

/**
 * Invalida cache de OpenAI quando API key muda
 */
export const invalidateTranslateCache = (companyId: number): void => {
  openaiInstances.delete(companyId);
};

// Mapa de códigos para nomes legíveis
const LANGUAGE_NAMES: Record<string, string> = {
  "pt-BR": "Portuguese (Brazil)",
  "pt": "Portuguese",
  "en": "English",
  "es": "Spanish",
  "fr": "French",
  "de": "German",
  "it": "Italian",
  "zh": "Chinese",
  "ja": "Japanese",
  "ko": "Korean",
  "ar": "Arabic",
  "ru": "Russian",
  "hi": "Hindi",
  "tr": "Turkish",
  "nl": "Dutch",
  "pl": "Polish",
  "uk": "Ukrainian",
  "th": "Thai",
  "vi": "Vietnamese",
  "id": "Indonesian",
  "ms": "Malay"
};

/**
 * Mapa de código de país (DDI) → idioma provável
 * Usado como validação/fallback quando a detecção por IA falha ou é ambígua
 */
const COUNTRY_CODE_TO_LANGUAGE: Record<string, string> = {
  "55": "pt-BR",    // Brasil
  "351": "pt",      // Portugal
  "1": "en",        // EUA/Canadá
  "44": "en",       // Reino Unido
  "61": "en",       // Austrália
  "34": "es",       // Espanha
  "52": "es",       // México
  "54": "es",       // Argentina
  "56": "es",       // Chile
  "57": "es",       // Colômbia
  "58": "es",       // Venezuela
  "51": "es",       // Peru
  "593": "es",      // Equador
  "591": "es",      // Bolívia
  "595": "es",      // Paraguai
  "598": "es",      // Uruguai
  "506": "es",      // Costa Rica
  "502": "es",      // Guatemala
  "503": "es",      // El Salvador
  "504": "es",      // Honduras
  "505": "es",      // Nicarágua
  "507": "es",      // Panamá
  "509": "es",      // Cuba (509 Haiti fr, 53 Cuba)
  "53": "es",       // Cuba
  "33": "fr",       // França
  "49": "de",       // Alemanha
  "39": "it",       // Itália
  "81": "ja",       // Japão
  "82": "ko",       // Coreia do Sul
  "86": "zh",       // China
  "7": "ru",        // Rússia
  "91": "hi",       // Índia
  "90": "tr",       // Turquia
  "31": "nl",       // Holanda
  "48": "pl",       // Polônia
  "380": "uk",      // Ucrânia
  "66": "th",       // Tailândia
  "84": "vi",       // Vietnã
  "62": "id",       // Indonésia
  "60": "ms",       // Malásia
  "966": "ar",      // Arábia Saudita
  "971": "ar",      // Emirados Árabes
  "20": "ar",       // Egito
  "212": "ar",      // Marrocos
  "972": "he",      // Israel
  "46": "sv",       // Suécia
  "47": "no",       // Noruega
  "45": "da",       // Dinamarca
  "358": "fi",      // Finlândia
};

/**
 * Detecta o idioma provável pelo número de telefone (DDI)
 * Retorna null se não conseguir determinar
 */
export const getLanguageFromPhoneNumber = (phoneNumber: string): string | null => {
  if (!phoneNumber) return null;
  // Limpar número - manter só dígitos
  const clean = phoneNumber.replace(/\D/g, "");
  if (clean.length < 4) return null;

  // Tentar DDI de 3 dígitos primeiro, depois 2, depois 1
  for (const len of [3, 2, 1]) {
    const prefix = clean.substring(0, len);
    if (COUNTRY_CODE_TO_LANGUAGE[prefix]) {
      return COUNTRY_CODE_TO_LANGUAGE[prefix];
    }
  }
  return null;
};

/**
 * Valida/corrige o idioma detectado pela IA usando o DDI do telefone.
 * Se a IA detectou pt-BR mas o número é do México (+52), marca como "es".
 * Útil para mensagens curtas onde a IA pode errar.
 */
export const validateDetectedLanguage = (
  detectedLang: string,
  phoneNumber: string | null
): string => {
  if (!phoneNumber) return detectedLang;

  const phoneLang = getLanguageFromPhoneNumber(phoneNumber);
  if (!phoneLang) return detectedLang;

  const detectedBase = detectedLang.split("-")[0];
  const phoneBase = phoneLang.split("-")[0];

  // Se a IA detectou o mesmo idioma-base que o DDI sugere, tudo OK
  if (detectedBase === phoneBase) return detectedLang;

  // Se a IA detectou pt-BR mas o número não é do Brasil/Portugal → confiar no DDI
  // (mensagens curtas em espanhol podem ser confundidas com português)
  if (detectedBase === "pt" && phoneBase !== "pt") {
    return phoneLang;
  }

  // Se a IA detectou espanhol mas o número é do Brasil → confiar na IA
  // (pode ser que a pessoa realmente escreveu em espanhol)
  if (detectedBase === "es" && phoneBase === "pt") {
    return detectedLang; // confiar na IA neste caso
  }

  // Para outros casos, confiar na IA (ela geralmente é melhor com textos longos)
  return detectedLang;
};

/**
 * Detecta o idioma de um texto
 */
export const detectLanguage = async (
  text: string,
  companyId: number
): Promise<string | null> => {
  if (!text || text.trim().length < 3) return null;

  const openai = await getOpenAI(companyId);
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a language detection tool. Respond with ONLY the ISO 639-1 language code (e.g., "en", "pt-BR", "es", "fr", "de", "zh", "ja", "ar"). For Brazilian Portuguese use "pt-BR". For European Portuguese use "pt". No explanation, just the code.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 10,
      temperature: 0
    });

    const detected = response.choices[0]?.message?.content?.trim();
    return detected || null;
  } catch (err) {
    console.error("[TranslateService] Erro na detecção de idioma:", err);
    return null;
  }
};

/**
 * Traduz texto de um idioma para outro
 */
export const translateText = async (
  text: string,
  fromLang: string,
  toLang: string,
  companyId: number
): Promise<string | null> => {
  if (!text || text.trim().length === 0) return null;

  // Mesmo idioma, não precisa traduzir
  const fromBase = fromLang.split("-")[0];
  const toBase = toLang.split("-")[0];
  if (fromBase === toBase) return null;

  const openai = await getOpenAI(companyId);
  if (!openai) return null;

  const fromName = LANGUAGE_NAMES[fromLang] || LANGUAGE_NAMES[fromBase] || fromLang;
  const toName = LANGUAGE_NAMES[toLang] || LANGUAGE_NAMES[toBase] || toLang;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional WhatsApp message translator. Translate the following text from ${fromName} to ${toName}.

CRITICAL RULES:
- Translate 100% of the text. Never leave any part in the original language
- The translation must sound natural and fluent in ${toName}, not word-by-word
- Keep emojis, URLs, phone numbers, and proper nouns (names of people, brands) unchanged
- Maintain the conversational/informal tone typical of WhatsApp chats
- Do NOT add any explanation, notes, or extra text
- Return ONLY the translated text, nothing else`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[TranslateService] Erro na tradução:", err);
    return null;
  }
};

/**
 * Detecta e traduz em uma única chamada (mais eficiente)
 */
export const detectAndTranslate = async (
  text: string,
  targetLang: string,
  companyId: number,
  phoneNumber?: string | null
): Promise<TranslateResult | null> => {
  if (!text || text.trim().length < 3) return null;

  const openai = await getOpenAI(companyId);
  if (!openai) return null;

  const targetName = LANGUAGE_NAMES[targetLang] || LANGUAGE_NAMES[targetLang.split("-")[0]] || targetLang;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional WhatsApp message translator.

TASK:
1. Detect the language of the input text
2. If it is already in ${targetName}, respond: {"lang":"${targetLang}","text":null}
3. If it is in ANY other language, you MUST translate it completely to ${targetName} and respond: {"lang":"<detected-iso-code>","text":"<fully translated text>"}

CRITICAL RULES:
- ALWAYS translate 100% of the text. Never leave parts in the original language
- The translated text must sound natural in ${targetName}, not a word-by-word translation
- Use ISO 639-1 codes (en, es, fr, de, etc). For Brazilian Portuguese use "pt-BR"
- Keep emojis, URLs, phone numbers, and proper nouns (names of people, brands) unchanged
- Maintain the conversational/informal tone typical of WhatsApp chats
- Respond ONLY with the JSON object, absolutely nothing else
- If unsure about the language, still translate to ${targetName}`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content);
    // Validar idioma detectado pela IA usando DDI do telefone
    const validatedLang = phoneNumber
      ? validateDetectedLanguage(parsed.lang, phoneNumber)
      : parsed.lang;

    // Se a validação mudou o idioma e o texto não foi traduzido (era "mesmo idioma"),
    // mas na verdade é outro idioma → precisamos traduzir
    if (validatedLang !== parsed.lang && !parsed.text) {
      // IA achou que era o mesmo idioma do target, mas DDI diz que é outro
      // Neste caso, retornar com idioma corrigido (sem tradução necessária se target = validatedLang)
      const validatedBase = validatedLang.split("-")[0];
      const targetBase = targetLang.split("-")[0];
      if (validatedBase === targetBase) {
        return { detectedLanguage: validatedLang, translatedText: "" };
      }
      // Precisa traduzir de fato — fazer chamada separada
      const translated = await translateText(text, validatedLang, targetLang, companyId);
      return {
        detectedLanguage: validatedLang,
        translatedText: translated || ""
      };
    }

    return {
      detectedLanguage: validatedLang,
      translatedText: parsed.text || ""
    };
  } catch (err) {
    console.error("[TranslateService] Erro na detecção+tradução:", err);
    return null;
  }
};

/**
 * Verifica se a tradução automática está habilitada para a empresa
 */
export const isAutoTranslateEnabled = async (companyId: number): Promise<boolean> => {
  try {
    const settings = await CompaniesSettings.findOne({
      where: { companyId },
      attributes: ["autoTranslate"]
    });
    return settings?.getDataValue("autoTranslate") === "enabled";
  } catch {
    return false;
  }
};
