import React, { useState, useEffect, useContext, useRef } from "react";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import { useMediaQuery, useTheme } from '@material-ui/core';
import { isNil } from "lodash";
import {
  CircularProgress,
  ClickAwayListener,
  IconButton,
  InputBase,
  makeStyles,
  Paper,
  Hidden,
  Menu,
  MenuItem,
  Tooltip,
  Fab,
  Popover,
  Typography,
} from "@material-ui/core";
import {
  blue,
  green,
  pink,
  grey,
} from "@material-ui/core/colors";
import {
  AttachFile,
  CheckCircleOutline,
  Clear,
  Comment,
  Create,
  Description,
  HighlightOff,
  Mic,
  Mood,
  MoreVert,
  Send,
  PermMedia,
  Person,
  Reply,
  Duo,
  Timer,
} from "@material-ui/icons";
import AddIcon from "@material-ui/icons/Add";
import BoltIcon from '@mui/icons-material/FlashOn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@material-ui/icons/Settings';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { CameraAlt } from "@material-ui/icons";
import MicRecorder from "mic-recorder-to-mp3";
import clsx from "clsx";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import RecordingTimer from "./RecordingTimer";

import useQuickMessages from "../../hooks/useQuickMessages";
import { isString, isEmpty } from "lodash";
import ContactSendModal from "../ContactSendModal";
import CameraModal from "../CameraModal";
import axios from "axios";
import ButtonModal from "../ButtonModal";
import MenuIcon from '@material-ui/icons/Menu';
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import MessageUploadMedias from "../MessageUploadMedias";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";
import ScheduleModal from "../ScheduleModal";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";


const Mp3Recorder = new MicRecorder({ bitRate: 128 });

// Mapa de bandeiras por código de idioma
const LANGUAGE_FLAGS = {
  "pt-BR": "🇧🇷", "pt": "🇵🇹", "en": "🇺🇸", "es": "🇪🇸",
  "fr": "🇫🇷", "de": "🇩🇪", "it": "🇮🇹", "zh": "🇨🇳",
  "ja": "🇯🇵", "ko": "🇰🇷", "ar": "🇸🇦", "ru": "🇷🇺",
  "hi": "🇮🇳", "tr": "🇹🇷", "nl": "🇳🇱", "pl": "🇵🇱",
  "uk": "🇺🇦", "th": "🇹🇭", "vi": "🇻🇳", "id": "🇮🇩",
  "ms": "🇲🇾", "he": "🇮🇱", "sv": "🇸🇪", "da": "🇩🇰",
  "fi": "🇫🇮", "no": "🇳🇴", "cs": "🇨🇿", "ro": "🇷🇴",
  "hu": "🇭🇺", "el": "🇬🇷", "bg": "🇧🇬", "hr": "🇭🇷",
  "sk": "🇸🇰", "sl": "🇸🇮", "lt": "🇱🇹", "lv": "🇱🇻",
  "et": "🇪🇪", "ca": "🇪🇸", "af": "🇿🇦", "sw": "🇰🇪",
};

const LANGUAGE_NAMES_SHORT = {
  "pt-BR": "PT-BR", "pt": "PT", "en": "EN", "es": "ES",
  "fr": "FR", "de": "DE", "it": "IT", "zh": "ZH",
  "ja": "JA", "ko": "KO", "ar": "AR", "ru": "RU",
  "hi": "HI", "tr": "TR", "nl": "NL", "pl": "PL",
  "uk": "UK", "th": "TH", "vi": "VI", "id": "ID",
  "ms": "MS", "he": "HE", "sv": "SV", "da": "DA",
  "fi": "FI", "no": "NO", "cs": "CS", "ro": "RO",
  "hu": "HU", "el": "EL", "bg": "BG", "hr": "HR",
};

