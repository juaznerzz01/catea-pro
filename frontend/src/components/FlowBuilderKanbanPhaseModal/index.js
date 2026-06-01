import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import api from "../../services/api";
import { Stack } from "@mui/material";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles(theme => ({
    root: { display: "flex", flexWrap: "wrap" },
    btnWrapper: { position: "relative" },
    buttonProgress: {
        color: green[500],
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12
    }
}));

const FlowBuilderKanbanPhaseModal = ({ open, onSave, data, onUpdate, close }) => {
    const classes = useStyles();
    const isMounted = useRef(true);
    const [activeModal, setActiveModal] = useState(false);
    const [phases, setPhases] = useState([]);
    const [selectedPhase, setSelectedPhase] = useState("");
    const [aiTimeoutSeconds, setAiTimeoutSeconds] = useState(0);

    useEffect(() => {
        if (open === "edit") {
            (async () => {
                try {
                    const { data: tagsData } = await api.get("/tags", { params: { kanban: 1 } });
                    const kanbanTags = (tagsData.tags || tagsData || []).filter(t => Number(t.kanban) === 1);
                    setPhases(kanbanTags);
                    const phaseId = data?.data?.id || data?.id;
                    if (phaseId) setSelectedPhase(phaseId);
                    setAiTimeoutSeconds(data?.data?.aiTimeoutSeconds || data?.aiTimeoutSeconds || 0);
                    setActiveModal(true);
                } catch (error) {
                    console.log(error);
                }
            })();
        } else if (open === "create") {
            (async () => {
                try {
                    const { data: tagsData } = await api.get("/tags", { params: { kanban: 1 } });
                    const kanbanTags = (tagsData.tags || tagsData || []).filter(t => Number(t.kanban) === 1);
                    setPhases(kanbanTags);
                    setSelectedPhase("");
                    setAiTimeoutSeconds(0);
                    setActiveModal(true);
                } catch (error) {
                    console.log(error);
                }
            })();
        }
        return () => { isMounted.current = false; };
    }, [open]);

    const handleClose = () => {
        close(null);
        setActiveModal(false);
    };

    const handleSave = () => {
        if (!selectedPhase) {
            return toast.error("Selecione uma fase do Kanban");
        }
        const phase = phases.find(p => p.id === selectedPhase);
        if (open === "edit") {
            onUpdate({ ...data, data: { id: phase.id, name: phase.name, aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0 } });
        } else {
            onSave({ data: { id: phase.id, name: phase.name, aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0 } });
        }
        handleClose();
    };

    return (
        <div className={classes.root}>
            <Dialog open={activeModal} onClose={handleClose} fullWidth="md" scroll="paper">
                <DialogTitle>
                    {open === "create" ? "Adicionar Fase Kanban" : "Editar Fase Kanban"}
                </DialogTitle>
                <Stack>
                    <DialogContent dividers>
                        <Select
                            value={selectedPhase}
                            style={{ width: "95%" }}
                            onChange={(e) => setSelectedPhase(e.target.value)}
                            displayEmpty
                            MenuProps={{
                                anchorOrigin: { vertical: "bottom", horizontal: "left" },
                                transformOrigin: { vertical: "top", horizontal: "left" },
                                getContentAnchorEl: null,
                            }}
                            renderValue={() => {
                                if (!selectedPhase) return "Selecione uma fase...";
                                const p = phases.find(x => x.id === selectedPhase);
                                return p?.name || "";
                            }}
                        >
                            {phases.map((phase) => (
                                <MenuItem key={phase.id} value={phase.id}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{
                                            width: 12, height: 12, borderRadius: "50%",
                                            backgroundColor: phase.color || "#ccc"
                                        }} />
                                        {phase.name}
                                    </div>
                                </MenuItem>
                            ))}
                        </Select>

                        <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#F3EEFF", borderRadius: "8px", border: "1px solid #8b5cf6" }}>
                            <Typography style={{ fontSize: "14px", fontWeight: "bold", color: "#8b5cf6", marginBottom: "8px" }}>
                                Saída IA (tempo para IA assumir)
                            </Typography>
                            <TextField
                                label="Tempo em segundos (0 = desativado)"
                                type="number"
                                variant="outlined"
                                margin="dense"
                                value={aiTimeoutSeconds}
                                onChange={e => setAiTimeoutSeconds(e.target.value)}
                                fullWidth
                                InputProps={{ inputProps: { min: 0 } }}
                                helperText={aiTimeoutSeconds > 0 ? `Se o cliente não responder em ${aiTimeoutSeconds}s, a IA assume o atendimento (saída roxa)` : ""}
                            />
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} color="secondary" variant="outlined">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} color="primary" variant="contained" className={classes.btnWrapper}>
                            {open === "create" ? "Adicionar" : "Salvar"}
                        </Button>
                    </DialogActions>
                </Stack>
            </Dialog>
        </div>
    );
};

export default FlowBuilderKanbanPhaseModal;
