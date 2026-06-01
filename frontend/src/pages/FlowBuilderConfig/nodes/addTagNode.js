import React, { memo } from "react";
import { i18n } from "../../../translate/i18n";
import { TagsIcon, CopyIcon, TrashIcon } from "../icons/FlowIcons";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { TargetHandle, glassStyle, FlowOutputHandle, AIOutputHandle } from "./NodeHandles";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  const tags = Object.keys(data)[0] === "data" ? (data.data.tags || []) : (data.tags || []);
  const label = tags.map(t => t.name).join(", ") || i18n.t("flowBuilderConfig.nodes.noTag");
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
        <TagsIcon
          style={{
            width: 16,
            height: 16,
            marginRight: "4px",
            marginTop: "4px",
            color: "#ff9800"
          }}
        />
        <div style={{ color: "#ededed", fontSize: "16px" }}>
          {i18n.t("flowBuilderConfig.nodes.addTag")}
        </div>
      </div>
      <div style={{ color: "#ededed", fontSize: "12px", width: 180 }}>
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            marginBottom: "3px",
            borderRadius: "5px"
          }}
        >
          <div style={{ gap: "5px", padding: "6px" }}>
            <div style={{ textAlign: "center" }}>{label}</div>
          </div>
        </div>
      </div>
      <FlowOutputHandle isConnectable={isConnectable} />
      <AIOutputHandle isConnectable={isConnectable} />
    </div>
  );
});
