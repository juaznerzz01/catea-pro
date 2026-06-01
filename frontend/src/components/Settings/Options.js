import React, { useEffect, useState, useContext } from "react";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormHelperText from "@material-ui/core/FormHelperText";
import Switch from "@material-ui/core/Switch";

import useSettings from "../../hooks/useSettings";

import { makeStyles, withStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";

import { Tab, Tabs, TextField, Typography } from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { BACKEND_URL } from "../../config/env";

const GreenSwitch = withStyles(() => ({
  root: {
    width: 36,
    height: 20,
    padding: 0,
    display: 'flex',
  },
  switchBase: {
    padding: 2,
    color: '#fff',
    '&$checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + $track': {
        opacity: 1,
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
      },
    },
  },
  thumb: {
    width: 16,
    height: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  track: {
    borderRadius: 10,
    opacity: 1,
    backgroundColor: '#bdbdbd',
  },
  checked: {},
}))(Switch);

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  tab: {
    backgroundColor: theme.mode === 'light' ? "#f2f2f2" : "#7f7f7f",
    borderRadius: 4,
    width: "100%",
    "& .MuiTabs-flexContainer": {
      justifyContent: "center"
    }
  },
  toggleItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #e0e0e0',
    marginBottom: 4,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      borderColor: '#bdbdbd',
    },
  },
  toggleLabel: {
    fontSize: '0.9rem',
    color: '#424242',
    fontWeight: 500,
  },
  toggleHelper: {
    fontSize: '0.75rem',
    color: '#999',
    marginTop: 2,
  },
}));

