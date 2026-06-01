import React, { useState, useEffect } from "react";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import { toast } from "react-toastify";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Link,
  CircularProgress,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  Facebook,
  Instagram,
  CheckCircle,
  OpenInNew,
} from "@material-ui/icons";

import api from "../../services/api";
import { FACEBOOK_APP_ID as ENV_FACEBOOK_APP_ID, REQUIRE_BUSINESS_MANAGEMENT } from "../../config/env";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    maxWidth: 600,
  },
  titleBox: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  facebookIcon: {
    color: "#3b5998",
    fontSize: 28,
  },
  instagramIcon: {
    color: "#e1306c",
    fontSize: 28,
  },
  stepContent: {
    paddingBottom: theme.spacing(2),
  },
  errorBox: {
    backgroundColor: "#ffebee",
    border: "1px solid #ef5350",
    borderRadius: 8,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  warningBox: {
    backgroundColor: "#fff3e0",
    border: "1px solid #ffb74d",
    borderRadius: 8,
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  infoBox: {
    backgroundColor: "#e3f2fd",
    border: "1px solid #64b5f6",
    borderRadius: 8,
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  permissionList: {
    margin: theme.spacing(1, 0),
    paddingLeft: theme.spacing(2),
    "& li": {
      marginBottom: theme.spacing(0.5),
    },
  },
  connectButton: {
    marginTop: theme.spacing(1),
    textTransform: "none",
    fontWeight: 600,
    fontSize: 16,
    padding: theme.spacing(1.2, 4),
  },
  facebookButton: {
    backgroundColor: "#3b5998",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#2d4373",
    },
  },
  instagramButton: {
    background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
    color: "#fff",
    "&:hover": {
      background: "linear-gradient(45deg, #d9842e, #cf5d36, #c6233c, #b8205c, #a9167a)",
    },
  },
  loadingWrapper: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  urlBox: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    padding: "6px 12px",
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
    gap: theme.spacing(1),
  },
  urlText: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: 13,
    wordBreak: "break-all",
  },
  copyButton: {
    minWidth: "auto",
    padding: "4px 12px",
    fontSize: 12,
    textTransform: "none",
  },
}));

