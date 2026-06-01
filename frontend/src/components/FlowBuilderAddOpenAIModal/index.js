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
import {
  MenuItem, FormControl, InputLabel, Select,
  InputAdornment, IconButton, Box, Typography,
  Accordion, AccordionSummary, AccordionDetails, Grid,
} from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { i18n } from "../../translate/i18n";

// Apenas modelos OpenAI GPT
const allowedModels = [
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-3.5-turbo-1106",
];

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
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
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
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
  tipBox: {
    backgroundColor: theme.palette.type === "dark" ? "#1a3a1a" : "#e8f5e9",
    border: "1px solid #4caf50",
    borderRadius: 6,
    padding: "8px 12px",
    marginTop: 8,
    fontSize: 13,
  },
}));

// Esquema de validação alinhado com o backend
const DialogflowSchema = Yup.object().shape({
  name: Yup.string()
    .min(5, i18n.t("flowBuilderConfig.validation.tooShort"))
    .max(100, i18n.t("flowBuilderConfig.validation.tooLong"))
    .required(i18n.t("flowBuilderConfig.validation.required")),
  prompt: Yup.string()
    .min(50, i18n.t("flowBuilderConfig.validation.tooShort"))
    .required(i18n.t("flowBuilderConfig.validation.describeAiTraining")),
  model: Yup.string()
    .oneOf(allowedModels, i18n.t("flowBuilderConfig.validation.invalidModel"))
    .required(i18n.t("flowBuilderConfig.validation.informModel")),
  maxTokens: Yup.number()
    .min(10, i18n.t("flowBuilderConfig.validation.minTokens"))
    .max(4096, i18n.t("flowBuilderConfig.validation.maxTokens"))
    .required(i18n.t("flowBuilderConfig.validation.informMaxTokens")),
  temperature: Yup.number()
    .min(0, i18n.t("flowBuilderConfig.validation.minZero"))
    .max(1, i18n.t("flowBuilderConfig.validation.maxOne"))
    .required(i18n.t("flowBuilderConfig.validation.informTemperature")),
  apiKey: Yup.string().required(i18n.t("flowBuilderConfig.validation.informApiKey")),
  maxMessages: Yup.number()
    .min(1, i18n.t("flowBuilderConfig.validation.minOneMessage"))
    .max(50, i18n.t("flowBuilderConfig.validation.maxFiftyMessages"))
    .required(i18n.t("flowBuilderConfig.validation.informMaxMessages")),
  voice: Yup.string().when("model", {
    is: "gpt-3.5-turbo-1106",
    then: Yup.string().required(i18n.t("flowBuilderConfig.validation.informVoiceMode")),
    otherwise: Yup.string().notRequired(),
  }),
  voiceKey: Yup.string().notRequired(),
  voiceRegion: Yup.string().notRequired(),
});

