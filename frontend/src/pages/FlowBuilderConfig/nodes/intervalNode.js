import React, { memo } from "react";
import { IntervalIcon, CopyIcon, TrashIcon } from "../icons/FlowIcons";
import { i18n } from "../../../translate/i18n";

import { useNodeStorage } from "../../../stores/useNodeStorage";
import { TargetHandle, glassStyle, FlowOutputHandle, AIOutputHandle } from "./NodeHandles";

const UNIT_DISPLAY = {
  seconds: "seg.",
  minutes: "min.",
  hours: "h",
  days: "dias"
};

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  const getDisplayText = () => {
    if (data.unit && data.value !== undefined) {
      const unitLabel = UNIT_DISPLAY[data.unit] || data.unit;
      return `${data.value} ${unitLabel}`;
    }
    if (data.sec !== undefined) {
      return i18n.t("flowBuilderConfig.messages.interval", { seconds: data.sec });
    }
    return "";
  };

  const showBusinessHours = data.businessHours && data.businessHours.enabled;

  return (
    <div style={{ ...glassStyle, minWidth: "155px" }} className="flow-node-card">
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
        <IntervalIcon
          style={{
            width: 16,
            height: 16,
            marginRight: "4px",
            marginTop: "4px",
            color: "#F7953B"
          }}
        />
        <div style={{ color: "#ededed", fontSize: "16px" }}>{i18n.t("flowBuilderConfig.nodes.interval")}</div>
      </div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
        {getDisplayText()}
      </div>
      {showBusinessHours && (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "2px", fontStyle: "italic" }}>
          Hor. Comercial
        </div>
      )}
      <FlowOutputHandle isConnectable={isConnectable} />
      <AIOutputHandle isConnectable={isConnectable} />
    </div>
  );
});