export default function Options(props) {
  const { oldSettings, settings, scheduleTypeChanged, user } = props;

  const classes = useStyles();
  const [userRating, setUserRating] = useState("disabled");
  const [scheduleType, setScheduleType] = useState("disabled");
  const [chatBotType, setChatBotType] = useState("text");

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);

  const [userCreation, setUserCreation] = useState("disabled");
  const [loadingUserCreation, setLoadingUserCreation] = useState(false);

  const [SendGreetingAccepted, setSendGreetingAccepted] = useState("enabled");
  const [loadingSendGreetingAccepted, setLoadingSendGreetingAccepted] = useState(false);

  const [UserRandom, setUserRandom] = useState("enabled");
  const [loadingUserRandom, setLoadingUserRandom] = useState(false);

  const [SettingsTransfTicket, setSettingsTransfTicket] = useState("enabled");
  const [loadingSettingsTransfTicket, setLoadingSettingsTransfTicket] = useState(false);

  const [AcceptCallWhatsapp, setAcceptCallWhatsapp] = useState("enabled");
  const [loadingAcceptCallWhatsapp, setLoadingAcceptCallWhatsapp] = useState(false);

  const [sendSignMessage, setSendSignMessage] = useState("enabled");
  const [loadingSendSignMessage, setLoadingSendSignMessage] = useState(false);

  const [sendGreetingMessageOneQueues, setSendGreetingMessageOneQueues] = useState("enabled");
  const [loadingSendGreetingMessageOneQueues, setLoadingSendGreetingMessageOneQueues] = useState(false);

  const [sendQueuePosition, setSendQueuePosition] = useState("enabled");
  const [loadingSendQueuePosition, setLoadingSendQueuePosition] = useState(false);

  const [sendFarewellWaitingTicket, setSendFarewellWaitingTicket] = useState("enabled");
  const [loadingSendFarewellWaitingTicket, setLoadingSendFarewellWaitingTicket] = useState(false);

  const [acceptAudioMessageContact, setAcceptAudioMessageContact] = useState("enabled");
  const [loadingAcceptAudioMessageContact, setLoadingAcceptAudioMessageContact] = useState(false);

  //LGPD
  const [enableLGPD, setEnableLGPD] = useState("disabled");
  const [loadingEnableLGPD, setLoadingEnableLGPD] = useState(false);

  const [lgpdMessage, setLGPDMessage] = useState("");
  const [loadinglgpdMessage, setLoadingLGPDMessage] = useState(false);

  const [lgpdLink, setLGPDLink] = useState("");
  const [loadingLGPDLink, setLoadingLGPDLink] = useState(false);

  const [lgpdDeleteMessage, setLGPDDeleteMessage] = useState("disabled");
  const [loadingLGPDDeleteMessage, setLoadingLGPDDeleteMessage] = useState(false);

  const [lgpdConsent, setLGPDConsent] = useState("disabled");
  const [loadingLGPDConsent, setLoadingLGPDConsent] = useState(false);

  const [lgpdHideNumber, setLGPDHideNumber] = useState("disabled");
  const [loadingLGPDHideNumber, setLoadingLGPDHideNumber] = useState(false);

  // Tag obrigatoria
  const [requiredTag, setRequiredTag] = useState("enabled")
  const [loadingRequiredTag, setLoadingRequiredTag] = useState(false)

  // Fechar ticket ao transferir para outro setor
  const [closeTicketOnTransfer, setCloseTicketOnTransfer] = useState(false)
  const [loadingCloseTicketOnTransfer, setLoadingCloseTicketOnTransfer] = useState(false)

  // Usar carteira de clientes
  const [directTicketsToWallets, setDirectTicketsToWallets] = useState(false)
  const [loadingDirectTicketsToWallets, setLoadingDirectTicketsToWallets] = useState(false)

  //MENSAGENS CUSTOMIZADAS
  const [transferMessage, setTransferMessage] = useState("Seu Atendimento foi Transferido para o setor ${queue.name},Aguarde atendimento por favor...");
  const [loadingTransferMessage, setLoadingTransferMessage] = useState(false);

  const [greetingAcceptedMessage, setGreetingAcceptedMessage] = useState("");
  const [loadingGreetingAcceptedMessage, setLoadingGreetingAcceptedMessage] = useState(false);

  const [AcceptCallWhatsappMessage, setAcceptCallWhatsappMessage] = useState("");
  const [loadingAcceptCallWhatsappMessage, setLoadingAcceptCallWhatsappMessage] = useState(false);

  const [sendQueuePositionMessage, setSendQueuePositionMessage] = useState("");
  const [loadingSendQueuePositionMessage, setLoadingSendQueuePositionMessage] = useState(false);

  const [showNotificationPending, setShowNotificationPending] = useState(false);
  const [loadingShowNotificationPending, setLoadingShowNotificationPending] = useState(false);

  const [autoTranslate, setAutoTranslate] = useState("disabled");
  const [loadingAutoTranslate, setLoadingAutoTranslate] = useState(false);
  const [translateApiKey, setTranslateApiKey] = useState("");
  const [loadingTranslateApiKey, setLoadingTranslateApiKey] = useState(false);

  const [aiAutoSummary, setAiAutoSummary] = useState("disabled");
  const [loadingAiAutoSummary, setLoadingAiAutoSummary] = useState(false);
  const [aiAutoSummaryTime, setAiAutoSummaryTime] = useState("23:00");
  const [loadingAiAutoSummaryTime, setLoadingAiAutoSummaryTime] = useState(false);

  const [sendWelcomeMessage, setSendWelcomeMessage] = useState("disabled");
  const [loadingSendWelcomeMessage, setLoadingSendWelcomeMessage] = useState(false);
  const [welcomeMessageTemplate, setWelcomeMessageTemplate] = useState("");
  const [loadingWelcomeMessageTemplate, setLoadingWelcomeMessageTemplate] = useState(false);

  // Saída IA do FlowBuilder
  const [flowbuilderAI, setFlowbuilderAI] = useState("disabled");
  const [loadingFlowbuilderAI, setLoadingFlowbuilderAI] = useState(false);
  const [flowbuilderAIApiKey, setFlowbuilderAIApiKey] = useState("");
  const [loadingFlowbuilderAIApiKey, setLoadingFlowbuilderAIApiKey] = useState(false);

  const [facebookAppId, setFacebookAppId] = useState("");
  const [loadingFacebookAppId, setLoadingFacebookAppId] = useState(false);
  const [facebookAppSecret, setFacebookAppSecret] = useState("");
  const [loadingFacebookAppSecret, setLoadingFacebookAppSecret] = useState(false);
  const [facebookVerifyToken, setFacebookVerifyToken] = useState("");
  const [loadingFacebookVerifyToken, setLoadingFacebookVerifyToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const webhookUrl = `${BACKEND_URL}/webhook`;

  const { update: updateUserCreation, getAll } = useSettings();

  const { update } = useCompanySettings();

  const isSuper = () => {
    return user.super;
  };


  useEffect(() => {

    if (Array.isArray(oldSettings) && oldSettings.length) {

      const userPar = oldSettings.find((s) => s.key === "userCreation");

      if (userPar) {
        setUserCreation(userPar.value);
      }
    }
  }, [oldSettings])


  useEffect(() => {
    for (const [key, value] of Object.entries(settings)) {
      if (key === "userRating") setUserRating(value);
      if (key === "scheduleType") setScheduleType(value);
      if (key === "chatBotType") setChatBotType(value);
      if (key === "acceptCallWhatsapp") setAcceptCallWhatsapp(value);
      if (key === "userRandom") setUserRandom(value);
      if (key === "sendGreetingMessageOneQueues") setSendGreetingMessageOneQueues(value);
      if (key === "sendSignMessage") setSendSignMessage(value);
      if (key === "sendFarewellWaitingTicket") setSendFarewellWaitingTicket(value);
      if (key === "sendGreetingAccepted") setSendGreetingAccepted(value);
      if (key === "sendQueuePosition") setSendQueuePosition(value);
      if (key === "acceptAudioMessageContact") setAcceptAudioMessageContact(value);
      if (key === "enableLGPD") setEnableLGPD(value);
      if (key === "requiredTag") setRequiredTag(value);
      if (key === "lgpdDeleteMessage") setLGPDDeleteMessage(value)
      if (key === "lgpdHideNumber") setLGPDHideNumber(value);
      if (key === "lgpdConsent") setLGPDConsent(value);
      if (key === "lgpdMessage") setLGPDMessage(value);
      if (key === "sendMsgTransfTicket") setSettingsTransfTicket(value);
      if (key === "lgpdLink") setLGPDLink(value);
      if (key === "DirectTicketsToWallets") setDirectTicketsToWallets(value);
      if (key === "closeTicketOnTransfer") setCloseTicketOnTransfer(value);
      if (key === "transferMessage") setTransferMessage(value);
      if (key === "greetingAcceptedMessage") setGreetingAcceptedMessage(value);
      if (key === "AcceptCallWhatsappMessage") setAcceptCallWhatsappMessage(value);
      if (key === "sendQueuePositionMessage") setSendQueuePositionMessage(value);
      if (key === "showNotificationPending") setShowNotificationPending(value);
      if (key === "autoTranslate") setAutoTranslate(value);
      if (key === "translateApiKey") setTranslateApiKey(value);
      if (key === "aiAutoSummary") setAiAutoSummary(value);
      if (key === "aiAutoSummaryTime") setAiAutoSummaryTime(value);
      if (key === "sendWelcomeMessage") setSendWelcomeMessage(value);
      if (key === "welcomeMessageTemplate") setWelcomeMessageTemplate(value || "");
      if (key === "flowbuilderAI") setFlowbuilderAI(value);
      if (key === "flowbuilderAIApiKey") setFlowbuilderAIApiKey(value || "");
      if (key === "facebookAppId") setFacebookAppId(value);
      if (key === "facebookAppSecret") setFacebookAppSecret(value);
      if (key === "facebookVerifyToken") {
        if (value) {
          setFacebookVerifyToken(value);
        } else {
          // Gerar token automaticamente se estiver vazio
          const autoToken = "chatia_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          setFacebookVerifyToken(autoToken);
          update({ column: "facebookVerifyToken", data: autoToken });
        }
      }

    }
  }, [settings]);

  async function handleChangeUserCreation(value) {
    setUserCreation(value);
    setLoadingUserCreation(true);
    await updateUserCreation({
      key: "userCreation",
      value,
    });
    setLoadingUserCreation(false);
  }

  async function handleChangeUserRating(value) {
    setUserRating(value);
    setLoadingUserRating(true);
    await update({
      column: "userRating",
      data: value
    });
    setLoadingUserRating(false);
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
    setLoadingScheduleType(true);
    await update({
      column: "scheduleType",
      data: value
    });
    setLoadingScheduleType(false);
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  async function handleChatBotType(value) {
    setChatBotType(value);
    await update({
      column: "chatBotType",
      data: value
    });
    if (typeof scheduleTypeChanged === "function") {
      setChatBotType(value);
    }
  }

  async function handleLGPDMessage(value) {
    setLGPDMessage(value);
    setLoadingLGPDMessage(true);
    await update({
      column: "lgpdMessage",
      data: value
    });
    setLoadingLGPDMessage(false);
  }

  async function handletransferMessage(value) {
    setTransferMessage(value);
    setLoadingTransferMessage(true);
    await update({
      column: "transferMessage",
      data: value
    });
    setLoadingTransferMessage(false);
  }

  async function handleGreetingAcceptedMessage(value) {
    setGreetingAcceptedMessage(value);
    setLoadingGreetingAcceptedMessage(true);
    await update({
      column: "greetingAcceptedMessage",
      data: value
    });
    setLoadingGreetingAcceptedMessage(false);
  }

  async function handleAcceptCallWhatsappMessage(value) {
    setAcceptCallWhatsappMessage(value);
    setLoadingAcceptCallWhatsappMessage(true);
    await update({
      column: "AcceptCallWhatsappMessage",
      data: value
    });
    setLoadingAcceptCallWhatsappMessage(false);
  }

  async function handlesendQueuePositionMessage(value) {
    setSendQueuePositionMessage(value);
    setLoadingSendQueuePositionMessage(true);
    await update({
      column: "sendQueuePositionMessage",
      data: value
    });
    setLoadingSendQueuePositionMessage(false);
  }

  async function handleShowNotificationPending(value) {
    setShowNotificationPending(value);
    setLoadingShowNotificationPending(true);
    await update({
      column: "showNotificationPending",
      data: value
    });
    setLoadingShowNotificationPending(false);
  }

  async function handleAutoTranslate(value) {
    setAutoTranslate(value);
    setLoadingAutoTranslate(true);
    await update({
      column: "autoTranslate",
      data: value
    });
    setLoadingAutoTranslate(false);
  }

  async function handleTranslateApiKey() {
    setLoadingTranslateApiKey(true);
    await update({
      column: "translateApiKey",
      data: translateApiKey
    });
    setLoadingTranslateApiKey(false);
  }

  async function handleSendWelcomeMessage(value) {
    setSendWelcomeMessage(value);
    setLoadingSendWelcomeMessage(true);
    await update({
      column: "sendWelcomeMessage",
      data: value
    });
    setLoadingSendWelcomeMessage(false);
  }

  async function handleWelcomeMessageTemplate() {
    setLoadingWelcomeMessageTemplate(true);
    await update({
      column: "welcomeMessageTemplate",
      data: welcomeMessageTemplate
    });
    setLoadingWelcomeMessageTemplate(false);
  }

  async function handleLGPDLink(value) {
    setLGPDLink(value);
    setLoadingLGPDLink(true);
    await update({
      column: "lgpdLink",
      data: value
    });
    setLoadingLGPDLink(false);
  }

  async function handleLGPDDeleteMessage(value) {
    setLGPDDeleteMessage(value);
    setLoadingLGPDDeleteMessage(true);
    await update({
      column: "lgpdDeleteMessage",
      data: value
    });
    setLoadingLGPDDeleteMessage(false);
  }

  async function handleLGPDConsent(value) {
    setLGPDConsent(value);
    setLoadingLGPDConsent(true);
    await update({
      column: "lgpdConsent",
      data: value
    });
    setLoadingLGPDConsent(false);
  }

  async function handleLGPDHideNumber(value) {
    setLGPDHideNumber(value);
    setLoadingLGPDHideNumber(true);
    await update({
      column: "lgpdHideNumber",
      data: value
    });
    setLoadingLGPDHideNumber(false);
  }

  async function handleSendGreetingAccepted(value) {
    setSendGreetingAccepted(value);
    setLoadingSendGreetingAccepted(true);
    await update({
      column: "sendGreetingAccepted",
      data: value
    });
    setLoadingSendGreetingAccepted(false);
  }

  async function handleUserRandom(value) {
    setUserRandom(value);
    setLoadingUserRandom(true);
    await update({
      column: "userRandom",
      data: value
    });
    setLoadingUserRandom(false);
  }

  async function handleSettingsTransfTicket(value) {
    setSettingsTransfTicket(value);
    setLoadingSettingsTransfTicket(true);
    await update({
      column: "sendMsgTransfTicket",
      data: value
    });
    setLoadingSettingsTransfTicket(false);
  }

  async function handleAcceptCallWhatsapp(value) {
    setAcceptCallWhatsapp(value);
    setLoadingAcceptCallWhatsapp(true);
    await update({
      column: "acceptCallWhatsapp",
      data: value
    });
    setLoadingAcceptCallWhatsapp(false);
  }

  async function handleSendSignMessage(value) {
    setSendSignMessage(value);
    setLoadingSendSignMessage(true);
    await update({
      column: "sendSignMessage",
      data: value
    });
    localStorage.setItem("sendSignMessage", value === "enabled" ? true : false); //atualiza localstorage para sessão
    setLoadingSendSignMessage(false);
  }

  async function handleSendGreetingMessageOneQueues(value) {
    setSendGreetingMessageOneQueues(value);
    setLoadingSendGreetingMessageOneQueues(true);
    await update({
      column: "sendGreetingMessageOneQueues",
      data: value
    });
    setLoadingSendGreetingMessageOneQueues(false);
  }

  async function handleSendQueuePosition(value) {
    setSendQueuePosition(value);
    setLoadingSendQueuePosition(true);
    await update({
      column: "sendQueuePosition",
      data: value
    });
    setLoadingSendQueuePosition(false);
  }

  async function handleSendFarewellWaitingTicket(value) {
    setSendFarewellWaitingTicket(value);
    setLoadingSendFarewellWaitingTicket(true);
    await update({
      column: "sendFarewellWaitingTicket",
      data: value
    });
    setLoadingSendFarewellWaitingTicket(false);
  }

  async function handleAcceptAudioMessageContact(value) {
    setAcceptAudioMessageContact(value);
    setLoadingAcceptAudioMessageContact(true);
    await update({
      column: "acceptAudioMessageContact",
      data: value
    });
    setLoadingAcceptAudioMessageContact(false);
  }

  async function handleEnableLGPD(value) {
    setEnableLGPD(value);
    setLoadingEnableLGPD(true);
    await update({
      column: "enableLGPD",
      data: value
    });
    setLoadingEnableLGPD(false);
  }

  async function handleRequiredTag(value) {
    setRequiredTag(value);
    setLoadingRequiredTag(true);
    await update({
      column: "requiredTag",
      data: value,
    });
    setLoadingRequiredTag(false);
  }

  async function handleCloseTicketOnTransfer(value) {
    setCloseTicketOnTransfer(value);
    setLoadingCloseTicketOnTransfer(true);
    await update({
      column: "closeTicketOnTransfer",
      data: value,
    });
    setLoadingCloseTicketOnTransfer(false);
  }

  async function handleDirectTicketsToWallets(value) {
    setDirectTicketsToWallets(value);
    setLoadingDirectTicketsToWallets(true);
    await update({
      column: "DirectTicketsToWallets",
      data: value,
    });
    setLoadingDirectTicketsToWallets(false);
  }

  async function handleFlowbuilderAI(value) {
    setFlowbuilderAI(value);
    setLoadingFlowbuilderAI(true);
    await update({
      column: "flowbuilderAI",
      data: value,
    });
    setLoadingFlowbuilderAI(false);
  }

  async function handleFlowbuilderAIApiKey() {
    setLoadingFlowbuilderAIApiKey(true);
    await update({
      column: "flowbuilderAIApiKey",
      data: flowbuilderAIApiKey,
    });
    setLoadingFlowbuilderAIApiKey(false);
  }

  async function handleAiAutoSummary(value) {
    setAiAutoSummary(value);
    setLoadingAiAutoSummary(true);
    await update({
      column: "aiAutoSummary",
      data: value,
    });
    setLoadingAiAutoSummary(false);
  }

  async function handleAiAutoSummaryTime() {
    setLoadingAiAutoSummaryTime(true);
    await update({
      column: "aiAutoSummaryTime",
      data: aiAutoSummaryTime,
    });
    setLoadingAiAutoSummaryTime(false);
  }

  // Helper para renderizar toggle
  const renderToggle = (label, value, handler, loading, opts = {}) => {
    const { isBoolean, onValue = "enabled", offValue = "disabled" } = opts;
    const isOn = isBoolean ? !!value : value === onValue;
    return (
      <div className={classes.toggleItem}>
        <div>
          <span className={classes.toggleLabel}>{label}</span>
          {loading && <div className={classes.toggleHelper}>{i18n.t("settings.settingsConfig.options.updating")}</div>}
        </div>
        <GreenSwitch
          checked={isOn}
          onChange={(e) => {
            const newVal = isBoolean
              ? e.target.checked
              : e.target.checked ? onValue : offValue;
            handler(newVal);
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ overflowY: "auto", overflowX: "hidden", maxHeight: "calc(100vh - 200px)" }}>
      <Grid spacing={1} container>

        {/* CRIAÇÃO DE COMPANY/USERS */}
        {isSuper() ?
          <Grid xs={12} sm={6} md={4} item>
            {renderToggle(
              i18n.t("settings.settingsConfig.options.creationCompanyUser"),
              userCreation, handleChangeUserCreation, loadingUserCreation
            )}
          </Grid>
          : null}

        {/* AVALIAÇÕES */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.evaluations"),
            userRating, handleChangeUserRating, loadingUserRating
          )}
        </Grid>

        {/* AGENDAMENTO DE EXPEDIENTE - múltiplas opções */}
        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.toggleItem}>
            <div style={{ flex: 1 }}>
              <span className={classes.toggleLabel}>
                {i18n.t("settings.settingsConfig.options.officeScheduling")}
              </span>
              {loadingScheduleType && <div className={classes.toggleHelper}>{i18n.t("settings.settingsConfig.options.updating")}</div>}
            </div>
            <Select
              value={scheduleType}
              onChange={async (e) => { handleScheduleType(e.target.value); }}
              disableUnderline
              style={{ fontSize: '0.85rem', fontWeight: 500 }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.settingsConfig.options.disabled")}</MenuItem>
              <MenuItem value={"queue"}>{i18n.t("settings.settingsConfig.options.queueManagement")}</MenuItem>
              <MenuItem value={"company"}>{i18n.t("settings.settingsConfig.options.companyManagement")}</MenuItem>
              <MenuItem value={"connection"}>{i18n.t("settings.settingsConfig.options.connectionManagement")}</MenuItem>
            </Select>
          </div>
        </Grid>

        {/* ENVIAR SAUDAÇÃO AO ACEITAR O TICKET */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.sendGreetingAccepted"),
            SendGreetingAccepted, handleSendGreetingAccepted, loadingSendGreetingAccepted
          )}
        </Grid>

        {/* ESCOLHER OPERADOR ALEATORIO */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.userRandom"),
            UserRandom, handleUserRandom, loadingUserRandom
          )}
        </Grid>

        {/* ENVIAR MENSAGEM DE TRANSFERENCIA */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.sendMsgTransfTicket"),
            SettingsTransfTicket, handleSettingsTransfTicket, loadingSettingsTransfTicket
          )}
        </Grid>

        {/* AVISO SOBRE LIGAÇÃO DO WHATSAPP */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.acceptCallWhatsapp"),
            AcceptCallWhatsapp, handleAcceptCallWhatsapp, loadingAcceptCallWhatsapp
          )}
        </Grid>

        {/* HABILITAR PARA O ATENDENTE RETIRAR O ASSINATURA */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.sendSignMessage"),
            sendSignMessage, handleSendSignMessage, loadingSendSignMessage
          )}
        </Grid>

        {/* ENVIAR SAUDAÇÃO QUANDO HOUVER SOMENTE 1 FILA */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.sendGreetingMessageOneQueues"),
            sendGreetingMessageOneQueues, handleSendGreetingMessageOneQueues, loadingSendGreetingMessageOneQueues
          )}
        </Grid>

        {/* ENVIAR MENSAGEM COM A POSIÇÃO DA FILA */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.sendQueuePosition"),
            sendQueuePosition, handleSendQueuePosition, loadingSendQueuePosition
          )}
        </Grid>

        {/* ENVIAR MENSAGEM DE DESPEDIDA NO AGUARDANDO */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.sendFarewellWaitingTicket"),
            sendFarewellWaitingTicket, handleSendFarewellWaitingTicket, loadingSendFarewellWaitingTicket
          )}
        </Grid>

        {/* ACEITAR AUDIO DO CONTATO */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.acceptAudioMessageContact"),
            acceptAudioMessageContact, handleAcceptAudioMessageContact, loadingAcceptAudioMessageContact
          )}
        </Grid>

        {/* LGPD */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.enableLGPD"),
            enableLGPD, handleEnableLGPD, loadingEnableLGPD
          )}
        </Grid>

        {/* TAG OBRIGATÓRIA */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.requiredTag"),
            requiredTag, handleRequiredTag, loadingRequiredTag
          )}
        </Grid>

        {/* FECHAR TICKET AO TRANSFERIR */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.closeTicketOnTransfer"),
            closeTicketOnTransfer, handleCloseTicketOnTransfer, loadingCloseTicketOnTransfer,
            { isBoolean: true }
          )}
        </Grid>

        {/* NOTIFICAÇÃO PENDENTE */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.showNotificationPending"),
            showNotificationPending, handleShowNotificationPending, loadingShowNotificationPending,
            { isBoolean: true }
          )}
        </Grid>

        {/* TRADUÇÃO AUTOMÁTICA */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.autoTranslate") || "Tradução Automática de Mensagens",
            autoTranslate, handleAutoTranslate, loadingAutoTranslate
          )}
        </Grid>

        {/* RESUMO IA DIÁRIO AUTOMÁTICO */}
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.aiAutoSummary") || "Resumo IA Diário Automático",
            aiAutoSummary, handleAiAutoSummary, loadingAiAutoSummary
          )}
        </Grid>

      </Grid>

      {/* HORÁRIO DO RESUMO IA */}
      {aiAutoSummary === "enabled" && (
        <Grid spacing={3} container style={{ marginBottom: 10, marginTop: 10 }}>
          <Grid xs={12} sm={6} md={4} item>
            <TextField
              id="aiAutoSummaryTime"
              label={i18n.t("settings.settingsConfig.options.aiAutoSummaryTime") || "Horário do Resumo IA Diário"}
              variant="outlined"
              size="small"
              type="time"
              fullWidth
              value={aiAutoSummaryTime}
              onChange={(e) => setAiAutoSummaryTime(e.target.value)}
              onBlur={handleAiAutoSummaryTime}
              InputLabelProps={{ shrink: true }}
              helperText={
                loadingAiAutoSummaryTime
                  ? (i18n.t("settings.settingsConfig.options.updating") || "Atualizando...")
                  : (i18n.t("settings.settingsConfig.options.aiAutoSummaryTimeHelper") || "Horário em que o resumo automático será gerado para todos os tickets abertos.")
              }
            />
          </Grid>
        </Grid>
      )}

      {/* MENSAGEM DE BOAS-VINDAS NO CADASTRO */}
      <Grid spacing={3} container style={{ marginBottom: 10, marginTop: 10 }}>
        <Grid xs={12} sm={6} md={4} item>
          {renderToggle(
            i18n.t("settings.settingsConfig.options.sendWelcomeMessage") || "Mensagem de boas-vindas no cadastro",
            sendWelcomeMessage, handleSendWelcomeMessage, loadingSendWelcomeMessage
          )}
        </Grid>
      </Grid>

      {/* TEMPLATE MENSAGEM BOAS-VINDAS */}
      {sendWelcomeMessage === "enabled" && (
        <Grid spacing={3} container style={{ marginBottom: 10, marginTop: 10 }}>
          <Grid xs={12} sm={8} md={6} item>
            <TextField
              id="welcomeMessageTemplate"
              label={i18n.t("settings.settingsConfig.options.welcomeMessageTemplate") || "Modelo da mensagem de boas-vindas"}
              variant="outlined"
              size="small"
              fullWidth
              multiline
              minRows={4}
              maxRows={8}
              value={welcomeMessageTemplate}
              onChange={(e) => setWelcomeMessageTemplate(e.target.value)}
              onBlur={handleWelcomeMessageTemplate}
              helperText={
                loadingWelcomeMessageTemplate
                  ? (i18n.t("settings.settingsConfig.options.updating") || "Atualizando...")
                  : (i18n.t("settings.settingsConfig.options.welcomeMessageHelper") || "Use variáveis: {name}, {companyName}, {email}, {phone}, {trialDate}. Se vazio, usa o modelo padrão.")
              }
            />
          </Grid>
        </Grid>
      )}

      {/* API KEY TRADUÇÃO */}
      {autoTranslate === "enabled" && (
        <Grid spacing={3} container style={{ marginBottom: 10, marginTop: 10 }}>
          <Grid xs={12} sm={6} md={6} item>
            <TextField
              id="translateApiKey"
              label={i18n.t("settings.settingsConfig.options.translateApiKey") || "API Key OpenAI (para tradução)"}
              variant="outlined"
              size="small"
              fullWidth
              value={translateApiKey}
              onChange={(e) => setTranslateApiKey(e.target.value)}
              onBlur={handleTranslateApiKey}
              type="password"
              helperText={i18n.t("settings.settingsConfig.options.translateApiKeyHelper") || "Chave da API OpenAI para tradução automática. Se vazio, usa a chave do primeiro Prompt configurado."}
            />
          </Grid>
        </Grid>
      )}

      <br></br>
      {/*-----------------LGPD-----------------*/}
      {enableLGPD === "enabled" && (
        <>
          <Grid spacing={3} container
            style={{ marginBottom: 10 }}>
            <Tabs
              value={0}
              indicatorColor="primary"
              textColor="primary"
              scrollButtons="on"
              variant="scrollable"
              className={classes.tab}
            >
              <Tab
                label={i18n.t("settings.settingsConfig.LGPD.title")} />
            </Tabs>
          </Grid>
          <Grid spacing={1} container>
            <Grid xs={12} sm={6} md={12} item>
              <FormControl className={classes.selectContainer}>
                <TextField
                  id="lgpdMessage"
                  name="lgpdMessage"
                  margin="dense"
                  multiline
                  minRows={3}
                  label={i18n.t("settings.settingsConfig.LGPD.welcome")}
                  variant="outlined"
                  value={lgpdMessage}
                  onChange={async (e) => {
                    handleLGPDMessage(e.target.value);
                  }}
                >
                </TextField>
                <FormHelperText>
                  {loadinglgpdMessage && i18n.t("settings.settingsConfig.options.updating")}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6} md={12} item>
              <FormControl className={classes.selectContainer}>
                <TextField
                  id="lgpdLink"
                  name="lgpdLink"
                  margin="dense"
                  label={i18n.t("settings.settingsConfig.LGPD.linkLGPD")}
                  variant="outlined"
                  value={lgpdLink}
                  onChange={async (e) => {
                    handleLGPDLink(e.target.value);
                  }}
                >
                </TextField>
                <FormHelperText>
                  {loadingLGPDLink && i18n.t("settings.settingsConfig.options.updating")}
                </FormHelperText>
              </FormControl>
            </Grid>
            {/* LGPD Manter ou nao mensagem deletada pelo contato */}
            <Grid xs={12} sm={6} md={4} item>
              {renderToggle(
                i18n.t("settings.settingsConfig.LGPD.obfuscateMessageDelete"),
                lgpdDeleteMessage, handleLGPDDeleteMessage, loadingLGPDDeleteMessage
              )}
            </Grid>
            {/* LGPD Sempre solicitar confirmação / consentimento dos dados */}
            <Grid xs={12} sm={6} md={4} item>
              {renderToggle(
                i18n.t("settings.settingsConfig.LGPD.alwaysConsent"),
                lgpdConsent, handleLGPDConsent, loadingLGPDConsent
              )}
            </Grid>
            {/* LGPD Ofuscar número telefone para usuários */}
            <Grid xs={12} sm={6} md={4} item>
              {renderToggle(
                i18n.t("settings.settingsConfig.LGPD.obfuscatePhoneUser"),
                lgpdHideNumber, handleLGPDHideNumber, loadingLGPDHideNumber
              )}
            </Grid>
          </Grid>
        </>
      )}
      <Grid spacing={1} container>
        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="transferMessage"
              name="transferMessage"
              margin="dense"
              multiline
              minRows={3}
              label={i18n.t("settings.settingsConfig.customMessages.transferMessage")}
              variant="outlined"
              value={transferMessage}
              required={SettingsTransfTicket === "enabled"}
              onChange={async (e) => {
                handletransferMessage(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingTransferMessage && i18n.t("settings.settingsConfig.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="greetingAcceptedMessage"
              name="greetingAcceptedMessage"
              margin="dense"
              multiline
              minRows={3}
              label={i18n.t("settings.settingsConfig.customMessages.greetingAcceptedMessage")}
              variant="outlined"
              value={greetingAcceptedMessage}
              required={SendGreetingAccepted === "enabled"}
              onChange={async (e) => {
                handleGreetingAcceptedMessage(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingGreetingAcceptedMessage && i18n.t("settings.settingsConfig.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="AcceptCallWhatsappMessage"
              name="AcceptCallWhatsappMessage"
              margin="dense"
              multiline
              minRows={3}
              label={i18n.t("settings.settingsConfig.customMessages.AcceptCallWhatsappMessage")}
              variant="outlined"
              required={AcceptCallWhatsapp === "disabled"}
              value={AcceptCallWhatsappMessage}
              onChange={async (e) => {
                handleAcceptCallWhatsappMessage(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingAcceptCallWhatsappMessage && i18n.t("settings.settingsConfig.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="sendQueuePositionMessage"
              name="sendQueuePositionMessage"
              margin="dense"
              multiline
              required={sendQueuePosition === "enabled"}
              minRows={3}
              label={i18n.t("settings.settingsConfig.customMessages.sendQueuePositionMessage")}
              variant="outlined"
              value={sendQueuePositionMessage}
              onChange={async (e) => {
                handlesendQueuePositionMessage(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingSendQueuePositionMessage && i18n.t("settings.settingsConfig.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>



      {/* ====== SAÍDA IA DO FLOWBUILDER ====== */}
      <Grid xs={12} item>
        <Typography variant="subtitle1" style={{ fontWeight: 600, marginTop: 24, marginBottom: 8 }}>
          Saída IA do FlowBuilder
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
          Quando ativado, a "Saída IA" nos blocos do FlowBuilder usa GPT para ler o histórico da conversa e assumir o atendimento automaticamente quando o tempo expira.
        </Typography>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        {renderToggle(
          "Ativar Saída IA no FlowBuilder",
          flowbuilderAI, handleFlowbuilderAI, loadingFlowbuilderAI
        )}
      </Grid>

      {flowbuilderAI === "enabled" && (
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="flowbuilderAIApiKey"
              name="flowbuilderAIApiKey"
              margin="dense"
              label="API Key OpenAI (Saída IA)"
              variant="outlined"
              type="password"
              placeholder="sk-..."
              value={flowbuilderAIApiKey}
              onChange={(e) => setFlowbuilderAIApiKey(e.target.value)}
              onBlur={handleFlowbuilderAIApiKey}
            />
            <FormHelperText>
              {loadingFlowbuilderAIApiKey
                ? (i18n.t("settings.settingsConfig.options.updating") || "Atualizando...")
                : "Chave da API OpenAI usada pela Saída IA dos blocos do FlowBuilder."}
            </FormHelperText>
          </FormControl>
        </Grid>
      )}

      {/* ====== INTEGRAÇÃO META (Facebook / Instagram) ====== */}
      <Grid xs={12} item>
        <Typography variant="subtitle1" style={{ fontWeight: 600, marginTop: 24, marginBottom: 8 }}>
          Integração Meta (Facebook / Instagram)
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
          Configure os dados do seu App criado no Meta for Developers para conectar Facebook Messenger e Instagram Direct.
        </Typography>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="facebookAppId"
            name="facebookAppId"
            margin="dense"
            label="Facebook App ID"
            variant="outlined"
            placeholder="Ex: 123456789012345"
            value={facebookAppId}
            onChange={(e) => setFacebookAppId(e.target.value)}
            onBlur={async () => {
              setLoadingFacebookAppId(true);
              await update({ column: "facebookAppId", data: facebookAppId });
              setLoadingFacebookAppId(false);
            }}
          />
          <FormHelperText>
            {loadingFacebookAppId ? i18n.t("settings.settingsConfig.options.updating") : "Encontre em developers.facebook.com > App > Configurações > Básico"}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="facebookAppSecret"
            name="facebookAppSecret"
            margin="dense"
            label="Facebook App Secret"
            variant="outlined"
            type="password"
            placeholder="Ex: abc123def456..."
            value={facebookAppSecret}
            onChange={(e) => setFacebookAppSecret(e.target.value)}
            onBlur={async () => {
              setLoadingFacebookAppSecret(true);
              await update({ column: "facebookAppSecret", data: facebookAppSecret });
              setLoadingFacebookAppSecret(false);
            }}
          />
          <FormHelperText>
            {loadingFacebookAppSecret ? i18n.t("settings.settingsConfig.options.updating") : "Chave secreta do App (nunca compartilhe)"}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="facebookVerifyToken"
            name="facebookVerifyToken"
            margin="dense"
            label="Token de Verificação do Webhook"
            variant="outlined"
            value={facebookVerifyToken}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <span
                  style={{
                    cursor: "pointer",
                    fontSize: 12,
                    color: copiedToken ? "#4caf50" : "#1976d2",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                    padding: "4px 8px",
                    borderRadius: 4,
                    backgroundColor: copiedToken ? "#e8f5e9" : "#e3f2fd",
                    transition: "all 0.2s",
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(facebookVerifyToken);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }}
                >
                  {copiedToken ? "Copiado!" : "Copiar"}
                </span>
              ),
            }}
          />
          <FormHelperText>
            Gerado automaticamente. Copie e cole no campo "Token de verificação" do webhook na Meta.
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="webhookUrl"
            name="webhookUrl"
            margin="dense"
            label="URL de Callback do Webhook"
            variant="outlined"
            value={webhookUrl}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <span
                  style={{
                    cursor: "pointer",
                    fontSize: 12,
                    color: copiedWebhookUrl ? "#4caf50" : "#1976d2",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                    padding: "4px 8px",
                    borderRadius: 4,
                    backgroundColor: copiedWebhookUrl ? "#e8f5e9" : "#e3f2fd",
                    transition: "all 0.2s",
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedWebhookUrl(true);
                    setTimeout(() => setCopiedWebhookUrl(false), 2000);
                  }}
                >
                  {copiedWebhookUrl ? "Copiado!" : "Copiar"}
                </span>
              ),
            }}
          />
          <FormHelperText>
            Cole no campo "URL de callback" do webhook na Meta for Developers.
          </FormHelperText>
        </FormControl>
      </Grid>

      </Grid>
    </div>
  );
}
