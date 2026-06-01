import React, { memo } from "react";
import { i18n } from "../../../translate/i18n";
import { CopyIcon, TrashIcon } from "../icons/FlowIcons";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Box } from "@material-ui/core";
import typebotIcon from "../../../assets/typebot-ico.png";
import { TargetHandle, glassStyle, FlowOutputHandle, TimeoutOutputHandle } from "./NodeHandles";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  return (
    <div style={glassStyle} className="flow-node-card">
      <TargetHandle isConnectable={isConnectable} />
      <div
        className="node-actions"
        style={{
          display: "flex",
          position: "absolute",
          right: 5,
          top: 5,
          cursor: "pointer",
          gap: 6,
        }}
      >
        <CopyIcon
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("duplicate");
          }}
          style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.5)" }}
        />

        <TrashIcon
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.5)" }}
        />
      </div>
      <div
        style={{
          color: "#ededed",
          fontSize: "16px",
          flexDirection: "row",
          display: "flex",
        }}
      >
        <Box
          component="img"
          sx={{
            width: 16,
            height: 16,
            marginRight: 4,
            marginTop: 4,
            color: "#3aba38",
          }}
          src={typebotIcon}
          alt="icon"
        />
        <div style={{ color: "#ededed", fontSize: "16px" }}>{i18n.t("flowBuilderConfig.nodes.typebot")}</div>
      </div>
      <div style={{ color: "#ededed", fontSize: "12px", width: 180 }}>
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            marginBottom: "3px",
            borderRadius: "5px",
          }}
        >
          <div style={{ gap: "5px", padding: "6px" }}>
            <div style={{ textAlign: "center" }}>{i18n.t("flowBuilderConfig.nodes.typebot")}</div>
          </div>
        </div>
      </div>
      <FlowOutputHandle isConnectable={isConnectable} />
      <TimeoutOutputHandle
        isConnectable={isConnectable}
        label={data.timeoutSeconds > 0 ? `Timeout ${data.timeoutSeconds}s` : i18n.t("flowBuilderConfig.nodes.noResponse")}
      />
    </div>
  );
});
