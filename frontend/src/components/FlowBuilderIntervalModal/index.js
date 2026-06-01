import React, { useState, useEffect, useRef } from "react";

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
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Checkbox from "@material-ui/core/Checkbox";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Box from "@material-ui/core/Box";

import { i18n } from "../../translate/i18n";
import { Stack } from "@mui/material";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1
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
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  businessHoursSection: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.02)"
  },
  daysRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1)
  },
  timeRow: {
    display: "flex",
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  }
}));

const getUnitOptions = () => [
  { value: "seconds", label: i18n.t("flowBuilderModals.intervalModal.fields.unitSeconds") },
  { value: "minutes", label: i18n.t("flowBuilderModals.intervalModal.fields.unitMinutes") },
  { value: "hours", label: i18n.t("flowBuilderModals.intervalModal.fields.unitHours") },
  { value: "days", label: i18n.t("flowBuilderModals.intervalModal.fields.unitDays") }
];

const MAX_VALUES = {
  seconds: 120,
  minutes: 120,
  hours: 72,
  days: 30
};

const getDaysOfWeek = () => [
  { value: 1, label: i18n.t("flowBuilderModals.intervalModal.fields.dayMon") },
  { value: 2, label: i18n.t("flowBuilderModals.intervalModal.fields.dayTue") },
  { value: 3, label: i18n.t("flowBuilderModals.intervalModal.fields.dayWed") },
  { value: 4, label: i18n.t("flowBuilderModals.intervalModal.fields.dayThu") },
  { value: 5, label: i18n.t("flowBuilderModals.intervalModal.fields.dayFri") },
  { value: 6, label: i18n.t("flowBuilderModals.intervalModal.fields.daySat") },
  { value: 0, label: i18n.t("flowBuilderModals.intervalModal.fields.daySun") }
];

const DEFAULT_BUSINESS_HOURS = {
  enabled: false,
  startTime: "08:00",
  endTime: "18:00",
  daysOfWeek: [1, 2, 3, 4, 5]
};

