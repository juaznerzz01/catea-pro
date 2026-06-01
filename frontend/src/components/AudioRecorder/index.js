import React, { useState, useRef, useEffect, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import MicIcon from "@material-ui/icons/Mic";
import StopIcon from "@material-ui/icons/Stop";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import DeleteIcon from "@material-ui/icons/Delete";
import { Stack } from "@mui/material";

const useStyles = makeStyles((theme) => ({
  recorderRoot: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
  },
  recordBtn: {
    backgroundColor: "#d32f2f",
    color: "white",
    "&:hover": { backgroundColor: "#b71c1c" },
    boxShadow: "none",
    borderRadius: 0,
    width: "100%",
  },
  visualizerContainer: {
    width: "100%",
    height: 60,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    border: "1px solid #e0e0e0",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  barsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    height: "100%",
    padding: "0 12px",
  },
  bar: {
    width: 3,
    backgroundColor: "#d32f2f",
    borderRadius: 2,
    transition: "height 0.1s ease",
  },
  barPaused: {
    backgroundColor: "#ff9800",
  },
  timerRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  timer: {
    fontFamily: "'Roboto Mono', monospace",
    fontSize: "1.3rem",
    fontWeight: 600,
    color: "#333",
    minWidth: 60,
    textAlign: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    animation: "$pulse 1s ease-in-out infinite",
  },
  statusDotRecording: {
    backgroundColor: "#d32f2f",
  },
  statusDotPaused: {
    backgroundColor: "#ff9800",
    animation: "none",
  },
  "@keyframes pulse": {
    "0%, 100%": { opacity: 1, transform: "scale(1)" },
    "50%": { opacity: 0.4, transform: "scale(0.8)" },
  },
  controlsRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  controlBtn: {
    minWidth: 40,
    width: 40,
    height: 40,
    borderRadius: "50%",
    padding: 0,
  },
  pauseBtn: {
    backgroundColor: "#ff9800",
    color: "white",
    "&:hover": { backgroundColor: "#f57c00" },
  },
  resumeBtn: {
    backgroundColor: "#4caf50",
    color: "white",
    "&:hover": { backgroundColor: "#388e3c" },
  },
  stopBtn: {
    backgroundColor: "#d32f2f",
    color: "white",
    "&:hover": { backgroundColor: "#b71c1c" },
  },
  cancelBtn: {
    backgroundColor: "#9e9e9e",
    color: "white",
    "&:hover": { backgroundColor: "#757575" },
  },
  statusLabel: {
    fontSize: "0.8rem",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    color: "#999",
    fontSize: "0.85rem",
    "&::before, &::after": {
      content: '""',
      flex: 1,
      borderBottom: "1px solid #ddd",
    },
  },
}));

const NUM_BARS = 32;

/**
 * AudioRecorder - Componente de gravacao de audio com visualizacao,
 * pause/resume e preview.
 *
 * Props:
 *   onRecorded(blob, file) - chamado quando o usuario finaliza a gravacao
 */
