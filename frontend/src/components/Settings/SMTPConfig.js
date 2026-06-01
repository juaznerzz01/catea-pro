import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Button,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Divider,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import { toast } from "react-toastify";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  subtitle: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
    fontSize: "0.9rem",
  },
  formField: {
    marginBottom: theme.spacing(2),
  },
  buttonGroup: {
    display: "flex",
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
  },
  testButton: {
    backgroundColor: theme.palette.info?.main || "#2196f3",
    color: "#fff",
    "&:hover": {
      backgroundColor: theme.palette.info?.dark || "#1976d2",
    },
  },
  saveButton: {
    backgroundColor: theme.palette.success?.main || "#4caf50",
    color: "#fff",
    "&:hover": {
      backgroundColor: theme.palette.success?.dark || "#388e3c",
    },
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  presetBox: {
    marginBottom: theme.spacing(3),
  },
}));

const SMTP_PRESETS = {
  hostinger: {
    label: "Hostinger",
    host: "smtp.hostinger.com",
    port: "465",
    secure: "true",
  },
  gmail: {
    label: "Gmail",
    host: "smtp.gmail.com",
    port: "465",
    secure: "true",
  },
  sendgrid: {
    label: "SendGrid",
    host: "smtp.sendgrid.net",
    port: "587",
    secure: "false",
    fixedUser: "apikey",
  },
  outlook: {
    label: "Outlook / Hotmail",
    host: "smtp-mail.outlook.com",
    port: "587",
    secure: "false",
  },
  custom: {
    label: i18n.t("settings.smtp.presetCustom"),
    host: "",
    port: "587",
    secure: "false",
  },
};

