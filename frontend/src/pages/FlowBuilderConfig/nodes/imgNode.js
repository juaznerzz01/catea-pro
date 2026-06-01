import React, { memo } from "react";
import { ContentIcon, CopyIcon, TrashIcon } from "../icons/FlowIcons";
import { i18n } from "../../../translate/i18n";
import { BACKEND_URL } from "../../../config/env";

import { useNodeStorage } from "../../../stores/useNodeStorage";
import { SourceHandle, TargetHandle, glassStyle } from "./NodeHandles";

export default memo(({ data, isConnectable, id }) => {

  const link = BACKEND_URL

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
      <div style={{color: '#ededed', fontSize: '16px', flexDirection: 'row', display: 'flex'}}>
        <ContentIcon style={{ width: 16, height: 16, marginRight: '4px', marginTop: '4px', color: '#3b82f6' }} />
        <div style={{color: '#ededed', fontSize: '16px'}}>
        {i18n.t("flowBuilderNodes.image")}
        </div>
      </div>
      <div style={{color: '#ededed', fontSize: '12px', width: 180}}>
        <img src={`${link}/public/${data.url}`} style={{width: '180px'}} />
      </div>
      <SourceHandle isConnectable={isConnectable} />
    </div>
  );
});
