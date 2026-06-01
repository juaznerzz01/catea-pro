import React, { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    TextField,
    Tooltip,
    makeStyles,
} from "@material-ui/core";
import { Colorize as EyeDropperIcon, FileCopy as CopyIcon } from "@material-ui/icons";
import { ChromePicker } from "react-color";
import { i18n } from "../../translate/i18n";

const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

const useStyles = makeStyles((theme) => ({
    btnWrapper: {
        position: "relative",
    },
    hexRow: {
        display: "flex",
        alignItems: "center",
        marginTop: 12,
        gap: 8,
    },
    hexInput: {
        flex: 1,
        "& input": {
            fontFamily: "monospace",
            fontSize: 14,
            textTransform: "uppercase",
        },
    },
    colorPreview: {
        width: 28,
        height: 28,
        borderRadius: 4,
        border: "1px solid #ccc",
        flexShrink: 0,
    },
    eyeDropperBtn: {
        marginTop: 12,
        textTransform: "none",
        gap: 6,
    },
}));

const ColorBoxModal = ({ onChange, currentColor, handleClose, open }) => {
    const classes = useStyles();
    const [selectedColor, setSelectedColor] = useState(currentColor);
    const [copied, setCopied] = useState(false);
    const [picking, setPicking] = useState(false);

    useEffect(() => {
        setSelectedColor(currentColor);
    }, [currentColor]);

    const handleOk = () => {
        onChange(selectedColor);
        handleClose();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(selectedColor).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    const handleEyeDropper = async () => {
        if (!hasEyeDropper) return;
        try {
            setPicking(true);
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            setSelectedColor(result.sRGBHex);
        } catch (e) {
            // usuário cancelou (ESC)
        } finally {
            setPicking(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            BackdropProps={{ style: { backgroundColor: "transparent" } }}
            PaperProps={{ style: picking ? { visibility: "hidden" } : {} }}
            style={picking ? { visibility: "hidden" } : {}}
        >
            <DialogTitle>{i18n.t("colorBoxModal.title")}</DialogTitle>
            <DialogContent>
                <ChromePicker
                    disableAlpha={true}
                    color={selectedColor}
                    onChange={(color) => setSelectedColor(color.hex)}
                />

                {hasEyeDropper && (
                    <Button
                        className={classes.eyeDropperBtn}
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={handleEyeDropper}
                    >
                        <EyeDropperIcon fontSize="small" />
                        Capturar cor da tela
                    </Button>
                )}

                <div className={classes.hexRow}>
                    <div
                        className={classes.colorPreview}
                        style={{ backgroundColor: selectedColor }}
                    />
                    <TextField
                        className={classes.hexInput}
                        variant="outlined"
                        size="small"
                        value={selectedColor}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                setSelectedColor(val);
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title={copied ? "Copiado!" : "Copiar cor"} arrow>
                                        <IconButton size="small" onClick={handleCopy}>
                                            <CopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />
                </div>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    {i18n.t("colorBoxModal.buttons.cancel")}
                </Button>
                <Button
                    color="primary"
                    variant="contained"
                    className={classes.btnWrapper}
                    onClick={handleOk}
                >
                    {i18n.t("colorBoxModal.buttons.ok")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ColorBoxModal;
