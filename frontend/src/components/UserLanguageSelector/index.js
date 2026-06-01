import React, { useContext, useState } from "react";
import { Popover, Typography, useTheme } from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";

// Check icon for selected item
const CheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12L10 17L20 7" />
  </svg>
);

const useStyles = makeStyles((theme) => ({
  triggerButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 8,
    borderRadius: 6,
    transition: "all 0.15s ease",
    "&:hover": {
      background: "rgba(255,255,255,0.15)",
    },
  },
  triggerFlag: {
    width: 28,
    height: 20,
    objectFit: "cover",
    borderRadius: 3,
    border: "1.5px solid rgba(255,255,255,0.3)",
    display: "block",
  },
  popoverPaper: {
    borderRadius: 14,
    minWidth: 230,
    overflow: "hidden",
    boxShadow: "0 10px 36px rgba(0,0,0,0.14)",
    border: theme.mode === "dark"
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(0,0,0,0.06)",
    background: theme.mode === "dark" ? "#1e1e1e" : "#ffffff",
  },
  header: {
    padding: "14px 18px 10px",
    borderBottom: theme.mode === "dark"
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(0,0,0,0.06)",
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: theme.mode === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.38)",
  },
  optionsList: {
    padding: 6,
  },
  optionItem: {
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
  optionItemSelected: {
    background: theme.mode === "dark"
      ? alpha(theme.palette.primary.main, 0.15)
      : alpha(theme.palette.primary.main, 0.08),
    "&:hover": {
      background: theme.mode === "dark"
        ? alpha(theme.palette.primary.main, 0.2)
        : alpha(theme.palette.primary.main, 0.12),
    },
  },
  flagImg: {
    width: 30,
    height: 20,
    objectFit: "cover",
    borderRadius: 3,
    flexShrink: 0,
    border: theme.mode === "dark"
      ? "1px solid rgba(255,255,255,0.12)"
      : "1px solid rgba(0,0,0,0.1)",
  },
  optionName: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.mode === "dark" ? "#ffffff" : "#1a1a1a",
    flex: 1,
  },
  checkWrapper: {
    width: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.primary.main,
    flexShrink: 0,
  },
}));

const UserLanguageSelector = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useContext(AuthContext);

  const languageOptions = [
    { code: "pt-BR", shortCode: "pt", flag: "/flags/br.png", name: "Português" },
    { code: "en", shortCode: "en", flag: "/flags/us.png", name: "English" },
    { code: "es", shortCode: "es", flag: "/flags/es.png", name: "Español" },
    { code: "tr", shortCode: "tr", flag: "/flags/tr.png", name: "Türkçe" },
    { code: "ar", shortCode: "ar", flag: "/flags/sa.png", name: "العربية" },
  ];

  let currentLanguage = "pt-BR";
  try { currentLanguage = localStorage.getItem("i18nextLng") || "pt-BR"; } catch (e) { /* storage bloqueado */ }
  // Se localStorage falhou, usa o idioma atual do i18n
  if (currentLanguage === "pt-BR" && i18n.language && i18n.language !== "pt") {
    currentLanguage = i18n.language;
  }
  const selectedLanguage = languageOptions.find(
    lang => lang.code === currentLanguage || lang.shortCode === currentLanguage
  ) || languageOptions[0];

  const isSelected = (lang) =>
    lang.code === currentLanguage || lang.shortCode === currentLanguage;

  const headerLabel = (() => {
    const l = (currentLanguage || "pt").split("-")[0];
    return l === "en" ? "Language" : l === "es" ? "Idioma" : l === "tr" ? "Dil" : l === "ar" ? "اللغة" : "Idioma";
  })();

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleChangeLanguage = async (language) => {
    try {
      await i18n.changeLanguage(language);
      await api.put(`/users/${user.id}`, { language });
    } catch (err) {
      toastError(err);
    }
    handleClose();
  };

  return (
    <>
      <div className={classes.triggerButton} onClick={handleOpen}>
        <img
          src={selectedLanguage.flag}
          alt={selectedLanguage.name}
          className={classes.triggerFlag}
        />
      </div>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{ className: classes.popoverPaper }}
        disableScrollLock
      >
        <div className={classes.header}>
          <Typography className={classes.headerTitle}>
            {headerLabel}
          </Typography>
        </div>

        <div className={classes.optionsList}>
          {languageOptions.map((lang) => {
            const selected = isSelected(lang);
            return (
              <div
                key={lang.code}
                className={`${classes.optionItem} ${selected ? classes.optionItemSelected : ""}`}
                onClick={() => handleChangeLanguage(lang.code)}
              >
                <img
                  src={lang.flag}
                  alt={lang.name}
                  className={classes.flagImg}
                />
                <Typography className={classes.optionName}>
                  {lang.name}
                </Typography>
                <div className={classes.checkWrapper}>
                  {selected && <CheckIcon />}
                </div>
              </div>
            );
          })}
        </div>
      </Popover>
    </>
  );
};

export default UserLanguageSelector;
