import { i18n } from "../../translate/i18n";

import React, { useState, useEffect, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";

import { Button, TextField, Typography, Popover, Switch, IconButton } from "@material-ui/core";
import { makeStyles, useTheme, alpha } from "@material-ui/core/styles";

import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import { BACKEND_URL } from "../../config/env";

// Ícones SVG customizados para evitar problemas de fundo branco
const EmailSvgIcon = ({ color = "#666666", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ backgroundColor: 'transparent' }}
  >
    <path
      d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
      fill={color}
    />
  </svg>
);

const LockSvgIcon = ({ color = "#666666", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ backgroundColor: 'transparent' }}
  >
    <path
      d="M18 8H17V6C17 3.24 14.76 1 12 1S7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15S10.9 13 12 13S14 13.9 14 15S13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9S15.1 4.29 15.1 6V8Z"
      fill={color}
    />
  </svg>
);

const VisibilitySvgIcon = ({ color = "#666666", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ backgroundColor: 'transparent' }}
  >
    <path
      d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7S17 9.24 17 12S14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15S15 13.66 15 12S13.66 9 12 9Z"
      fill={color}
    />
  </svg>
);

const VisibilityOffSvgIcon = ({ color = "#666666", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ backgroundColor: 'transparent' }}
  >
    <path
      d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.26 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8.04 5.21L10.17 7.34C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.81 19.09L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8Z"
      fill={color}
    />
  </svg>
);

