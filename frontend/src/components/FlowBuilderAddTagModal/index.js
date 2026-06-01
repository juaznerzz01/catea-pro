import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Chip from "@material-ui/core/Chip";
import Checkbox from "@material-ui/core/Checkbox";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
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
    },
    chipContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 8,
        padding: 8,
        minHeight: 40,
        backgroundColor: "#f5f5f5",
        borderRadius: 4,
    }
}));

const FlowBuilderAddTagModal = ({ open, onSave, data, onUpdate, close }) => {
    const classes = useStyles();
    const isMounted = useRef(true);
    const [activeModal, setActiveModal] = useState(false);
    const [tags, setTags] = useState([]);
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [aiTimeoutSeconds, setAiTimeoutSeconds] = useState(0);

    useEffect(() => {
        if (open === "edit") {
            (async () => {
                try {
                    const { data: tagsData } = await api.get("/tags", { params: { kanban: 0 } });
                    const regularTags = (tagsData.tags || tagsData || []).filter(t => Number(t.kanban) !== 1);
                    setTags(regularTags);
                    const existingTags = data?.data?.tags || data?.tags || [];
                    setSelectedTagIds(existingTags.map(t => t.id));
                    setAiTimeoutSeconds(data?.data?.aiTimeoutSeconds || 0);
                    setActiveModal(true);
                } catch (error) {
                    console.log(error);
                }
            })();
        } else if (open === "create") {
            (async () => {
                try {
                    const { data: tagsData } = await api.get("/tags", { params: { kanban: 0 } });
                    const regularTags = (tagsData.tags || tagsData || []).filter(t => Number(t.kanban) !== 1);
                    setTags(regularTags);
                    setSelectedTagIds([]);
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

    const handleToggleTag = (tagId) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const handleSave = () => {
        if (selectedTagIds.length === 0) {
            return toast.error("Selecione pelo menos uma tag");
        }
        const selectedTags = selectedTagIds.map(id => {
            const t = tags.find(tag => tag.id === id);
            return { id: t.id, name: t.name, color: t.color };
        });
        if (open === "edit") {
            onUpdate({ ...data, data: { tags: selectedTags, aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0 } });
        } else {
            onSave({ data: { tags: selectedTags, aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0 } });
        }
        handleClose();
    };

    return (
        <div className={classes.root}>
            <Dialog open={activeModal} onClose={handleClose} fullWidth="md" scroll="paper">
                <DialogTitle>
                    {open === "create" ? "Adicionar Tags" : "Editar Tags"}
                </DialogTitle>
                <Stack>
                    <DialogContent dividers>
                        <div className={classes.chipContainer}>
                            {selectedTagIds.length === 0 && (
                                <span style={{ color: "#999", fontSize: 13 }}>Nenhuma tag selecionada</span>
                            )}
                            {selectedTagIds.map(id => {
                                const tag = tags.find(t => t.id === id);
                                return tag ? (
                                    <Chip
                                        key={id}
                                        label={tag.name}
                                        size="small"
                                        onDelete={() => handleToggleTag(id)}
                                        style={{
                                            backgroundColor: tag.color || "#ccc",
                                            color: "#fff",
                                        }}
                                    />
                                ) : null;
                            })}
                        </div>
                        <List dense style={{ maxHeight: 300, overflow: "auto" }}>
                            {tags.map(tag => (
                                <ListItem
                                    key={tag.id}
                                    button
                                    onClick={() => handleToggleTag(tag.id)}
                                    dense
                                >
                                    <ListItemIcon style={{ minWidth: 36 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={selectedTagIds.includes(tag.id)}
                                            size="small"
                                        />
                                    </ListItemIcon>
                                    <div style={{
                                        width: 14, height: 14, borderRadius: "50%",
                                        backgroundColor: tag.color || "#ccc",
                                        marginRight: 8, flexShrink: 0
                                    }} />
                                    <ListItemText primary={tag.name} primaryTypographyProps={{ style: { fontSize: 13 } }} />
                                </ListItem>
                            ))}
                        </List>

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

export default FlowBuilderAddTagModal;