const FlowBuilderIntervalModal = ({
  open,
  onSave,
  data,
  onUpdate,
  close
}) => {
  const classes = useStyles();
  const isMounted = useRef(true);

  const [timerValue, setTimerValue] = useState(0);
  const [timerUnit, setTimerUnit] = useState("seconds");
  const [businessHours, setBusinessHours] = useState({ ...DEFAULT_BUSINESS_HOURS });
  const [aiTimeoutSeconds, setAiTimeoutSeconds] = useState(0);
  const [activeModal, setActiveModal] = useState(false);

  useEffect(() => {
    if (open === "edit") {
      const d = data.data;
      if (d.unit) {
        setTimerValue(d.value || 0);
        setTimerUnit(d.unit || "seconds");
        setBusinessHours(d.businessHours || { ...DEFAULT_BUSINESS_HOURS });
        setAiTimeoutSeconds(d.aiTimeoutSeconds || 0);
      } else if (d.sec !== undefined) {
        setTimerValue(d.sec);
        setTimerUnit("seconds");
        setBusinessHours({ ...DEFAULT_BUSINESS_HOURS });
      }
      setActiveModal(true);
    } else if (open === "create") {
      setTimerValue(0);
      setTimerUnit("seconds");
      setBusinessHours({ ...DEFAULT_BUSINESS_HOURS });
      setAiTimeoutSeconds(0);
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

  const handleToggleDay = (day) => {
    setBusinessHours(prev => {
      const days = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day];
      return { ...prev, daysOfWeek: days };
    });
  };

  const handleSaveContact = () => {
    const val = parseInt(timerValue);
    if (!val || val <= 0) {
      return toast.error(i18n.t("flowBuilderModals.intervalModal.validation.addValue"));
    }
    const max = MAX_VALUES[timerUnit];
    if (val > max) {
      return toast.error(
        i18n.t("flowBuilderModals.intervalModal.validation.maxTime", {
          max,
          unit: getUnitOptions().find(u => u.value === timerUnit)?.label || timerUnit
        })
      );
    }
    if (businessHours.enabled && businessHours.daysOfWeek.length === 0) {
      return toast.error(i18n.t("flowBuilderModals.intervalModal.validation.addValue"));
    }

    const payload = {
      value: val,
      unit: timerUnit,
      businessHours: { ...businessHours },
      aiTimeoutSeconds: parseInt(aiTimeoutSeconds) || 0
    };

    if (open === "edit") {
      onUpdate({
        ...data,
        data: payload
      });
    } else if (open === "create") {
      onSave(payload);
    }
    handleClose();
  };

  return (
    <div className={classes.root}>
      <Dialog open={activeModal} onClose={handleClose} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle id="form-dialog-title">
          {open === "create"
            ? i18n.t("flowBuilderModals.intervalModal.titleAdd")
            : i18n.t("flowBuilderModals.intervalModal.titleEdit")}
        </DialogTitle>
        <Stack>
          <DialogContent dividers>
            <div className={classes.row}>
              <TextField
                label={i18n.t("flowBuilderModals.intervalModal.fields.timeValue")}
                name="timerValue"
                type="number"
                value={timerValue}
                onChange={(e) => setTimerValue(e.target.value)}
                autoFocus
                variant="outlined"
                InputProps={{ inputProps: { min: 0, max: MAX_VALUES[timerUnit] } }}
                margin="dense"
                style={{ flex: 1 }}
              />
              <FormControl variant="outlined" margin="dense" style={{ minWidth: 140 }}>
                <InputLabel>{i18n.t("flowBuilderModals.intervalModal.fields.unit")}</InputLabel>
                <Select
                  value={timerUnit}
                  onChange={(e) => setTimerUnit(e.target.value)}
                  label={i18n.t("flowBuilderModals.intervalModal.fields.unit")}
                >
                  {getUnitOptions().map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className={classes.businessHoursSection}>
              <FormControlLabel
                control={
                  <Switch
                    checked={businessHours.enabled}
                    onChange={(e) =>
                      setBusinessHours(prev => ({ ...prev, enabled: e.target.checked }))
                    }
                    color="primary"
                  />
                }
                label={i18n.t("flowBuilderModals.intervalModal.fields.businessHours")}
              />

              {businessHours.enabled && (
                <Box mt={1}>
                  <Typography variant="caption" color="textSecondary" style={{ display: "block", marginBottom: 8 }}>
                    {i18n.t("flowBuilderModals.intervalModal.fields.businessHoursHelp")}
                  </Typography>
                  <div className={classes.timeRow}>
                    <TextField
                      label={i18n.t("flowBuilderModals.intervalModal.fields.startTime")}
                      type="time"
                      value={businessHours.startTime}
                      onChange={(e) =>
                        setBusinessHours(prev => ({ ...prev, startTime: e.target.value }))
                      }
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      style={{ flex: 1 }}
                    />
                    <TextField
                      label={i18n.t("flowBuilderModals.intervalModal.fields.endTime")}
                      type="time"
                      value={businessHours.endTime}
                      onChange={(e) =>
                        setBusinessHours(prev => ({ ...prev, endTime: e.target.value }))
                      }
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <Typography variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                    {i18n.t("flowBuilderModals.intervalModal.fields.daysOfWeek")}
                  </Typography>
                  <div className={classes.daysRow}>
                    {getDaysOfWeek().map(day => (
                      <FormControlLabel
                        key={day.value}
                        control={
                          <Checkbox
                            checked={businessHours.daysOfWeek.includes(day.value)}
                            onChange={() => handleToggleDay(day.value)}
                            color="primary"
                            size="small"
                          />
                        }
                        label={day.label}
                      />
                    ))}
                  </div>
                </Box>
              )}
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
                helperText={aiTimeoutSeconds > 0 ? `Se o cliente não responder em ${aiTimeoutSeconds}s, a IA assume o atendimento (saída roxa)` : ""}
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
              onClick={() => handleSaveContact()}
            >
              {open === "create"
                ? i18n.t("flowBuilderModals.intervalModal.buttonAdd")
                : i18n.t("flowBuilderModals.intervalModal.buttonEdit")}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </div>
  );
};

export default FlowBuilderIntervalModal;