// Check icon for selected language
const CheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12L10 17L20 7" />
  </svg>
);

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: theme.mode === "light" ? "#f5f5f5" : "#1a1a1a",
    transition: "background-color 0.3s ease",
  },
  // Container para controles no topo esquerdo
  topLeftControls: {
    position: "absolute",
    top: "20px",
    left: "20px",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  // Estilos para seletor de idioma (trigger)
  langTriggerButton: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    padding: 4,
    borderRadius: 6,
    transition: "all 0.15s ease",
    background: "transparent",
    "&:hover": {
      opacity: 0.7,
    },
  },
  langTriggerFlag: {
    width: 28,
    height: 20,
    objectFit: "cover",
    borderRadius: 3,
    border: theme.mode === "dark"
      ? "1.5px solid rgba(255,255,255,0.3)"
      : "1.5px solid rgba(0,0,0,0.15)",
    display: "block",
  },
  langPopoverPaper: {
    borderRadius: 14,
    minWidth: 230,
    overflow: "hidden",
    boxShadow: "0 10px 36px rgba(0,0,0,0.14)",
    border: theme.mode === "dark"
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(0,0,0,0.06)",
    background: theme.mode === "dark" ? "#1e1e1e" : "#ffffff",
  },
  langHeader: {
    padding: "14px 18px 10px",
    borderBottom: theme.mode === "dark"
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(0,0,0,0.06)",
  },
  langHeaderTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: theme.mode === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.38)",
  },
  langOptionsList: {
    padding: 6,
  },
  langOptionItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "9px 12px",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.15s ease",
    "&:hover": {
      background: theme.mode === "dark"
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.04)",
    },
  },
  langOptionItemSelected: {
    background: theme.mode === "dark"
      ? alpha(theme.palette.primary.main, 0.15)
      : alpha(theme.palette.primary.main, 0.08),
    "&:hover": {
      background: theme.mode === "dark"
        ? alpha(theme.palette.primary.main, 0.2)
        : alpha(theme.palette.primary.main, 0.12),
    },
  },
  langFlagImg: {
    width: 30,
    height: 20,
    objectFit: "cover",
    borderRadius: 3,
    flexShrink: 0,
    border: theme.mode === "dark"
      ? "1px solid rgba(255,255,255,0.12)"
      : "1px solid rgba(0,0,0,0.1)",
  },
  langOptionName: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.mode === "dark" ? "#ffffff" : "#1a1a1a",
    flex: 1,
  },
  langCheckWrapper: {
    width: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.primary.main,
    flexShrink: 0,
  },
  // Estilos para toggle de tema (agora ao lado do seletor de idioma)
  themeToggle: {
    background: "transparent !important",
    backgroundColor: "transparent !important",
    borderRadius: "50%",
    padding: "10px",
    transition: "all 0.3s ease",
    minWidth: "44px",
    height: "44px",
    boxShadow: "none !important",
    "&:hover": {
      opacity: 0.7,
      background: "transparent !important",
      backgroundColor: "transparent !important",
    },
    "&:focus": {
      background: "transparent !important",
      backgroundColor: "transparent !important",
    },
    "& .MuiTouchRipple-root": {
      display: "none",
    },
  },
  formSide: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    [theme.breakpoints.down("sm")]: { padding: "20px" },
  },
  formContainer: {
    width: "100%",
    maxWidth: "400px",
    background: theme.mode === "light" ? "#ffffff" : "#2c2c2c",
    borderRadius: "21px",
    boxShadow: theme.mode === "light"
      ? "0px 4px 12px rgba(0, 0, 0, 0.1)"
      : "0px 4px 12px rgba(0, 0, 0, 0.4)",
    padding: "30px",
    transition: "background-color 0.3s ease, box-shadow 0.3s ease",
    border: theme.mode === "dark"
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "none",
    [theme.breakpoints.down("sm")]: { maxWidth: "340px", padding: "20px" },
  },
  logoImg: {
    display: "block",
    margin: "0 auto 20px",
    maxWidth: "150px",
    height: "auto",
  },
  submitBtn: {
    marginTop: "20px",
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    borderRadius: "14px",
    padding: "12px",
    fontWeight: "bold",
    width: "100%",
    cursor: "pointer",
    transition: "all 0.5s ease",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
    },
  },
  signupText: {
    marginTop: "16px",
    textAlign: "center",
    fontSize: "14px",
    color: theme.mode === "light" ? "#666" : "#aaa",
  },
  signupLink: {
    color: theme.palette.primary.main,
    textDecoration: "none",
    fontWeight: "600",
    "&:hover": { textDecoration: "underline" },
  },
  forgotPassword: { marginTop: "15px", textAlign: "center" },
  forgotPasswordLink: {
    color: theme.mode === "light" ? theme.palette.primary.main : "#ffffff",
    textDecoration: "none",
    fontWeight: "500",
    "&:hover": { textDecoration: "underline" },
  },
  rememberMeContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: "10px",
    "& .MuiTypography-root": {
      color: theme.palette.primary.main,
      fontWeight: 500,
    },
  },

  /* === Campos com borda e label em cinza fixo (não dinâmico) === */
  textFieldPrimary: {
    // Label padrão e focado: cinza fixo
    "&& label": {
      color: "#9e9e9e !important",
    },
    "&& label.Mui-focused": {
      color: "#9e9e9e !important",
    },
    // Borda padrão: cinza fixo
    "&& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
      borderColor: "#9e9e9e !important",
      borderRadius: "14px",
    },
    // Hover: cinza um pouco mais escuro
    "&&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
      borderColor: "#757575 !important",
    },
    // Foco: mesmo cinza
    "&& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#9e9e9e !important",
      borderWidth: "2px",
    },
    // Padding para dar espaço aos ícones
    "&& .MuiOutlinedInput-input": {
      paddingLeft: "45px",
    },
    // Ajustar posição do label para não sobrepor o ícone
    "&& .MuiInputLabel-outlined": {
      transform: "translate(45px, 20px) scale(1)",
    },
    "&& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
      transform: "translate(14px, -6px) scale(0.75)",
    },
  },

  textFieldWithEndIcon: {
    // Label padrão e focado: cinza fixo
    "&& label": {
      color: "#9e9e9e !important",
    },
    "&& label.Mui-focused": {
      color: "#9e9e9e !important",
    },
    // Borda padrão: cinza fixo
    "&& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
      borderColor: "#9e9e9e !important",
      borderRadius: "14px",
    },
    // Hover
    "&&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
      borderColor: "#757575 !important",
    },
    // Foco
    "&& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#9e9e9e !important",
      borderWidth: "2px",
    },
    // Padding para ícones em ambos os lados
    "&& .MuiOutlinedInput-input": {
      paddingLeft: "45px",
      paddingRight: "45px",
    },
    // Ajustar posição do label para não sobrepor o ícone
    "&& .MuiInputLabel-outlined": {
      transform: "translate(45px, 20px) scale(1)",
    },
    "&& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
      transform: "translate(14px, -6px) scale(0.75)",
    },
  },

  // Container para posicionamento dos ícones
  inputContainer: {
    position: "relative",
    width: "100%",
  },

  // Ícone posicionado absolutamente no lado esquerdo
  inputIconLeft: {
    position: "absolute",
    left: "12px",
    top: "35px", // Ajustado para alinhar melhor com o texto do label
    zIndex: 1,
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Ícone posicionado absolutamente no lado direito
  inputIconRight: {
    position: "absolute",
    right: "12px",
    top: "27px", // Ajustado para alinhar melhor com o texto do label
    zIndex: 1,
    cursor: "pointer",
    padding: "8px",
    borderRadius: "4px",
    transition: "opacity 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      opacity: 0.7,
    },
  },


}));

