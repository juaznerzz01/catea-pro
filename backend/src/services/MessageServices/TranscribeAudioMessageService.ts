import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import Setting from '../../models/Setting';
import CompaniesSettings from '../../models/CompaniesSettings';
import Prompt from '../../models/Prompt';

interface Response {
  transcribedText: string;
}

class TranscribeAudioMessageService {
  public async execute(fileName: string, companyId: number): Promise<Response | { error: string }> {
    // Validação dos parâmetros de entrada
    if (!fileName || typeof fileName !== 'string') {
      return { error: 'fileName é obrigatório e deve ser uma string.' };
    }
    if (!companyId || typeof companyId !== 'number') {
      return { error: 'companyId é obrigatório e deve ser um número.' };
    }

    // Construção e verificação do caminho do arquivo
    const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');
    const filePath = `${publicFolder}/company${companyId}/${fileName}`;

    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      return { error: 'Arquivo não encontrado' };
    }

    // Busca da chave da API - prioridade: translateApiKey (CompaniesSettings) → apiTranscription (Setting) → Prompt.apiKey
    let apiKey: string | null = null;

    // 1. Tentar CompaniesSettings.translateApiKey (mesma chave da tradução)
    const settings = await CompaniesSettings.findOne({
      where: { companyId },
      attributes: ["translateApiKey"],
    });
    const translateKey = settings?.getDataValue("translateApiKey");
    if (translateKey) {
      apiKey = translateKey;
    }

    // 2. Fallback: Setting.apiTranscription
    if (!apiKey) {
      const transcriptionSetting = await Setting.findOne({
        where: { key: 'apiTranscription', companyId },
      });
      if (transcriptionSetting?.value) {
        apiKey = transcriptionSetting.value;
      }
    }

    // 3. Fallback: Prompt.apiKey
    if (!apiKey) {
      const prompt = await Prompt.findOne({
        where: { companyId },
        attributes: ["apiKey"],
        order: [["id", "ASC"]],
      });
      if (prompt?.apiKey) {
        apiKey = prompt.apiKey;
      }
    }

    if (!apiKey) {
      console.error(`Chave da API não encontrada para companyId: ${companyId}`);
      return { error: 'Chave da API não configurada' };
    }

    // Identificação do provedor baseado na chave da API
    let transcriptionProvider: string;
    if (apiKey.startsWith('sk-')) {
      transcriptionProvider = 'openai';
    } else if (apiKey.startsWith('AIzaSy')) {
      transcriptionProvider = 'gemini';
    } else {
      console.error(`Formato de chave da API desconhecido: ${apiKey} para companyId: ${companyId}`);
      return { error: 'Formato de chave da API inválido' };
    }

    try {
      const audioFile = fs.createReadStream(filePath);

      if (transcriptionProvider === 'openai') {
        // Configuração para a API da OpenAI
        const form = new FormData();
        form.append('file', audioFile);
        form.append('model', 'whisper-1');
        form.append('response_format', 'text');
        // Não define language para Whisper detectar automaticamente

        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${apiKey}`,
          },
        });

        return { transcribedText: response.data };
      } else if (transcriptionProvider === 'gemini') {
        // Placeholder para a API do Gemini (ajuste necessário)
        const form = new FormData();
        form.append('file', audioFile);

        // Nota: A URL e a estrutura da resposta devem ser ajustadas conforme a API real do Gemini
        const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:transcribe', form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${apiKey}`,
          },
        });

        // Ajuste conforme a resposta real da API do Gemini
        return { transcribedText: response.data.text || 'Transcrição não disponível' };
      } else {
        console.error(`Provedor de transcrição desconhecido: ${transcriptionProvider} para companyId: ${companyId}`);
        return { error: 'Provedor de transcrição inválido' };
      }
    } catch (error) {
      console.error(`Erro ao transcrever áudio para fileName: ${fileName}, companyId: ${companyId}`, error);
      return { error: 'Conversão para texto falhou' };
    }
  }
}

export default TranscribeAudioMessageService;