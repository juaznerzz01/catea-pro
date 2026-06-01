import React, { useState, useEffect } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import {
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Select,
  InputLabel,
  MenuItem,
  FormControl,
  TextField,
  Grid,
  Paper,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4
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
  btnLeft: {
    display: "flex",
    marginRight: "auto",
    marginLeft: 12,
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },
  instructionsBox: {
    marginTop: theme.spacing(2),
  },
  instructionsAccordion: {
    backgroundColor: theme.palette.type === "dark" ? "#2a2a2a" : "#f5f5f5",
    "&::before": { display: "none" },
    boxShadow: "none",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "8px !important",
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
    .min(2, i18n.t("validation.tooShort"))
    .max(50, i18n.t("validation.tooLong"))
    .required(i18n.t("validation.required")),
  // projectName: Yup.string()
  //   .min(3, "Too Short!")
  //   .max(100, "Too Long!")
  //   .required(),
  // jsonContent: Yup.string().min(3, "Too Short!").required(),
  // language: Yup.string().min(2, "Too Short!").max(50, "Too Long!").required(),
});



const QueueIntegration = ({ open, onClose, integrationId }) => {
  const classes = useStyles();

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

  const [integration, setIntegration] = useState(initialState);

  useEffect(() => {
    (async () => {
      if (!integrationId) return;
      try {
        const { data } = await api.get(`/queueIntegration/${integrationId}`);
        setIntegration((prevState) => {
          return { ...prevState, ...data };
        });
      } catch (err) {
        toastError(err);
      }
    })();

    return () => {
      setIntegration({
        type: "dialogflow",
        name: "",
        projectName: "",
        jsonContent: "",
        language: "",
        urlN8N: "",
        typebotDelayMessage: 1000
      });
    };

  }, [integrationId, open]);

  const handleClose = () => {
    onClose();
    setIntegration(initialState);
  };

  const handleTestSession = async (event, values) => {
    try {
      const { projectName, jsonContent, language } = values;

      await api.post(`/queueIntegration/testSession`, {
        projectName,
        jsonContent,
        language,
      });

      toast.success(i18n.t("queueIntegrationModal.messages.testSuccess"));
    } catch (err) {
      toastError(err);
    }
  };

  const handleSaveDialogflow = async (values) => {

    try {
      if (values.type === 'n8n' || values.type === 'webhook' || values.type === 'typebot' || values.type === "flowbuilder") values.projectName = values.name
      if (integrationId) {
        await api.put(`/queueIntegration/${integrationId}`, values);
        toast.success(i18n.t("queueIntegrationModal.messages.editSuccess"));
      } else {
        await api.post("/queueIntegration", values);
        toast.success(i18n.t("queueIntegrationModal.messages.addSuccess"));
      }
      handleClose();
    } catch (err) {
      toastError(err);
    }


  };

  return (
    <div className={classes.root}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle>
          {integrationId
            ? `${i18n.t("queueIntegrationModal.title.edit")}`
            : `${i18n.t("queueIntegrationModal.title.add")}`}
        </DialogTitle>
        <Formik
          initialValues={integration}
          enableReinitialize={true}
          validationSchema={DialogflowSchema}
          onSubmit={(values, actions, event) => {
            setTimeout(() => {
              handleSaveDialogflow(values);
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
                      <FormControl
                        variant="outlined"
                        className={classes.formControl}
                        margin="dense"
                        fullWidth
                      >
                        <InputLabel id="type-selection-input-label">
                          {i18n.t("queueIntegrationModal.form.type")}
                        </InputLabel>

                        <Field
                          as={Select}
                          label={i18n.t("queueIntegrationModal.form.type")}
                          name="type"
                          labelId="profile-selection-label"
                          error={touched.type && Boolean(errors.type)}
                          helpertext={touched.type && errors.type}
                          id="type"
                          required
                        >
                          <MenuItem value="dialogflow">DialogFlow</MenuItem>
                          <MenuItem value="n8n">N8N</MenuItem>
                          <MenuItem value="webhook">WebHooks</MenuItem>
                          <MenuItem value="typebot">Typebot</MenuItem>
                          <MenuItem value="flowbuilder">Flowbuilder</MenuItem>
                        </Field>
                      </FormControl>
                    </Grid>
                    {values.type === "dialogflow" && (
                      <>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.name")}
                            autoFocus
                            name="name"
                            fullWidth
                            error={touched.name && Boolean(errors.name)}
                            helpertext={touched.name && errors.name}
                            variant="outlined"
                            margin="dense"
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <FormControl
                            variant="outlined"
                            className={classes.formControl}
                            margin="dense"
                            fullWidth
                          >
                            <InputLabel id="language-selection-input-label">
                              {i18n.t("queueIntegrationModal.form.language")}
                            </InputLabel>

                            <Field
                              as={Select}
                              label={i18n.t("queueIntegrationModal.form.language")}
                              name="language"
                              labelId="profile-selection-label"
                              fullWidth
                              error={touched.language && Boolean(errors.language)}
                              helpertext={touched.language && errors.language}
                              id="language-selection"
                              required
                            >
                              <MenuItem value="pt-BR">{i18n.t("queueIntegrationModal.languages.pt-BR")}</MenuItem>
                              <MenuItem value="en">{i18n.t("queueIntegrationModal.languages.en")}</MenuItem>
                              <MenuItem value="es">{i18n.t("queueIntegrationModal.languages.es")}</MenuItem>
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.projectName")}
                            name="projectName"
                            error={touched.projectName && Boolean(errors.projectName)}
                            helpertext={touched.projectName && errors.projectName}
                            fullWidth
                            variant="outlined"
                            margin="dense"
                          />
                        </Grid>
                        <Grid item xs={12} md={12} xl={12} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.jsonContent")}
                            type="jsonContent"
                            multiline
                            //inputRef={greetingRef}
                            maxRows={5}
                            minRows={5}
                            fullWidth
                            name="jsonContent"
                            error={touched.jsonContent && Boolean(errors.jsonContent)}
                            helpertext={touched.jsonContent && errors.jsonContent}
                            variant="outlined"
                            margin="dense"
                          />
                        </Grid>
                      </>
                    )}

                    {(values.type === "n8n" || values.type === "webhook") && (
                      <>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.name")}
                            autoFocus
                            required
                            name="name"
                            error={touched.name && Boolean(errors.name)}
                            helpertext={touched.name && errors.name}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={12} xl={12} >
                          <Field
                            as={TextField}
                            label={values.type === "n8n"
                              ? i18n.t("queueIntegrationModal.form.urlN8NWebhook")
                              : i18n.t("queueIntegrationModal.form.urlN8N")}
                            name="urlN8N"
                            error={touched.urlN8N && Boolean(errors.urlN8N)}
                            helpertext={touched.urlN8N && errors.urlN8N}
                            variant="outlined"
                            margin="dense"
                            required
                            fullWidth
                            className={classes.textField}
                            placeholder="https://seu-n8n.com/webhook/abc123"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Box className={classes.instructionsBox}>
                            <Accordion className={classes.instructionsAccordion}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
                                  {values.type === "n8n"
                                    ? i18n.t("queueIntegrationModal.instructions.n8nTitle")
                                    : i18n.t("queueIntegrationModal.instructions.webhookTitle")}
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Box style={{ width: "100%" }}>
                                  {values.type === "n8n" ? (
                                    <>
                                      <div className={classes.stepItem}>
                                        <span className={classes.stepNumber}>1</span>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.n8nStep1")}
                                        </Typography>
                                      </div>
                                      <div className={classes.stepItem}>
                                        <span className={classes.stepNumber}>2</span>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.n8nStep2")}
                                        </Typography>
                                      </div>
                                      <div className={classes.stepItem}>
                                        <span className={classes.stepNumber}>3</span>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.n8nStep3")}
                                        </Typography>
                                      </div>
                                      <div className={classes.stepItem}>
                                        <span className={classes.stepNumber}>4</span>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.n8nStep4")}
                                        </Typography>
                                      </div>
                                      <div className={classes.stepItem}>
                                        <span className={classes.stepNumber}>5</span>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.n8nStep5")}
                                        </Typography>
                                      </div>

                                      <Typography variant="subtitle2" style={{ fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
                                        {i18n.t("queueIntegrationModal.instructions.n8nDataTitle")}
                                      </Typography>
                                      <div className={classes.codeBlock}>
                                        {"{"}<br/>
                                        &nbsp;&nbsp;{"\"message\": { \"text\": \"...\", \"type\": \"conversation\" },"}<br/>
                                        &nbsp;&nbsp;{"\"contact\": { \"name\": \"...\", \"number\": \"5511...\" },"}<br/>
                                        &nbsp;&nbsp;{"\"ticket\": { \"id\": 123, \"status\": \"pending\" },"}<br/>
                                        &nbsp;&nbsp;{"\"apiToken\": \"token-para-responder\","}<br/>
                                        &nbsp;&nbsp;{"\"apiUrl\": \"https://seu-backend.com\""}<br/>
                                        {"}"}
                                      </div>

                                      <Typography variant="subtitle2" style={{ fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
                                        {i18n.t("queueIntegrationModal.instructions.n8nReplyTitle")}
                                      </Typography>
                                      <div className={classes.stepItem}>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.n8nReplyOption1")}
                                        </Typography>
                                      </div>
                                      <div className={classes.codeBlock}>
                                        {"{ \"reply\": \"Sua resposta aqui\" }"}
                                      </div>
                                      <div className={classes.stepItem}>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.n8nReplyOption2")}
                                        </Typography>
                                      </div>
                                      <div className={classes.codeBlock}>
                                        {"POST {{ apiUrl }}/api/messages/send"}<br/>
                                        {"Authorization: Bearer {{ apiToken }}"}<br/>
                                        {"{ \"number\": \"5511...\", \"body\": \"Resposta\" }"}
                                      </div>

                                      <div className={classes.tipBox}>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.n8nTip")}
                                        </Typography>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className={classes.stepItem}>
                                        <span className={classes.stepNumber}>1</span>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.webhookStep1")}
                                        </Typography>
                                      </div>
                                      <div className={classes.stepItem}>
                                        <span className={classes.stepNumber}>2</span>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.webhookStep2")}
                                        </Typography>
                                      </div>
                                      <div className={classes.stepItem}>
                                        <span className={classes.stepNumber}>3</span>
                                        <Typography variant="body2">
                                          {i18n.t("queueIntegrationModal.instructions.webhookStep3")}
                                        </Typography>
                                      </div>
                                    </>
                                  )}
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                          </Box>
                        </Grid>
                      </>
                    )}

                    {(values.type === "flowbuilder") && (
                      <Grid item xs={12} md={6} xl={6} >
                        <Field
                          as={TextField}
                          label={i18n.t("queueIntegrationModal.form.name")}
                          autoFocus
                          name="name"
                          fullWidth
                          error={touched.name && Boolean(errors.name)}
                          helpertext={touched.name && errors.name}
                          variant="outlined"
                          margin="dense"
                          className={classes.textField}
                        />
                      </Grid>
                    )}
                    {(values.type === "typebot") && (
                      <>
                        <Grid item xs={12} md={6} xl={6} >
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
                        <Grid item xs={12} md={12} xl={12} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.urlN8N")}
                            name="urlN8N"
                            error={touched.urlN8N && Boolean(errors.urlN8N)}
                            helpertext={touched.urlN8N && errors.urlN8N}
                            variant="outlined"
                            margin="dense"
                            required
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotSlug")}
                            name="typebotSlug"
                            error={touched.typebotSlug && Boolean(errors.typebotSlug)}
                            helpertext={touched.typebotSlug && errors.typebotSlug}
                            required
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotExpires")}
                            name="typebotExpires"
                            error={touched.typebotExpires && Boolean(errors.typebotExpires)}
                            helpertext={touched.typebotExpires && errors.typebotExpires}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotDelayMessage")}
                            name="typebotDelayMessage"
                            error={touched.typebotDelayMessage && Boolean(errors.typebotDelayMessage)}
                            helpertext={touched.typebotDelayMessage && errors.typebotDelayMessage}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotKeywordFinish")}
                            name="typebotKeywordFinish"
                            error={touched.typebotKeywordFinish && Boolean(errors.typebotKeywordFinish)}
                            helpertext={touched.typebotKeywordFinish && errors.typebotKeywordFinish}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotKeywordRestart")}
                            name="typebotKeywordRestart"
                            error={touched.typebotKeywordRestart && Boolean(errors.typebotKeywordRestart)}
                            helpertext={touched.typebotKeywordRestart && errors.typebotKeywordRestart}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={6} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotUnknownMessage")}
                            name="typebotUnknownMessage"
                            error={touched.typebotUnknownMessage && Boolean(errors.typebotUnknownMessage)}
                            helpertext={touched.typebotUnknownMessage && errors.typebotUnknownMessage}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>
                        <Grid item xs={12} md={12} xl={12} >
                          <Field
                            as={TextField}
                            label={i18n.t("queueIntegrationModal.form.typebotRestartMessage")}
                            name="typebotRestartMessage"
                            error={touched.typebotRestartMessage && Boolean(errors.typebotRestartMessage)}
                            helpertext={touched.typebotRestartMessage && errors.typebotRestartMessage}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                          />
                        </Grid>

                      </>
                    )}
                  </Grid>
                </DialogContent>
              </Paper>

              <DialogActions>
                {values.type === "dialogflow" && (
                  <Button
                    //type="submit"
                    onClick={(e) => handleTestSession(e, values)}
                    color="inherit"
                    disabled={isSubmitting}
                    name="testSession"
                    variant="outlined"
                    className={classes.btnLeft}
                  >
                    {i18n.t("queueIntegrationModal.buttons.test")}
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("queueIntegrationModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {integrationId
                    ? `${i18n.t("queueIntegrationModal.buttons.okEdit")}`
                    : `${i18n.t("queueIntegrationModal.buttons.okAdd")}`}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div >
  );
};

export default QueueIntegration;