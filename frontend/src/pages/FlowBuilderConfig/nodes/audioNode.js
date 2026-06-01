import React, { memo } from "react";
import { ContentIcon, CopyIcon, TrashIcon } from "../icons/FlowIcons";
import { useTranslation } from "react-i18next";

import { useNodeStorage } from "../../../stores/useNodeStorage";
import { BACKEND_URL } from "../../../config/env";
import { SourceHandle, TargetHandle, glassStyle } from "./NodeHandles";

export default memo(({ data, isConnectable, id }) => {
  const { t } = useTranslation();
  const link = BACKEND_URL;

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
          gap: 6
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
          display: "flex"
        }}
      >
        <ContentIcon
          style={{
            width: 16,
            height: 16,
            marginRight: "4px",
            marginTop: "4px",
            color: "#3b82f6"
          }}
        />
        <div style={{ color: "#ededed", fontSize: "16px" }}>{t("flowBuilderConfig.nodes.audioNode.title")}</div>
      </div>
      <div style={{ color: "#ededed", fontSize: "12px" }}>
        <div style={{ position: "absolute", right: "50px", top: "12px" }}>
          {data.record && data.record ? (
            <div>{t("flowBuilderConfig.nodes.audioNode.recordedLive")}</div>
          ) : (
            <div>{t("flowBuilderConfig.nodes.audioNode.audioSent")}</div>
          )}
        </div>
        <audio controls="controls">
          <source src={`${link}/public/${data.url}`} type="audio/mp3" />
          {t("flowBuilderConfig.nodes.audioNode.browserNotSupported")}
        </audio>
      </div>
      <SourceHandle isConnectable={isConnectable} />
    </div>
  );
});
