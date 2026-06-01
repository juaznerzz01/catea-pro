import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Divider,
  Chip,
  Paper,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import AutoAwesomeIcon from "@material-ui/icons/Stars";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    minWidth: 480,
    maxWidth: 600,
    maxHeight: "80vh",
  },
  dialogTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1.5, 2),
    background: theme.palette.primary.main,
    color: "#fff",
  },
  titleLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  summaryCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    transition: "box-shadow 0.2s",
    "&:hover": {
      boxShadow: theme.shadows[2],
    },
  },
  summaryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
  },
  summaryDate: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: theme.palette.text.secondary,
  },
  summaryMeta: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  summaryText: {
    fontSize: "0.85rem",
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
    color: theme.palette.text.primary,
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  generateBtn: {
    textTransform: "none",
    fontWeight: 600,
  },
  chipManual: {
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    height: 22,
    fontSize: "0.7rem",
  },
  chipAuto: {
    backgroundColor: "#43a047",
    color: "#fff",
    height: 22,
    fontSize: "0.7rem",
  },
  msgCount: {
    fontSize: "0.72rem",
    color: theme.palette.text.secondary,
    fontStyle: "italic",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(4),
  },
}));

const AiSummaryModal = ({ open, onClose, ticketId }) => {
  const classes = useStyles();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadSummaries = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/tickets/${ticketId}/ai-summaries`);
      setSummaries(data);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    if (open) {
      loadSummaries();
    }
  }, [open, loadSummaries]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post(`/tickets/${ticketId}/ai-summaries`);
      toast.success("Resumo IA gerado com sucesso!");
      await loadSummaries();
    } catch (err) {
      toastError(err);
    }
    setGenerating(false);
  };

  const formatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      classes={{ paper: classes.dialogPaper }}
      scroll="paper"
    >
      <div className={classes.dialogTitle}>
        <div className={classes.titleLeft}>
          <AutoAwesomeIcon style={{ fontSize: 22 }} />
          <Typography variant="h6" style={{ fontSize: "1rem", fontWeight: 600 }}>
            Resumos IA
          </Typography>
        </div>
        <IconButton size="small" onClick={onClose} style={{ color: "#fff" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent dividers style={{ padding: 16 }}>
        {loading ? (
          <div className={classes.loadingContainer}>
            <CircularProgress size={32} />
          </div>
        ) : summaries.length === 0 ? (
          <div className={classes.emptyState}>
            <AutoAwesomeIcon style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }} />
            <Typography variant="body2">
              Nenhum resumo gerado ainda.
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Clique em "Gerar Novo Resumo" para analisar a conversa.
            </Typography>
          </div>
        ) : (
          summaries.map((s, idx) => (
            <Paper key={s.id} className={classes.summaryCard} elevation={0}>
              <div className={classes.summaryHeader}>
                <span className={classes.summaryDate}>
                  {formatDate(s.createdAt)}
                </span>
                <div className={classes.summaryMeta}>
                  <Chip
                    label={s.generatedBy === "automatic" ? "Automático" : "Manual"}
                    className={s.generatedBy === "automatic" ? classes.chipAuto : classes.chipManual}
                    size="small"
                  />
                </div>
              </div>
              <div className={classes.msgCount}>
                {s.messageCount} mensagens analisadas
                {s.user && ` • por ${s.user.name}`}
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div className={classes.summaryText}>
                {s.summaryText}
              </div>
            </Paper>
          ))
        )}
      </DialogContent>

      <DialogActions style={{ padding: "8px 16px" }}>
        <Button onClick={onClose} size="small">
          Fechar
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={handleGenerate}
          disabled={generating}
          startIcon={generating ? <CircularProgress size={16} style={{ color: "#fff" }} /> : <AutoAwesomeIcon />}
          className={classes.generateBtn}
        >
          {generating ? "Gerando..." : "Gerar Novo Resumo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AiSummaryModal;