const FlowBuilderOpenAIModal = ({ open, onSave, data, onUpdate, close }) => {
  const classes = useStyles();
  const isMounted = useRef(true);

  const initialState = {
    name: "",
    prompt: "",
    model: "gpt-4o-mini",
    voice: i18n.t("flowBuilderConfig.voice.text"),
    voiceKey: "",
    voiceRegion: "",
    maxTokens: 100,
    temperature: 1,
    apiKey: "",
    maxMessages: 10,
  };

  const [showApiKey, setShowApiKey] = useState(false);
  const [integration, setIntegration] = useState(initialState);
  const [labels, setLabels] = useState({
    title: i18n.t("flowBuilderConfig.modals.openai.addTitle"),
    btn: i18n.t("flowBuilderConfig.buttons.add"),
  });

  useEffect(() => {
    if (open === "edit") {
      setLabels({
        title: i18n.t("flowBuilderConfig.modals.openai.editTitle"),
        btn: i18n.t("flowBuilderConfig.buttons.save"),
      });
      const typebotIntegration = data?.data?.typebotIntegration || {};
      setIntegration({
        ...initialState,
        ...typebotIntegration,
        model: allowedModels.includes(typebotIntegration.model)
          ? typebotIntegration.model
          : "gpt-4o-mini",
      });
    } else if (open === "create") {
      setLabels({
        title: i18n.t("flowBuilderConfig.modals.openai.addTitle"),
        btn: i18n.t("flowBuilderConfig.buttons.add"),
      });
      setIntegration(initialState);
    }

    return () => {
      isMounted.current = false;
    };
  }, [open, data]);

  const handleClose = () => {
    close(null);
  };

  const handleSavePrompt = (values, { setSubmitting }) => {
    const promptData = {
      ...values,
      voice: values.model === "gpt-3.5-turbo-1106" ? values.voice : i18n.t("flowBuilderConfig.voice.text"),
    };

    if (open === "edit") {
      onUpdate({
        ...data,
        data: { typebotIntegration: promptData },
      });
    } else if (open === "create") {
      promptData.projectName = promptData.name;
      onSave({
        typebotIntegration: promptData,
      });
    }
    handleClose();
    setSubmitting(false);
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={open === "create" || open === "edit"}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">{labels.title}</DialogTitle>
        <Formik
          initialValues={integration}
          enableReinitialize={true}
          validationSchema={DialogflowSchema}
          onSubmit={handleSavePrompt}
        >
          {({ touched, errors, isSubmitting, values, setFieldValue }) => (
            <Form style={{ width: "100%" }}>
              <DialogContent dividers>
                <Field
                  as={TextField}
                  label={i18n.t("promptModal.form.name")}
                  name="name"
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                />
                <FormControl fullWidth margin="dense" variant="outlined">
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.apikey")}
                    name="apiKey"
                    type={showApiKey ? "text" : "password"}
                    error={touched.apiKey && Boolean(errors.apiKey)}
                    helperText={touched.apiKey && errors.apiKey}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
                <Field
                  as={TextField}
                  label={i18n.t("promptModal.form.prompt")}
                  name="prompt"
                  error={touched.prompt && Boolean(errors.prompt)}
                  helperText={touched.prompt && errors.prompt}
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                  minRows={10}
                  multiline
                />
                <div className={classes.multFieldLine}>
                  <FormControl
                    fullWidth
                    margin="dense"
                    variant="outlined"
                    error={touched.model && Boolean(errors.model)}
                  >
                    <InputLabel>{i18n.t("promptModal.form.model")}</InputLabel>
                    <Field
                      as={Select}
                      label={i18n.t("promptModal.form.model")}
                      name="model"
                      onChange={(e) => {
                        setFieldValue("model", e.target.value);
                        if (e.target.value !== "gpt-3.5-turbo-1106") {
                          setFieldValue("voice", i18n.t("flowBuilderConfig.voice.text"));
                        }
                      }}
                    >
                      {allowedModels.map((model) => (
                        <MenuItem key={model} value={model}>
                          {i18n.t(`promptModal.models.${model}`, { defaultValue: model })}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.model && errors.model && (
                      <div style={{ color: "red", fontSize: "12px" }}>
                        {errors.model}
                      </div>
                    )}
                  </FormControl>
                  <FormControl
                    fullWidth
                    margin="dense"
                    variant="outlined"
                    disabled={values.model !== "gpt-3.5-turbo-1106"}
                    error={touched.voice && Boolean(errors.voice)}
                  >
                    <InputLabel>{i18n.t("promptModal.form.voice")}</InputLabel>
                    <Field
                      as={Select}
                      label={i18n.t("promptModal.form.voice")}
                      name="voice"
                    >
                      <MenuItem value="texto">{i18n.t("flowBuilderConfig.voice.text")}</MenuItem>
                      <MenuItem value="pt-BR-FranciscaNeural">{i18n.t("flowBuilderConfig.voice.francisca")}</MenuItem>
                      <MenuItem value="pt-BR-AntonioNeural">{i18n.t("flowBuilderConfig.voice.antonio")}</MenuItem>
                      <MenuItem value="pt-BR-BrendaNeural">{i18n.t("flowBuilderConfig.voice.brenda")}</MenuItem>
                      <MenuItem value="pt-BR-DonatoNeural">{i18n.t("flowBuilderConfig.voice.donato")}</MenuItem>
                      <MenuItem value="pt-BR-ElzaNeural">{i18n.t("flowBuilderConfig.voice.elza")}</MenuItem>
                      <MenuItem value="pt-BR-FabioNeural">{i18n.t("flowBuilderConfig.voice.fabio")}</MenuItem>
                      <MenuItem value="pt-BR-GiovannaNeural">{i18n.t("flowBuilderConfig.voice.giovanna")}</MenuItem>
                      <MenuItem value="pt-BR-HumbertoNeural">{i18n.t("flowBuilderConfig.voice.humberto")}</MenuItem>
                      <MenuItem value="pt-BR-JulioNeural">{i18n.t("flowBuilderConfig.voice.julio")}</MenuItem>
                      <MenuItem value="pt-BR-LeilaNeural">{i18n.t("flowBuilderConfig.voice.leila")}</MenuItem>
                      <MenuItem value="pt-BR-LeticiaNeural">{i18n.t("flowBuilderConfig.voice.leticia")}</MenuItem>
                      <MenuItem value="pt-BR-ManuelaNeural">{i18n.t("flowBuilderConfig.voice.manuela")}</MenuItem>
                      <MenuItem value="pt-BR-NicolauNeural">{i18n.t("flowBuilderConfig.voice.nicolau")}</MenuItem>
                      <MenuItem value="pt-BR-ValerioNeural">{i18n.t("flowBuilderConfig.voice.valerio")}</MenuItem>
                      <MenuItem value="pt-BR-YaraNeural">{i18n.t("flowBuilderConfig.voice.yara")}</MenuItem>
                    </Field>
                    {touched.voice && errors.voice && (
                      <div style={{ color: "red", fontSize: "12px" }}>
                        {errors.voice}
                      </div>
                    )}
                  </FormControl>
                </div>
                <div className={classes.multFieldLine}>
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.voiceKey")}
                    name="voiceKey"
                    error={touched.voiceKey && Boolean(errors.voiceKey)}
                    helperText={touched.voiceKey && errors.voiceKey}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    disabled={values.model !== "gpt-3.5-turbo-1106"}
                  />
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.voiceRegion")}
                    name="voiceRegion"
                    error={touched.voiceRegion && Boolean(errors.voiceRegion)}
                    helperText={touched.voiceRegion && errors.voiceRegion}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    disabled={values.model !== "gpt-3.5-turbo-1106"}
                  />
                </div>
                <div className={classes.multFieldLine}>
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.temperature")}
                    name="temperature"
                    error={touched.temperature && Boolean(errors.temperature)}
                    helperText={touched.temperature && errors.temperature}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    type="number"
                    inputProps={{
                      step: "0.1",
                      min: "0",
                      max: "1",
                    }}
                  />
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.max_tokens")}
                    name="maxTokens"
                    error={touched.maxTokens && Boolean(errors.maxTokens)}
                    helperText={touched.maxTokens && errors.maxTokens}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    type="number"
                  />
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.max_messages")}
                    name="maxMessages"
                    error={touched.maxMessages && Boolean(errors.maxMessages)}
                    helperText={touched.maxMessages && errors.maxMessages}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    type="number"
                  />
                </div>
                <Grid item xs={12}>
                  <Accordion className={classes.instructionsAccordion}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
                        {i18n.t("flowBuilderModals.openaiModal.instructions.title")}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box style={{ width: "100%" }}>
                        <div className={classes.stepItem}>
                          <span className={classes.stepNumber}>1</span>
                          <Typography variant="body2">
                            {i18n.t("flowBuilderModals.openaiModal.instructions.step1")}
                          </Typography>
                        </div>
                        <div className={classes.stepItem}>
                          <span className={classes.stepNumber}>2</span>
                          <Typography variant="body2">
                            {i18n.t("flowBuilderModals.openaiModal.instructions.step2")}
                          </Typography>
                        </div>
                        <div className={classes.stepItem}>
                          <span className={classes.stepNumber}>3</span>
                          <Typography variant="body2">
                            {i18n.t("flowBuilderModals.openaiModal.instructions.step3")}
                          </Typography>
                        </div>
                        <div className={classes.stepItem}>
                          <span className={classes.stepNumber}>4</span>
                          <Typography variant="body2">
                            {i18n.t("flowBuilderModals.openaiModal.instructions.step4")}
                          </Typography>
                        </div>
                        <div className={classes.stepItem}>
                          <span className={classes.stepNumber}>5</span>
                          <Typography variant="body2">
                            {i18n.t("flowBuilderModals.openaiModal.instructions.step5")}
                          </Typography>
                        </div>

                        <Typography variant="subtitle2" style={{ fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
                          {i18n.t("flowBuilderModals.openaiModal.instructions.promptTipTitle")}
                        </Typography>
                        <Typography variant="body2">
                          {i18n.t("flowBuilderModals.openaiModal.instructions.promptTip")}
                        </Typography>

                        <div className={classes.tipBox}>
                          <Typography variant="body2">
                            {i18n.t("flowBuilderModals.openaiModal.instructions.tip")}
                          </Typography>
                        </div>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  variant="outlined"
                  disabled={isSubmitting}
                >
                  {i18n.t("promptModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.btnWrapper}
                  disabled={isSubmitting}
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

export default FlowBuilderOpenAIModal;