const useStyles = makeStyles((theme) => ({
  mainWrapper: {
    background: "#eee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
    [theme.breakpoints.down("sm")]: {
      position: "fixed",
      bottom: 0,
      width: "100%",
    },
  },
  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "25%",
  },
  dropInfo: {
    background: "#eee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    padding: 15,
    left: 0,
    right: 0,
  },
  dropInfoOut: {
    display: "none",
  },
  gridFiles: {
    maxHeight: "100%",
    overflow: "scroll",
  },
  newMessageBox: {
    background: theme.palette.background.default,
    width: "100%",
    display: "flex",
    padding: "7px",
    alignItems: "center",
  },
  messageInputWrapper: {
    padding: 6,
    marginRight: 7,
    background: theme.palette.background.paper,
    display: "flex",
    borderRadius: 20,
    flex: 1,
    position: "relative",
  },
  messageInputWrapperPrivate: {
    padding: 6,
    marginRight: 7,
    background: "#F0E68C",
    display: "flex",
    borderRadius: 20,
    flex: 1,
    position: "relative",
  },
  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none",

  },
  messageInputPrivate: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
    color: grey[800],

  },
  translateBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
    color: "#667781",
    backgroundColor: "rgba(0,0,0,0.06)",
    cursor: "default",
    whiteSpace: "nowrap",
    marginRight: 4,
    height: 24,
  },
  translateFlag: {
    fontSize: 16,
    lineHeight: 1,
  },
  langFlagBtn: {
    padding: 6,
    cursor: "pointer",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    transition: "all 0.15s ease",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.06)",
    },
  },
  langFlagImg: {
    width: 24,
    height: 16,
    objectFit: "cover",
    borderRadius: 2,
    border: "1px solid rgba(0,0,0,0.12)",
  },
  langPopoverPaper: {
    borderRadius: 12,
    minWidth: 200,
    overflow: "hidden",
    boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
  },
  langPopoverHeader: {
    padding: "10px 14px 8px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  langPopoverTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "rgba(0,0,0,0.38)",
  },
  langOptionsList: {
    padding: 4,
  },
  langOptionItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 10px",
    borderRadius: 6,
    cursor: "pointer",
    transition: "all 0.15s ease",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.04)",
    },
  },
  langOptionSelected: {
    backgroundColor: "rgba(6,207,156,0.1)",
    "&:hover": {
      backgroundColor: "rgba(6,207,156,0.15)",
    },
  },
  langOptionFlag: {
    width: 26,
    height: 18,
    objectFit: "cover",
    borderRadius: 2,
    border: "1px solid rgba(0,0,0,0.1)",
    flexShrink: 0,
  },
  langOptionName: {
    fontSize: 13,
    fontWeight: 500,
    flex: 1,
  },
  langOptionCheck: {
    color: "#06cf9c",
    fontSize: 16,
  },
  variablesWrapper: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    maxHeight: 240,
    overflowY: "auto",
    background: "#fff",
    borderRadius: "8px 8px 0 0",
    boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
    zIndex: 10,
    padding: 4,
  },
  variableItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: 6,
    transition: "background 0.12s ease",
    "&:hover": {
      background: "rgba(0,0,0,0.06)",
    },
  },
  variableCode: {
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: 600,
    color: "#1976d2",
    background: "rgba(25,118,210,0.08)",
    padding: "2px 6px",
    borderRadius: 4,
    whiteSpace: "nowrap",
  },
  variableLabel: {
    fontSize: 13,
    color: "#333",
    fontWeight: 500,
  },
  variableDesc: {
    fontSize: 11,
    color: "#888",
    marginLeft: "auto",
  },
  sendMessageIcons: {
    color: grey[700],
  },
  ForwardMessageIcons: {
    color: grey[700],
    transform: 'scaleX(-1)'
  },
  uploadInput: {
    display: "none",
  },
  viewMediaInputWrapper: {
    maxHeight: "100%",
    display: "flex",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.mode === 'light' ? "#ffffff" : "#202c33",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },
  emojiBox: {
    position: "absolute",
    bottom: 63,
    width: 40,
    borderTop: "1px solid #e8e8e8",
  },
  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12,
  },
  audioLoading: {
    color: green[500],
    opacity: "70%",
  },
  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    alignContent: "middle",
  },
  cancelAudioIcon: {
    color: "red",
  },
  sendAudioIcon: {
    color: "green",
  },
  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingLeft: 73,
    paddingRight: 7,
    backgroundColor: theme.palette.optionsBackground,
  },
  replyginMsgContainer: {
    flex: 1,
    marginRight: 5,
    overflowY: "hidden",
    backgroundColor: theme.mode === "light" ? "#f0f0f0" : "#1d282f", //"rgba(0, 0, 0, 0.05)",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },
  replyginMsgBody: {
    padding: 10,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },
  replyginContactMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },
  replyginSelfMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },
  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },
  messageQuickAnswersWrapper: {
    margin: 0,
    position: "absolute",
    bottom: "50px",
    background: theme.palette.background.default,
    padding: 0,
    border: "none",
    left: 0,
    width: "100%",
    "& li": {
      listStyle: "none",
      "& a": {
        display: "block",
        padding: "8px",
        textOverflow: "ellipsis",
        overflow: "hidden",
        maxHeight: "30px",
        "&:hover": {
          background: theme.palette.background.paper,
          cursor: "pointer",
        },
      },
    },
  },
  invertedFabMenu: {
    border: "none",
    borderRadius: 50, // Define o raio da borda para 0 para remover qualquer borda
    boxShadow: "none", // Remove a sombra
    padding: theme.spacing(1),
    backgroundColor: "transparent",
    color: "grey",
    "&:hover": {
      backgroundColor: "transparent",
    },
    "&:disabled": {
      backgroundColor: "transparent !important",
    },
  },
  invertedFabMenuMP: {
    border: "none",
    borderRadius: 0, // Define o raio da borda para 0 para remover qualquer borda
    boxShadow: "none", // Remove a sombra
    width: theme.spacing(4), // Ajuste o tamanho de acordo com suas preferências
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: blue[800],
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  invertedFabMenuCont: {
    border: "none",
    borderRadius: 0, // Define o raio da borda para 0 para remover qualquer borda
    boxShadow: "none", // Remove a sombra
    minHeight: "auto",
    width: theme.spacing(4), // Ajuste o tamanho de acordo com suas preferências
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: blue[500],
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  invertedFabMenuMeet: {
    border: "none",
    borderRadius: 0, // Define o raio da borda para 0 para remover qualquer borda
    boxShadow: "none", // Remove a sombra
    minHeight: "auto",
    width: theme.spacing(4), // Ajuste o tamanho de acordo com suas preferências
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: green[500],
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  invertedFabMenuDoc: {
    border: "none",
    borderRadius: 0, // Define o raio da borda para 0 para remover qualquer borda
    boxShadow: "none", // Remove a sombra
    width: theme.spacing(4), // Ajuste o tamanho de acordo com suas preferências
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: "#7f66ff",
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  invertedFabMenuCamera: {
    border: "none",
    borderRadius: 0, // Define o raio da borda para 0 para remover qualquer borda
    boxShadow: "none", // Remove a sombra
    width: theme.spacing(4), // Ajuste o tamanho de acordo com suas preferências
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: pink[500],
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  flexContainer: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
  },
  flexItem: {
    flex: 1,
  },
  aiSuggestionsWrapper: {
    position: "absolute",
    bottom: "50px",
    left: 0,
    width: "100%",
    background: theme.palette.background.default,
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 8,
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    zIndex: 10,
    padding: 8,
  },
  aiSuggestionItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
    transition: "background 0.15s ease",
    "&:hover": {
      background: "rgba(0,0,0,0.04)",
    },
  },
  aiSuggestionBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#fff",
    background: "#6B46C1",
    whiteSpace: "nowrap",
    marginTop: 2,
    flexShrink: 0,
  },
  aiSuggestionText: {
    fontSize: 13,
    color: theme.palette.text.primary,
    lineHeight: 1.4,
    flex: 1,
  },
  aiSuggestionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 8px 8px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    marginBottom: 4,
  },
  aiSuggestionsTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "rgba(0,0,0,0.45)",
  },
  aiButtonWrapper: {
    position: "relative",
    display: "inline-flex",
    "&:hover $aiConfigBtn": {
      opacity: 1,
      pointerEvents: "auto",
    },
  },
  aiConfigBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    opacity: 0,
    pointerEvents: "none",
    transition: "opacity 0.2s",
    padding: 2,
    background: "#fff",
    borderRadius: "50%",
    boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
    zIndex: 2,
    "& svg": {
      fontSize: 14,
    },
  },
}));