const AudioRecorder = ({ onRecorded }) => {
  const classes = useStyles();

  const [status, setStatus] = useState("idle"); // idle | recording | paused | done
  const [elapsed, setElapsed] = useState(0);
  const [barHeights, setBarHeights] = useState(new Array(NUM_BARS).fill(4));
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopEverything = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Visualizer animation
  const animateBars = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      if (!analyserRef.current) return;
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const step = Math.floor(dataArray.length / NUM_BARS);
      const heights = [];
      for (let i = 0; i < NUM_BARS; i++) {
        const val = dataArray[i * step] || 0;
        // map 0-255 to 4-50 px height
        heights.push(Math.max(4, (val / 255) * 50));
      }
      setBarHeights(heights);
    };
    draw();
  }, []);

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      // Audio analyser for visualization
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder - prefer ogg/opus (WhatsApp native), fallback to webm
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      }
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(200); // collect data every 200ms for smooth stop
      setStatus("recording");
      setElapsed(0);
      setAudioUrl(null);
      startTimer();
      animateBars();
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Nao foi possivel acessar o microfone. Verifique as permissoes do navegador.");
    }
  };

  const handlePause = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      stopTimer();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      // Show flat bars when paused
      setBarHeights(new Array(NUM_BARS).fill(8));
      setStatus("paused");
    }
  };

  const handleResume = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      animateBars();
      setStatus("recording");
    }
  };

  const handleStop = () => {
    if (!mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });

      if (blob.size < 5000) {
        setStatus("idle");
        stopEverything();
        return;
      }

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setStatus("done");

      // Stop mic + analyser but keep the blob
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      analyserRef.current = null;
    };

    stopTimer();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    recorder.stop();
  };

  const handleCancel = () => {
    stopTimer();
    stopEverything();
    setBarHeights(new Array(NUM_BARS).fill(4));
    setElapsed(0);
    setAudioUrl(null);
    setStatus("idle");
  };

  const handleConfirm = () => {
    if (!chunksRef.current.length) return;
    // Always save as .ogg so backend detects it as audio
    const blob = new Blob(chunksRef.current, { type: "audio/ogg" });
    const file = new File([blob], `${Date.now()}.ogg`, { type: "audio/ogg" });
    if (onRecorded) onRecorded(blob, file);
    handleCancel();
  };

  const handleDiscard = () => {
    handleCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // ---------- IDLE ----------
  if (status === "idle") {
    return (
      <div>
        <div className={classes.divider}><span>ou</span></div>
        <Button
          className={classes.recordBtn}
          variant="contained"
          startIcon={<MicIcon />}
          onClick={handleStart}
          style={{ marginTop: 8 }}
        >
          Gravar Audio
        </Button>
      </div>
    );
  }

  // ---------- DONE (preview) ----------
  if (status === "done") {
    return (
      <div className={classes.recorderRoot}>
        <Typography
          className={classes.statusLabel}
          style={{ color: "#4caf50" }}
        >
          Gravacao concluida - {formatTime(elapsed)}
        </Typography>

        {audioUrl && (
          <audio controls style={{ width: "100%" }} src={audioUrl} />
        )}

        <Stack direction="row" gap="8px" justifyContent="center">
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={handleDiscard}
            size="small"
          >
            Descartar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            size="small"
          >
            Usar este audio
          </Button>
        </Stack>
      </div>
    );
  }

  // ---------- RECORDING / PAUSED ----------
  const isRecording = status === "recording";
  const isPaused = status === "paused";

  return (
    <div className={classes.recorderRoot}>
      {/* Status label */}
      <Stack direction="row" alignItems="center" gap="6px">
        <div
          className={`${classes.statusDot} ${
            isRecording
              ? classes.statusDotRecording
              : classes.statusDotPaused
          }`}
        />
        <Typography
          className={classes.statusLabel}
          style={{ color: isRecording ? "#d32f2f" : "#ff9800" }}
        >
          {isRecording ? "Gravando" : "Pausado"}
        </Typography>
      </Stack>

      {/* Visualizer bars */}
      <div className={classes.visualizerContainer}>
        <div className={classes.barsContainer}>
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={`${classes.bar} ${isPaused ? classes.barPaused : ""}`}
              style={{ height: h }}
            />
          ))}
        </div>
      </div>

      {/* Timer */}
      <span className={classes.timer}>{formatTime(elapsed)}</span>

      {/* Controls */}
      <div className={classes.controlsRow}>
        {/* Cancel */}
        <IconButton
          className={`${classes.controlBtn} ${classes.cancelBtn}`}
          onClick={handleCancel}
          title="Cancelar"
          size="small"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>

        {/* Pause / Resume */}
        {isRecording ? (
          <IconButton
            className={`${classes.controlBtn} ${classes.pauseBtn}`}
            onClick={handlePause}
            title="Pausar"
          >
            <PauseIcon />
          </IconButton>
        ) : (
          <IconButton
            className={`${classes.controlBtn} ${classes.resumeBtn}`}
            onClick={handleResume}
            title="Continuar"
          >
            <PlayArrowIcon />
          </IconButton>
        )}

        {/* Stop / Finish */}
        <IconButton
          className={`${classes.controlBtn} ${classes.stopBtn}`}
          onClick={handleStop}
          title="Finalizar"
        >
          <StopIcon />
        </IconButton>
      </div>

      <Typography variant="caption" style={{ color: "#999" }}>
        {isPaused
          ? "Clique em ▶ para continuar ou ■ para finalizar"
          : "Clique em ⏸ para pausar ou ■ para finalizar"}
      </Typography>
    </div>
  );
};

export default AudioRecorder;
