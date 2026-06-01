import React, { useState, useEffect, useContext } from "react";
import qs from "query-string";
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import {
  Button,
  TextField,
  Typography,
  Popover,
  IconButton,
  Link,
  Grid,
  Box,
} from "@material-ui/core";
import { makeStyles, useTheme, alpha } from "@material-ui/core/styles";
import { Helmet } from "react-helmet";
import ColorModeContext from "../../layout/themeContext";
import { BACKEND_URL } from "../../config/env";
import usePlans from "../../hooks/usePlans";
import { i18n } from "../../translate/i18n";
import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

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
    minHeight: "100vh",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: theme.mode === "light" ? "#f5f5f5" : "#1a1a1a",
    transition: "background-color 0.3s ease",
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
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
  // Seletor de idioma (trigger) - flag only, transparent
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
  // Toggle de tema - transparent
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
  // Card do formulário
  formContainer: {
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
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
  signupTitle: {
    color: theme.mode === "light" ? "inherit" : "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(2),
  },
  submitBtn: {
    margin: theme.spacing(3, 0, 2),
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
  loginLink: {
    color: theme.mode === "light" ? theme.palette.primary.main : "#ffffff !important",
    textDecoration: "none",
    fontWeight: "500",
    "&:hover": {
      textDecoration: "underline",
    },
  },
}));

const UserSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, i18n.t("validation.tooShort"))
    .max(50, i18n.t("validation.tooLong"))
    .required(i18n.t("validation.required")),
  companyName: Yup.string()
    .min(2, i18n.t("validation.tooShort"))
    .max(50, i18n.t("validation.tooLong"))
    .required(i18n.t("validation.required")),
  password: Yup.string().min(5, i18n.t("validation.tooShort")).max(50, i18n.t("validation.tooLong")),
  email: Yup.string().email(i18n.t("validation.invalidEmail")).required(i18n.t("validation.required")),
  phone: Yup.string().required(i18n.t("validation.required")),
});

