
import React from "react";
import {
  getBezierPath,
  getEdgeCenter,
} from "react-flow-renderer";
import { useTranslation } from "react-i18next";

import "./css/buttonedge.css";
import { TrashIcon } from "../icons/FlowIcons";

export default function RemoveEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  style = {},
  data
}) {
  const { t } = useTranslation();

  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY
  });

  const foreignObjectSize = 40;
  const markerId = `arrow-${id}`;
  const gradId = `grad-${id}`;

  // Normal: degradê azul→laranja | Timeout: degradê amarelo→laranja
  const isNormal = sourceHandleId === "a" || !sourceHandleId;
  const startColor = isNormal ? "#3b82f6" : "#facc15";
  const endColor = "#f97316";

  return (
    <>
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={endColor} />
        </marker>
      </defs>
      <path
        id={id}
        style={{ ...style, stroke: `url(#${gradId})`, filter: "none" }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={`url(#${markerId})`}
      />
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={edgeCenterX - foreignObjectSize / 2}
        y={edgeCenterY - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div>
          <button
            className="edgebutton"
            onClick={() => data?.onDelete?.(id)}
            title={t("flowBuilder.edges.removeEdgeTooltip")}
            aria-label={t("flowBuilder.edges.removeEdgeTooltip")}
          >
            <TrashIcon style={{ width: "14px", height: "14px", color: endColor }} />
          </button>
        </div>
      </foreignObject>
    </>
  );
}
