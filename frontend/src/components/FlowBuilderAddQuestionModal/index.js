import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import { MenuItem, FormControl, InputLabel, Select } from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import { InputAdornment, IconButton } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { i18n } from "../../translate/i18n";
import TextField from "@material-ui/core/TextField";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },

  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
}));

const FlowBuilderAddQuestionModal = ({
  open,
  onSave,
  onUpdate,
  data,
  close,
}) => {
  const classes = useStyles();
  const isMounted = useRef(true);

  const initialState = {
    message: "",
    answerKey: "",
    timeoutSeconds: 0,
  };

  const [message, setMessage] = useState();
  const [activeModal, setActiveModal] = useState(false);
  const [integration, setIntegration] = useState();
  const [timeoutSeconds, setTimeoutSeconds] = useState(0);
  const [aiTimeoutSeconds, setAiTimeoutSeconds] = useState(0);
  const [labels, setLabels] = useState({
    title: i18n.t("flowBuilderConfig.modals.question.addTitle"),
    btn: i18n.t("flowBuilderConfig.buttons.add"),
  });

  useEffect(() => {
    if (open === "edit") {
      setLabels({
        title: i18n.t("flowBuilderConfig.modals.question.editTitle"),
        btn: i18n.t("flowBuilderConfig.buttons.save"),
      });
      console.log("FlowTybebotEdit", data.data.typebotIntegration);
      setMessage(data.data.typebotIntegration.message)
      setTimeoutSeconds(data.data.typebotIntegration.timeoutSeconds || data.data.timeoutSeconds || 0);
      setAiTimeoutSeconds(data.data.typebotIntegration.aiTimeoutSeconds || data.data.aiTimeoutSeconds || 0);
      setIntegration({
        ...data.data.typebotIntegration,
      });
      setActiveModal(true);
    } else if (open === "create") {
      setLabels({
        title: i18n.t("flowBuilderConfig.modals.question.createTitle"),
        btn: i18n.t("flowBuilderConfig.buttons.save"),
      });
      setTimeoutSeconds(0);
      setAiTimeoutSeconds(0);
      setIntegration(initialState);
      setActiveModal(true);
    }

    return () => {
      isMounted.current = false;
    };
  }, [open]);

  const handleClose = () => {
    close(null);
    setActiveModal(false);
  };

  const handleSavePrompt = (values) => {
   

    if (open === "edit") {

      let oldVariable = localStorage.getItem("variables")

      const oldNameKey = data.data.typebotIntegration.answerKey
      
      if(oldVariable){
        oldVariable = JSON.parse(oldVariable)
      }else{
        oldVariable = []
      }
  
      oldVariable = oldVariable.filter(item => item !== oldNameKey)
      localStorage.setItem('variables', JSON.stringify([...oldVariable, values.answerKey]))    

      handleClose();
      onUpdate({
        ...data,
        data: { typebotIntegration: { ...values, message, timeoutSeconds: parseInt(timeoutSeconds) || 0, aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0 }, timeoutSeconds: parseInt(timeoutSeconds) || 0, aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0 },
      });
    } else if (open === "create") {
      
      let oldVariable = localStorage.getItem("variables")

      if(oldVariable){
        oldVariable = JSON.parse(oldVariable)
      }else{
        oldVariable = []
      }
  
      oldVariable = oldVariable.filter(item => item !== values.answerKey)
      localStorage.setItem('variables', JSON.stringify([...oldVariable, values.answerKey]))    

      handleClose();
      onSave({
        typebotIntegration: {
          ...values,
          message,
          timeoutSeconds: parseInt(timeoutSeconds) || 0,
          aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0
        },
        timeoutSeconds: parseInt(timeoutSeconds) || 0,
        aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0,
      });
    }
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={activeModal}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">
          {open === "create" ? i18n.t("flowBuilderConfig.modals.question.addTitle") : i18n.t("flowBuilderConfig.modals.question.editTitle")}
        </DialogTitle>
        <Formik
          initialValues={integration}
          enableReinitialize={true}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSavePrompt(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting, values }) => (
            <Form style={{ width: "100%" }}>
              <DialogContent dividers>
                <TextField
                  label={i18n.t("flowBuilderConfig.modals.question.messageLabel")}
                  multiline
                  minRows={7}
                  name="message"
                  error={touched.message && Boolean(errors.message)}
                  helperText={touched.message && errors.message}
                  variant="outlined"
                  margin="dense"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  fullWidth
                  required
                />
                <Field
                  as={TextField}
                  label={i18n.t("flowBuilderConfig.modals.question.saveAnswer")}
                  name="answerKey"
                  error={touched.answerKey && Boolean(errors.answerKey)}
                  helperText={touched.answerKey && errors.answerKey}
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                />

                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#FFF8F0", borderRadius: "8px", border: "1px solid #E67E22" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#E67E22", marginBottom: "8px" }}>
                    Timeout (sem resposta)
                  </div>
                  <TextField
                    label="Tempo em segundos (0 = desativado)"
                    type="number"
                    variant="outlined"
                    margin="dense"
                    value={timeoutSeconds}
                    onChange={e => setTimeoutSeconds(e.target.value)}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                    helperText={timeoutSeconds > 0 ? `Se o cliente nao responder em ${timeoutSeconds}s, o fluxo segue pelo caminho de timeout (saida amarela)` : ""}
                  />
                </div>

                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#F3EEFF", borderRadius: "8px", border: "1px solid #8b5cf6" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#8b5cf6", marginBottom: "8px" }}>
                    Saída IA (tempo para IA assumir)
                  </div>
                  <TextField
                    label="Tempo em segundos (0 = desativado)"
                    type="number"
                    variant="outlined"
                    margin="dense"
                    value={aiTimeoutSeconds}
                    onChange={e => setAiTimeoutSeconds(e.target.value)}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                    helperText={aiTimeoutSeconds > 0 ? `Se o cliente nao responder em ${aiTimeoutSeconds}s, a IA assume o atendimento (saida roxa)` : ""}
                  />
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  variant="outlined"
                >
                  {i18n.t("contactModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.btnWrapper}
                  disabled={isSubmitting}
                >
                  {open === "create" ? i18n.t("flowBuilderConfig.buttons.add") : i18n.t("flowBuilderConfig.buttons.edit")}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default FlowBuilderAddQuestionModal;
