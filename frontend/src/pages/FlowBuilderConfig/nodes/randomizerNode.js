import React, { memo } from "react";
import { RandomizerIcon, CopyIcon, TrashIcon } from "../icons/FlowIcons";
import { i18n } from "../../../translate/i18n";

import { useNodeStorage } from "../../../stores/useNodeStorage";
import { TargetHandle, glassStyle, OptionOutputHandle, optionRowStyle } from "./NodeHandles";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  return (
    <div style={{ ...glassStyle, width: "185px" }} className="flow-node-card">
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
        <RandomizerIcon
          style={{
            width: 16,
            height: 16,
            marginRight: "4px",
            marginTop: "4px",
            color: "#1FBADC"
          }}
        />
        <div style={{ color: "#ededed", fontSize: "16px" }}>{i18n.t("flowBuilderConfig.nodes.randomizer")}</div>
      </div>
      <div style={optionRowStyle}>
        <div
          style={{
            fontSize: "14px",
            color: "#ededed",
          }}
        >
          {`${data.percent}%`}
        </div>
        <OptionOutputHandle isConnectable={isConnectable} id="a" />
      </div>
      <div style={optionRowStyle}>
        <div
          style={{
            fontSize: "14px",
            color: "#ededed",
          }}
        >
          {`${100 - data.percent}%`}
        </div>
        <OptionOutputHandle isConnectable={isConnectable} id="b" />
      </div>
    </div>
  );
});
