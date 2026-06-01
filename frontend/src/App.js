import React, { useState, useEffect, useMemo } from "react";
import api from "./services/api";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import { ActiveMenuProvider } from "./context/ActiveMenuContext";
import Favicon from "react-favicon";
import { getBackendUrl } from "./config";
import Routes from "./routes";
import useSettings from "./hooks/useSettings";

const defaultLogoLight = "/logo-light.png";
const defaultLogoDark = "/logo-dark.png";
const defaultLogoFavicon = "/favicon.png";

const queryClient = new QueryClient();

const App = () => {
  const [locale, setLocale] = useState();
  const appColorLocalStorage = localStorage.getItem("primaryColorLight") || localStorage.getItem("primaryColorDark") || "#065183";
  const appNameLocalStorage = localStorage.getItem("appName") || "";
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");
  const [primaryColorLight, setPrimaryColorLight] = useState(appColorLocalStorage);
  const [primaryColorDark, setPrimaryColorDark] = useState(appColorLocalStorage);
  const [appLogoLight, setAppLogoLight] = useState(defaultLogoLight);
  const [appLogoDark, setAppLogoDark] = useState(defaultLogoDark);
  const [appLogoFavicon, setAppLogoFavicon] = useState(defaultLogoFavicon);
  const [appName, setAppName] = useState(appNameLocalStorage);
  const { getPublicSetting } = useSettings();
  // Estado para controlar o prompt de instalação do PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        document.body.classList.add("theme-transitioning");
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          window.localStorage.setItem("preferredTheme", newMode);
          return newMode;
        });
        setTimeout(() => {
          document.body.classList.remove("theme-transitioning");
        }, 400);
      },
      setPrimaryColorLight,
      setPrimaryColorDark,
      setAppLogoLight,
      setAppLogoDark,
      setAppLogoFavicon,
      setAppName,
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      mode,
    }),
    [appLogoLight, appLogoDark, appLogoFavicon, appName, mode]
  );

  const theme = useMemo(
    () =>
      createTheme(
        {
          scrollbarStyles: {
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)",
              backgroundColor: mode === "light" ? primaryColorLight : primaryColorDark,
            },
          },
          scrollbarStylesSoft: {
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: mode === "light" ? "#F3F3F3" : "#333333",
            },
          },
          palette: {
            type: mode,
            primary: { main: mode === "light" ? primaryColorLight : primaryColorDark },
            textPrimary: mode === "light" ? primaryColorLight : primaryColorDark,
            borderPrimary: mode === "light" ? primaryColorLight : primaryColorDark,
            dark: { main: mode === "light" ? "#333333" : "#F3F3F3" },
            light: { main: mode === "light" ? "#F3F3F3" : "#333333" },
            fontColor: mode === "light" ? primaryColorLight : primaryColorDark,
            tabHeaderBackground: mode === "light" ? "#EEE" : "#1a1a1a",
            optionsBackground: mode === "light" ? "#fafafa" : "#1a1a1a",
            fancyBackground: mode === "light" ? "#fafafa" : "#1a1a1a",
            total: mode === "light" ? "#fff" : "#1a1a1a",
            messageIcons: mode === "light" ? "grey" : "#F3F3F3",
            inputBackground: mode === "light" ? "#FFFFFF" : "#1a1a1a",
            barraSuperior: mode === "light" ? primaryColorLight : "#2c2c2c",
          },
          mode,
          appLogoLight,
          appLogoDark,
          appLogoFavicon,
          appName,
          calculatedLogoDark: () => {
            if (appLogoDark === defaultLogoDark && appLogoLight !== defaultLogoLight) {
              return appLogoLight;
            }
            return appLogoDark;
          },
          calculatedLogoLight: () => {
            if (appLogoDark !== defaultLogoDark && appLogoLight === defaultLogoLight) {
              return appLogoDark;
            }
            return appLogoLight;
          },
        },
        locale
      ),
    [appLogoLight, appLogoDark, appLogoFavicon, appName, locale, mode, primaryColorDark, primaryColorLight]
  );

  // Detecta quando o navegador está pronto para mostrar o prompt de instalação do PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Previne o comportamento padrão do navegador
      e.preventDefault();
      // Armazena o evento para uso posterior
      setDeferredPrompt(e);
      
      // Mostra o prompt de instalação imediatamente
      setTimeout(() => {
        showInstallPrompt();
      }, 2000); // Pequeno delay para garantir que a página já carregou
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Função para mostrar o prompt de instalação
  const showInstallPrompt = () => {
    if (deferredPrompt) {
      // Verifica se o PWA já está instalado
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        // Mostra o prompt de instalação
        deferredPrompt.prompt();
        
        // Espera pela resposta do usuário
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
          } else {
          }
          // Limpa o prompt armazenado, só pode ser usado uma vez
          setDeferredPrompt(null);
        });
      }
    }
  };

  useEffect(() => {
    try {
      const i18nlocale = localStorage.getItem("i18nextLng") || "pt";
      const browserLocale = i18nlocale.substring(0, 2) + (i18nlocale.length > 3 ? i18nlocale.substring(3, 5) : "");

      if (browserLocale === "ptBR" || browserLocale === "pt") {
        setLocale(ptBR);
      }
    } catch (e) {
      setLocale(ptBR);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("preferredTheme", mode);
  }, [mode]);

  useEffect(() => {
    // WhiteLabel: Carregar TODAS as configurações com cache-first + paralelização
    const loadWhiteLabelSettings = async () => {
      const settingsConfig = [
        { key: 'appName', setter: setAppName, defaultValue: 'ChatIA', cache: true },
        { key: 'primaryColorLight', setter: setPrimaryColorLight, defaultValue: '#0000FF', cache: true },
        { key: 'primaryColorDark', setter: setPrimaryColorDark, defaultValue: '#39ACE7', cache: true },
        { key: 'appLogoLight', setter: setAppLogoLight, defaultValue: defaultLogoLight, cache: true, isFile: true },
        { key: 'appLogoDark', setter: setAppLogoDark, defaultValue: defaultLogoDark, cache: true, isFile: true },
        { key: 'appLogoFavicon', setter: setAppLogoFavicon, defaultValue: defaultLogoFavicon, cache: true, isFile: true }
      ];

      // ETAPA 1: Carregar cache PRIMEIRO (síncrono, instantâneo)
      settingsConfig.forEach(({ key, setter, defaultValue, cache, isFile }) => {
        if (cache) {
          const cachedValue = localStorage.getItem(key);
          if (cachedValue && cachedValue !== 'null' && cachedValue !== 'undefined') {
            const value = isFile && !cachedValue.startsWith('http') && !cachedValue.startsWith('/')
              ? getBackendUrl() + "/public/" + cachedValue
              : cachedValue;

            setter(value);

            // Atualiza document.title imediatamente se for appName
            if (key === 'appName') {
              document.title = cachedValue;
            }

          }
        }
      });

      // ETAPA 2: Executar TODAS as chamadas API EM PARALELO

      const promises = settingsConfig.map(({ key }) =>
        getPublicSetting(key).catch(error => {
          return null;
        })
      );

      const results = await Promise.allSettled(promises);

      // ✅ ETAPA 3: Processar resultados e atualizar estados + cache
      results.forEach((result, index) => {
        const { key, setter, defaultValue, cache, isFile } = settingsConfig[index];

        if (result.status === 'fulfilled' && result.value !== null) {
          let value = result.value || defaultValue;

          // Processar arquivos (adicionar URL base se necessário)
          if (isFile && value && !value.startsWith('http') && !value.startsWith('/')) {
            value = getBackendUrl() + "/public/" + value;
          } else if (isFile && !value) {
            value = defaultValue;
          }

          setter(value);

          // Salvar no cache
          if (cache) {
            localStorage.setItem(key, result.value || defaultValue);
          }

          // Atualizar document.title se for appName
          if (key === 'appName') {
            document.title = result.value || defaultValue;
          }

        } else {
          // Se falhou, usar valor padrão (se não tiver cache)
          const cachedValue = localStorage.getItem(key);
          if (!cachedValue) {
            let value = defaultValue;
            if (isFile && !value.startsWith('http') && !value.startsWith('/')) {
              // defaultValue já deve ser um caminho relativo válido
              value = defaultValue;
            }
            setter(value);
          }
        }
      });

    };

    loadWhiteLabelSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ WhiteLabel: useEffect reativo para atualizar document.title quando appName muda
  useEffect(() => {
    if (appName && appName !== 'null' && appName !== 'undefined') {
      document.title = appName;
    }
  }, [appName]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primaryColor", mode === "light" ? primaryColorLight : primaryColorDark);
  }, [primaryColorLight, primaryColorDark, mode]);

  useEffect(() => {
    async function fetchVersionData() {
      try {
        const response = await api.get("/version");
        const { data } = response;
        window.localStorage.setItem("frontendVersion", data.version);
      } catch (error) {
      }
    }
    fetchVersionData();
  }, []);

  return (
    <>
      <Favicon url={appLogoFavicon ? getBackendUrl() + "/public/" + appLogoFavicon : defaultLogoFavicon} />
      <ColorModeContext.Provider value={{ colorMode }}>
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <ActiveMenuProvider>
  <div style={{ position: "relative", overflow: "hidden", zIndex: 0, height: "100vh" }}>
    <Routes />
  </div>
            </ActiveMenuProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </>
  );
};

export default App;