const SMTPConfig = ({ settings }) => {
  const classes = useStyles();
  const { update } = useCompanySettings();

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState("true");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("custom");

  useEffect(() => {
    if (settings) {
      setSmtpHost(settings.smtpHost || "");
      setSmtpPort(settings.smtpPort || "465");
      setSmtpUser(settings.smtpUser || "");
      setSmtpPass(settings.smtpPass || "");
      setSmtpSecure(settings.smtpSecure || "true");
      setSmtpFrom(settings.smtpFrom || "");

      // Detectar preset
      const host = settings.smtpHost || "";
      if (host === "smtp.hostinger.com") setSelectedPreset("hostinger");
      else if (host === "smtp.gmail.com") setSelectedPreset("gmail");
      else if (host === "smtp.sendgrid.net") setSelectedPreset("sendgrid");
      else if (host === "smtp-mail.outlook.com") setSelectedPreset("outlook");
      else if (host) setSelectedPreset("custom");
    }
  }, [settings]);

  const handlePresetChange = (e) => {
    const preset = e.target.value;
    setSelectedPreset(preset);
    if (preset !== "custom" && SMTP_PRESETS[preset]) {
      setSmtpHost(SMTP_PRESETS[preset].host);
      setSmtpPort(SMTP_PRESETS[preset].port);
      setSmtpSecure(SMTP_PRESETS[preset].secure);
      if (SMTP_PRESETS[preset].fixedUser) {
        setSmtpUser(SMTP_PRESETS[preset].fixedUser);
      }
    }
  };

  const handleSave = async () => {
    if (!smtpHost || !smtpUser || !smtpPass) {
      toast.error(i18n.t("settings.smtp.fillRequired"));
      return;
    }
    setSaving(true);
    try {
      await update({ column: "smtpHost", data: smtpHost });
      await update({ column: "smtpPort", data: smtpPort });
      await update({ column: "smtpUser", data: smtpUser });
      await update({ column: "smtpPass", data: smtpPass });
      await update({ column: "smtpSecure", data: smtpSecure });
      await update({ column: "smtpFrom", data: smtpFrom || smtpUser });
      toast.success(i18n.t("settings.smtp.saveSuccess"));
    } catch (err) {
      toast.error(i18n.t("settings.smtp.saveError"));
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data } = await api.post("/companySettings/test-smtp");
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || i18n.t("settings.smtp.testError");
      toast.error(msg);
    }
    setTesting(false);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error(i18n.t("settings.smtp.fillTestEmail"));
      return;
    }
    setSendingTest(true);
    try {
      const { data } = await api.post("/companySettings/send-test-email", { email: testEmail });
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || i18n.t("settings.smtp.sendTestError");
      toast.error(msg);
    }
    setSendingTest(false);
  };

  return (
    <div className={classes.root}>
      <Typography variant="h6" className={classes.sectionTitle}>
        {i18n.t("settings.smtp.title")}
      </Typography>
      <Typography className={classes.subtitle}>
        {i18n.t("settings.smtp.subtitle")}
      </Typography>

      {/* Preset selector */}
      <Box className={classes.presetBox}>
        <FormControl variant="outlined" fullWidth className={classes.formField}>
          <InputLabel>{i18n.t("settings.smtp.preset")}</InputLabel>
          <Select
            value={selectedPreset}
            onChange={handlePresetChange}
            label={i18n.t("settings.smtp.preset")}
          >
            {Object.entries(SMTP_PRESETS).map(([key, preset]) => (
              <MenuItem key={key} value={key}>
                {preset.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={8}>
          <TextField
            label={i18n.t("settings.smtp.host")}
            variant="outlined"
            fullWidth
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.hostinger.com"
            className={classes.formField}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label={i18n.t("settings.smtp.port")}
            variant="outlined"
            fullWidth
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            placeholder="465"
            className={classes.formField}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label={selectedPreset === "sendgrid" ? "Usuário (fixo: apikey)" : i18n.t("settings.smtp.user")}
            variant="outlined"
            fullWidth
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder={selectedPreset === "sendgrid" ? "apikey" : "seuemail@seudominio.com"}
            disabled={selectedPreset === "sendgrid"}
            helperText={selectedPreset === "sendgrid" ? "SendGrid usa 'apikey' como usuário fixo" : ""}
            className={classes.formField}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label={selectedPreset === "sendgrid" ? "API Key" : i18n.t("settings.smtp.password")}
            variant="outlined"
            fullWidth
            type={showPassword ? "text" : "password"}
            value={smtpPass}
            onChange={(e) => setSmtpPass(e.target.value)}
            className={classes.formField}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label={i18n.t("settings.smtp.from")}
            variant="outlined"
            fullWidth
            value={smtpFrom}
            onChange={(e) => setSmtpFrom(e.target.value)}
            placeholder={smtpUser || "noreply@seudominio.com"}
            helperText={selectedPreset === "sendgrid" ? "Obrigatório: use um remetente verificado no SendGrid" : i18n.t("settings.smtp.fromHelper")}
            className={classes.formField}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl variant="outlined" fullWidth className={classes.formField}>
            <InputLabel>{i18n.t("settings.smtp.secure")}</InputLabel>
            <Select
              value={smtpSecure}
              onChange={(e) => setSmtpSecure(e.target.value)}
              label={i18n.t("settings.smtp.secure")}
            >
              <MenuItem value="true">SSL/TLS (porta 465)</MenuItem>
              <MenuItem value="false">STARTTLS (porta 587)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <div className={classes.buttonGroup}>
        <Button
          variant="contained"
          className={classes.saveButton}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : i18n.t("settings.smtp.save")}
        </Button>
        <Button
          variant="contained"
          className={classes.testButton}
          onClick={handleTestConnection}
          disabled={testing || !smtpHost}
        >
          {testing ? <CircularProgress size={24} /> : i18n.t("settings.smtp.testConnection")}
        </Button>
      </div>

      <Divider className={classes.divider} />

      {/* Enviar e-mail de teste */}
      <Typography variant="h6" className={classes.sectionTitle}>
        {i18n.t("settings.smtp.sendTestTitle")}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={8}>
          <TextField
            label={i18n.t("settings.smtp.testEmailLabel")}
            variant="outlined"
            fullWidth
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="teste@email.com"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            className={classes.testButton}
            onClick={handleSendTestEmail}
            disabled={sendingTest || !testEmail}
            fullWidth
            style={{ height: 56 }}
          >
            {sendingTest ? <CircularProgress size={24} /> : i18n.t("settings.smtp.sendTest")}
          </Button>
        </Grid>
      </Grid>
    </div>
  );
};

export default SMTPConfig;
