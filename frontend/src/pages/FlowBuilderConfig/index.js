import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useCallback,
} from "react";
import { SiOpenai, SiGoogle } from "react-icons/si";
import typebotIcon from "../../assets/typebot-ico.png";
import { HiOutlinePuzzle } from "react-icons/hi";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

import audioNode from "./nodes/audioNode";
import typebotNode from "./nodes/typebotNode";
import openaiNode from "./nodes/openaiNode";
import geminiNode from "./nodes/geminiNode";
import messageNode from "./nodes/messageNode.js";
import startNode from "./nodes/startNode";
import menuNode from "./nodes/menuNode";
import intervalNode from "./nodes/intervalNode";
import imgNode from "./nodes/imgNode";
import randomizerNode from "./nodes/randomizerNode";
import videoNode from "./nodes/videoNode";
import questionNode from "./nodes/questionNode";
import kanbanPhaseNode from "./nodes/kanbanPhaseNode";
import addTagNode from "./nodes/addTagNode";

import api from "../../services/api";

import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import {
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import { Box, CircularProgress } from "@material-ui/core";
import BallotIcon from '@mui/icons-material/Ballot';

import "reactflow/dist/style.css";
import "./flowbuilder.css";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  onElementsRemove,
  useReactFlow,
} from "react-flow-renderer";
import FlowBuilderAddTextModal from "../../components/FlowBuilderAddTextModal";
import FlowBuilderIntervalModal from "../../components/FlowBuilderIntervalModal";
import FlowBuilderConditionModal from "../../components/FlowBuilderConditionModal";
import FlowBuilderMenuModal from "../../components/FlowBuilderMenuModal";
import {
  AccessTime,
  CallSplit,
  DynamicFeed,
  Image,
  ImportExport,
  LibraryBooks,
  Message,
  MicNone,
  RocketLaunch,
  Videocam,
} from "@mui/icons-material";
import {
  ContentIcon as FlowContentIcon,
  MenuIcon as FlowMenuIcon,
  RandomizerIcon as FlowRandomizerIcon,
  IntervalIcon as FlowIntervalIcon,
  TicketIcon as FlowTicketIcon,
  QuestionIcon as FlowQuestionIcon,
  KanbanIcon as FlowKanbanIcon,
  TagsIcon as FlowTagsIcon,
} from "./icons/FlowIcons";
import RemoveEdge from "./nodes/removeEdge";
import FlowBuilderAddImgModal from "../../components/FlowBuilderAddImgModal";
import FlowBuilderTicketModal from "../../components/FlowBuilderAddTicketModal";
import FlowBuilderAddAudioModal from "../../components/FlowBuilderAddAudioModal";

import { useNodeStorage } from "../../stores/useNodeStorage";
import FlowBuilderRandomizerModal from "../../components/FlowBuilderRandomizerModal";
import FlowBuilderAddVideoModal from "../../components/FlowBuilderAddVideoModal";
import FlowBuilderSingleBlockModal from "../../components/FlowBuilderSingleBlockModal";
import singleBlockNode from "./nodes/singleBlockNode";
import { colorPrimary } from "../../styles/styles";
import ticketNode from "./nodes/ticketNode";
import { ConfirmationNumber } from "@material-ui/icons";
import FlowBuilderTypebotModal from "../../components/FlowBuilderAddTypebotModal";
import FlowBuilderOpenAIModal from "../../components/FlowBuilderAddOpenAIModal";
import FlowBuilderGeminiModal from "../../components/FlowBuilderAddGeminiModal";
import FlowBuilderAddQuestionModal from "../../components/FlowBuilderAddQuestionModal";
import FlowBuilderKanbanPhaseModal from "../../components/FlowBuilderKanbanPhaseModal";
import FlowBuilderAddTagModal from "../../components/FlowBuilderAddTagModal";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import GetAppIcon from "@mui/icons-material/GetApp";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { exportFlow } from "../../services/flowBuilder";
import FlowImportModal from "../../components/FlowImportModal";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    position: "relative",
    backgroundColor: "#F8F9FA",
    overflow: "hidden",
  },
  speeddial: {
    backgroundColor: "red",
  },
}));

function geraStringAleatoria(tamanho) {
  var stringAleatoria = "";
  var caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < tamanho; i++) {
    stringAleatoria += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  }
  return stringAleatoria;
}

