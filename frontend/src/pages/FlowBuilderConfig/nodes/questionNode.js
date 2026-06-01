import React, { memo } from "react";
import { i18n } from "../../../translate/i18n";

import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography } from "@mui/material";
import { QuestionIcon, CopyIcon, TrashIcon } from "../icons/FlowIcons";
import { TargetHandle, glassStyle, FlowOutputHandle, TimeoutOutputHandle, AIOutputHandle } from "./NodeHandles";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  const timeoutSeconds = data?.timeoutSeconds || data?.typebotIntegration?.timeoutSeconds || 0;
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
        <QuestionIcon
          style={{
            width: 16,
            height: 16,
            marginRight: "4px",
            marginTop: "4px",
            color: "#EC5858",
          }}
        />
        <div style={{ color: "#ededed", fontSize: "16px" }}>{i18n.t("flowBuilderConfig.nodes.question")}</div>
      </div>
      <div style={{ color: "#ededed", fontSize: "12px", width: 180 }}>
         <div style={{ gap: "5px", padding: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    position: "relative",
                    flexDirection: "row",
                    justifyContent: "center"
                  }}
                >
                  <QuestionIcon style={{ color: "#EC5858" }} />
                </div>
                <Typography
                  textAlign={"center"}
                  sx={{
                    textOverflow: "ellipsis",
                    fontSize: "10px",
                    whiteSpace: "nowrap",
                    overflow: "hidden"
                  }}
                >
                {data?.typebotIntegration?.message}
                </Typography>
              </div>
      </div>
      <FlowOutputHandle isConnectable={isConnectable} />
      <TimeoutOutputHandle
        isConnectable={isConnectable}
        label={timeoutSeconds > 0 ? `Timeout ${timeoutSeconds}s` : i18n.t("flowBuilderConfig.nodes.noResponse")}
      />
      <AIOutputHandle isConnectable={isConnectable} />
    </div>
  );
});
