import { ImportExport, Message } from "@mui/icons-material";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";

import { Handle } from "react-flow-renderer";
import { TargetHandle, glassStyle } from "./NodeHandles";

const multiSourceStyle = {
  background: "#3b82f6",
  width: "12px",
  height: "12px",
  cursor: "pointer",
  border: "2px solid rgba(59, 130, 246, 0.4)",
  boxShadow: "0 0 6px rgba(59, 130, 246, 0.5)",
};

export default memo(({ data, isConnectable }) => {
  const { t } = useTranslation();

  const typeCondition = (value) => {
    if(value === 1){
      return '=='
    }
    if(value === 2){
      return '>='
    }
    if(value === 3){
      return '<='
    }
    if(value === 4){
      return '<'
    }
    if(value === 5){
      return '>'
    }
  }
  return (
    <div style={glassStyle}>
      <TargetHandle isConnectable={isConnectable} />
      <div style={{color: '#ededed', fontSize: '16px', flexDirection: 'row', display: 'flex'}}>
        <ImportExport sx={{width: '16px', height: '16px', marginRight: '4px', marginTop: '4px'}}/>
        <div style={{color: '#ededed', fontSize: '16px'}}>
        {t("flowBuilderNodes.condition")}
        </div>
      </div>
      <div style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px'}}>{data.key}</div>
      <div style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px'}}>{typeCondition(data.condition)}</div>
      <div style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px'}}>{data.value}</div>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{ ...multiSourceStyle, top: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position="right"
        id="b"
        style={{ ...multiSourceStyle, bottom: 10, top: "auto" }}
        isConnectable={isConnectable}
      />
    </div>
  );
});