const nodeTypes = {
  message: messageNode,
  start: startNode,
  menu: menuNode,
  interval: intervalNode,
  img: imgNode,
  audio: audioNode,
  randomizer: randomizerNode,
  video: videoNode,
  singleBlock: singleBlockNode,
  ticket: ticketNode,
  typebot: typebotNode,
  openai: openaiNode,
  gemini: geminiNode,
  question: questionNode,
  kanbanPhase: kanbanPhaseNode,
  addTag: addTagNode,
};

const edgeTypes = {
  buttonedge: RemoveEdge,
};

const initialNodes = [
  {
    id: "1",
    position: { x: 250, y: 100 },
    data: { label: i18n.t("flowBuilderConfig.messages.flowStart") },
    type: "start",
  },
];

const initialEdges = [];

export const FlowBuilderConfig = () => {
  const classes = useStyles();
  const history = useHistory();
  const { id } = useParams();

  const storageItems = useNodeStorage();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [dataNode, setDataNode] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [modalAddText, setModalAddText] = useState(null);
  const [modalAddInterval, setModalAddInterval] = useState(false);
  const [modalAddMenu, setModalAddMenu] = useState(null);
  const [modalAddImg, setModalAddImg] = useState(null);
  const [modalAddAudio, setModalAddAudio] = useState(null);
  const [modalAddRandomizer, setModalAddRandomizer] = useState(null);
  const [modalAddVideo, setModalAddVideo] = useState(null);
  const [modalAddSingleBlock, setModalAddSingleBlock] = useState(null);
  const [modalAddTicket, setModalAddTicket] = useState(null);
  const [modalAddTypebot, setModalAddTypebot] = useState(null);
  const [modalAddOpenAI, setModalAddOpenAI] = useState(null);
  const [modalAddGemini, setModalAddGemini] = useState(null);
  const [modalAddQuestion, setModalAddQuestion] = useState(null);
  const [modalAddKanbanPhase, setModalAddKanbanPhase] = useState(null);
  const [modalAddTag, setModalAddTag] = useState(null);
  const [importModal, setImportModal] = useState(false);

  const connectionLineStyle = { stroke: "#2b2b2b", strokeWidth: "6px" };

  const addNode = (type, data) => {
    const posY = nodes[nodes.length - 1].position.y;
    const posX =
      nodes[nodes.length - 1].position.x + nodes[nodes.length - 1].width + 40;
    if (type === "start") {
      return setNodes((old) => {
        return [
        //  ...old.filter((item) => item.id !== "1"),
          {
            id: "1",
            position: { x: posX, y: posY },
            data: { label: i18n.t("flowBuilderConfig.messages.flowStart") },
            type: "start",
          },
        ];
      });
    }
    if (type === "text") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { label: data.text },
            type: "message",
          },
        ];
      });
    }
    if (type === "interval") {
      const unitDisplay = { seconds: "seg.", minutes: "min.", hours: "h", days: "dias" };
      const unit = data.unit || "seconds";
      const value = data.value !== undefined ? data.value : data.sec;
      const label = `${value} ${unitDisplay[unit] || unit}`;
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: {
              label,
              value,
              unit,
              businessHours: data.businessHours || { enabled: false, startTime: "08:00", endTime: "18:00", daysOfWeek: [1,2,3,4,5] }
            },
            type: "interval",
          },
        ];
      });
    }
    if (type === "condition") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: {
              key: data.key,
              condition: data.condition,
              value: data.value,
            },
            type: "condition",
          },
        ];
      });
    }
    if (type === "menu") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: {
              message: data.message,
              arrayOption: data.arrayOption,
            },
            type: "menu",
          },
        ];
      });
    }
    if (type === "img") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { url: data.url },
            type: "img",
          },
        ];
      });
    }
    if (type === "audio") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { url: data.url, record: data.record },
            type: "audio",
          },
        ];
      });
    }
    if (type === "randomizer") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { percent: data.percent },
            type: "randomizer",
          },
        ];
      });
    }
    if (type === "video") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { url: data.url },
            type: "video",
          },
        ];
      });
    }
    if (type === "singleBlock") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "singleBlock",
          },
        ];
      });
    }

    if (type === "ticket") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "ticket",
          },
        ];
      });
    }

    if (type === "typebot") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "typebot",
          },
        ];
      });
    }

    if (type === "openai") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "openai",
          },
        ];
      });
    }

    if (type === "gemini") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "gemini",
          },
        ];
      });
    }

    if (type === "question") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "question",
          },
        ];
      });
    }

    if (type === "kanbanPhase") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "kanbanPhase",
          },
        ];
      });
    }

    if (type === "addTag") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "addTag",
          },
        ];
      });
    }
  };

  const textAdd = (data) => {
    addNode("text", data);
  };

  const intervalAdd = (data) => {
    addNode("interval", data);
  };

  const conditionAdd = (data) => {
    addNode("condition", data);
  };

  const menuAdd = (data) => {
    addNode("menu", data);
  };

  const imgAdd = (data) => {
    addNode("img", data);
  };

  const audioAdd = (data) => {
    addNode("audio", data);
  };

  const randomizerAdd = (data) => {
    addNode("randomizer", data);
  };

  const videoAdd = (data) => {
    addNode("video", data);
  };

  const singleBlockAdd = (data) => {
    addNode("singleBlock", data);
  };

  const ticketAdd = (data) => {
    addNode("ticket", data);
  };

  const typebotAdd = (data) => {
    addNode("typebot", data);
  };

  const openaiAdd = (data) => {
    addNode("openai", data);
  };

  const geminiAdd = (data) => {
    addNode("gemini", data);
  };

  const questionAdd = (data) => {
    addNode("question", data);
  };

  const kanbanPhaseAdd = (data) => {
    addNode("kanbanPhase", data);
  };

  const addTagAdd = (data) => {
    addNode("addTag", data);
  };

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get(`/flowbuilder/flow/${id}`);
          if (data.flow.flow !== null) {
            const flowNodes = data.flow.flow.nodes
            setNodes(flowNodes);
            setEdges(data.flow.flow.connections);
            const filterVariables = flowNodes.filter(nd  => nd.type === "question")
            const variables = filterVariables.map(variable => variable.data.typebotIntegration.answerKey)
            localStorage.setItem('variables', JSON.stringify(variables))
          }
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [id]);

  useEffect(() => {
    if (storageItems.action === "delete") {
      setNodes((old) => old.filter((item) => item.id !== storageItems.node));
      setEdges((old) => {
        const newData = old.filter((item) => item.source !== storageItems.node);
        const newClearTarget = newData.filter(
          (item) => item.target !== storageItems.node
        );
        return newClearTarget;
      });
      storageItems.setNodesStorage("");
      storageItems.setAct("idle");
    }
    if (storageItems.action === "duplicate") {
      const nodeDuplicate = nodes.filter(
        (item) => item.id === storageItems.node
      )[0];
      const maioresX = nodes.map((node) => node.position.x);
      const maiorX = Math.max(...maioresX);
      const finalY = nodes[nodes.length - 1].position.y;
      const nodeNew = {
        ...nodeDuplicate,
        id: geraStringAleatoria(30),
        position: {
          x: maiorX + 240,
          y: finalY,
        },
        selected: false,
        style: { backgroundColor: "#555555", padding: 0, borderRadius: 8 },
      };
      setNodes((old) => [...old, nodeNew]);
      storageItems.setNodesStorage("");
      storageItems.setAct("idle");
    }
  }, [storageItems.action]);

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "buttonedge", // garante que use RemoveEdge
            data: {
              onDelete: (idToDelete) => {
                setEdges((prev) =>
                  prev.filter((ed) => ed.id !== idToDelete)
                );
              }
            }
          },
          eds
        )
      ),
    [setEdges]
  );


  const saveFlow = async () => {
    await api
      .post("/flowbuilder/flow", {
        idFlow: id,
        nodes: nodes,
        connections: edges,
      })
      .then((res) => {
        toast.success(i18n.t("flowBuilderConfig.messages.flowSaved"));
      });
  };

  const doubleClick = (event, node) => {
    console.log("NODE", node);
    setDataNode(node);
    if (node.type === "message") {
      setModalAddText("edit");
    }
    if (node.type === "interval") {
      setModalAddInterval("edit");
    }

    if (node.type === "menu") {
      setModalAddMenu("edit");
    }
    if (node.type === "img") {
      setModalAddImg("edit");
    }
    if (node.type === "audio") {
      setModalAddAudio("edit");
    }
    if (node.type === "randomizer") {
      setModalAddRandomizer("edit");
    }
    if (node.type === "singleBlock") {
      setModalAddSingleBlock("edit");
    }
    if (node.type === "ticket") {
      setModalAddTicket("edit");
    }
    if (node.type === "typebot") {
      setModalAddTypebot("edit");
    }
    if (node.type === "openai") {
      setModalAddOpenAI("edit");
    }
    if (node.type === "gemini") {
      setModalAddGemini("edit");
    }
    if (node.type === "question") {
      setModalAddQuestion("edit");
    }
    if (node.type === "kanbanPhase") {
      setModalAddKanbanPhase("edit");
    }
    if (node.type === "addTag") {
      setModalAddTag("edit");
    }
  };

  const clickNode = (event, node) => {
    setNodes((old) =>
      old.map((item) => {
        if (item.id === node.id) {
          return {
            ...item,
            style: { backgroundColor: "#0000FF", padding: 1, borderRadius: 8 },
          };
        }
        return {
          ...item,
          style: { backgroundColor: "#13111C", padding: 0, borderRadius: 8 },
        };
      })
    );
  };
  const clickEdge = (event, edge) => {
    setEdges((edges) =>
      edges.map((e) =>
        e.id === edge.id
          ? {
              ...e,
              data: {
                ...(e.data || {}),
                selected: true,
                onDelete: (id) => {
                  setEdges((eds) => eds.filter((ed) => ed.id !== id));
                }
              }
            }
          : { ...e, data: { ...(e.data || {}), selected: false } }
      )
    );
  };


  const updateNode = (dataAlter) => {
    setNodes((old) =>
      old.map((itemNode) => {
        if (itemNode.id === dataAlter.id) {
          return dataAlter;
        }
        return itemNode;
      })
    );
    setModalAddText(null);
    setModalAddInterval(null);
    setModalAddMenu(null);
    setModalAddOpenAI(null);
    setModalAddTypebot(null);
  };

  const actions = [
    {
      icon: <FlowContentIcon style={{ color: "#EC5858", fontSize: 20 }} />,
      name: i18n.t("flowBuilderConfig.nodes.content"),
      type: "content",
      bg: "rgba(236, 88, 88, 0.15)",
    },
    {
      icon: <FlowMenuIcon style={{ color: "#683AC8", fontSize: 20 }} />,
      name: i18n.t("flowBuilderConfig.nodes.menu"),
      type: "menu",
      bg: "rgba(104, 58, 200, 0.15)",
    },
    {
      icon: <FlowRandomizerIcon style={{ color: "#1FBADC", fontSize: 20 }} />,
      name: i18n.t("flowBuilderConfig.nodes.randomizer"),
      type: "random",
      bg: "rgba(31, 186, 220, 0.15)",
    },
    {
      icon: <FlowIntervalIcon style={{ color: "#F7953B", fontSize: 20 }} />,
      name: i18n.t("flowBuilderConfig.nodes.interval"),
      type: "interval",
      bg: "rgba(247, 149, 59, 0.15)",
    },
    {
      icon: <FlowTicketIcon style={{ color: "#F7953B", fontSize: 20 }} />,
      name: i18n.t("flowBuilderConfig.nodes.ticket"),
      type: "ticket",
      bg: "rgba(247, 149, 59, 0.15)",
    },
    {
      icon: <FlowQuestionIcon style={{ color: "#F7953B", fontSize: 20 }} />,
      name: i18n.t("flowBuilderConfig.nodes.question"),
      type: "question",
      bg: "rgba(247, 149, 59, 0.15)",
    },
    {
      icon: <FlowKanbanIcon style={{ color: "#9c27b0", fontSize: 20 }} />,
      name: "Fase Kanban",
      type: "kanbanPhase",
      bg: "rgba(156, 39, 176, 0.15)",
    },
    {
      icon: <FlowTagsIcon style={{ color: "#ff9800", fontSize: 20 }} />,
      name: "Adicionar Tag",
      type: "addTag",
      bg: "rgba(255, 152, 0, 0.15)",
    },
    {
      icon: (
        <Box
          component="img"
          sx={{ width: 20, height: 20 }}
          src={typebotIcon}
          alt="icon"
        />
      ),
      name: i18n.t("flowBuilderConfig.nodes.typebot"),
      type: "typebot",
      bg: "rgba(58, 186, 56, 0.15)",
    },
    {
      icon: <SiOpenai style={{ color: "#10a37f", width: 20, height: 20 }} />,
      name: "Agente GPT",
      type: "openai",
      bg: "rgba(16, 163, 127, 0.15)",
    },
    {
      icon: <SiGoogle style={{ color: "#4285F4", width: 20, height: 20 }} />,
      name: "Agente Gemini",
      type: "gemini",
      bg: "rgba(66, 133, 244, 0.15)",
    },
  ];

  const clickActions = (type) => {
    switch (type) {
      case "menu":
        setModalAddMenu("create");
        break;
      case "content":
        setModalAddSingleBlock("create");
        break;
      case "random":
        setModalAddRandomizer("create");
        break;
      case "interval":
        setModalAddInterval("create");
        break;
      case "ticket":
        setModalAddTicket("create");
        break;
      case "typebot":
        setModalAddTypebot("create");
        break;
      case "openai":
        setModalAddOpenAI("create");
        break;
      case "gemini":
        setModalAddGemini("create");
        break;
      case "question":
        setModalAddQuestion("create");
        break;
      case "kanbanPhase":
        setModalAddKanbanPhase("create");
        break;
      case "addTag":
        setModalAddTag("create");
        break;
      default:
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <FlowBuilderAddTextModal
        open={modalAddText}
        onSave={textAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddText}
      />
      <FlowBuilderIntervalModal
        open={modalAddInterval}
        onSave={intervalAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddInterval}
      />
      <FlowBuilderMenuModal
        open={modalAddMenu}
        onSave={menuAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddMenu}
      />
      <FlowBuilderAddImgModal
        open={modalAddImg}
        onSave={imgAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddImg}
      />
      <FlowBuilderAddAudioModal
        open={modalAddAudio}
        onSave={audioAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddAudio}
      />
      <FlowBuilderRandomizerModal
        open={modalAddRandomizer}
        onSave={randomizerAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddRandomizer}
      />
      <FlowBuilderAddVideoModal
        open={modalAddVideo}
        onSave={videoAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddVideo}
      />
      <FlowBuilderSingleBlockModal
        open={modalAddSingleBlock}
        onSave={singleBlockAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddSingleBlock}
      />
      <FlowBuilderTicketModal
        open={modalAddTicket}
        onSave={ticketAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddTicket}
      />

      <FlowBuilderOpenAIModal
        open={modalAddOpenAI}
        onSave={openaiAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddOpenAI}
      />

      <FlowBuilderGeminiModal
        open={modalAddGemini}
        onSave={geminiAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddGemini}
      />

      <FlowBuilderTypebotModal
        open={modalAddTypebot}
        onSave={typebotAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddTypebot}
      />

      <FlowBuilderAddQuestionModal
        open={modalAddQuestion}
        onSave={questionAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddQuestion}
      />
      <FlowBuilderKanbanPhaseModal
        open={modalAddKanbanPhase}
        onSave={kanbanPhaseAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddKanbanPhase}
      />

      <FlowBuilderAddTagModal
        open={modalAddTag}
        onSave={addTagAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddTag}
      />

      <FlowImportModal open={importModal} onClose={() => setImportModal(false)} />

      {loading && (
        <Stack justifyContent={"center"} alignItems={"center"} height={"100%"}>
          <CircularProgress />
        </Stack>
      )}
      {!loading && (
        <div className="flow-canvas-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            deleteKeyCode={["Backspace", "Delete"]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDoubleClick={doubleClick}
            onNodeClick={clickNode}
            onEdgeClick={clickEdge}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="react-flow"
            defaultEdgeOptions={{
              animated: true,
              className: "edge-line"
            }}
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={-1} />
          </ReactFlow>

          {/* Sidebar de nodes */}
          <div className="flow-sidebar">
            <div className="flow-sidebar__trigger">
              <span className="flow-sidebar__trigger-dot" />
              <span className="flow-sidebar__trigger-dot" />
              <span className="flow-sidebar__trigger-dot" />
            </div>
            <div className="flow-sidebar__panel">
              <div className="flow-sidebar__panel-inner">
                <p className="flow-sidebar__title">Nodes</p>
                {actions.map((action) => (
                  <div
                    key={action.name}
                    className="flow-sidebar__card"
                    onClick={() => clickActions(action.type)}
                  >
                    <div
                      className="flow-sidebar__card-icon"
                      style={{ background: action.bg || "rgba(255,255,255,0.07)" }}
                    >
                      {action.icon}
                    </div>
                    <span className="flow-sidebar__card-label">{action.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botões flutuantes no topo direito */}
          <div className="flow-top-bar">
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none" }}
              startIcon={<UploadFileIcon />}
              onClick={() => setImportModal(true)}
            >
              {i18n.t("flowBuilderConfig.actions.import")}
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none" }}
              startIcon={<GetAppIcon />}
              onClick={() => exportFlow(id)}
            >
              {i18n.t("flowBuilderConfig.actions.export")}
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={saveFlow}
            >
              {i18n.t("flowBuilderConfig.actions.save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};