import React, { memo } from "react";
import { MenuIcon, CopyIcon, TrashIcon } from "../icons/FlowIcons";
import { i18n } from "../../../translate/i18n";

import { useNodeStorage } from "../../../stores/useNodeStorage";
import { TargetHandle, glassStyle, OptionOutputHandle, optionRowStyle, TimeoutOutputHandle, AIOutputHandle } from "./NodeHandles";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  return (
    <div style={{ ...glassStyle, maxWidth: "155px", width: 180 }} className="flow-node-card">
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
        <MenuIcon
          style={{
            width: 16,
            height: 16,
            marginRight: "4px",
            marginTop: "4px",
            color: "#683AC8"
          }}
        />
        <div style={{ color: "#ededed", fontSize: "16px" }}>{i18n.t("flowBuilderConfig.nodes.menu")}</div>
      </div>
      <div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px",
            height: "50px",
            overflow: "hidden",
            marginBottom: "8px"
          }}
        >
          {data.message}
        </div>
      </div>
      {data.arrayOption.map(option => (
        <div
          key={option.number}
          style={optionRowStyle}
        >
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: "10px",
              color: "#ededed",
            }}
          >
            {i18n.t("flowBuilderConfig.nodes.optionFormat", { number: option.number, value: option.value })}
          </div>
          <OptionOutputHandle isConnectable={isConnectable} id={"a" + option.number} />
        </div>
      ))}

      <TimeoutOutputHandle
        isConnectable={isConnectable}
        label={data.timeoutSeconds > 0 ? `Timeout ${data.timeoutSeconds}s` : i18n.t("flowBuilderConfig.nodes.noResponse")}
      />
      <AIOutputHandle isConnectable={isConnectable} />
    </div>
  );
});
