import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { Stack } from "@mui/material";
import { FormControl, Grid, Paper } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
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
  instructionsAccordion: {
    backgroundColor: theme.palette.type === "dark" ? "#2a2a2a" : "#f5f5f5",
    "&::before": { display: "none" },
    boxShadow: "none",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "8px !important",
    marginTop: theme.spacing(2),
  },
  stepNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: "50%",
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    marginRight: 10,
    flexShrink: 0,
  },
  stepItem: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: 12,
    lineHeight: 1.6,
  },
  codeBlock: {
    backgroundColor: theme.palette.type === "dark" ? "#1a1a1a" : "#e8e8e8",
    padding: "8px 12px",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 12,
    overflowX: "auto",
    marginTop: 4,
    marginBottom: 4,
    wordBreak: "break-all",
  },
  tipBox: {
    backgroundColor: theme.palette.type === "dark" ? "#1a3a1a" : "#e8f5e9",
    border: "1px solid #4caf50",
    borderRadius: 6,
    padding: "8px 12px",
    marginTop: 8,
    fontSize: 13,
  },
}));

const DialogflowSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
});

const FlowBuilderTypebotModal = ({ open, onSave, data, onUpdate, close }) => {
  const classes = useStyles();
  const isMounted = useRef(true);

  const initialState = {
    type: "typebot",
    name: "",
    projectName: "",
    jsonContent: "",
    language: "",
    urlN8N: "",
    typebotDelayMessage: 1000,
    typebotExpires: 1,
    typebotKeywordFinish: "",
    typebotKeywordRestart: "",
    typebotRestartMessage: "",
    typebotSlug: "",
    typebotUnknownMessage: "",
  };
  const [activeModal, setActiveModal] = useState(false);
  const [integration, setIntegration] = useState();
  const [labels, setLabels] = useState({
    title: i18n.t("flowBuilderModals.typebotModal.titleAdd"),
    btn: i18n.t("flowBuilderModals.typebotModal.buttonAdd"),
  });

  useEffect(() => {
    if (open === "edit") {
      setLabels({
        title: i18n.t("flowBuilderModals.typebotModal.titleEdit"),
        btn: i18n.t("flowBuilderModals.typebotModal.buttonEdit"),
      });
      setIntegration({
        ...data.data.typebotIntegration,
      });
      setActiveModal(true);
    } else if (open === "create") {
      setLabels({
        title: i18n.t("flowBuilderModals.typebotModal.titleAdd"),
        btn: i18n.t("flowBuilderModals.typebotModal.buttonAdd"),
      });
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

  const handleSaveDialogFlow = (values) => {
    if (open === "edit") {
      handleClose();
      onUpdate({
        ...data,
        data: { typebotIntegration: { ...values } },
      });
    } else if (open === "create") {
      values.projectName = values.name;
      handleClose();
      onSave({
        typebotIntegration: values,
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
          {labels.title}
        </DialogTitle>
        <Formik
          initialValues={integration}
          enableReinitialize={true}
          validationSchema={DialogflowSchema}
          onSubmit={(values, actions, event) => {
            setTimeout(() => {
              handleSaveDialogFlow(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting, values }) => (
            <Form>
              <Paper square className={classes.mainPaper} elevation={1}>
                <DialogContent dividers>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={6} xl={6}>
                      <Field
                        as={TextField}
                        label={i18n.t("queueIntegrationModal.form.name")}
                        autoFocus
                        name="name"
                        error={touched.name && Boolean(errors.name)}
                        helpertext={touched.name && errors.name}
                        variant="outlined"
                        margin="dense"
                        required
                        fullWidth
                        className={classes.textField}
                      />
                    </Grid>
                    <Grid item xs={12} md={12} xl={12}>
                      <Field
                        as={TextField}
                        label={i18n.t("flowBuilderModals.typebotModal.fields.url")}
                        name="urlN8N"
                        error={touched.urlN8N && Boolean(errors.urlN8N)}
                        helpertext={touched.urlN8N && errors.urlN8N}
                        variant="outlined"
                        margin="dense"
                        required
                        fullWidth
                        className={classes.textField}
                        placeholder="https://typebot.exemplo.com"
                      />
                    </Grid>
                    <Grid item xs={12} md={6} xl={6}>
                      <Field
                        as={TextField}
                        label={i18n.t("flowBuilderModals.typebotModal.fields.slug")}
                        name="typebotSlug"
                        error={touched.typebotSlug && Boolean(errors.typebotSlug)}
                        helpertext={touched.typebotSlug && errors.typebotSlug}
                        required
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        className={classes.textField}
                        placeholder="meu-bot-atendimento"
                      />
                    </Grid>
                    <Grid item xs={12} md={6} xl={6}>
                      <Field
                        as={TextField}
                        label={i18n.t("flowBuilderModals.typebotModal.fields.expires")}
                        name="typebotExpires"
                        type="number"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        className={classes.textField}
                      />
                    </Grid>
                    <Grid item xs={12} md={6} xl={6}>
                      <Field
                        as={TextField}
                        label={i18n.t("flowBuilderModals.typebotModal.fields.delay")}
                        name="typebotDelayMessage"
                        type="number"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        className={classes.textField}
                      />
                    </Grid>
                    <Grid item xs={12} md={6} xl={6}>
                      <Field
                        as={TextField}
                        label={i18n.t("flowBuilderModals.typebotModal.fields.keywordFinish")}
                        name="typebotKeywordFinish"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        className={classes.textField}
                      />
                    </Grid>
                    <Grid item xs={12} md={6} xl={6}>
                      <Field
                        as={TextField}
                        label={i18n.t("flowBuilderModals.typebotModal.fields.keywordRestart")}
                        name="typebotKeywordRestart"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        className={classes.textField}
                      />
                    </Grid>
                    <Grid item xs={12} md={6} xl={6}>
                      <Field
                        as={TextField}
                        label={i18n.t("flowBuilderModals.typebotModal.fields.unknownMessage")}
                        name="typebotUnknownMessage"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        className={classes.textField}
                      />
                    </Grid>
                    <Grid item xs={12} md={12} xl={12}>
                      <Field
                        as={TextField}
                        label={i18n.t("flowBuilderModals.typebotModal.fields.restartMessage")}
                        name="typebotRestartMessage"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        className={classes.textField}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Accordion className={classes.instructionsAccordion}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
                            {i18n.t("flowBuilderModals.typebotModal.instructions.title")}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box style={{ width: "100%" }}>
                            <div className={classes.stepItem}>
                              <span className={classes.stepNumber}>1</span>
                              <Typography variant="body2">
                                {i18n.t("flowBuilderModals.typebotModal.instructions.step1")}
                              </Typography>
                            </div>
                            <div className={classes.stepItem}>
                              <span className={classes.stepNumber}>2</span>
                              <Typography variant="body2">
                                {i18n.t("flowBuilderModals.typebotModal.instructions.step2")}
                              </Typography>
                            </div>
                            <div className={classes.stepItem}>
                              <span className={classes.stepNumber}>3</span>
                              <Typography variant="body2">
                                {i18n.t("flowBuilderModals.typebotModal.instructions.step3")}
                              </Typography>
                            </div>
                            <div className={classes.stepItem}>
                              <span className={classes.stepNumber}>4</span>
                              <Typography variant="body2">
                                {i18n.t("flowBuilderModals.typebotModal.instructions.step4")}
                              </Typography>
                            </div>
                            <div className={classes.stepItem}>
                              <span className={classes.stepNumber}>5</span>
                              <Typography variant="body2">
                                {i18n.t("flowBuilderModals.typebotModal.instructions.step5")}
                              </Typography>
                            </div>

                            <Typography variant="subtitle2" style={{ fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
                              {i18n.t("flowBuilderModals.typebotModal.instructions.variablesTitle")}
                            </Typography>
                            <div className={classes.codeBlock}>
                              {"number"} — {i18n.t("flowBuilderModals.typebotModal.instructions.varNumber")}<br/>
                              {"pushName"} — {i18n.t("flowBuilderModals.typebotModal.instructions.varPushName")}<br/>
                              {"remoteJid"} — {i18n.t("flowBuilderModals.typebotModal.instructions.varRemoteJid")}
                            </div>

                            <Typography variant="subtitle2" style={{ fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
                              {i18n.t("flowBuilderModals.typebotModal.instructions.jsonTitle")}
                            </Typography>
                            <Typography variant="body2" style={{ marginBottom: 8 }}>
                              {i18n.t("flowBuilderModals.typebotModal.instructions.jsonDesc")}
                            </Typography>
                            <div className={classes.codeBlock}>
                              {'#{"stopBot": true}'} — {i18n.t("flowBuilderModals.typebotModal.instructions.jsonStop")}<br/>
                              {'#{"queueId": 1}'} — {i18n.t("flowBuilderModals.typebotModal.instructions.jsonQueue")}<br/>
                              {'#{"queueId": 1, "userId": 5}'} — {i18n.t("flowBuilderModals.typebotModal.instructions.jsonUser")}
                            </div>

                            <div className={classes.tipBox}>
                              <Typography variant="body2">
                                {i18n.t("flowBuilderModals.typebotModal.instructions.tip")}
                              </Typography>
                            </div>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  </Grid>
                </DialogContent>
              </Paper>
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
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {labels.btn}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default FlowBuilderTypebotModal;
