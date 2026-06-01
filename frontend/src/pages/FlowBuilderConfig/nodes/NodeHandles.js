import React from "react";
import { Handle } from "react-flow-renderer";
import { ArrowForwardIos } from "@mui/icons-material";
import { SiOpenai } from "react-icons/si";
import { TimeIcon } from "../icons/FlowIcons";

// Bolinha de entrada (target) - laranja
export const TargetHandle = ({ isConnectable, top = "20px" }) => (
  <Handle
    type="target"
    position="left"
    style={{
      background: "#f97316",
      width: "14px",
      height: "14px",
      top,
      left: "-8px",
      cursor: "pointer",
      border: "2px solid rgba(249, 115, 22, 0.4)",
      boxShadow: "0 0 6px rgba(249, 115, 22, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    isConnectable={isConnectable}
  >
    <ArrowForwardIos
      sx={{
        color: "#fff",
        width: "7px",
        height: "7px",
        marginLeft: "1px",
        pointerEvents: "none",
      }}
    />
  </Handle>
);

// Estilo glass compartilhado para os cards
export const glassStyle = {
  background: "rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(20px) saturate(1.3)",
  WebkitBackdropFilter: "blur(20px) saturate(1.3)",
  padding: "8px",
  borderRadius: "10px",
  boxShadow: "0 2px 16px rgba(0, 0, 0, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

// Estilo da linha de saida
const handleRowStyle = {
  position: "relative",
  marginTop: "5px",
  justifyContent: "flex-end",
  display: "flex",
  alignItems: "center",
  minHeight: "16px",
};

// Posicionamento do handle dentro da linha relativa
const rowHandleBase = {
  position: "absolute",
  right: "-15px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "12px",
  height: "12px",
  cursor: "pointer",
};

// Saida Azul: Fluxo Normal
export const FlowOutputHandle = ({ isConnectable, id = "a" }) => (
  <div style={handleRowStyle}>
    <ArrowForwardIos sx={{ width: "10px", height: "10px", color: "#3b82f6", marginRight: "3px" }} />
    <div style={{ fontSize: "9px", color: "#3b82f6", fontWeight: "bold" }}>Fluxo Normal</div>
    <Handle
      type="source"
      position="right"
      id={id}
      style={{
        ...rowHandleBase,
        background: "#3b82f6",
        border: "2px solid rgba(59, 130, 246, 0.4)",
        boxShadow: "0 0 6px rgba(59, 130, 246, 0.5)",
      }}
      isConnectable={isConnectable}
    />
  </div>
);

// Saida Amarela: Sem resposta / Timeout
export const TimeoutOutputHandle = ({ isConnectable, label }) => (
  <div style={handleRowStyle}>
    <TimeIcon style={{ width: "12px", height: "12px", color: "#facc15", marginRight: "3px" }} />
    <div style={{ fontSize: "9px", color: "#facc15", fontWeight: "bold" }}>
      {label}
    </div>
    <Handle
      type="source"
      position="right"
      id="timeout"
      style={{
        ...rowHandleBase,
        background: "#facc15",
        border: "2px solid rgba(250, 204, 21, 0.4)",
        boxShadow: "0 0 6px rgba(250, 204, 21, 0.5)",
      }}
      isConnectable={isConnectable}
    />
  </div>
);

// Saida Roxa: Saida IA
export const AIOutputHandle = ({ isConnectable }) => (
  <div style={handleRowStyle}>
    <SiOpenai style={{ width: "10px", height: "10px", color: "#8b5cf6", marginRight: "3px" }} />
    <div style={{ fontSize: "9px", color: "#8b5cf6", fontWeight: "bold" }}>
      Saida IA
    </div>
    <Handle
      type="source"
      position="right"
      id="ai"
      style={{
        ...rowHandleBase,
        background: "#8b5cf6",
        border: "2px solid rgba(139, 92, 246, 0.4)",
        boxShadow: "0 0 6px rgba(139, 92, 246, 0.5)",
      }}
      isConnectable={isConnectable}
    />
  </div>
);

// Handle generico para opcoes de menu (dentro de row relativa)
export const OptionOutputHandle = ({ isConnectable, id }) => (
  <Handle
    type="source"
    position="right"
    id={id}
    style={{
      ...rowHandleBase,
      background: "#3b82f6",
      border: "2px solid rgba(59, 130, 246, 0.4)",
      boxShadow: "0 0 6px rgba(59, 130, 246, 0.5)",
    }}
    isConnectable={isConnectable}
  />
);

// Estilo da linha de opcao (para menu e randomizer)
export const optionRowStyle = {
  position: "relative",
  marginBottom: "6px",
  justifyContent: "flex-end",
  display: "flex",
  alignItems: "center",
  minHeight: "16px",
};

// SourceHandle legado (para nodes simples que so tem 1 saida)
export const SourceHandle = ({ isConnectable, id = "a", top = "70%" }) => (
  <Handle
    type="source"
    position="right"
    id={id}
    style={{
      background: "#3b82f6",
      width: "12px",
      height: "12px",
      top,
      right: "-7px",
      cursor: "pointer",
      border: "2px solid rgba(59, 130, 246, 0.4)",
      boxShadow: "0 0 6px rgba(59, 130, 246, 0.5)",
    }}
    isConnectable={isConnectable}
  />
);
