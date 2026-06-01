import { RocketLaunch } from "@mui/icons-material";
import React, { memo } from "react";
import { i18n } from "../../../translate/i18n";
import { Handle } from "react-flow-renderer";
import { glassStyle } from "./NodeHandles";

export default memo(({ data, isConnectable }) => {
  return (
    <div style={{ ...glassStyle, border: "1px solid rgba(58, 186, 56, 0.25)" }}>
      <div style={{ color: "#ededed", fontSize: "16px", flexDirection: "row", display: "flex", alignItems: "center", gap: 4 }}>
        <RocketLaunch sx={{ width: "16px", height: "16px", color: "#3aba38" }} />
        <div style={{ color: "#ededed", fontSize: "16px" }}>{i18n.t("flowBuilderConfig.messages.flowStart")}</div>
      </div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{i18n.t("flowBuilderConfig.nodeDescriptions.startFlow")}</div>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#3aba38", width: "12px", height: "12px", top: "50%", right: "-7px", cursor: "pointer",
          border: "2px solid rgba(58, 186, 56, 0.4)", boxShadow: "0 0 6px rgba(58, 186, 56, 0.5)",
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
});
