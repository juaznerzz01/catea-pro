import { useState, useCallback } from "react";
import api from "../../services/api";
import toastError from "../../errors/toastError";

// Moedas suportadas pela Stripe
const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound' },
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', name: 'Real Brasileiro' },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Iene Japonês' },
  CNY: { code: 'CNY', symbol: '¥', locale: 'zh-CN', name: 'Yuan Chinês' },
  ARS: { code: 'ARS', symbol: '$', locale: 'es-AR', name: 'Peso Argentino' },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  CAD: { code: 'CAD', symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar' },
  CHF: { code: 'CHF', symbol: 'CHF', locale: 'de-CH', name: 'Franco Suíço' },
  CLP: { code: 'CLP', symbol: '$', locale: 'es-CL', name: 'Peso Chileno' },
  COP: { code: 'COP', symbol: '$', locale: 'es-CO', name: 'Peso Colombiano' },
  CZK: { code: 'CZK', symbol: 'Kč', locale: 'cs-CZ', name: 'Coroa Tcheca' },
  DKK: { code: 'DKK', symbol: 'kr', locale: 'da-DK', name: 'Coroa Dinamarquesa' },
  EGP: { code: 'EGP', symbol: 'E£', locale: 'ar-EG', name: 'Libra Egípcia' },
  HKD: { code: 'HKD', symbol: 'HK$', locale: 'zh-HK', name: 'Hong Kong Dollar' },
  HUF: { code: 'HUF', symbol: 'Ft', locale: 'hu-HU', name: 'Florim Húngaro' },
  IDR: { code: 'IDR', symbol: 'Rp', locale: 'id-ID', name: 'Rúpia Indonésia' },
  ILS: { code: 'ILS', symbol: '₪', locale: 'he-IL', name: 'Shekel Israelense' },
  INR: { code: 'INR', symbol: '₹', locale: 'hi-IN', name: 'Rúpia Indiana' },
  ISK: { code: 'ISK', symbol: 'kr', locale: 'is-IS', name: 'Coroa Islandesa' },
  KRW: { code: 'KRW', symbol: '₩', locale: 'ko-KR', name: 'Won Sul-Coreano' },
  KWD: { code: 'KWD', symbol: 'د.ك', locale: 'ar-KW', name: 'Dinar Kuwaitiano' },
  MXN: { code: 'MXN', symbol: '$', locale: 'es-MX', name: 'Peso Mexicano' },
  MYR: { code: 'MYR', symbol: 'RM', locale: 'ms-MY', name: 'Ringgit Malaio' },
  NGN: { code: 'NGN', symbol: '₦', locale: 'en-NG', name: 'Naira Nigeriana' },
  NOK: { code: 'NOK', symbol: 'kr', locale: 'nb-NO', name: 'Coroa Norueguesa' },
  NZD: { code: 'NZD', symbol: 'NZ$', locale: 'en-NZ', name: 'New Zealand Dollar' },
  PEN: { code: 'PEN', symbol: 'S/', locale: 'es-PE', name: 'Sol Peruano' },
  PHP: { code: 'PHP', symbol: '₱', locale: 'fil-PH', name: 'Peso Filipino' },
  PKR: { code: 'PKR', symbol: '₨', locale: 'ur-PK', name: 'Rúpia Paquistanesa' },
  PLN: { code: 'PLN', symbol: 'zł', locale: 'pl-PL', name: 'Zloty Polonês' },
  PYG: { code: 'PYG', symbol: '₲', locale: 'es-PY', name: 'Guarani Paraguaio' },
  QAR: { code: 'QAR', symbol: 'ر.ق', locale: 'ar-QA', name: 'Rial Catarense' },
  RON: { code: 'RON', symbol: 'lei', locale: 'ro-RO', name: 'Leu Romeno' },
  RUB: { code: 'RUB', symbol: '₽', locale: 'ru-RU', name: 'Rublo Russo' },
  SAR: { code: 'SAR', symbol: 'ر.س', locale: 'ar-SA', name: 'Rial Saudita' },
  SEK: { code: 'SEK', symbol: 'kr', locale: 'sv-SE', name: 'Coroa Sueca' },
  SGD: { code: 'SGD', symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar' },
  THB: { code: 'THB', symbol: '฿', locale: 'th-TH', name: 'Baht Tailandês' },
  TRY: { code: 'TRY', symbol: '₺', locale: 'tr-TR', name: 'Lira Turca' },
  TWD: { code: 'TWD', symbol: 'NT$', locale: 'zh-TW', name: 'Dólar Taiwanês' },
  UAH: { code: 'UAH', symbol: '₴', locale: 'uk-UA', name: 'Hryvnia Ucraniana' },
  UYU: { code: 'UYU', symbol: '$U', locale: 'es-UY', name: 'Peso Uruguaio' },
  VND: { code: 'VND', symbol: '₫', locale: 'vi-VN', name: 'Dong Vietnamita' },
  ZAR: { code: 'ZAR', symbol: 'R', locale: 'en-ZA', name: 'Rand Sul-Africano' },
  AED: { code: 'AED', symbol: 'د.إ', locale: 'ar-AE', name: 'Dirham dos EAU' },
  AFN: { code: 'AFN', symbol: '؋', locale: 'fa-AF', name: 'Afghani' },
  ALL: { code: 'ALL', symbol: 'L', locale: 'sq-AL', name: 'Lek Albanês' },
  AMD: { code: 'AMD', symbol: '֏', locale: 'hy-AM', name: 'Dram Armênio' },
  ANG: { code: 'ANG', symbol: 'ƒ', locale: 'nl-AN', name: 'Florim Antilhano' },
  AOA: { code: 'AOA', symbol: 'Kz', locale: 'pt-AO', name: 'Kwanza Angolano' },
  AWG: { code: 'AWG', symbol: 'ƒ', locale: 'nl-AW', name: 'Florim Arubano' },
  AZN: { code: 'AZN', symbol: '₼', locale: 'az-AZ', name: 'Manat Azerbaijano' },
  BAM: { code: 'BAM', symbol: 'KM', locale: 'bs-BA', name: 'Marco Conversível' },
  BBD: { code: 'BBD', symbol: '$', locale: 'en-BB', name: 'Barbados Dollar' },
  BDT: { code: 'BDT', symbol: '৳', locale: 'bn-BD', name: 'Taka de Bangladesh' },
  BGN: { code: 'BGN', symbol: 'лв', locale: 'bg-BG', name: 'Lev Búlgaro' },
  BHD: { code: 'BHD', symbol: '.د.ب', locale: 'ar-BH', name: 'Dinar Bareinita' },
  BIF: { code: 'BIF', symbol: 'FBu', locale: 'fr-BI', name: 'Franco Burundinês' },
  BMD: { code: 'BMD', symbol: '$', locale: 'en-BM', name: 'Bermuda Dollar' },
  BND: { code: 'BND', symbol: '$', locale: 'ms-BN', name: 'Brunei Dollar' },
  BOB: { code: 'BOB', symbol: 'Bs.', locale: 'es-BO', name: 'Boliviano' },
  BSD: { code: 'BSD', symbol: '$', locale: 'en-BS', name: 'Bahamas Dollar' },
  BWP: { code: 'BWP', symbol: 'P', locale: 'en-BW', name: 'Pula de Botswana' },
  BYN: { code: 'BYN', symbol: 'Br', locale: 'be-BY', name: 'Rublo Bielorrusso' },
  BZD: { code: 'BZD', symbol: '$', locale: 'en-BZ', name: 'Belize Dollar' },
  CDF: { code: 'CDF', symbol: 'FC', locale: 'fr-CD', name: 'Franco Congolês' },
  CRC: { code: 'CRC', symbol: '₡', locale: 'es-CR', name: 'Colón Costarriquenho' },
  CVE: { code: 'CVE', symbol: '$', locale: 'pt-CV', name: 'Escudo Cabo-Verdiano' },
  DJF: { code: 'DJF', symbol: 'Fdj', locale: 'fr-DJ', name: 'Franco Djiboutiano' },
  DOP: { code: 'DOP', symbol: 'RD$', locale: 'es-DO', name: 'Peso Dominicano' },
  DZD: { code: 'DZD', symbol: 'د.ج', locale: 'ar-DZ', name: 'Dinar Argelino' },
  ETB: { code: 'ETB', symbol: 'Br', locale: 'am-ET', name: 'Birr Etíope' },
  FJD: { code: 'FJD', symbol: '$', locale: 'en-FJ', name: 'Fiji Dollar' },
  FKP: { code: 'FKP', symbol: '£', locale: 'en-FK', name: 'Libra Malvinense' },
  GEL: { code: 'GEL', symbol: '₾', locale: 'ka-GE', name: 'Lari Georgiano' },
  GHS: { code: 'GHS', symbol: '₵', locale: 'en-GH', name: 'Cedi Ganês' },
  GIP: { code: 'GIP', symbol: '£', locale: 'en-GI', name: 'Libra de Gibraltar' },
  GMD: { code: 'GMD', symbol: 'D', locale: 'en-GM', name: 'Dalasi Gambiano' },
  GNF: { code: 'GNF', symbol: 'FG', locale: 'fr-GN', name: 'Franco Guineense' },
  GTQ: { code: 'GTQ', symbol: 'Q', locale: 'es-GT', name: 'Quetzal Guatemalteco' },
  GYD: { code: 'GYD', symbol: '$', locale: 'en-GY', name: 'Guyana Dollar' },
  HNL: { code: 'HNL', symbol: 'L', locale: 'es-HN', name: 'Lempira Hondurenha' },
  HTG: { code: 'HTG', symbol: 'G', locale: 'fr-HT', name: 'Gourde Haitiano' },
  JMD: { code: 'JMD', symbol: '$', locale: 'en-JM', name: 'Jamaica Dollar' },
  JOD: { code: 'JOD', symbol: 'د.ا', locale: 'ar-JO', name: 'Dinar Jordaniano' },
  KES: { code: 'KES', symbol: 'KSh', locale: 'sw-KE', name: 'Xelim Queniano' },
  KGS: { code: 'KGS', symbol: 'сом', locale: 'ky-KG', name: 'Som Quirguiz' },
  KHR: { code: 'KHR', symbol: '៛', locale: 'km-KH', name: 'Riel Cambojano' },
  KMF: { code: 'KMF', symbol: 'CF', locale: 'fr-KM', name: 'Franco Comoriano' },
  KYD: { code: 'KYD', symbol: '$', locale: 'en-KY', name: 'Cayman Dollar' },
  KZT: { code: 'KZT', symbol: '₸', locale: 'kk-KZ', name: 'Tenge Cazaque' },
  LAK: { code: 'LAK', symbol: '₭', locale: 'lo-LA', name: 'Kip Laociano' },
  LBP: { code: 'LBP', symbol: 'ل.ل', locale: 'ar-LB', name: 'Libra Libanesa' },
  LKR: { code: 'LKR', symbol: 'Rs', locale: 'si-LK', name: 'Rúpia do Sri Lanka' },
  LRD: { code: 'LRD', symbol: '$', locale: 'en-LR', name: 'Liberia Dollar' },
  LSL: { code: 'LSL', symbol: 'L', locale: 'en-LS', name: 'Loti do Lesoto' },
  MAD: { code: 'MAD', symbol: 'د.م.', locale: 'ar-MA', name: 'Dirham Marroquino' },
  MDL: { code: 'MDL', symbol: 'L', locale: 'ro-MD', name: 'Leu Moldavo' },
  MGA: { code: 'MGA', symbol: 'Ar', locale: 'mg-MG', name: 'Ariary Malgaxe' },
  MKD: { code: 'MKD', symbol: 'ден', locale: 'mk-MK', name: 'Dinar Macedônio' },
  MMK: { code: 'MMK', symbol: 'K', locale: 'my-MM', name: 'Kyat de Myanmar' },
  MNT: { code: 'MNT', symbol: '₮', locale: 'mn-MN', name: 'Tugrik Mongol' },
  MOP: { code: 'MOP', symbol: 'MOP$', locale: 'zh-MO', name: 'Pataca de Macau' },
  MRU: { code: 'MRU', symbol: 'UM', locale: 'ar-MR', name: 'Ouguiya Mauritana' },
  MUR: { code: 'MUR', symbol: '₨', locale: 'en-MU', name: 'Rúpia Mauriciana' },
  MVR: { code: 'MVR', symbol: 'Rf', locale: 'dv-MV', name: 'Rufiyaa Maldiva' },
  MWK: { code: 'MWK', symbol: 'MK', locale: 'en-MW', name: 'Kwacha Malauiana' },
  MZN: { code: 'MZN', symbol: 'MT', locale: 'pt-MZ', name: 'Metical Moçambicano' },
  NAD: { code: 'NAD', symbol: '$', locale: 'en-NA', name: 'Namibia Dollar' },
  NIO: { code: 'NIO', symbol: 'C$', locale: 'es-NI', name: 'Córdoba Nicaraguense' },
  NPR: { code: 'NPR', symbol: '₨', locale: 'ne-NP', name: 'Rúpia Nepalesa' },
  OMR: { code: 'OMR', symbol: 'ر.ع.', locale: 'ar-OM', name: 'Rial Omanense' },
  PAB: { code: 'PAB', symbol: 'B/.', locale: 'es-PA', name: 'Balboa Panamenho' },
  PGK: { code: 'PGK', symbol: 'K', locale: 'en-PG', name: 'Kina de Papua' },
  RSD: { code: 'RSD', symbol: 'дин.', locale: 'sr-RS', name: 'Dinar Sérvio' },
  RWF: { code: 'RWF', symbol: 'RF', locale: 'rw-RW', name: 'Franco Ruandês' },
  SBD: { code: 'SBD', symbol: '$', locale: 'en-SB', name: 'Solomon Dollar' },
  SCR: { code: 'SCR', symbol: '₨', locale: 'en-SC', name: 'Rúpia Seichelense' },
  SHP: { code: 'SHP', symbol: '£', locale: 'en-SH', name: 'Libra de Santa Helena' },
  SOS: { code: 'SOS', symbol: 'Sh', locale: 'so-SO', name: 'Xelim Somali' },
  SRD: { code: 'SRD', symbol: '$', locale: 'nl-SR', name: 'Suriname Dollar' },
  STN: { code: 'STN', symbol: 'Db', locale: 'pt-ST', name: 'Dobra São-Tomense' },
  SZL: { code: 'SZL', symbol: 'E', locale: 'en-SZ', name: 'Lilangeni Suazi' },
  TJS: { code: 'TJS', symbol: 'SM', locale: 'tg-TJ', name: 'Somoni Tajique' },
  TND: { code: 'TND', symbol: 'د.ت', locale: 'ar-TN', name: 'Dinar Tunisino' },
  TOP: { code: 'TOP', symbol: 'T$', locale: 'to-TO', name: 'Pa\'anga Tonganesa' },
  TTD: { code: 'TTD', symbol: '$', locale: 'en-TT', name: 'Trinidad Dollar' },
  TZS: { code: 'TZS', symbol: 'TSh', locale: 'sw-TZ', name: 'Xelim Tanzaniano' },
  UGX: { code: 'UGX', symbol: 'USh', locale: 'sw-UG', name: 'Xelim Ugandense' },
  UZS: { code: 'UZS', symbol: "so'm", locale: 'uz-UZ', name: 'Som Uzbeque' },
  VES: { code: 'VES', symbol: 'Bs.S', locale: 'es-VE', name: 'Bolívar Venezuelano' },
  VUV: { code: 'VUV', symbol: 'VT', locale: 'en-VU', name: 'Vatu de Vanuatu' },
  WST: { code: 'WST', symbol: 'T', locale: 'en-WS', name: 'Tala Samoano' },
  XAF: { code: 'XAF', symbol: 'FCFA', locale: 'fr-CM', name: 'Franco CFA Central' },
  XCD: { code: 'XCD', symbol: '$', locale: 'en-AG', name: 'East Caribbean Dollar' },
  XOF: { code: 'XOF', symbol: 'CFA', locale: 'fr-SN', name: 'Franco CFA Ocidental' },
  XPF: { code: 'XPF', symbol: '₣', locale: 'fr-PF', name: 'Franco CFP' },
  YER: { code: 'YER', symbol: '﷼', locale: 'ar-YE', name: 'Rial Iemenita' },
  ZMW: { code: 'ZMW', symbol: 'ZK', locale: 'en-ZM', name: 'Kwacha Zambiana' }
};

// Mapeamento idioma → moeda padrão
const LANGUAGE_CURRENCY_MAP = {
  'pt': 'BRL',
  'pt-BR': 'BRL',
  'en': 'USD',
  'es': 'USD',
  'tr': 'TRY',
  'ar': 'SAR',
};

const getCurrencyByLanguage = () => {
  try {
    const lang = localStorage.getItem('i18nextLng') || 'pt';
    const code = LANGUAGE_CURRENCY_MAP[lang] || LANGUAGE_CURRENCY_MAP[lang.substring(0, 2)] || 'USD';
    return CURRENCIES[code] || CURRENCIES.USD;
  } catch {
    return CURRENCIES.USD;
  }
};

const useCurrency = () => {
  const [currency, setCurrency] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrency = useCallback(async () => {
    if (currency) {
      return currency;
    }

    setLoading(true);
    try {
      const { data } = await api.request({
        url: "/settings/currency",
        method: "GET",
      });

      // Se tem moeda salva no banco, usa ela. Senão, usa a do idioma.
      const currencyData = data?.systemCurrency || getCurrencyByLanguage();
      setCurrency(currencyData);
      return currencyData;
    } catch (err) {
      console.warn("Error fetching currency, using language default:", err);
      const fallback = getCurrencyByLanguage();
      setCurrency(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [currency]);

  const updateCurrency = async (currencyCode) => {
    if (!CURRENCIES[currencyCode]) {
      throw new Error(`Moeda não suportada: ${currencyCode}`);
    }

    setLoading(true);
    try {
      const currencyData = CURRENCIES[currencyCode];
      const { data } = await api.request({
        url: "/settings/currency",
        method: "PUT",
        data: { systemCurrency: currencyData },
      });

      setCurrency(currencyData);
      return currencyData;
    } catch (err) {
      toastError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value, currencyData = null) => {
    const activeCurrency = currencyData || currency || getCurrencyByLanguage();

    if (typeof value === 'string') {
      value = parseFloat(value.replace(/[^\d.-]/g, ''));
    }

    if (isNaN(value)) {
      value = 0;
    }

    return new Intl.NumberFormat(activeCurrency.locale, {
      style: 'currency',
      currency: activeCurrency.code,
    }).format(value);
  };

  const getAvailableCurrencies = () => {
    return Object.values(CURRENCIES);
  };

  const clearCache = () => {
    setCurrency(null);
  };

  return {
    currency,
    loading,
    getCurrency,
    updateCurrency,
    formatCurrency,
    getAvailableCurrencies,
    clearCache,
  };
};

export default useCurrency;