const FacebookModal = ({ open, onClose, channel = "facebook" }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [dbAppId, setDbAppId] = useState("");
  const { get: getSetting } = useCompanySettings();

  const FACEBOOK_APP_ID = dbAppId || ENV_FACEBOOK_APP_ID;

  useEffect(() => {
    if (open) {
      getSetting({ column: "facebookAppId" })
        .then((res) => {
          if (res && res.facebookAppId) setDbAppId(res.facebookAppId);
        })
        .catch(() => {});
    }
  }, [open, getSetting]);

  const baseUrl = window.location.origin;
  const privacyUrl = `${baseUrl}/politicas`;
  const termsUrl = `${baseUrl}/termos`;
  const dataDeletionUrl = `${baseUrl}/exclusao-dados`;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const isFacebook = channel === "facebook";
  const channelName = isFacebook ? "Facebook Messenger" : "Instagram Direct";

  // Scopes para Facebook e Instagram usam as mesmas permissões de página
  // O Instagram é acessado via a Página vinculada (instagram_business_account)
  // pages_read_engagement é necessário para /me/accounts retornar páginas na Graph API v18+
  const scopes = REQUIRE_BUSINESS_MANAGEMENT
    ? "public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,instagram_basic,instagram_manage_messages,business_management"
    : "public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,instagram_basic,instagram_manage_messages";

  const handleResponse = (response) => {
    console.log("Facebook Login response:", response);
    console.log("Facebook Login grantedScopes:", response?.grantedScopes);

    if (!response || response.status === "unknown") {
      setLoading(false);
      return;
    }

    const accessToken =
      response?.accessToken || response?.authResponse?.accessToken;

    const userId =
      response?.id || response?.userID || response?.authResponse?.userID;

    if (!userId || !accessToken) {
      console.error("Facebook Login: userId ou accessToken ausente", {
        response,
        userId,
        hasAccessToken: !!accessToken,
      });
      toast.error("Erro ao obter dados do Facebook. Tente novamente.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const payload = {
      facebookUserId: userId,
      facebookUserToken: accessToken,
    };

    if (!isFacebook) {
      payload.addInstagram = true;
    }

    api
      .post("/facebook", payload)
      .then(() => {
        toast.success(
          isFacebook
            ? i18n.t("facebookModal.success.facebook")
            : i18n.t("facebookModal.success.instagram")
        );
        onClose();
      })
      .catch((error) => {
        toastError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      classes={{ paper: classes.dialogPaper }}
      fullWidth
    >
      <DialogTitle>
        <Box className={classes.titleBox}>
          {isFacebook ? (
            <Facebook className={classes.facebookIcon} />
          ) : (
            <Instagram className={classes.instagramIcon} />
          )}
          <span>{i18n.t("facebookModal.title", { channel: channelName })}</span>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" gutterBottom>
          {i18n.t("facebookModal.description", { channel: channelName })}
        </Typography>

        <Stepper orientation="vertical" activeStep={-1}>
          {/* Passo 1 - Criar App */}
          <Step active expanded>
            <StepLabel>{i18n.t("facebookModal.steps.step1.title")}</StepLabel>
            <StepContent className={classes.stepContent}>
              <Typography variant="body2">
                {i18n.t("facebookModal.steps.step1.description")}
              </Typography>
              <Link
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}
              >
                developers.facebook.com <OpenInNew fontSize="small" />
              </Link>
            </StepContent>
          </Step>

          {/* Passo 1b - Configurar Produtos */}
          <Step active expanded>
            <StepLabel>{i18n.t("facebookModal.steps.step1b.title")}</StepLabel>
            <StepContent className={classes.stepContent}>
              <Typography variant="body2">
                {i18n.t("facebookModal.steps.step1b.description")}
              </Typography>
            </StepContent>
          </Step>

          {/* Passo 1c - URLs de Política e Termos */}
          <Step active expanded>
            <StepLabel>{i18n.t("facebookModal.steps.step1c.title")}</StepLabel>
            <StepContent className={classes.stepContent}>
              <Typography variant="body2">
                {i18n.t("facebookModal.steps.step1c.description")}
              </Typography>

              <Typography variant="caption" color="textSecondary" style={{ marginTop: 8, display: "block" }}>
                {i18n.t("facebookModal.steps.step1c.privacyUrl")}
              </Typography>
              <Box className={classes.urlBox}>
                <Typography className={classes.urlText}>{privacyUrl}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  className={classes.copyButton}
                  onClick={() => handleCopy(privacyUrl, "privacy")}
                >
                  {copiedField === "privacy" ? <><CheckCircle fontSize="small" style={{ color: "#4caf50", marginRight: 4 }} /> {i18n.t("facebookModal.steps.step1c.copied")}</> : "Copiar"}
                </Button>
              </Box>

              <Typography variant="caption" color="textSecondary">
                {i18n.t("facebookModal.steps.step1c.termsUrl")}
              </Typography>
              <Box className={classes.urlBox}>
                <Typography className={classes.urlText}>{termsUrl}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  className={classes.copyButton}
                  onClick={() => handleCopy(termsUrl, "terms")}
                >
                  {copiedField === "terms" ? <><CheckCircle fontSize="small" style={{ color: "#4caf50", marginRight: 4 }} /> {i18n.t("facebookModal.steps.step1c.copied")}</> : "Copiar"}
                </Button>
              </Box>

              <Typography variant="caption" color="textSecondary">
                URL de Exclusao de Dados (Data Deletion):
              </Typography>
              <Box className={classes.urlBox}>
                <Typography className={classes.urlText}>{dataDeletionUrl}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  className={classes.copyButton}
                  onClick={() => handleCopy(dataDeletionUrl, "deletion")}
                >
                  {copiedField === "deletion" ? <><CheckCircle fontSize="small" style={{ color: "#4caf50", marginRight: 4 }} /> {i18n.t("facebookModal.steps.step1c.copied")}</> : "Copiar"}
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 2 - Página do Facebook */}
          <Step active expanded>
            <StepLabel>{i18n.t("facebookModal.steps.step2.title")}</StepLabel>
            <StepContent className={classes.stepContent}>
              <Typography variant="body2">
                {i18n.t("facebookModal.steps.step2.description")}
              </Typography>
            </StepContent>
          </Step>

          {/* Passo 3 - Instagram only */}
          {!isFacebook && (
            <Step active expanded>
              <StepLabel>{i18n.t("facebookModal.steps.step3instagram.title")}</StepLabel>
              <StepContent className={classes.stepContent}>
                <Typography variant="body2">
                  {i18n.t("facebookModal.steps.step3instagram.description")}
                </Typography>
              </StepContent>
            </Step>
          )}

          {/* Passo de conectar */}
          <Step active expanded>
            <StepLabel>{i18n.t("facebookModal.steps.stepConnect.title")}</StepLabel>
            <StepContent className={classes.stepContent}>
              <Typography variant="body2">
                {i18n.t("facebookModal.steps.stepConnect.description", { channel: channelName })}
              </Typography>
            </StepContent>
          </Step>
        </Stepper>

        {/* Permissões */}
        <Box className={classes.infoBox}>
          <Typography variant="subtitle2" gutterBottom>
            {i18n.t("facebookModal.permissions.title")}
          </Typography>
          <ul className={classes.permissionList}>
            <li>
              <Typography variant="body2">
                {i18n.t("facebookModal.permissions.sendReceive")}
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                {i18n.t("facebookModal.permissions.pagesList")}
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                {i18n.t("facebookModal.permissions.managePages")}
              </Typography>
            </li>
            {!isFacebook && (
              <li>
                <Typography variant="body2">
                  {i18n.t("facebookModal.permissions.instagramMessages")}
                </Typography>
              </li>
            )}
          </ul>
        </Box>

        {/* Aviso */}
        <Box className={classes.warningBox}>
          <Typography variant="body2">
            <strong>{i18n.t("facebookModal.warning.title")}</strong>{" "}
            {isFacebook
              ? i18n.t("facebookModal.warning.facebook")
              : i18n.t("facebookModal.warning.instagram")}
          </Typography>
        </Box>
      </DialogContent>

      {!FACEBOOK_APP_ID && (
        <Box px={3} pb={1}>
          <Box className={classes.errorBox}>
            <Typography variant="body2">
              <strong>{i18n.t("facebookModal.errors.noAppIdTitle")}</strong>{" "}
              {i18n.t("facebookModal.errors.noAppId")}
            </Typography>
          </Box>
        </Box>
      )}

      <DialogActions style={{ padding: 16, justifyContent: "space-between" }}>
        <Button onClick={onClose}>
          {i18n.t("facebookModal.buttons.cancel")}
        </Button>

        {FACEBOOK_APP_ID ? (
          <FacebookLogin
            appId={FACEBOOK_APP_ID}
            autoLoad={false}
            fields="name,email,picture"
            version="18.0"
            scope={scopes}
            authType="rerequest"
            returnScopes={true}
            disableMobileRedirect={true}
            callback={handleResponse}
            render={(renderProps) => (
              <Button
                variant="contained"
                className={`${classes.connectButton} ${isFacebook ? classes.facebookButton : classes.instagramButton}`}
                onClick={() => {
                  setLoading(true);
                  renderProps.onClick();
                }}
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : isFacebook ? (
                    <Facebook />
                  ) : (
                    <Instagram />
                  )
                }
              >
                {loading
                  ? i18n.t("facebookModal.buttons.connecting")
                  : i18n.t("facebookModal.buttons.connect", { channel: channelName })}
              </Button>
            )}
          />
        ) : (
          <Button
            variant="contained"
            className={`${classes.connectButton} ${isFacebook ? classes.facebookButton : classes.instagramButton}`}
            disabled
            startIcon={isFacebook ? <Facebook /> : <Instagram />}
          >
            {i18n.t("facebookModal.buttons.connect", { channel: channelName })}
          </Button>
        )}
      </DialogActions>

    </Dialog>
  );
};

export default FacebookModal;
