import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack
} from "@mui/material";
import { AddCircle, Delete } from "@mui/icons-material";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1
  },

  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  btnWrapper: {
    position: "relative"
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  }
}));

const selectFieldStyles = {
  ".MuiOutlinedInput-notchedOutline": {
    borderColor: "#909090"
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#000000",
    borderWidth: "thin"
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0000FF",
    borderWidth: "thin"
  }
};


const ContactSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, i18n.t("flowBuilderModals.menuModal.validation.tooShort"))
    .max(50, i18n.t("flowBuilderModals.menuModal.validation.tooLong"))
    .required(i18n.t("flowBuilderModals.menuModal.validation.required")),
  text: Yup.string()
    .min(2, i18n.t("flowBuilderModals.menuModal.validation.tooShort"))
    .max(50, i18n.t("flowBuilderModals.menuModal.validation.tooLong"))
    .required(i18n.t("flowBuilderModals.menuModal.validation.messageRequired"))
});

const FlowBuilderMenuModal = ({ open, onSave, onUpdate, data, close }) => {
  const classes = useStyles();
  const isMounted = useRef(true);

  const [activeModal, setActiveModal] = useState(false);

  const [rule, setRule] = useState();

  const [textDig, setTextDig] = useState();

  const [arrayOption, setArrayOption] = useState([]);

  const [timeoutSeconds, setTimeoutSeconds] = useState(0);
  const [aiTimeoutSeconds, setAiTimeoutSeconds] = useState(0);

  const [invalidOptionMessage, setInvalidOptionMessage] = useState("");

  const [labels, setLabels] = useState({
    title: i18n.t("flowBuilderModals.menuModal.titleAdd"),
    btn: i18n.t("flowBuilderModals.menuModal.buttonAdd")
  });

  useEffect(() => {
    if (open === "edit") {
      setLabels({
        title: i18n.t("flowBuilderModals.menuModal.titleEdit"),
        btn: i18n.t("flowBuilderModals.menuModal.buttonSave")
      });
      setTextDig(data.data.message);
      setArrayOption(data.data.arrayOption);
      setTimeoutSeconds(data.data.timeoutSeconds || 0);
      setAiTimeoutSeconds(data.data.aiTimeoutSeconds || 0);
      setInvalidOptionMessage(data.data.invalidOptionMessage || "");
      setActiveModal(true);
    } else if (open === "create") {
      setLabels({
        title: i18n.t("flowBuilderModals.menuModal.titleAdd"),
        btn: i18n.t("flowBuilderModals.menuModal.buttonAdd")
      });
      setTextDig();
      setArrayOption([]);
      setTimeoutSeconds(0);
      setAiTimeoutSeconds(0);
      setInvalidOptionMessage("");
      setActiveModal(true);
    } else {
      setActiveModal(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleClose = () => {
    close(null);
    setActiveModal(false);
  };

  const handleSaveContact = async () => {
    if (open === "edit") {
      handleClose();
      onUpdate({
        ...data,
        data: { message: textDig, arrayOption: arrayOption, timeoutSeconds: parseInt(timeoutSeconds) || 0, aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0, invalidOptionMessage: invalidOptionMessage }
      });
      return;
    } else if (open === "create") {
      handleClose();
      onSave({
        message: textDig,
        arrayOption: arrayOption,
        timeoutSeconds: parseInt(timeoutSeconds) || 0,
        aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0,
        invalidOptionMessage: invalidOptionMessage
      });
    }
  };

  const removeOption = number => {
    setArrayOption(old => old.filter(item => item.number !== number));
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={activeModal}
        onClose={handleClose}
        fullWidth="md"
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">{labels.title}</DialogTitle>
        <Stack>
          <Stack dividers style={{ gap: "8px", padding: "16px" }}>
            <TextField
              label={i18n.t("flowBuilderModals.menuModal.fields.explanationMessage")}
              minRows={4}
              name="text"
              multiline
              variant="outlined"
              value={textDig}
              onChange={e => setTextDig(e.target.value)}
              className={classes.textField}
              style={{ width: "100%" }}
            />
            <Stack direction={"row"} justifyContent={"space-between"}>
              <Typography>{i18n.t("flowBuilderModals.menuModal.fields.addOption")}</Typography>
              <Button
                onClick={() =>
                  setArrayOption(old => [
                    ...old,
                    { number: old.length + 1, value: "" }
                  ])
                }
                color="primary"
                variant="contained"
              >
                <AddCircle />
              </Button>
            </Stack>
            {arrayOption.map((item, index) => (
              <Stack width={"100%"} key={item.number}>
                <Typography>{i18n.t("flowBuilderModals.menuModal.fields.typeOption", { number: item.number })}</Typography>
                <Stack direction={"row"} width={"100%"} style={{ gap: "8px" }}>
                  <TextField
                    placeholder={i18n.t("flowBuilderModals.menuModal.fields.optionPlaceholder")}
                    variant="outlined"
                    defaultValue={item.value}
                    style={{ width: "100%" }}
                    onChange={event =>
                      setArrayOption(old => {
                        let newArr = old;
                        newArr[index].value = event.target.value;
                        return newArr;
                      })
                    }
                  />
                  {arrayOption.length === item.number && (
                    <IconButton onClick={() => removeOption(item.number)}>
                      <Delete />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
            ))}

            <Stack style={{ marginTop: "16px", padding: "12px", backgroundColor: "#FFF0F0", borderRadius: "8px", border: "1px solid #E74C3C" }}>
              <Typography style={{ fontSize: "14px", fontWeight: "bold", color: "#E74C3C", marginBottom: "8px" }}>
                {i18n.t("flowBuilderModals.menuModal.invalidOption.title")}
              </Typography>
              <TextField
                label={i18n.t("flowBuilderModals.menuModal.invalidOption.messageLabel")}
                minRows={2}
                multiline
                variant="outlined"
                value={invalidOptionMessage}
                onChange={e => setInvalidOptionMessage(e.target.value)}
                style={{ width: "100%" }}
                placeholder={i18n.t("flowBuilderModals.menuModal.invalidOption.placeholder")}
                helperText={i18n.t("flowBuilderModals.menuModal.invalidOption.helperText")}
              />
            </Stack>

            <Stack style={{ marginTop: "16px", padding: "12px", backgroundColor: "#FFF8F0", borderRadius: "8px", border: "1px solid #E67E22" }}>
              <Typography style={{ fontSize: "14px", fontWeight: "bold", color: "#E67E22", marginBottom: "8px" }}>
                {i18n.t("flowBuilderModals.menuModal.timeout.title")}
              </Typography>
              <TextField
                label={i18n.t("flowBuilderModals.menuModal.timeout.label")}
                type="number"
                variant="outlined"
                value={timeoutSeconds}
                onChange={e => setTimeoutSeconds(e.target.value)}
                style={{ width: "100%" }}
                InputProps={{ inputProps: { min: 0 } }}
                helperText={timeoutSeconds > 0 ? i18n.t("flowBuilderModals.menuModal.timeout.helperText", { seconds: timeoutSeconds }) : ""}
              />
            </Stack>

            <Stack style={{ marginTop: "16px", padding: "12px", backgroundColor: "#F3EEFF", borderRadius: "8px", border: "1px solid #8b5cf6" }}>
              <Typography style={{ fontSize: "14px", fontWeight: "bold", color: "#8b5cf6", marginBottom: "8px" }}>
                Saída IA (tempo para IA assumir)
              </Typography>
              <TextField
                label="Tempo em segundos (0 = desativado)"
                type="number"
                variant="outlined"
                value={aiTimeoutSeconds}
                onChange={e => setAiTimeoutSeconds(e.target.value)}
                style={{ width: "100%" }}
                InputProps={{ inputProps: { min: 0 } }}
                helperText={aiTimeoutSeconds > 0 ? `Se o cliente não responder em ${aiTimeoutSeconds}s, a IA assume o atendimento (saída roxa)` : ""}
              />
            </Stack>
          </Stack>
          <DialogActions>
            <Button onClick={handleClose} color="secondary" variant="outlined">
              {i18n.t("contactModal.buttons.cancel")}
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              className={classes.btnWrapper}
              onClick={() => handleSaveContact()}
            >
              {`${labels.btn}`}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </div>
  );
};

export default FlowBuilderMenuModal;