const SignUp = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { colorMode } = useContext(ColorModeContext);
  const { handleLogin } = useContext(AuthContext);
  const { getPlanList } = usePlans();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
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

  let companyId = null;
  const params = qs.parse(window.location.search);
  if (params.companyId !== undefined) {
    companyId = params.companyId;
  }

  const initialState = {
    name: "",
    email: "",
    password: "",
    phone: "",
    companyId,
    companyName: "",
    planId: "",
  };

  const [user] = useState(initialState);

  const backendUrl = BACKEND_URL;

  const getLogoPath = () => {
    const isDark = theme.mode === 'dark';
    return isDark
      ? colorMode.appLogoDark || "/logo-dark.png"
      : colorMode.appLogoLight || "/logo-light.png";
  };

  useEffect(() => {
    document.body.classList.add("signup-page");
    requestAnimationFrame(() => setMounted(true));
    return () => {
      document.body.classList.remove("signup-page");
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
        const isEnabled = data.userCreation === "enabled";
        setUserCreationEnabled(isEnabled);
        if (!isEnabled) {
          toast.info(i18n.t("signup.toasts.userCreationDisabled"));
          history.push("/login");
        }
      } catch (err) {
        console.error("Erro ao verificar userCreation:", err);
        setUserCreationEnabled(false);
        toast.error(i18n.t("signup.toasts.verificationError"));
        history.push("/login");
      }
    };
    fetchUserCreationStatus();
  }, [backendUrl, history]);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const planList = await getPlanList({ listPublic: "false" });
      setPlans(planList);
      if (planList && planList.length > 0) {
        user.planId = planList[0].id;
      }
      setLoading(false);
    };
    fetchData();
  }, [getPlanList]);

  const handleSignUp = async (values) => {
    try {
      const lang = (localStorage.getItem("i18nextLng") || "pt").split("-")[0];
      const submitData = {
        ...values,
        planId: values.planId || (plans.length > 0 ? plans[0].id : 1),
        language: lang
      };
      await openApi.post("/auth/signup", submitData);
      toast.success(i18n.t("signup.toasts.success"));
      // Login automático após cadastro
      await handleLogin({ email: values.email, password: values.password });
    } catch (err) {
      toastError(err);
    }
  };

  const handleLanguageOpen = (event) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem("i18nextLng", languageCode);
    handleLanguageClose();
    window.location.reload();
  };

  if (!userCreationEnabled) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{i18n.t("signup.title")}</title>
        <style>{`
          /* Forçar fundo uniforme */
          html, body, body.signup-page, #root {
            background-color: ${theme.mode === "light" ? "#f5f5f5" : "#1a1a1a"} !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Botões brancos */
          body.signup-page .MuiButton-root,
          body.signup-page .MuiButton-root span,
          body.signup-page button {
            color: #ffffff !important;
          }

          /* Campos de input - border radius */
          body.signup-page .MuiOutlinedInput-root {
            border-radius: 14px !important;
          }

          /* Campos de input - cores */
          body.signup-page .MuiOutlinedInput-root,
          body.signup-page .MuiOutlinedInput-input {
            background-color: ${theme.mode === "light" ? "#ffffff" : "#3a3a3a"} !important;
            color: ${theme.mode === "light" ? "#000000" : "#ffffff"} !important;
          }

          /* Autofill do browser */
          body.signup-page .MuiOutlinedInput-input:-webkit-autofill,
          body.signup-page .MuiOutlinedInput-input:-webkit-autofill:hover,
          body.signup-page .MuiOutlinedInput-input:-webkit-autofill:focus,
          body.signup-page .MuiOutlinedInput-input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px ${theme.mode === "light" ? "#ffffff" : "#3a3a3a"} inset !important;
            -webkit-text-fill-color: ${theme.mode === "light" ? "#000000" : "#ffffff"} !important;
            caret-color: ${theme.mode === "light" ? "#000000" : "#ffffff"} !important;
            transition: background-color 5000s ease-in-out 0s !important;
          }

          /* Labels - cinza fixo */
          body.signup-page .MuiInputLabel-root {
            color: #9e9e9e !important;
          }
          body.signup-page .MuiInputLabel-root.Mui-focused {
            color: #9e9e9e !important;
          }

          /* Bordas - cinza fixo */
          body.signup-page .MuiOutlinedInput-notchedOutline {
            border-color: #9e9e9e !important;
          }
          body.signup-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
            border-color: #757575 !important;
          }
          body.signup-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
            border-color: #9e9e9e !important;
          }

          /* Links */
          body.signup-page a {
            color: ${theme.mode === "light" ? theme.palette.primary.main : "#ffffff"} !important;
          }

          /* Texto de erro */
          body.signup-page .MuiTypography-colorError,
          body.signup-page .MuiFormHelperText-root.Mui-error {
            color: ${theme.mode === "light" ? "#d32f2f" : "#ff6b6b"} !important;
          }

          /* Popover do seletor de idioma */
          body.signup-page [class*="langOptionName"] {
            color: ${theme.mode === "light" ? "#1a1a1a" : "#ffffff"} !important;
          }
        `}</style>
      </Helmet>

      <div className={classes.root}>
        {/* Controles no topo esquerdo */}
        <div className={classes.topLeftControls}>
          {/* Seletor de idioma - flag only */}
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
              <img src="/theme/sol.png" alt="Modo claro" style={{ width: '24px', height: '24px' }} />
            ) : (
              <img src="/theme/lua.png" alt="Modo escuro" style={{ width: '24px', height: '24px' }} />
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

        <div
          className={classes.formContainer}
          style={!mounted ? { opacity: 0, transform: "translateY(20px)" } : { opacity: 1, transform: "translateY(0)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
        >
          <img src={getLogoPath()} alt="Logo" className={classes.logoImg} />
          <Formik
            initialValues={user}
            enableReinitialize={true}
            validationSchema={UserSchema}
            onSubmit={(values, actions) => {
              setTimeout(() => {
                handleSignUp(values);
                actions.setSubmitting(false);
              }, 400);
            }}
          >
            {({ touched, errors, isSubmitting }) => (
              <Form className={classes.form}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      variant="outlined"
                      fullWidth
                      id="companyName"
                      label={i18n.t("signup.form.company")}
                      error={touched.companyName && Boolean(errors.companyName)}
                      helperText={touched.companyName && errors.companyName}
                      name="companyName"
                      autoComplete="companyName"
                      autoFocus
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      autoComplete="name"
                      name="name"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      variant="outlined"
                      fullWidth
                      id="name"
                      label={i18n.t("signup.form.name")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      variant="outlined"
                      fullWidth
                      id="email"
                      label={i18n.t("signup.form.email")}
                      name="email"
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                      autoComplete="email"
                      inputProps={{ style: { textTransform: "lowercase" } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      variant="outlined"
                      fullWidth
                      name="password"
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                      label={i18n.t("signup.form.password")}
                      type="password"
                      id="password"
                      autoComplete="current-password"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      variant="outlined"
                      fullWidth
                      id="phone"
                      label={i18n.t("signup.form.phone")}
                      name="phone"
                      autoComplete="phone"
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={classes.submitBtn}
                >
                  {i18n.t("signup.buttons.submit")}
                </Button>
                <Grid container justifyContent="center">
                  <Grid item>
                    <Link
                      href="#"
                      variant="body2"
                      component={RouterLink}
                      to="/login"
                      className={classes.loginLink}
                    >
                      {i18n.t("signup.buttons.login")}
                    </Link>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </div>
        <Box mt={5}></Box>
      </div>
    </>
  );
};

export default SignUp;