const Login = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { handleLogin } = useContext(AuthContext);
  const { colorMode } = useContext(ColorModeContext);

  const [user, setUser] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [userCreationEnabled, setUserCreationEnabled] = useState(true);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Mapeamento de idiomas com bandeiras
  const languageOptions = [
    { code: "pt-BR", shortCode: "pt", flag: "/flags/br.png", name: "Português" },
    { code: "en", shortCode: "en", flag: "/flags/us.png", name: "English" },
    { code: "es", shortCode: "es", flag: "/flags/es.png", name: "Español" },
    { code: "tr", shortCode: "tr", flag: "/flags/tr.png", name: "Türkçe" },
    { code: "ar", shortCode: "ar", flag: "/flags/sa.png", name: "العربية" },
  ];

  const currentLanguage = localStorage.getItem("i18nextLng") || "pt-BR";
  const selectedLanguage = languageOptions.find(
    lang => lang.code === currentLanguage || lang.shortCode === currentLanguage
  ) || languageOptions[0];

  const isLangSelected = (lang) =>
    lang.code === currentLanguage || lang.shortCode === currentLanguage;

  const langHeaderLabel = (() => {
    const l = (currentLanguage || "pt").split("-")[0];
    return l === "en" ? "Language" : l === "es" ? "Idioma" : l === "tr" ? "Dil" : l === "ar" ? "اللغة" : "Idioma";
  })();

  const backendUrl = BACKEND_URL;

  // Determinar qual logo usar baseado no tema (usando contexto dinâmico)
  const getLogoPath = () => {
    const isDark = theme.mode === 'dark';
    return isDark
      ? colorMode.appLogoDark || "/logo-dark.png"
      : colorMode.appLogoLight || "/logo-light.png";
  };

  useEffect(() => {
    document.title = i18n.t("login.title");
    document.body.classList.add("login-page");
    requestAnimationFrame(() => setMounted(true));
    return () => {
      document.body.classList.remove("login-page");
    };
  }, []);

  useEffect(() => {
    const fetchUserCreationStatus = async () => {
      try {
        const response = await fetch(`${backendUrl}/settings/userCreation`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to fetch user creation status");
        const data = await response.json();
        setUserCreationEnabled(data.userCreation === "enabled");
      } catch (err) {
        console.error("Erro ao verificar userCreation:", err);
        setUserCreationEnabled(false);
      }
    };
    fetchUserCreationStatus();
  }, [backendUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const lang = localStorage.getItem("i18nextLng") || "pt";
    i18n.changeLanguage(lang);
    handleLogin(user);
  };

  // Funções para o seletor de idioma
  const handleLanguageOpen = (event) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLanguageChange = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      localStorage.setItem("i18nextLng", languageCode);
      handleLanguageClose();
      window.location.reload();
    } catch (err) {
      console.error("Erro ao alterar idioma:", err);
    }
  };

  return (
      <div className={classes.root}>
        {/* Container para controles no topo esquerdo */}
        <div className={classes.topLeftControls}>
          {/* Seletor de idioma */}
          <div className={classes.langTriggerButton} onClick={handleLanguageOpen}>
            <img
              src={selectedLanguage.flag}
              alt={selectedLanguage.name}
              className={classes.langTriggerFlag}
            />
          </div>

          {/* Toggle de tema */}
          <IconButton
            className={classes.themeToggle}
            onClick={colorMode.toggleColorMode}
            title={theme.mode === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          >
            {theme.mode === 'dark' ? (
              <img
                src="/theme/sol.png"
                alt="Modo claro"
                style={{ width: '24px', height: '24px' }}
              />
            ) : (
              <img
                src="/theme/lua.png"
                alt="Modo escuro"
                style={{ width: '24px', height: '24px' }}
              />
            )}
          </IconButton>
        </div>

        {/* Popover do seletor de idioma */}
        <Popover
          open={Boolean(languageMenuAnchor)}
          anchorEl={languageMenuAnchor}
          onClose={handleLanguageClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          PaperProps={{ className: classes.langPopoverPaper }}
          disableScrollLock
        >
          <div className={classes.langHeader}>
            <Typography className={classes.langHeaderTitle}>
              {langHeaderLabel}
            </Typography>
          </div>
          <div className={classes.langOptionsList}>
            {languageOptions.map((lang) => {
              const selected = isLangSelected(lang);
              return (
                <div
                  key={lang.code}
                  className={`${classes.langOptionItem} ${selected ? classes.langOptionItemSelected : ""}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <img
                    src={lang.flag}
                    alt={lang.name}
                    className={classes.langFlagImg}
                  />
                  <Typography className={classes.langOptionName}>
                    {lang.name}
                  </Typography>
                  <div className={classes.langCheckWrapper}>
                    {selected && <CheckIcon />}
                  </div>
                </div>
              );
            })}
          </div>
        </Popover>

        <div className={classes.formSide}>
          <form
            className={classes.formContainer}
            onSubmit={handleSubmit}
            style={!mounted ? { opacity: 0, transform: "translateY(20px)" } : { opacity: 1, transform: "translateY(0)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
          >
            <img src={getLogoPath()} alt={i18n.t("login.logoAlt")} className={classes.logoImg} />

            <div className={classes.inputContainer}>
              <TextField
                className={classes.textFieldPrimary}
                label={i18n.t("login.emailLabel")}
                variant="outlined"
                fullWidth
                margin="normal"
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
              <div className={classes.inputIconLeft}>
                <EmailSvgIcon color={theme.mode === "light" ? "#666666" : "#cccccc"} size={20} />
              </div>
            </div>

            <div className={classes.inputContainer}>
              <TextField
                className={classes.textFieldWithEndIcon}
                label={i18n.t("login.passwordLabel")}
                variant="outlined"
                fullWidth
                margin="normal"
                type={showPassword ? "text" : "password"}
                value={user.password}
                onChange={(e) => setUser({ ...user, password: e.target.value })}
              />
              <div className={classes.inputIconLeft}>
                <LockSvgIcon color={theme.mode === "light" ? "#666666" : "#cccccc"} size={20} />
              </div>
              <div
                className={classes.inputIconRight}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <VisibilityOffSvgIcon color={theme.mode === "light" ? "#374151" : "#cccccc"} size={20} />
                ) : (
                  <VisibilitySvgIcon color={theme.mode === "light" ? "#374151" : "#cccccc"} size={20} />
                )}
              </div>
            </div>

            <div className={classes.rememberMeContainer}>
              <Switch
                checked={user.remember}
                onChange={(e) =>
                  setUser({ ...user, remember: e.target.checked })
                }
                name="remember"
                color="primary"
              />
              <Typography>{i18n.t("login.rememberMe")}</Typography>
            </div>

            <div>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                className={classes.submitBtn}
              >
                {i18n.t("login.loginButton")}
              </Button>

              {userCreationEnabled && (
                <div className={classes.signupText}>
                  {i18n.t("login.noAccount")}{" "}
                  <RouterLink to="/signup" className={classes.signupLink}>
                    {i18n.t("login.signupButton")}
                  </RouterLink>
                </div>
              )}
            </div>

            <div className={classes.forgotPassword}>
              <RouterLink
                to="/forgot-password"
                className={classes.forgotPasswordLink}
              >
                {i18n.t("login.forgotPassword")}
              </RouterLink>
            </div>
          </form>
        </div>
      </div>
  );
};

export default Login;
