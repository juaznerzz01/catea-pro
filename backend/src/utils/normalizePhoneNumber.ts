import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import logger from './logger';

/**
 * Normaliza um número de telefone para o formato E.164 padrão
 *
 * @param rawNumber - Número de telefone em qualquer formato
 * @param defaultCountry - Código do país padrão (default: 'BR')
 * @returns Número normalizado em E.164 (ex: +5511999999999) ou null se inválido
 *
 * @example
 * normalizePhoneNumber('(11) 99999-9999') // '+5511999999999'
 * normalizePhoneNumber('11 999999999') // '+5511999999999'
 * normalizePhoneNumber('+55 11 99999-9999') // '+5511999999999'
 */
export const normalizePhoneNumber = (rawNumber: string, defaultCountry: string = 'BR'): string | null => {
  if (!rawNumber) return null;

  try {
    // Remover espaços e caracteres especiais, mantendo apenas dígitos e +
    let cleaned = rawNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');

    // México: remover prefixo legacy "1" após código de país 52
    // WhatsApp envia como +521XXXXXXXXXX, mas desde 2019 o formato correto é +52XXXXXXXXXX
    cleaned = cleaned.replace(/^\+?521(\d{10})$/, '+52$1');

    // Se já começa com +, validar direto
    if (cleaned.startsWith('+')) {
      if (isValidPhoneNumber(cleaned, defaultCountry as any)) {
        const parsed = parsePhoneNumber(cleaned, defaultCountry as any);
        return parsed.number;
      }
    } else {
      // Sem +: tentar como número local do defaultCountry
      if (isValidPhoneNumber(cleaned, defaultCountry as any)) {
        const parsed = parsePhoneNumber(cleaned, defaultCountry as any);
        return parsed.number;
      }

      // Tentar adicionando + (caso seja código de país + número sem o +)
      if (isValidPhoneNumber('+' + cleaned)) {
        const parsed = parsePhoneNumber('+' + cleaned);
        return parsed.number;
      }
    }

    logger.warn({ rawNumber, cleaned }, 'Failed to normalize phone number');
    return null;
  } catch (error) {
    logger.error({ error, rawNumber }, 'Error normalizing phone number');
    return null;
  }
};
