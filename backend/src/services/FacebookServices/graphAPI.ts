import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import logger from "../../utils/logger";

const formData: FormData = new FormData();

const apiBase = (token: string) =>
  axios.create({
    baseURL: "https://graph.facebook.com/v18.0/",
    params: {
      access_token: token
    }
  });

export const getAccessToken = async (appId?: string, appSecret?: string): Promise<string> => {
  const { data } = await axios.get(
    "https://graph.facebook.com/v18.0/oauth/access_token",
    {
      params: {
        client_id: appId || process.env.FACEBOOK_APP_ID,
        client_secret: appSecret || process.env.FACEBOOK_APP_SECRET,
        grant_type: "client_credentials"
      }
    }
  );

  return data.access_token;
};

export const markSeen = async (id: string, token: string): Promise<void> => {
  await apiBase(token).post(`${id}/messages`, {
    recipient: {
      id
    },
    sender_action: "mark_seen"
  });
};

export const showTypingIndicator = async (
  id: string, 
  token: string,
  action: string
): Promise<void> => {

  try {
    const { data } = await apiBase(token).post("me/messages", {
      recipient: {
        id: id
      },
      sender_action: action
    })

    return data;
  } catch (error) {
    console.log(error);
  }

}


export const sendText = async (
  id: string | number,
  text: string,
  token: string,
): Promise<void> => {
  try {
    const { data } = await apiBase(token).post("me/messages", {
      recipient: {
        id
      },
      message: {
        text: `${text}`,
      }
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const sendAttachmentFromUrl = async (
  id: string,
  url: string,
  type: string,
  token: string
): Promise<void> => {
  try {
    const { data } = await apiBase(token).post("me/messages", {
      recipient: {
        id
      },
      message: {
        attachment: {
          type,
          payload: {
            url
          }
        }
      }
    });

    return data;
  } catch (error) {
    console.log(error);
  }
};

export const sendAttachment = async (
  id: string,
  file: Express.Multer.File,
  type: string,
  token: string
): Promise<void> => {
  formData.append(
    "recipient",
    JSON.stringify({
      id
    })
  );

  formData.append(
    "message",
    JSON.stringify({
      attachment: {
        type,
        payload: {
          is_reusable: true
        }
      }
    })
  );

  const fileReaderStream = createReadStream(file.path);

  formData.append("filedata", fileReaderStream);

  try {
    await apiBase(token).post("me/messages", formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const genText = (text: string): any => {
  const response = {
    text
  };

  return response;
};

export const getProfile = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(id);

    return data;
  } catch (error) {
    console.log(error);
    throw new Error("ERR_FETCHING_FB_USER_PROFILE_2");
  }
};

export const getPageProfile = async (
  id: string,
  token: string,
  appId?: string,
  appSecret?: string
): Promise<any> => {
  try {
    // Tentar /me/accounts primeiro (funciona para páginas clássicas)
    const { data } = await apiBase(token).get(
      `me/accounts?fields=name,access_token,instagram_business_account{id,username,profile_picture_url,name}`
    );
    console.log("[Facebook] /me/accounts response:", JSON.stringify(data));

    // Se /me/accounts retornou páginas, usar normalmente
    if (data.data && data.data.length > 0) {
      return data;
    }

    // Fallback: /me/accounts vazio (Nova Experiência de Páginas da Meta)
    // Buscar page IDs nos granular_scopes do debug_token
    console.log("[Facebook] /me/accounts vazio, tentando fallback via debug_token...");

    const appToken = appId && appSecret ? `${appId}|${appSecret}` : "";
    if (!appToken) {
      console.log("[Facebook] Sem App Token para debug_token, não é possível fallback");
      return data; // retorna vazio mesmo
    }

    const debugRes = await axios.get(
      "https://graph.facebook.com/v18.0/debug_token",
      { params: { input_token: token, access_token: appToken } }
    );

    const granularScopes = debugRes.data?.data?.granular_scopes || [];
    const pagesScope = granularScopes.find((s: any) => s.scope === "pages_show_list");
    const pageIds: string[] = pagesScope?.target_ids || [];

    console.log("[Facebook] Page IDs encontrados via debug_token:", pageIds);

    if (pageIds.length === 0) {
      return data; // retorna vazio
    }

    // Buscar detalhes de cada página diretamente pelo ID
    const pages: any[] = [];
    for (const pageId of pageIds) {
      try {
        const pageRes = await apiBase(token).get(
          `${pageId}?fields=name,access_token,instagram_business_account{id,username,profile_picture_url,name}`
        );
        console.log("[Facebook] Página encontrada via fallback:", pageId, pageRes.data?.name);
        pages.push(pageRes.data);
      } catch (pageError: any) {
        console.log("[Facebook] Erro ao buscar página", pageId, ":", pageError?.response?.data?.error?.message || pageError?.message);
      }
    }

    return { data: pages };
  } catch (error: any) {
    console.log("[Facebook] Erro ao buscar páginas:", error?.response?.data || error?.message);
    throw new Error("ERR_FETCHING_FB_PAGES");
  }
};

export const profilePsid = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v18.0/${id}?access_token=${token}`
    );
    return data;
  } catch (error) {
    console.log(error);
    await getProfile(id, token);
  }
};

export const subscribeApp = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/v18.0/${id}/subscribed_apps?access_token=${token}`,
      {
        subscribed_fields: [
          "messages",
          "messaging_postbacks",
          "message_deliveries",
          "message_reads",
          "message_echoes"
        ]
      }
    );
    return data;
  } catch (error) {
    console.log(error)
    throw new Error("ERR_SUBSCRIBING_PAGE_TO_MESSAGE_WEBHOOKS");
  }
};

export const unsubscribeApp = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await axios.delete(
      `https://graph.facebook.com/v18.0/${id}/subscribed_apps?access_token=${token}`
    );
    return data;
  } catch (error) {
    throw new Error("ERR_UNSUBSCRIBING_PAGE_TO_MESSAGE_WEBHOOKS");
  }
};


export const getSubscribedApps = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(`${id}/subscribed_apps`);
    return data;
  } catch (error) {
    throw new Error("ERR_GETTING_SUBSCRIBED_APPS");
  }
};

export const getAccessTokenFromPage = async (
  token: string,
  appId?: string,
  appSecret?: string
): Promise<string> => {
  try {

    if (!token) throw new Error("ERR_FETCHING_FB_USER_TOKEN");

    const data = await axios.get(
      "https://graph.facebook.com/v18.0/oauth/access_token",
      {
        params: {
          client_id: appId || process.env.FACEBOOK_APP_ID,
          client_secret: appSecret || process.env.FACEBOOK_APP_SECRET,
          grant_type: "fb_exchange_token",
          fb_exchange_token: token
        }
      }
    );

    return data.data.access_token;
  } catch (error) {
    console.log(error);
    throw new Error("ERR_FETCHING_FB_USER_TOKEN");
  }
};

export const removeApplcation = async (
  id: string,
  token: string
): Promise<void> => {
  try {
    await axios.delete(`https://graph.facebook.com/v18.0/${id}/permissions`, {
      params: {
        access_token: token
      }
    });
  } catch (error) {
    logger.error("ERR_REMOVING_APP_FROM_PAGE");
  }
};