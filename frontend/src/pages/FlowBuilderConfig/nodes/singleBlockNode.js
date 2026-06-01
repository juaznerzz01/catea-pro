import React, { memo } from "react";
import { ContentIcon, CopyIcon, TrashIcon, TextIcon, ImageIcon, VideoIcon, AudioIcon, TimeIcon, DocumentIcon } from "../icons/FlowIcons";
import { i18n } from "../../../translate/i18n";

import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography } from "@mui/material";
import { TargetHandle, glassStyle, FlowOutputHandle, TimeoutOutputHandle, AIOutputHandle } from "./NodeHandles";

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
            color: "#EC5858"
          }}
        />
        <div style={{ color: "#ededed", fontSize: "16px" }}>{i18n.t("flowBuilderConfig.nodes.content")}</div>
      </div>
      <div style={{ color: "#ededed", fontSize: "12px", width: 180 }}>
        {data.seq.map(item => (
          <div
            key={item}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              marginBottom: "3px",
              borderRadius: "5px"
            }}
          >
            {item.includes("message") && (
              <div style={{ gap: "5px", padding: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    position: "relative",
                    flexDirection: "row",
                    justifyContent: "center"
                  }}
                >
                  <TextIcon style={{ width: 16, height: 16, color: "#EC5858" }} />
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
                  {
                    data.elements.filter(itemLoc => itemLoc.number === item)[0]
                      .value
                  }
                </Typography>
              </div>
            )}
            {item.includes("interval") && (
              <div style={{ gap: "5px", padding: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    position: "relative",
                    flexDirection: "row",
                    justifyContent: "center"
                  }}
                >
                  <TimeIcon style={{ width: 16, height: 16, color: "#EC5858" }} />
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
                  {
                    data.elements.filter(itemLoc => itemLoc.number === item)[0]
                      .value
                  }{" "}
                  {i18n.t("flowBuilderConfig.units.seconds")}
                </Typography>
              </div>
            )}
            {item.includes("img") && (
              <div style={{ gap: "5px", padding: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    position: "relative",
                    flexDirection: "row",
                    justifyContent: "center"
                  }}
                >
                  <ImageIcon style={{ width: 16, height: 16, color: "#EC5858" }} />
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
                  {
                    data.elements.filter(itemLoc => itemLoc.number === item)[0]
                      .original
                  }
                </Typography>
              </div>
            )}
            {item.includes("audio") && (
              <div style={{ gap: "5px", padding: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    position: "relative",
                    flexDirection: "row",
                    justifyContent: "center"
                  }}
                >
                  <AudioIcon style={{ width: 16, height: 16, color: "#EC5858" }} />
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
                  {
                    data.elements.filter(itemLoc => itemLoc.number === item)[0]
                      .original
                  }
                </Typography>
              </div>
            )}
            {item.includes("video") && (
              <div style={{ gap: "5px", padding: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    position: "relative",
                    flexDirection: "row",
                    justifyContent: "center"
                  }}
                >
                  <VideoIcon style={{ width: 16, height: 16, color: "#EC5858" }} />
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
                  {
                    data.elements.filter(itemLoc => itemLoc.number === item)[0]
                      .original
                  }
                </Typography>
              </div>
            )}
            {item.includes("document") && (
              <div style={{ gap: "5px", padding: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    position: "relative",
                    flexDirection: "row",
                    justifyContent: "center"
                  }}
                >
                  <DocumentIcon style={{ width: 16, height: 16, color: "#EC5858" }} />
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
                  {
                    data.elements.filter(itemLoc => itemLoc.number === item)[0]
                      .original
                  }
                </Typography>
              </div>
            )}
          </div>
        ))}
      </div>
      <FlowOutputHandle isConnectable={isConnectable} />
      <TimeoutOutputHandle
        isConnectable={isConnectable}
        label={data.timeoutSeconds > 0 ? `Timeout ${data.timeoutSeconds}s` : i18n.t("flowBuilderConfig.nodes.noResponse")}
      />
      <AIOutputHandle isConnectable={isConnectable} />
    </div>
  );
});