const MessageInput = ({ ticketId, ticketStatus, droppedFiles, contactId, ticketChannel }) => {

  const classes = useStyles();
  const theme = useTheme();
  const [mediasUpload, setMediasUpload] = useState([]);
  const isMounted = useRef(true);
  const [buttonModalOpen, setButtonModalOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [quickAnswers, setQuickAnswer] = useState([]);
  const [typeBar, setTypeBar] = useState(false);
  const inputRef = useRef();
  const [onDragEnter, setOnDragEnter] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { setReplyingMessage, replyingMessage } = useContext(ReplyMessageContext);
  const { setEditingMessage, editingMessage } = useContext(EditMessageContext);
  const { user } = useContext(AuthContext);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

  const [signMessagePar, setSignMessagePar] = useState(false);
  const { get: getSetting, update: updateSetting } = useCompanySettings();
  const [signMessage, setSignMessage] = useState(true);
  const [privateMessage, setPrivateMessage] = useState(false);
  const [privateMessageInputVisible, setPrivateMessageInputVisible] = useState(false);
  const [senVcardModalOpen, setSenVcardModalOpen] = useState(false);
  const [showModalMedias, setShowModalMedias] = useState(false);
  const [contactLanguage, setContactLanguage] = useState(null);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [aiConfigOpen, setAiConfigOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptDraft, setAiPromptDraft] = useState("");
  const [savingAiPrompt, setSavingAiPrompt] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [variableFilter, setVariableFilter] = useState("");

  const { list: listQuickMessages } = useQuickMessages();


  const isMobile = useMediaQuery('(max-width: 767px)'); // Ajuste o valor conforme necessário
  const [placeholderText, setPlaceHolderText] = useState("");

  // Determine o texto do placeholder com base no ticketStatus
  useEffect(() => {
    if (ticketStatus === "open" || ticketStatus === "group") {
      setPlaceHolderText(i18n.t("messagesInput.placeholderOpen"));
    } else {
      setPlaceHolderText(i18n.t("messagesInput.placeholderClosed"));
    }

    // Limitar o comprimento do texto do placeholder apenas em ambientes mobile
    const maxLength = isMobile ? 20 : Infinity; // Define o limite apenas em mobile

    if (isMobile && placeholderText.length > maxLength) {
      setPlaceHolderText(placeholderText.substring(0, maxLength) + "...");
    }
  }, [ticketStatus])

  const {
    selectedMessages,
    setForwardMessageModalOpen,
    showSelectMessageCheckbox } = useContext(ForwardMessageContext);

  // Buscar idioma do contato e config de tradução
  useEffect(() => {
    let cancelled = false;
    async function fetchTranslateInfo() {
      try {
        if (contactId) {
          const { data } = await api.get(`/translate/contact/${contactId}/language`);
          if (!cancelled) {
            setContactLanguage(data.language || "pt-BR");
          }
        }
        const { data: settings } = await api.get("/translate/settings");
        if (!cancelled) {
          setAutoTranslateEnabled(settings.autoTranslate === "enabled");
        }
      } catch (err) {
        if (!cancelled) setContactLanguage("pt-BR");
      }
    }
    fetchTranslateInfo();
    return () => { cancelled = true; };
  }, [contactId]);

  // Carregar prompt IA salvo
  useEffect(() => {
    async function loadAiPrompt() {
      try {
        const setting = await getSetting({ column: "aiSuggestionsPrompt" });
        if (setting?.aiSuggestionsPrompt) {
          setAiPrompt(setting.aiSuggestionsPrompt);
        }
      } catch {}
    }
    loadAiPrompt();
  }, []);

  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const selectedMedias = Array.from(droppedFiles);
      setMediasUpload(selectedMedias);
      setShowModalMedias(true);
    }
  }, [droppedFiles]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    inputRef.current.focus();
    if (editingMessage) {
      setInputMessage(editingMessage.body);
    }
  }, [replyingMessage, editingMessage]);

  useEffect(() => {
    inputRef.current.focus();
    return () => {
      setInputMessage("");
      setShowEmoji(false);
      setMediasUpload([]);
      setReplyingMessage(null);
      //setSignMessage(true);
      setPrivateMessage(false);
      setPrivateMessageInputVisible(false)
      setEditingMessage(null);
    };
  }, [ticketId, setReplyingMessage, setEditingMessage]);

  useEffect(() => {
    setTimeout(() => {
      if (isMounted.current)
        setOnDragEnter(false);
    }, 1000);
    // eslint-disable-next-line
  }, [onDragEnter === true]);

  //permitir ativar/desativar firma
  useEffect(() => {
    const fetchSettings = async () => {
      const setting = await getSetting({
        "column": "sendSignMessage"
      });

      if (isMounted.current) {
        if (setting.sendSignMessage === "enabled") {
          setSignMessagePar(true);
          const signMessageStorage = JSON.parse(
            localStorage.getItem("persistentSignMessage")
          );
          if (isNil(signMessageStorage)) {
            setSignMessage(true)
          } else {
            setSignMessage(signMessageStorage);
          }
        } else {
          setSignMessagePar(false);
        }
      }
    };
    fetchSettings();
  }, []);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const handleSendLinkVideo = async () => {
    const link = `https://meet.jit.si/${ticketId}`;
    setInputMessage(link);
  }

  const handleAiSuggestions = async () => {
    if (loadingAiSuggestions) return;
    setLoadingAiSuggestions(true);
    setShowAiSuggestions(false);
    try {
      const { data } = await api.post(`/messages/${ticketId}/ai-suggestions`, {
        draftText: inputMessage.trim() || undefined
      });
      if (data.suggestions && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions);
        setShowAiSuggestions(true);
      } else {
        toastError({ response: { data: { message: "Nenhuma sugestão gerada. Verifique se a API key está configurada." } } });
      }
    } catch (err) {
      toastError(err);
    }
    setLoadingAiSuggestions(false);
  };

  const handleSelectAiSuggestion = (text) => {
    setInputMessage(text);
    setShowAiSuggestions(false);
    setAiSuggestions([]);
    inputRef.current?.focus();
  };

  const handleOpenAiConfig = () => {
    setAiPromptDraft(aiPrompt);
    setAiConfigOpen(true);
  };

  const handleSaveAiPrompt = async () => {
    setSavingAiPrompt(true);
    try {
      await updateSetting({ column: "aiSuggestionsPrompt", data: aiPromptDraft });
      setAiPrompt(aiPromptDraft);
      setAiConfigOpen(false);
    } catch (err) {
      console.error("Erro ao salvar prompt IA:", err);
    }
    setSavingAiPrompt(false);
  };

  const TEMPLATE_VARIABLES = [
    { variable: "{{firstName}}", label: "Primeiro nome", description: "Primeiro nome do contato" },
    { variable: "{{name}}", label: "Nome completo", description: "Nome completo do contato" },
    { variable: "{{userName}}", label: "Atendente", description: "Nome do atendente" },
    { variable: "{{ticket_id}}", label: "Ticket ID", description: "Numero do ticket" },
    { variable: "{{ms}}", label: "Saudacao", description: "Bom dia / Boa tarde / Boa noite" },
    { variable: "{{hour}}", label: "Hora", description: "Hora atual" },
    { variable: "{{date}}", label: "Data", description: "Data atual" },
    { variable: "{{data_hora}}", label: "Data e hora", description: "Data e hora atual" },
    { variable: "{{queue}}", label: "Fila", description: "Nome da fila do ticket" },
    { variable: "{{connection}}", label: "Conexao", description: "Nome da conexao WhatsApp" },
    { variable: "{{protocol}}", label: "Protocolo", description: "Numero de protocolo" },
    { variable: "{{name_company}}", label: "Empresa", description: "Nome da empresa" },
  ];

  const handleSelectVariable = (variable) => {
    // Replace the "#..." trigger text with the selected variable
    const cursorPos = inputRef.current?.selectionStart || inputMessage.length;
    const textBefore = inputMessage.substring(0, cursorPos);
    const textAfter = inputMessage.substring(cursorPos);
    const hashIndex = textBefore.lastIndexOf("#");
    if (hashIndex >= 0) {
      const newText = textBefore.substring(0, hashIndex) + variable + textAfter;
      setInputMessage(newText);
    } else {
      setInputMessage(inputMessage + variable);
    }
    setShowVariables(false);
    setVariableFilter("");
    inputRef.current?.focus();
  };

  const typingTimeoutRef = useRef(null);

  const handleChangeInput = (e) => {
    setInputMessage(e.target.value);

    // Enviar typing para WhatsApp (debounce de 800ms entre emits)
    if (e.target.value.length > 0) {
      if (!typingTimeoutRef.current) {
        api.post(`/typing/${ticketId}`).catch(() => {});
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
        }, 800);
      }
    }
  };

  const handlePrivateMessage = (e) => {
    setPrivateMessage(!privateMessage);
    setPrivateMessageInputVisible(!privateMessageInputVisible);
  };

  const handleButtonModalOpen = () => {
    handleMenuItemClick();
    setButtonModalOpen(true); // Define o estado como true para abrir o modal
  };

  const handleQuickAnswersClick = async (value) => {
    if (value.mediaPath) {
      try {
        const { data } = await axios.get(value.mediaPath, {
          responseType: "blob",
        });

        handleUploadQuickMessageMedia(data, value.value);
        setInputMessage("");
        return;
        //  handleChangeMedias(response)
      } catch (err) {
        toastError(err);
      }
    }

    setInputMessage("");
    setInputMessage(value.value);
    setTypeBar(false);
  };

  const handleAddEmoji = (e) => {
    let emoji = e.native;
    setInputMessage((prevState) => prevState + emoji);
  };

  const [modalCameraOpen, setModalCameraOpen] = useState(false);

  const handleCapture = (imageData) => {
    if (imageData) {
      handleUploadCamera(imageData);
    }
  };

  const handleChangeMedias = (e) => {
    if (!e.target.files) {
      return;
    }
    const selectedMedias = Array.from(e.target.files);
    setMediasUpload(selectedMedias);
    setShowModalMedias(true);
  };

  const handleChangeSign = (e) => {
    getStatusSingMessageLocalstogare();
  };

  const handleOpenModalForward = () => {
    if (selectedMessages.length === 0) {
      setForwardMessageModalOpen(false)
      toastError(i18n.t("messagesList.header.notMessage"));
      return;
    }
    setForwardMessageModalOpen(true);
  }

  const getStatusSingMessageLocalstogare = () => {
    const signMessageStorage = JSON.parse(
      localStorage.getItem("persistentSignMessage")
    );
    //si existe uma chave "sendSingMessage"
    if (signMessageStorage !== null) {
      if (signMessageStorage) {
        localStorage.setItem("persistentSignMessage", false);
        setSignMessage(false);
      } else {
        localStorage.setItem("persistentSignMessage", true);
        setSignMessage(true);
      }
    } else {
      localStorage.setItem("persistentSignMessage", false);
      setSignMessage(false);
    }
  };

  const inputLanguageOptions = [
    { code: "pt-BR", flag: "/flags/br.png", name: "Português" },
    { code: "en", flag: "/flags/us.png", name: "English" },
    { code: "es", flag: "/flags/es.png", name: "Español" },
    { code: "tr", flag: "/flags/tr.png", name: "Türkçe" },
    { code: "ar", flag: "/flags/sa.png", name: "العربية" },
  ];

  const getContactFlag = () => {
    const lang = contactLanguage || "pt-BR";
    const opt = inputLanguageOptions.find(l => l.code === lang || l.code.startsWith(lang) || lang.startsWith(l.code.split("-")[0]));
    return opt || inputLanguageOptions[0];
  };

  const handleChangeContactLang = async (langCode) => {
    try {
      if (contactId) {
        await api.put(`/contacts/language/${contactId}`, { language: langCode });
        setContactLanguage(langCode);
      }
    } catch (err) {
      toastError(err);
    }
    setLangAnchorEl(null);
  };

  const handleInputPaste = (e) => {
    if (e.clipboardData.files[0]) {
      const selectedMedias = Array.from(e.clipboardData.files);
      setMediasUpload(selectedMedias);
      setShowModalMedias(true);
    }
  };

  const handleInputDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) {
      const selectedMedias = Array.from(e.dataTransfer.files);
      setMediasUpload(selectedMedias);
      setShowModalMedias(true);
    }
  };

  const handleUploadMedia = async (mediasUpload) => {
    setLoading(true);
    // e.preventDefault();

    // Certifique-se de que a variável medias esteja preenchida antes de continuar
    if (!mediasUpload.length) {
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("fromMe", true);
    formData.append("isPrivate", privateMessage ? "true" : "false");
    const userName = privateMessage
      ? `${user.name} - ${i18n.t("messageInputResponsive.privateMessage.suffix")}`
      : user.name;

    mediasUpload.forEach((media) => {
      const caption = (signMessage || privateMessage) && media.caption
        ? `> ${userName}\n${media.caption}`
        : media.caption;
      formData.append("body", caption);
      formData.append("medias", media.file);
    });

    try {
      await api.post(`/messages/${ticketId}`, formData);
    } catch (err) {
      toastError(err);
    }

    setLoading(false);
    setMediasUpload([]);
    setShowModalMedias(false);
    setPrivateMessage(false);
    setPrivateMessageInputVisible(false)
  };

  const handleSendContatcMessage = async (vcard) => {
    setSenVcardModalOpen(false);
    setLoading(true);

    if (isNil(vcard)) {
      setLoading(false);
      return;
    }

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: null,
      quotedMsg: replyingMessage,
      isPrivate: privateMessage ? "true" : "false",
      vCard: vcard,
    };
    try {
      await api.post(`/messages/${ticketId}`, message);
    } catch (err) {
      toastError(err);
    }

    setInputMessage("");
    setShowEmoji(false);
    setLoading(false);
    setReplyingMessage(null);
    setEditingMessage(null);
    setPrivateMessage(false);
    setPrivateMessageInputVisible(false);
  };

  const handleSendMessage = async () => {

    if (inputMessage.trim() === "") return;
    setLoading(true);

    const userName = privateMessage
      ? `${user.name} - ${i18n.t("messageInputResponsive.privateMessage.suffix")}`
      : user.name;

    const sendMessage = inputMessage.trim();

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: (signMessage || privateMessage) && !editingMessage
        ? `> ${userName}\n${sendMessage}`
        : sendMessage,
      quotedMsg: replyingMessage,
      isPrivate: privateMessage ? "true" : "false",
    };

    try {
      if (editingMessage !== null) {
        await api.post(`/messages/edit/${editingMessage.id}`, message);
      } else {
        await api.post(`/messages/${ticketId}`, message);
      }
    } catch (err) {
      toastError(err);
    }

    setInputMessage("");
    setShowEmoji(false);
    setLoading(false);
    setReplyingMessage(null);
    setPrivateMessage(false);
    setEditingMessage(null);
    setPrivateMessageInputVisible(false)
    handleMenuItemClick();
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const messages = await listQuickMessages({ companyId, userId: user.id });
      const options = messages.map((m) => {
        let truncatedMessage = m.message;
        if (isString(truncatedMessage) && truncatedMessage.length > 90) {
          truncatedMessage = m.message.substring(0, 90) + "...";
        }
        return {
          value: m.message,
          label: `/${m.shortcode} - ${truncatedMessage}`,
          mediaPath: m.mediaPath,
        };
      });
      if (isMounted.current) {

        setQuickAnswer(options);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      isString(inputMessage) &&
      !isEmpty(inputMessage) &&
      inputMessage.length >= 1
    ) {
      const firstWord = inputMessage.charAt(0);

      if (firstWord === "/") {
        setTypeBar(firstWord.indexOf("/") > -1);

        const filteredOptions = quickAnswers.filter(
          (m) => m.label.toLowerCase().indexOf(inputMessage.toLowerCase()) > -1
        );
        setTypeBar(filteredOptions);
      } else {
        setTypeBar(false);
      }

      // Detect # for variable insertion
      const cursorPos = inputRef.current?.selectionStart || inputMessage.length;
      const textBeforeCursor = inputMessage.substring(0, cursorPos);
      const hashMatch = textBeforeCursor.match(/#([a-zA-Z_{}]*)$/);
      if (hashMatch) {
        const filter = hashMatch[1].toLowerCase();
        setVariableFilter(filter);
        setShowVariables(true);
      } else {
        setShowVariables(false);
        setVariableFilter("");
      }
    } else {
      setTypeBar(false);
      setShowVariables(false);
      setVariableFilter("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMessage]);

  const disableOption = () => {
    return (
      loading ||
      recording ||
      (ticketStatus !== "open" && ticketStatus !== "group")
    );
  };

  const handleUploadCamera = async (blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      const filename = `${new Date().getTime()}.png`;
      formData.append("medias", blob, filename);
      formData.append("body", privateMessage ? `\u200d` : "");
      formData.append("fromMe", true);

      await api.post(`/messages/${ticketId}`, formData);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
    setLoading(false);
  };

  const handleUploadQuickMessageMedia = async (blob, message) => {
    setLoading(true);
    try {
      const extension = blob.type.split("/")[1];

      const formData = new FormData();
      const filename = `${new Date().getTime()}.${extension}`;
      formData.append("medias", blob, filename);
      formData.append("body", privateMessage ? `\u200d${message}` : message);
      formData.append("fromMe", true);

      if (isMounted.current) {
        await api.post(`/messages/${ticketId}`, formData);
      }
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };


  const handleUploadAudio = async () => {

    setLoading(true);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();
      if (blob.size < 10000) {
        setLoading(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();
      const filename = ticketChannel === "whatsapp" ? `${new Date().getTime()}.mp3` : `${new Date().getTime()}.m4a`;
      formData.append("medias", blob, filename);
      formData.append("body", filename);
      formData.append("fromMe", true);

      if (isMounted.current) {
        await api.post(`/messages/${ticketId}`, formData);
      }
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRecording(false);
      }
    }
  };

  const handleCloseModalMedias = () => {
    setShowModalMedias(false);
  };
  const handleCancelAudio = async () => {
    try {
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (event) => {
    setAnchorEl(null);
  };

  const handleSendContactModalOpen = async () => {
    handleMenuItemClick();
    setSenVcardModalOpen(true);
  };

  const handleCameraModalOpen = async () => {
    handleMenuItemClick();
    setModalCameraOpen(true);
  };

  const handleCancelSelection = () => {
    setMediasUpload([]);
    setShowModalMedias(false);
  };

  const renderReplyingMessage = (message) => {
    return (
      <div className={classes.replyginMsgWrapper}>
        <div className={classes.replyginMsgContainer}>
          <span
            className={clsx(classes.replyginContactMsgSideColor, {
              [classes.replyginSelfMsgSideColor]: !message.fromMe,
            })}
          ></span>
          {replyingMessage && (
            <div className={classes.replyginMsgBody}>
              {!message.fromMe && (
                <span className={classes.messageContactName}>
                  {message.contact?.name}
                </span>
              )}
              {message.body}
            </div>
          )
          }
        </div>
        <IconButton
          aria-label="showRecorder"
          component="span"
          disabled={disableOption()}
          onClick={() => {
            setReplyingMessage(null);
            setEditingMessage(null);
            setInputMessage("");
          }}
        >
          <Clear className={classes.sendMessageIcons} />
        </IconButton>
      </div>
    );
  };

  if (mediasUpload.length > 0) {
    return (

      <Paper
        elevation={0}
        square
        className={classes.viewMediaInputWrapper}
        onDragEnter={() => setOnDragEnter(true)}
        onDrop={(e) => handleInputDrop(e)}
      >
        {showModalMedias && (
          <MessageUploadMedias
            isOpen={showModalMedias}
            files={mediasUpload}
            onClose={handleCloseModalMedias}
            onSend={handleUploadMedia}
            onCancelSelection={handleCancelSelection}
          />
        )}

      </Paper>
    )
  }
  else {
    return (
      <>
        {modalCameraOpen && (
          <CameraModal
            isOpen={modalCameraOpen}
            onRequestClose={() => setModalCameraOpen(false)}
            onCapture={handleCapture}
          />
        )}
        {senVcardModalOpen && (
          <ContactSendModal
            modalOpen={senVcardModalOpen}
            onClose={(c) => {
              handleSendContatcMessage(c);
            }}
          />
        )}
        <Paper
          square
          elevation={0}
          className={classes.mainWrapper}
          onDragEnter={() => setOnDragEnter(true)}
          onDrop={(e) => handleInputDrop(e)}
        >
          {(replyingMessage && renderReplyingMessage(replyingMessage)) || (editingMessage && renderReplyingMessage(editingMessage))}
          <div className={classes.newMessageBox}>
            <Hidden only={["sm", "xs"]}>
              <IconButton
                aria-label="emojiPicker"
                component="span"
                disabled={disableOption()}
                onClick={(e) => setShowEmoji((prevState) => !prevState)}
              >
                <Mood className={classes.sendMessageIcons} />
              </IconButton>
              {showEmoji ? (
                <div className={classes.emojiBox}>
                  <ClickAwayListener onClickAway={(e) => setShowEmoji(true)}>
                    <Picker
                      perLine={16}
                      theme={"dark"}
                      i18n={i18n}
                      showPreview={true}
                      showSkinTones={false}
                      onSelect={handleAddEmoji}
                    />
                  </ClickAwayListener>
                </div>
              ) : null}

              <Fab
                disabled={disableOption()}
                aria-label="uploadMedias"
                component="span"
                className={classes.invertedFabMenu}
                onClick={handleOpenMenuClick}
              >
                <AddIcon />
              </Fab>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuItemClick}
                id="simple-menu"
              >
                <MenuItem onClick={handleMenuItemClick}>
                  <input
                    multiple
                    type="file"
                    id="upload-img-button"
                    accept="image/*, video/*, audio/* "
                    // disabled={disableOption()}
                    className={classes.uploadInput}
                    onChange={handleChangeMedias}
                  />
                  <label htmlFor="upload-img-button">
                    <Fab
                      aria-label="upload-img"
                      component="span"
                      className={classes.invertedFabMenuMP}
                    >
                      <PermMedia />
                    </Fab>
                    {i18n.t("messageInput.type.imageVideo")}
                  </label>
                </MenuItem>
                <MenuItem onClick={handleCameraModalOpen}>
                  <Fab className={classes.invertedFabMenuCamera}>
                    <CameraAlt />
                  </Fab>
                  {i18n.t("messageInput.type.cam")}
                </MenuItem>
                <MenuItem onClick={handleMenuItemClick}>
                  <input
                    multiple
                    type="file"
                    id="upload-doc-button"
                    accept="application/*, text/*"
                    // disabled={disableOption()}
                    className={classes.uploadInput}
                    onChange={handleChangeMedias}
                  />
                  <label htmlFor="upload-doc-button">
                    <Fab aria-label="upload-img"
                      component="span" className={classes.invertedFabMenuDoc}>
                      <Description />
                    </Fab>
                    {i18n.t("messageInputResponsive.type.document")}
                  </label>
                </MenuItem>
                <MenuItem onClick={handleSendContactModalOpen}>
                  <Fab className={classes.invertedFabMenuCont}>
                    <Person />
                  </Fab>
                  {i18n.t("messageInput.type.contact")}
                </MenuItem>
                <MenuItem onClick={handleSendLinkVideo}>
                  <Fab className={classes.invertedFabMenuMeet}>
                    <Duo />
                  </Fab>
                  {i18n.t("messageInput.type.meet")}
                </MenuItem>
                {buttonModalOpen && (
          <ButtonModal
            modalOpen={buttonModalOpen}
            onClose={() => setButtonModalOpen(false)} // Função para fechar o modal
            ticketId={ticketId}
          />
        )}
                <MenuItem onClick={handleButtonModalOpen}>
                  <Fab className={classes.invertedFabMenuCont}>
                    <MenuIcon />
                  </Fab>
                  {i18n.t("messageInputResponsive.type.buttons")}
                </MenuItem>
              </Menu>
              {/* <IconButton
				  aria-label="upload"
				  component="span"
				  disabled={disableOption()}
				  onMouseOver={() => setOnDragEnter(true)}
				>
				  <AttachFile className={classes.sendMessageIcons} />
				</IconButton> */}

              {/* </label> */}
              {signMessagePar && (
                <Tooltip title={i18n.t("messageInput.tooltip.signature")}>
                  <IconButton
                    aria-label="send-upload"
                    component="span"
                    onClick={handleChangeSign}
                  >
                    {signMessage === true ? (
                      <Create style={{ color: theme.mode === "light" ? theme.palette.primary.main : "#EEE" }} />
                    ) : (
                      <Create style={{ color: "grey" }} />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={i18n.t("messageInput.tooltip.privateMessage")}>
                <IconButton
                  aria-label="send-upload"
                  component="span"
                  onClick={handlePrivateMessage}
                >
                  {privateMessage === true ? (
                    <Comment style={{ color: theme.mode === "light" ? theme.palette.primary.main : "#EEE" }} />
                  ) : (
                    <Comment style={{ color: "grey" }} />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title={i18n.t("messageInput.tooltip.language") || "Idioma"}>
                <div
                  className={classes.langFlagBtn}
                  onClick={(e) => setLangAnchorEl(e.currentTarget)}
                >
                  <img
                    src={getContactFlag().flag}
                    alt={getContactFlag().name}
                    className={classes.langFlagImg}
                  />
                </div>
              </Tooltip>
              <Popover
                open={Boolean(langAnchorEl)}
                anchorEl={langAnchorEl}
                onClose={() => setLangAnchorEl(null)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                transformOrigin={{ vertical: "bottom", horizontal: "center" }}
                PaperProps={{ className: classes.langPopoverPaper }}
                disableScrollLock
              >
                <div className={classes.langPopoverHeader}>
                  <Typography className={classes.langPopoverTitle}>
                    {i18n.t("messageInput.selectLanguage") || "Selecione o idioma"}
                  </Typography>
                </div>
                <div className={classes.langOptionsList}>
                  {inputLanguageOptions.map((lang) => {
                    const cLang = contactLanguage || "pt-BR";
                    const selected = cLang === lang.code ||
                      cLang.startsWith(lang.code.split("-")[0]) ||
                      lang.code.startsWith(cLang.split("-")[0]);
                    return (
                      <div
                        key={lang.code}
                        className={`${classes.langOptionItem} ${selected ? classes.langOptionSelected : ""}`}
                        onClick={() => handleChangeContactLang(lang.code)}
                      >
                        <img src={lang.flag} alt={lang.name} className={classes.langOptionFlag} />
                        <Typography className={classes.langOptionName}>{lang.name}</Typography>
                        {selected && <CheckCircleOutline className={classes.langOptionCheck} />}
                      </div>
                    );
                  })}
                </div>
              </Popover>
              {/* <Tooltip title={i18n.t("messageInput.tooltip.meet")}>
                <IconButton
                  aria-label="send-upload"
                  component="span"
                  onClick={handleSendLinkVideo}
                >
                  <Duo style={{ color: "grey" }} />
                </IconButton>
              </Tooltip> */}
            </Hidden>
            <Hidden only={["md", "lg", "xl"]}>
              <IconButton
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={handleOpenMenuClick}
              >
                <MoreVert></MoreVert>
              </IconButton>
              <Menu
                id="simple-menu"
                keepMounted
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuItemClick}
              >
                <MenuItem onClick={handleMenuItemClick}>
                  <IconButton
                    aria-label="emojiPicker"
                    component="span"
                    disabled={disableOption()}
                    onClick={(e) => setShowEmoji((prevState) => !prevState)}
                  >
                    <Mood className={classes.sendMessageIcons} />
                  </IconButton>
                </MenuItem>
                <MenuItem onClick={handleMenuItemClick}>
                  <input
                    multiple
                    type="file"
                    id="upload-button"
                    disabled={disableOption()}
                    className={classes.uploadInput}
                    onChange={handleChangeMedias}
                  />
                  <label htmlFor="upload-button">
                    <IconButton
                      aria-label="upload"
                      component="span"
                      disabled={disableOption()}
                    >
                      <AttachFile className={classes.sendMessageIcons} />
                    </IconButton>
                  </label>
                </MenuItem>
                {signMessagePar && (
                  <Tooltip title={i18n.t("messageInputResponsive.tooltip.toggleSignature")}>
                    <IconButton
                      aria-label="send-upload"
                      component="span"
                      onClick={handleChangeSign}
                    >
                      {signMessage === true ? (
                        <Create style={{ color: theme.mode === "light" ? theme.palette.primary.main : "#EEE" }} />
                      ) : (
                        <Create style={{ color: "grey" }} />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={i18n.t("messageInputResponsive.tooltip.toggleComments")}>
                  <IconButton
                    aria-label="send-upload"
                    component="span"
                    onClick={handlePrivateMessage}
                  >
                    {privateMessage === true ? (
                      <Comment style={{ color: theme.mode === "light" ? theme.palette.primary.main : "#EEE" }} />
                    ) : (
                      <Comment style={{ color: "grey" }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Menu>
            </Hidden>
            <div className={classes.flexContainer}>
              {privateMessageInputVisible && (
                <div className={classes.flexItem}>
                  <div className={classes.messageInputWrapperPrivate}>
                    <InputBase
                      inputRef={(input) => {
                        input && input.focus();
                        input && (inputRef.current = input);
                      }}
                      className={classes.messageInputPrivate}
                      placeholder={
                        ticketStatus === "open" || ticketStatus === "group"
                          ? i18n.t("messagesInput.placeholderPrivateMessage")
                          : i18n.t("messagesInput.placeholderClosed")
                      }
                      multiline
                      maxRows={5}
                      value={inputMessage}
                      onChange={handleChangeInput}
                      disabled={disableOption()}
                      onPaste={(e) => {
                        (ticketStatus === "open" || ticketStatus === "group") &&
                          handleInputPaste(e);
                      }}
                      onKeyPress={(e) => {
                        if (loading || e.shiftKey) return;
                        else if (e.key === "Enter") {
                          handleSendMessage();
                        }
                      }}

                    />
                    {typeBar ? (
                      <ul className={classes.messageQuickAnswersWrapper}>
                        {typeBar.map((value, index) => {
                          return (
                            <li
                              className={classes.messageQuickAnswersWrapperItem}
                              key={index}
                            >
                              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                              <a onClick={() => handleQuickAnswersClick(value)}>
                                {`${value.label} - ${value.value}`}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div></div>
                    )}
                    {showVariables && (
                      <ClickAwayListener onClickAway={() => setShowVariables(false)}>
                        <div className={classes.variablesWrapper}>
                          {TEMPLATE_VARIABLES
                            .filter(v =>
                              !variableFilter ||
                              v.label.toLowerCase().includes(variableFilter) ||
                              v.variable.toLowerCase().includes(variableFilter) ||
                              v.description.toLowerCase().includes(variableFilter)
                            )
                            .map((v, idx) => (
                              <div
                                key={idx}
                                className={classes.variableItem}
                                onClick={() => handleSelectVariable(v.variable)}
                              >
                                <span className={classes.variableCode}>{v.variable}</span>
                                <span className={classes.variableLabel}>{v.label}</span>
                                <span className={classes.variableDesc}>{v.description}</span>
                              </div>
                            ))}
                        </div>
                      </ClickAwayListener>
                    )}
                  </div>
                </div>
              )}
              {!privateMessageInputVisible && (
                <div className={classes.flexItem}>
                  <div className={classes.messageInputWrapper}>
                    {/* badge de tradução removido - idioma controlado pela bandeira nos botões */}
                    <InputBase
                      inputRef={(input) => {
                        input && input.focus();
                        input && (inputRef.current = input);
                      }}
                      className={classes.messageInput}
                      placeholder={placeholderText}
                      multiline
                      maxRows={5}
                      value={inputMessage}
                      onChange={handleChangeInput}
                      disabled={disableOption()}
                      onPaste={(e) => {
                        (ticketStatus === "open" || ticketStatus === "group") &&
                          handleInputPaste(e);
                      }}
                      onKeyPress={(e) => {
                        if (loading || e.shiftKey) return;
                        else if (e.key === "Enter") {
                          handleSendMessage();
                        }
                      }}
                    />
                    {typeBar ? (
                      <ul className={classes.messageQuickAnswersWrapper}>
                        {typeBar.map((value, index) => {
                          return (
                            <li
                              className={classes.messageQuickAnswersWrapperItem}
                              key={index}
                            >
                              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                              <a onClick={() => handleQuickAnswersClick(value)}>
                                {`${value.label} - ${value.value}`}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div></div>
                    )}
                    {showVariables && (
                      <ClickAwayListener onClickAway={() => setShowVariables(false)}>
                        <div className={classes.variablesWrapper}>
                          {TEMPLATE_VARIABLES
                            .filter(v =>
                              !variableFilter ||
                              v.label.toLowerCase().includes(variableFilter) ||
                              v.variable.toLowerCase().includes(variableFilter) ||
                              v.description.toLowerCase().includes(variableFilter)
                            )
                            .map((v, idx) => (
                              <div
                                key={idx}
                                className={classes.variableItem}
                                onClick={() => handleSelectVariable(v.variable)}
                              >
                                <span className={classes.variableCode}>{v.variable}</span>
                                <span className={classes.variableLabel}>{v.label}</span>
                                <span className={classes.variableDesc}>{v.description}</span>
                              </div>
                            ))}
                        </div>
                      </ClickAwayListener>
                    )}
                    {showAiSuggestions && aiSuggestions.length > 0 && (
                      <ClickAwayListener onClickAway={() => setShowAiSuggestions(false)}>
                        <div className={classes.aiSuggestionsWrapper}>
                          <div className={classes.aiSuggestionsHeader}>
                            <Typography className={classes.aiSuggestionsTitle}>
                              Sugestões IA
                            </Typography>
                            <IconButton size="small" onClick={() => setShowAiSuggestions(false)}>
                              <Clear style={{ fontSize: 16 }} />
                            </IconButton>
                          </div>
                          {aiSuggestions.map((s, idx) => {
                            const badgeColors = {
                              direta: "#2196F3", consultiva: "#4CAF50", curta: "#FF9800",
                              formal: "#673AB7", casual: "#E91E63", expandida: "#009688"
                            };
                            return (
                              <div
                                key={idx}
                                className={classes.aiSuggestionItem}
                                onClick={() => handleSelectAiSuggestion(s.text)}
                              >
                                <span
                                  className={classes.aiSuggestionBadge}
                                  style={{ background: badgeColors[s.type] || "#6B46C1" }}
                                >
                                  {s.type}
                                </span>
                                <span className={classes.aiSuggestionText}>{s.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </ClickAwayListener>
                    )}
                  </div>
                </div>
              )}
            </div>
            {!privateMessageInputVisible && (
              <>
              <span className={classes.aiButtonWrapper}>
                <Tooltip title="Sugestão IA">
                  <IconButton
                    aria-label="aiSuggestions"
                    component="span"
                    disabled={disableOption() || loadingAiSuggestions}
                    onClick={handleAiSuggestions}
                  >
                    {loadingAiSuggestions ? (
                      <CircularProgress size={20} />
                    ) : (
                      <AutoAwesomeIcon style={{ color: "#6B46C1" }} />
                    )}
                  </IconButton>
                </Tooltip>
                <IconButton
                  className={classes.aiConfigBtn}
                  size="small"
                  onClick={handleOpenAiConfig}
                >
                  <SettingsIcon />
                </IconButton>
              </span>
              <Dialog
                open={aiConfigOpen}
                onClose={() => setAiConfigOpen(false)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle style={{ paddingBottom: 0 }}>
                  Configurar Sugestões IA
                </DialogTitle>
                <DialogContent>
                  <TextField
                    label="Prompt personalizado"
                    placeholder="Ex: Você é um agente de vendas especializado em software. Sempre sugira agendar uma demonstração..."
                    multiline
                    minRows={4}
                    maxRows={10}
                    fullWidth
                    variant="outlined"
                    value={aiPromptDraft}
                    onChange={(e) => setAiPromptDraft(e.target.value)}
                    style={{ marginTop: 8 }}
                    helperText="Instrua a IA sobre como gerar sugestões. Ex: perfil do agente, tom, produtos, regras de negócio."
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setAiConfigOpen(false)} size="small">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveAiPrompt}
                    color="primary"
                    variant="contained"
                    size="small"
                    disabled={savingAiPrompt}
                  >
                    {savingAiPrompt ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogActions>
              </Dialog>
              <Tooltip title={i18n.t("tickets.buttons.quickMessageFlash")}>
  <IconButton
    aria-label={i18n.t("tickets.buttons.quickMessageFlash")}
    component="span"
    onClick={() => setInputMessage('/')}
  >
    <BoltIcon className={classes.sendMessageIcons} />
  </IconButton>
</Tooltip>
                <Tooltip title={i18n.t("tickets.buttons.scredule")}>
                  <IconButton
                    aria-label="scheduleMessage"
                    component="span"
                    onClick={() => setAppointmentModalOpen(true)}
                    disabled={loading}
                  >
                    <Timer className={classes.sendMessageIcons} />
                  </IconButton>
                </Tooltip>
                {inputMessage || showSelectMessageCheckbox ? (
                  <>
                    <IconButton
                      aria-label="sendMessage"
                      component="span"
                      onClick={showSelectMessageCheckbox ? handleOpenModalForward : handleSendMessage}
                      disabled={loading}
                    >
                      {showSelectMessageCheckbox ?
                        <Reply className={classes.ForwardMessageIcons} /> : <Send className={classes.sendMessageIcons} />}
                    </IconButton>
                  </>
                ) : recording ? (
                  <div className={classes.recorderWrapper}>
                    <IconButton
                      aria-label="cancelRecording"
                      component="span"
                      fontSize="large"
                      disabled={loading}
                      onClick={handleCancelAudio}
                    >
                      <HighlightOff className={classes.cancelAudioIcon} />
                    </IconButton>
                    {loading ? (
                      <div>
                        <CircularProgress className={classes.audioLoading} />
                      </div>
                    ) : (
                      <RecordingTimer />
                    )}

                    <IconButton
                      aria-label="sendRecordedAudio"
                      component="span"
                      onClick={handleUploadAudio}
                      disabled={loading}
                    >
                      <CheckCircleOutline className={classes.sendAudioIcon} />
                    </IconButton>
                  </div>
                ) : (
                  <IconButton
                    aria-label="showRecorder"
                    component="span"
                    disabled={disableOption()}
                    onClick={handleStartRecording}
                  >
                    <Mic className={classes.sendMessageIcons} />
                  </IconButton>
                )}
              </>
            )}

            {privateMessageInputVisible && (
              <>
                <IconButton
                  aria-label="sendMessage"
                  component="span"
                  onClick={showSelectMessageCheckbox ? handleOpenModalForward : handleSendMessage}
                  disabled={loading}
                >
                  {showSelectMessageCheckbox ?
                    <Reply className={classes.ForwardMessageIcons} /> : <Send className={classes.sendMessageIcons} />}
                </IconButton>
              </>
            )}
            {appointmentModalOpen && (
              <ScheduleModal
                open={appointmentModalOpen}
                onClose={() => setAppointmentModalOpen(false)}
                message={inputMessage}
                contactId={contactId}
              />
            )}
          </div>
        </Paper>
      </>
    );
  }
};

export default MessageInput;

