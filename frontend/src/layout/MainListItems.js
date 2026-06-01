import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useTheme, alpha } from "@material-ui/core/styles";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Collapse,
  List,
  Tooltip,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import {
  HelpOutline,
  ExpandLess,
  ExpandMore,
  PhonelinkSetupRounded,
} from "@mui/icons-material";

import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { useActiveMenu } from "../context/ActiveMenuContext";
import { Can } from "../components/Can";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import usePlans from "../hooks/usePlans";
import { i18n } from "../translate/i18n";
import useHelps from "../hooks/useHelps";

// ---------------- Custom icons ----------------
const QuickReplyIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" {...props}>
    <path d="M8.62814 12.6736H8.16918C6.68545 12.6736 5.94358 12.6736 5.62736 12.1844C5.31114 11.6953 5.61244 11.0138 6.21504 9.65083L8.02668 5.55323C8.57457 4.314 8.84852 3.69438 9.37997 3.34719C9.91142 3 10.5859 3 11.935 3H14.0244C15.6632 3 16.4826 3 16.7916 3.53535C17.1007 4.0707 16.6942 4.78588 15.8811 6.21623L14.8092 8.10188C14.405 8.81295 14.2029 9.16849 14.2057 9.45952C14.2094 9.83775 14.4105 10.1862 14.7354 10.377C14.9854 10.5239 15.3927 10.5239 16.2074 10.5239C17.2373 10.5239 17.7523 10.5239 18.0205 10.7022C18.3689 10.9338 18.5513 11.3482 18.4874 11.7632C18.4382 12.0826 18.0918 12.4656 17.399 13.2317L11.8639 19.3523C10.7767 20.5545 10.2331 21.1556 9.86807 20.9654C9.50303 20.7751 9.67833 19.9822 10.0289 18.3962L10.7157 15.2896C10.9826 14.082 11.1161 13.4782 10.7951 13.0759C10.4741 12.6736 9.85877 12.6736 8.62814 12.6736Z" />
  </svg>
);

const GerenciaIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 21H16M14 21C13.1716 21 12.5 20.3284 12.5 19.5V17L12 17M14 21H10M10 21H8M10 21C10.8284 21 11.5 20.3284 11.5 19.5V17L12 17M12 17V21" />
    <path d="M16 3H8C5.17157 3 3.75736 3 2.87868 3.87868C2 4.75736 2 6.17157 2 9V11C2 13.8284 2 15.2426 2.87868 16.1213C3.75736 17 5.17157 17 8 17H16C18.8284 17 20.2426 17 21.1213 16.1213C22 15.2426 22 13.8284 22 11V9C22 6.17157 22 4.75736 21.1213 3.87868C20.2426 3 18.8284 3 16 3Z" />
    <path d="M16 8L13.5 10.5C13.2274 10.7726 13.0911 10.9089 12.944 10.9818C12.6642 11.1204 12.3358 11.1204 12.056 10.9818C11.9089 10.9089 11.7726 10.7726 11.5 10.5C11.2274 10.2274 11.0911 10.0911 10.944 10.0182C10.6642 9.87955 10.3358 9.87955 10.056 10.0182C9.90894 10.0911 9.77262 10.2274 9.5 10.5L7 13M14 7H15.7143C16.3204 7 16.6234 7 16.8117 7.18829C17 7.37658 17 7.67962 17 8.28571V10" />
  </svg>
);

const DashboardIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
    <path d="M21 21H10C6.70017 21 5.05025 21 4.02513 19.9749C3 18.9497 3 17.2998 3 14V3" />
    <path d="M5 20C5.43938 16.8438 7.67642 8.7643 10.4282 8.7643C12.3301 8.7643 12.8226 12.6353 14.6864 12.6353C17.8931 12.6353 17.4282 4 21 4" />
  </svg>
);

const RelatoriosIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 4V14C3 16.8284 3 18.2426 3.87868 19.1213C4.75736 20 6.17157 20 9 20H21" />
    <path d="M7 16L16 16" />
    <path d="M7 12L20 12" />
    <path d="M7 8L13 8" />
  </svg>
);

const PainelIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="round" {...props}>
    <path d="M13.6903 19.4567C13.5 18.9973 13.5 18.4149 13.5 17.25C13.5 16.0851 13.5 15.5027 13.6903 15.0433C13.944 14.4307 14.4307 13.944 15.0433 13.6903C15.5027 13.5 16.0851 13.5 17.25 13.5C18.4149 13.5 18.9973 13.5 19.4567 13.6903C20.0693 13.944 20.556 14.4307 20.8097 15.0433C21 15.5027 21 16.0851 21 17.25C21 18.4149 21 18.9973 20.8097 19.4567C20.556 20.0693 20.0693 20.556 19.4567 20.8097C18.9973 21 18.4149 21 17.25 21C16.0851 21 15.5027 21 15.0433 20.8097C14.4307 20.556 13.944 20.0693 13.6903 19.4567Z" />
    <path d="M13.6903 8.95671C13.5 8.49728 13.5 7.91485 13.5 6.75C13.5 5.58515 13.5 5.00272 13.6903 4.54329C13.944 3.93072 14.4307 3.44404 15.0433 3.1903C15.5027 3 16.0851 3 17.25 3C18.4149 3 18.9973 3 19.4567 3.1903C20.0693 3.44404 20.556 3.93072 20.8097 4.54329C21 5.00272 21 5.58515 21 6.75C21 7.91485 21 8.49728 20.8097 8.95671C20.556 9.56928 20.0693 10.056 19.4567 10.3097C18.9973 10.5 18.4149 10.5 17.25 10.5C16.0851 10.5 15.5027 10.5 15.0433 10.3097C14.4307 10.056 13.944 9.56928 13.6903 8.95671Z" />
    <path d="M3.1903 19.4567C3 18.9973 3 18.4149 3 17.25C3 16.0851 3 15.5027 3.1903 15.0433C3.44404 14.4307 3.93072 13.944 4.54329 13.6903C5.00272 13.5 5.58515 13.5 6.75 13.5C7.91485 13.5 8.49728 13.5 8.95671 13.6903C9.56928 13.944 10.056 14.4307 10.3097 15.0433C10.5 15.5027 10.5 16.0851 10.5 17.25C10.5 18.4149 10.5 18.9973 10.3097 19.4567C10.056 20.0693 9.56928 20.556 8.95671 20.8097C8.49728 21 7.91485 21 6.75 21C5.58515 21 5.00272 21 4.54329 20.8097C3.93072 20.556 3.44404 20.0693 3.1903 19.4567Z" />
    <path d="M3.1903 8.95671C3 8.49728 3 7.91485 3 6.75C3 5.58515 3 5.00272 3.1903 4.54329C3.44404 3.93072 3.93072 3.44404 4.54329 3.1903C5.00272 3 5.58515 3 6.75 3C7.91485 3 8.49728 3 8.95671 3.1903C9.56928 3.44404 10.056 3.93072 10.3097 4.54329C10.5 5.00272 10.5 5.58515 10.5 6.75C10.5 7.91485 10.5 8.49728 10.3097 8.95671C10.056 9.56928 9.56928 10.056 8.95671 10.3097C8.49728 10.5 7.91485 10.5 6.75 10.5C5.58515 10.5 5.00272 10.5 4.54329 10.3097C3.93072 10.056 3.44404 9.56928 3.1903 8.95671Z" />
  </svg>
);

const KanbanIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 21C15.7497 21 17.6246 21 18.9389 20.0451C19.3634 19.7367 19.7367 19.3634 20.0451 18.9389C21 17.6246 21 15.7497 21 12C21 8.25027 21 6.3754 20.0451 5.06107C19.7367 4.6366 19.3634 4.26331 18.9389 3.95491C17.6246 3 15.7497 3 12 3C8.25027 3 6.3754 3 5.06107 3.95491C4.6366 4.26331 4.26331 4.6366 3.95491 5.06107C3 6.3754 3 8.25027 3 12C3 15.7497 3 17.6246 3.95491 18.9389C4.26331 19.3634 4.6366 19.7367 5.06107 20.0451C6.3754 21 8.25027 21 12 21Z" />
    <path d="M12 7V11M17 7V17M7 7V14" />
  </svg>
);

const ContatosIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <rect x="4" y="2" width="17.5" height="20" rx="4" />
    <path d="M10.59 13.7408C9.96125 14.162 8.31261 15.0221 9.31674 16.0983C9.80725 16.624 10.3536 17 11.0404 17H14.9596C15.6464 17 16.1928 16.624 16.6833 16.0983C17.6874 15.0221 16.0388 14.162 15.41 13.7408C13.9355 12.7531 12.0645 12.7531 10.59 13.7408Z" />
    <path d="M15 9C15 10.1046 14.1046 11 13 11C11.8954 11 11 10.1046 11 9C11 7.89543 11.8954 7 13 7C14.1046 7 15 7.89543 15 9Z" />
    <path d="M5 6L2.5 6M5 12L2.5 12M5 18H2.5" />
  </svg>
);

const AgendamentosIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 2V6M8 2V6" />
    <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" />
    <path d="M3 10H21" />
    <path d="M15.5 15.5V17.5M17 16.5C17 17.3284 16.3284 18 15.5 18C14.6716 18 14 17.3284 14 16.5C14 15.6716 14.6716 15 15.5 15C16.3284 15 17 15.6716 17 16.5Z" />
  </svg>
);

const TagIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M2.73552 11.6867C1.78253 12.7511 1.76203 14.3569 2.63665 15.4865C4.37226 17.7281 6.2719 19.6277 8.51351 21.3633C9.64313 22.238 11.2489 22.2175 12.3133 21.2645C15.203 18.6771 17.8494 15.9731 20.4033 13.0016C20.6558 12.7078 20.8137 12.3477 20.8492 11.9619C21.0059 10.2561 21.3279 5.34144 19.9932 4.00675C18.6586 2.67207 13.7439 2.99408 12.0381 3.15083C11.6523 3.18627 11.2922 3.34421 10.9984 3.59671C8.02692 6.15064 5.32291 8.797 2.73552 11.6867Z" />
    <path d="M7.5 14.5L9.5 16.5" />
    <path d="M18 6L22 2" />
  </svg>
);

const ChatIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 9C19.2048 5.01455 15.5128 2 11.0793 2C6.06549 2 2 5.85521 2 10.61C2 12.8946 2.93819 14.9704 4.46855 16.5108C4.80549 16.85 5.03045 17.3134 4.93966 17.7903C4.78982 18.5701 4.45026 19.2975 3.95305 19.9037C5.26123 20.1449 6.62147 19.9277 7.78801 19.3127C8.20039 19.0954 8.40657 18.9867 8.55207 18.9646C8.65392 18.9492 8.78659 18.9636 9 19.0002" />
    <path d="M11 16.2617C11 19.1674 13.4628 21.5234 16.5 21.5234C16.8571 21.5238 17.2132 21.4908 17.564 21.425C17.8165 21.3775 17.9428 21.3538 18.0309 21.3673C18.119 21.3807 18.244 21.4472 18.4938 21.58C19.2004 21.9558 20.0244 22.0885 20.8169 21.9411C20.5157 21.5707 20.31 21.1262 20.2192 20.6496C20.1642 20.3582 20.3005 20.075 20.5046 19.8677C21.4317 18.9263 22 17.6578 22 16.2617C22 13.356 19.5372 11 16.5 11C13.4628 11 11 13.356 11 16.2617Z" />
  </svg>
);

const CampanhasIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.9263 4.41103L8.27352 7.60452C7.76151 7.85029 7.21443 7.91187 6.65675 7.78693C6.29177 7.70517 6.10926 7.66429 5.9623 7.64751C4.13743 7.43912 3 8.88342 3 10.5443V11.4557C3 13.1166 4.13743 14.5609 5.9623 14.3525C6.10926 14.3357 6.29178 14.2948 6.65675 14.2131C7.21443 14.0881 7.76151 14.1497 8.27352 14.3955L14.9263 17.589C16.4534 18.3221 17.217 18.6886 18.0684 18.4029C18.9197 18.1172 19.2119 17.5041 19.7964 16.278C21.4012 12.9112 21.4012 9.08885 19.7964 5.72196C19.2119 4.49586 18.9197 3.88281 18.0684 3.5971C17.217 3.3114 16.4534 3.67794 14.9263 4.41103Z" />
    <path d="M13 17V17.5C13 18.7841 13 19.4261 12.776 19.7886C12.4773 20.2719 11.9312 20.545 11.3653 20.4939C10.9409 20.4557 10.4273 20.0704 9.4 19.3L8.2 18.4C7.22253 17.6669 7 17.2218 7 16V14.5" />
    <path d="M7.5 14V8" />
  </svg>
);

const ListagemIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.4999 14V10C20.4999 6.22876 20.4999 4.34315 19.3284 3.17157C18.1568 2 16.2712 2 12.4999 2H11.5C7.72883 2 5.84323 2 4.67166 3.17156C3.50008 4.34312 3.50007 6.22872 3.50004 9.99993L3.5 13.9999C3.49997 17.7712 3.49995 19.6568 4.67153 20.8284C5.8431 22 7.72873 22 11.5 22H12.4999C16.2712 22 18.1568 22 19.3284 20.8284C20.4999 19.6569 20.4999 17.7712 20.4999 14Z" />
    <path d="M8 7H16M8 12H16M8 17L12 17" />
  </svg>
);

const ListaContatosIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M13 11C13 8.79086 11.2091 7 9 7C6.79086 7 5 8.79086 5 11C5 13.2091 6.79086 15 9 15C11.2091 15 13 13.2091 13 11Z" />
    <path d="M11.0386 7.55773C11.0131 7.37547 11 7.18927 11 7C11 4.79086 12.7909 3 15 3C17.2091 3 19 4.79086 19 7C19 9.20914 17.2091 11 15 11C14.2554 11 13.5584 10.7966 12.9614 10.4423" />
    <path d="M15 21C15 17.6863 12.3137 15 9 15C5.68629 15 3 17.6863 3 21" />
    <path d="M21 17C21 13.6863 18.3137 11 15 11" />
  </svg>
);

const ConfiguracoesIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
    <path d="M21.3175 7.14139L20.8239 6.28479C20.4506 5.63696 20.264 5.31305 19.9464 5.18388C19.6288 5.05472 19.2696 5.15664 18.5513 5.36048L17.3311 5.70418C16.8725 5.80994 16.3913 5.74994 15.9726 5.53479L15.6357 5.34042C15.2766 5.11043 15.0004 4.77133 14.8475 4.37274L14.5136 3.37536C14.294 2.71534 14.1842 2.38533 13.9228 2.19657C13.6615 2.00781 13.3143 2.00781 12.6199 2.00781H11.5051C10.8108 2.00781 10.4636 2.00781 10.2022 2.19657C9.94085 2.38533 9.83106 2.71534 9.61149 3.37536L9.27753 4.37274C9.12465 4.77133 8.84845 5.11043 8.48937 5.34042L8.15249 5.53479C7.73374 5.74994 7.25259 5.80994 6.79398 5.70418L5.57375 5.36048C4.85541 5.15664 4.49625 5.05472 4.17867 5.18388C3.86109 5.31305 3.67445 5.63696 3.30115 6.28479L2.80757 7.14139C2.45766 7.74864 2.2827 8.05227 2.31666 8.37549C2.35061 8.69871 2.58483 8.95918 3.05326 9.48012L4.0843 10.6328C4.3363 10.9518 4.51521 11.5078 4.51521 12.0077C4.51521 12.5078 4.33636 13.0636 4.08433 13.3827L3.05326 14.5354C2.58483 15.0564 2.35062 15.3168 2.31666 15.6401C2.2827 15.9633 2.45766 16.2669 2.80757 16.8741L3.30114 17.7307C3.67443 18.3785 3.86109 18.7025 4.17867 18.8316C4.49625 18.9608 4.85542 18.8589 5.57377 18.655L6.79394 18.3113C7.25263 18.2055 7.73387 18.2656 8.15267 18.4808L8.4895 18.6752C8.84851 18.9052 9.12464 19.2442 9.2775 19.6428L9.61149 20.6403C9.83106 21.3003 9.94085 21.6303 10.2022 21.8191C10.4636 22.0078 10.8108 22.0078 11.5051 22.0078H12.6199C13.3143 22.0078 13.6615 22.0078 13.9228 21.8191C14.1842 21.6303 14.294 21.3003 14.5136 20.6403L14.8476 19.6428C15.0004 19.2442 15.2765 18.9052 15.6356 18.6752L15.9724 18.4808C16.3912 18.2656 16.8724 18.2055 17.3311 18.3113L18.5513 18.655C19.2696 18.8589 19.6288 18.9608 19.9464 18.8316C20.264 18.7025 20.4506 18.3785 20.8239 17.7307L21.3175 16.8741C21.6674 16.2669 21.8423 15.9633 21.8084 15.6401C21.7744 15.3168 21.5402 15.0564 21.0718 14.5354L20.0407 13.3827C19.7887 13.0636 19.6098 12.5078 19.6098 12.0077C19.6098 11.5078 19.7888 10.9518 20.0407 10.6328L21.0718 9.48012C21.5402 8.95918 21.7744 8.69871 21.8084 8.37549C21.8423 8.05227 21.6674 7.74864 21.3175 7.14139Z" />
    <path d="M15.5195 12C15.5195 13.933 13.9525 15.5 12.0195 15.5C10.0865 15.5 8.51953 13.933 8.51953 12C8.51953 10.067 10.0865 8.5 12.0195 8.5C13.9525 8.5 15.5195 10.067 15.5195 12Z" />
  </svg>
);

const FluxoConversaIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M18 4.5C18 5.88071 16.8807 7 15.5 7C14.1193 7 13 5.88071 13 4.5C13 3.11929 14.1193 2 15.5 2C16.8807 2 18 3.11929 18 4.5Z" />
    <path d="M18 19.5C18 20.8807 16.8807 22 15.5 22C14.1193 22 13 20.8807 13 19.5C13 18.1193 14.1193 17 15.5 17C16.8807 17 18 18.1193 18 19.5Z" />
    <path d="M10 12C10 14.2091 8.20914 16 6 16C3.79086 16 2 14.2091 2 12C2 9.79086 3.79086 8 6 8C8.20914 8 10 9.79086 10 12Z" />
    <path d="M22 4.50006L18 4.49997M6 7.99988C6 6.59542 6 5.89319 6.33706 5.38874C6.48298 5.17036 6.67048 4.98286 6.88886 4.83694C7.39331 4.49988 8.09554 4.49988 9.5 4.49988H13M22 19.5002L18 19.5001M6 16.0002C6 17.4046 6 18.1069 6.33706 18.6113C6.48298 18.8297 6.67048 19.0172 6.88886 19.1631C7.39331 19.5002 8.09554 19.5002 9.5 19.5002H13" />
  </svg>
);

const FluxoCampanhaIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M3 4C3 2.34533 3.34533 2 5 2H9C10.6547 2 11 2.34533 11 4C11 5.65467 10.6547 6 9 6H5C3.34533 6 3 5.65467 3 4Z" />
    <path d="M13 13C13 11.3453 13.3453 11 15 11H19C20.6547 11 21 11.3453 21 13C21 14.6547 20.6547 15 19 15H15C13.3453 15 13 14.6547 13 13Z" />
    <path d="M4 20C4 18.3453 4.34533 18 6 18H10C11.6547 18 12 18.3453 12 20C12 21.6547 11.6547 22 10 22H6C4.34533 22 4 21.6547 4 20Z" />
    <path d="M17 11C17 10.5353 17 10.303 16.9616 10.1098C16.8038 9.31644 16.1836 8.69624 15.3902 8.53843C15.197 8.5 14.9647 8.5 14.5 8.5H9.5C9.03534 8.5 8.80302 8.5 8.60982 8.46157C7.81644 8.30376 7.19624 7.68356 7.03843 6.89018C7 6.69698 7 6.46466 7 6" />
    <path d="M17 15V16C17 17.8856 17 18.8284 16.4142 19.4142C15.8284 20 14.8856 20 13 20H12" />
  </svg>
);

const InformativosIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.0045 11H12.0135M8.00903 11H8.018" />
    <path d="M14 3.0191C13.3467 3.00651 12.679 3 12 3C10.5209 3 9.09517 3.0309 7.7562 3.08819C5.3157 3.1926 4.09545 3.24481 3.13007 4.21745C2.16469 5.19009 2.12282 6.37683 2.03909 8.7503C2.01346 9.47679 2 10.2292 2 11C2 11.7708 2.01346 12.5232 2.03909 13.2497C2.12282 15.6232 2.16469 16.8099 3.13007 17.7825C4.09545 18.7552 5.31569 18.8074 7.75619 18.9118C7.83715 18.9153 7.91842 18.9186 8 18.9219V21.2701C8 21.6732 8.32679 22 8.72991 22C8.90419 22 9.07273 21.9376 9.20503 21.8242L11.3845 19.9553C11.9325 19.4855 12.2064 19.2506 12.532 19.1266C12.8576 19.0026 13.2282 18.9955 13.9693 18.9815C14.7498 18.9667 15.5098 18.9432 16.2437 18.9118C18.6843 18.8074 19.9046 18.7552 20.8699 17.7826C21.8353 16.8099 21.8772 15.6232 21.9609 13.2497C21.981 12.6811 21.9936 12.0967 21.9981 11.5" />
    <path d="M16 8.49951C16 6.84266 17.3431 5.49951 19 5.49951M19 5.49951C20.6569 5.49951 22 6.84266 22 8.49951M19 5.49951C19.9665 5.49951 20.75 4.7165 20.75 3.75C20.75 2.7835 19.9665 2 19 2C18.0335 2 17.25 2.7835 17.25 3.75C17.25 4.7165 18.0335 5.49951 19 5.49951Z" />
  </svg>
);

const ApiIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5.99998 22C5.99998 22 3.00001 19.7905 3 19C3 18.2094 6 16 6 16" />
    <path d="M10 22C10 22 13 19.7905 13 19C13 18.2094 10 16 10 16" />
    <path d="M5 12V9.45584C5 6.21082 5 4.58831 5.88607 3.48933C6.06508 3.26731 6.26731 3.06508 6.48933 2.88607C7.58831 2 9.21082 2 12.4558 2C13.1614 2 13.5141 2 13.8372 2.11401C13.9044 2.13772 13.9702 2.165 14.0345 2.19575C14.3436 2.34355 14.593 2.593 15.0919 3.09188L19.8284 7.82843C20.4065 8.40649 20.6955 8.69552 20.8478 9.06306C21 9.4306 21 9.83935 21 10.6569V14C21 17.7712 21 19.6569 19.8284 20.8284C18.8853 21.7715 17.4796 21.9554 15 21.9913M14 2.5V3C14 5.82843 14 7.24264 14.8787 8.12132C15.7574 9 17.1716 9 20 9H20.5" />
  </svg>
);

const UsuariosIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 8.5C17 5.73858 14.7614 3.5 12 3.5C9.23858 3.5 7 5.73858 7 8.5C7 11.2614 9.23858 13.5 12 13.5C14.7614 13.5 17 11.2614 17 8.5Z" />
    <path d="M19 20.5C19 16.634 15.866 13.5 12 13.5C8.13401 13.5 5 16.634 5 20.5" />
  </svg>
);

const FilasIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 9H6.65856C5.65277 9 5.14987 9 5.02472 8.69134C4.89957 8.38268 5.25517 8.01942 5.96637 7.29289L8.21091 5" />
    <path d="M5 15H17.3414C18.3472 15 18.8501 15 18.9753 15.3087C19.1004 15.6173 18.7448 15.9806 18.0336 16.7071L15.7891 19" />
  </svg>
);

const PromptsIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
    <path d="M9 7H16.75C18.8567 7 19.91 7 20.6667 7.50559C20.9943 7.72447 21.2755 8.00572 21.4944 8.33329C22 9.08996 22 10.1433 22 12.25C22 15.7612 22 17.5167 21.1573 18.7779C20.7926 19.3238 20.3238 19.7926 19.7779 20.1573C18.5167 21 16.7612 21 13.25 21H12C7.28595 21 4.92893 21 3.46447 19.5355C2 18.0711 2 15.714 2 11V7.94427C2 6.1278 2 5.21956 2.38032 4.53806C2.65142 4.05227 3.05227 3.65142 3.53806 3.38032C4.21956 3 5.1278 3 6.94427 3C8.10802 3 8.6899 3 9.19926 3.19101C10.3622 3.62712 10.8418 4.68358 11.3666 5.73313L12 7" />
    <path d="M15.5 12L16.4199 12.7929C16.8066 13.1262 17 13.2929 17 13.5C17 13.7071 16.8066 13.8738 16.4199 14.2071L15.5 15" />
    <path d="M8.5 12L7.58009 12.7929C7.19337 13.1262 7 13.2929 7 13.5C7 13.7071 7.19336 13.8738 7.58009 14.2071L8.5 15" />
    <path d="M13 11L11 16" />
  </svg>
);

const IntegracoesIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M17.854 12.16C17.471 12.6105 16.7631 12.6138 16.3165 12.1671L11.8329 7.68351C11.3862 7.23686 11.3895 6.529 11.84 6.14596L13.071 5.09939C13.9559 4.34704 15.0349 3.84824 16.2044 3.6509L16.9294 3.52858C17.614 3.41306 18.3339 3.65221 18.8475 4.16577L19.8342 5.15255C20.3478 5.66611 20.5869 6.38601 20.4714 7.07063L20.3491 7.79559C20.1518 8.9651 19.653 10.0441 18.9006 10.929L17.854 12.16Z" />
    <path d="M19.5 4.5L21.5 2.5" />
    <path d="M2.5 21.5L4.5 19.5" />
    <path d="M6.14596 11.84C6.52901 11.3895 7.23686 11.3862 7.68351 11.8329L12.1671 16.3165C12.6138 16.7631 12.6105 17.471 12.16 17.854L10.929 18.9006C10.0441 19.653 8.9651 20.1518 7.79559 20.3491L7.07063 20.4714C6.38601 20.5869 5.66611 20.3478 5.15255 19.8342L4.16577 18.8475C3.65221 18.3339 3.41306 17.614 3.52858 16.9294L3.6509 16.2044C3.84824 15.0349 4.34704 13.9559 5.09939 13.071L6.14596 11.84Z" />
    <path d="M8.5 12.5L10.5 10.5M11.5 15.5L13.5 13.5" />
  </svg>
);

const ConexoesIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
    <path d="M8 12.3735C9.14883 11.5048 10.5209 11 11.9946 11C13.4729 11 14.849 11.508 16 12.3818M14.1743 14.7179C13.5182 14.3376 12.7779 14.1237 11.9946 14.1237C11.2152 14.1237 10.4784 14.3355 9.82477 14.7122" />
    <path d="M12 17.5H12.0064" />
    <path d="M7 6H7.00635" />
    <path d="M11 6H11.0064" />
    <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" />
  </svg>
);

const FinanceiroIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19.7453 13C20.5362 11.8662 21 10.4872 21 9C21 5.13401 17.866 2 14 2C10.134 2 7 5.134 7 9C7 10.0736 7.24169 11.0907 7.67363 12" />
    <path d="M12.4375 11.6667L12.4375 6.33333M14 6.33333V5M14 13V11.6667M12.4375 9H15.5625M15.5625 9C16.0803 9 16.5 9.44772 16.5 10V10.6667C16.5 11.219 16.0803 11.6667 15.5625 11.6667H11.5M15.5625 9C16.0803 9 16.5 8.55228 16.5 8V7.33333C16.5 6.78105 16.0803 6.33333 15.5625 6.33333H11.5" />
    <path d="M3 14H5.39482C5.68897 14 5.97908 14.0663 6.24217 14.1936L8.28415 15.1816C8.54724 15.3089 8.83735 15.3751 9.1315 15.3751H10.1741C11.1825 15.3751 12 16.1662 12 17.142C12 17.1814 11.973 17.2161 11.9338 17.2269L9.39287 17.9295C8.93707 18.0555 8.449 18.0116 8.025 17.8064L5.84211 16.7503M12 16.5L16.5928 15.0889C17.407 14.8352 18.2871 15.136 18.7971 15.8423C19.1659 16.3529 19.0157 17.0842 18.4785 17.3942L10.9629 21.7305C10.4849 22.0063 9.92094 22.0736 9.39516 21.9176L3 20.0199" />
  </svg>
);

const AtendimentosIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 10.5C2 9.72921 2.01346 8.97679 2.03909 8.2503C2.12282 5.87683 2.16469 4.69009 3.13007 3.71745C4.09545 2.74481 5.3157 2.6926 7.7562 2.58819C9.09517 2.5309 10.5209 2.5 12 2.5C13.4791 2.5 14.9048 2.5309 16.2438 2.58819C18.6843 2.6926 19.9046 2.74481 20.8699 3.71745C21.8353 4.69009 21.8772 5.87683 21.9609 8.2503C21.9865 8.97679 22 9.72921 22 10.5C22 11.2708 21.9865 12.0232 21.9609 12.7497C21.8772 15.1232 21.8353 16.3099 20.8699 17.2826C19.9046 18.2552 18.6843 18.3074 16.2437 18.4118C15.5098 18.4432 14.7498 18.4667 13.9693 18.4815C13.2282 18.4955 12.8576 18.5026 12.532 18.6266C12.2064 18.7506 11.9325 18.9855 11.3845 19.4553L9.20503 21.3242C9.07273 21.4376 8.90419 21.5 8.72991 21.5C8.32679 21.5 8 21.1732 8 20.7701V18.4219C7.91842 18.4186 7.83715 18.4153 7.75619 18.4118C5.31569 18.3074 4.09545 18.2552 3.13007 17.2825C2.16469 16.3099 2.12282 15.1232 2.03909 12.7497C2.01346 12.0232 2 11.2708 2 10.5Z" />
    <path d="M8.5 13.9984C8.5 12.0654 10.067 10.4984 12 10.4984C13.933 10.4984 15.5 12.0654 15.5 13.9984M14 8.5C14 9.60457 13.1046 10.5 12 10.5C10.8954 10.5 10 9.60457 10 8.5C10 7.39543 10.8954 6.5 12 6.5C13.1046 6.5 14 7.39543 14 8.5Z" />
  </svg>
);

const EmpresasIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8.5 6.5C8.5 5.09554 8.5 4.39331 8.83706 3.88886C8.98298 3.67048 9.17048 3.48298 9.38886 3.33706C9.89331 3 10.5955 3 12 3C13.4045 3 14.1067 3 14.6111 3.33706C14.8295 3.48298 15.017 3.67048 15.1629 3.88886C15.5 4.39331 15.5 5.09554 15.5 6.5" />
    <path d="M22 14V13.5C22 10.2002 22 8.55025 20.9749 7.52513C19.9497 6.5 18.2998 6.5 15 6.5H9C5.70017 6.5 4.05025 6.5 3.02513 7.52513C2 8.55025 2 10.2002 2 13.5V14C2 17.2998 2 18.9497 3.02513 19.9749C4.05025 21 5.70017 21 9 21H15C18.2998 21 19.9497 21 20.9749 19.9749C22 18.9497 22 17.2998 22 14Z" />
    <path d="M2 11C2 11 4.63158 15 12 15C19.3684 15 22 11 22 11" />
    <path d="M12 12H12.009" />
  </svg>
);

// ---------------- Icon palette ----------------
const iconStyles = {
  dashboard: { color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" },
  tickets: { color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
  messages: { color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" },
  kanban: { color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)" },
  contacts: { color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" },
  schedules: { color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)" },
  tags: { color: "#14b8a6", gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" },
  chats: { color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" },
  helps: { color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
  campaigns: { color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
  flowbuilder: { color: "#84cc16", gradient: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)" },
  announcements: { color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
  api: { color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" },
  users: { color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
  queues: { color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)" },
  prompts: { color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)" },
  integrations: { color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)" },
  connections: { color: "#64748b", gradient: "linear-gradient(135deg, #64748b 0%, #475569 100%)" },
  files: { color: "#14b8a6", gradient: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)" },
  financial: { color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #065f46 100%)" },
  settings: { color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" },
  companies: { color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" },
};

// ---------------- i18n helpers ----------------
const lang = () => (i18n?.language || "pt").split("-")[0].toLowerCase();

/**
 * tLang: tenta i18n.t(key). Se não existir, usa fallback por idioma atual.
 * Ex.: tLang("mainDrawer.listItems.tickets", "Atendimentos", "Services")
 */
const tLang = (key, pt, en) => {
  try {
    const v = i18n.t(key);
    if (v && v !== key) return v;
  } catch (_) {}
  return lang() === "en" ? en : pt;
};

// ---------------- theme helpers ----------------
const getPaletteMode = (theme) => theme?.mode ?? theme?.palette?.mode ?? theme?.palette?.type ?? "light";
const labelColor = (theme, isActive, iconColor) =>
  getPaletteMode(theme) === "dark" ? "#ffffff" : (isActive ? iconColor : "#666");

// ---------------- reducer ----------------
const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];
    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) state[chatIndex] = chat;
        else newChats.push(chat);
      });
    }
    return [...state, ...newChats];
  }
  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);
    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    }
    return [chat, ...state];
  }
  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) state.splice(chatIndex, 1);
    return [...state];
  }
  if (action.type === "RESET") return [];
  if (action.type === "CHANGE_CHAT") {
    return state.map((chat) => (chat.id === action.payload.chat.id ? action.payload.chat : chat));
  }
  return state;
};

// ---------------- Item de link ----------------
function ListItemLink({ icon, primary, to, showBadge, iconKey, small, collapsed }) {
  const theme = useTheme();
  const { activeMenu } = useActiveMenu();
  const location = useLocation();
  const isActive = activeMenu === to || location.pathname === to;
  const iconStyle = iconStyles[iconKey] || iconStyles.dashboard;

  // Debug: verificar se o tema está sendo lido corretamente
  const isDark = theme.mode === "dark" || theme.palette?.mode === "dark" || theme.palette?.type === "dark";
  const textColor = isDark ? "#ffffff" : "#666";
  const activeAccent = isDark ? "#ffffff" : "#666";

  const renderLink = React.useMemo(
    () => React.forwardRef((itemProps, ref) => <RouterLink to={to} ref={ref} {...itemProps} />),
    [to]
  );

  return (
    <Tooltip title={collapsed ? primary : ""} placement="right">
      <li>
        <ListItem
          button
          component={renderLink}
          sx={{
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            minHeight: small ? 40 : 48,
            pl: collapsed ? 2 : small ? 4 : 2,
            pr: collapsed ? 2 : "auto",
            justifyContent: collapsed ? "center" : "flex-start",
            position: "relative",
            overflow: "hidden",
            background: isActive ? alpha(activeAccent, 0.12) : "transparent",
            "&:hover": { background: alpha(activeAccent, 0.08) },
            "&::before": isActive
              ? {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: activeAccent,
                  borderRadius: "0 4px 4px 0",
                }
              : {},
            "& .MuiListItemText-primary": {
              color: `${textColor} !important`,
            },
          }}
        >
          {icon && (
            <ListItemIcon
              sx={{
                minWidth: collapsed ? "auto" : 40,
                justifyContent: "center",
              }}
            >
              {showBadge ? (
                <Badge
                  badgeContent="!"
                  color="error"
                  overlap="circular"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "10px",
                      height: 16,
                      minWidth: 16,
                      padding: "0 4px",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: `${textColor} !important`,
                      "& svg": { color: `${textColor} !important` },
                    }}
                  >
                    {icon}
                  </Box>
                </Badge>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: `${textColor} !important`,
                    "& svg": { color: `${textColor} !important` },
                  }}
                >
                  {icon}
                </Box>
              )}
            </ListItemIcon>
          )}
          {!collapsed && (
            <ListItemText
              primary={primary}
              primaryTypographyProps={{
                sx: {
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 500 : 400,
                  color: `${textColor} !important`,
                },
              }}
            />
          )}
        </ListItem>
      </li>
    </Tooltip>
  );
}

// ---------------- Main ----------------
const MainListItems = ({ collapsed, drawerClose }) => {
  const theme = useTheme();
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, socket } = useContext(AuthContext);
  const { setActiveMenu } = useActiveMenu();
  const location = useLocation();

  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [openFlowSubmenu, setOpenFlowSubmenu] = useState(false);
  const [openDashboardSubmenu, setOpenDashboardSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);
  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const { list } = useHelps();
  const [hasHelps, setHasHelps] = useState(false);

  // re-render no changeLanguage
  const [, force] = useState(0);
  useEffect(() => {
    const rerender = () => force((n) => n + 1);
    i18n.on("languageChanged", rerender);
    return () => i18n.off("languageChanged", rerender);
  }, []);

  useEffect(() => {
    async function checkHelps() {
      // Não fazer requisição se não houver usuário autenticado
      if (!user || !user.id) {
        setHasHelps(false);
        return;
      }

      try {
        const helps = await list();
        setHasHelps(helps.length > 0);
      } catch (error) {
        // Ignora erros de autenticação durante logout
        if (error?.response?.status !== 401) {
          console.error("Erro ao buscar helps:", error);
        }
        setHasHelps(false);
      }
    }
    checkHelps();
  }, [list, user]);

  const isManagementActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/reports") ||
    location.pathname.startsWith("/moments");

  const isCampaignRouteActive =
    location.pathname === "/campaigns" ||
    location.pathname.startsWith("/contact-lists") ||
    location.pathname.startsWith("/campaigns-config");

  const isFlowbuilderRouteActive =
    location.pathname.startsWith("/phrase-lists") ||
    location.pathname.startsWith("/flowbuilders");

  useEffect(() => {
    setActiveMenu(location.pathname.startsWith("/tickets") ? "/tickets" : "");
  }, [location, setActiveMenu]);

  useEffect(() => {
    if (collapsed) {
      setOpenCampaignSubmenu(false);
      setOpenFlowSubmenu(false);
      setOpenDashboardSubmenu(false);
    }
  }, [collapsed]);

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      if (user.companyId) {
        const companyId = user.companyId;
        const planConfigs = await getPlanCompany(undefined, companyId);
        // Verificar se plan existe antes de acessar propriedades
        if (planConfigs && planConfigs.plan) {
          setShowCampaigns(planConfigs.plan.useCampaigns);
          setShowKanban(planConfigs.plan.useKanban);
          setShowOpenAi(planConfigs.plan.useOpenAi);
          setShowIntegrations(planConfigs.plan.useIntegrations);
          setShowSchedules(planConfigs.plan.useSchedules);
          setShowInternalChat(planConfigs.plan.useInternalChat);
          setShowExternalApi(planConfigs.plan.useExternalApi);
        }
      }
    }
    fetchData();
  }, [user, getPlanCompany]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    if (user.id) {
      const companyId = user.companyId;
      const onCompanyChat = (data) => {
        if (["new-message", "update"].includes(data.action)) {
          dispatch({ type: "CHANGE_CHAT", payload: data });
        }
      };
      socket.on(`company-${companyId}-chat`, onCompanyChat);
      return () => {
        socket.off(`company-${companyId}-chat`, onCompanyChat);
      };
    }
  }, [socket, user.id, user.companyId]);

  useEffect(() => {
    let unreads = 0;
    for (const chat of chats) {
      for (const cu of chat.users) {
        if (cu.userId === user.id) unreads += cu.unreads;
      }
    }
    setInvisible(unreads <= 0);
  }, [chats, user.id]);

  useEffect(() => {
    const t = setTimeout(() => {
      const offline = whatsApps.some((w) =>
        ["qrcode", "PAIRING", "DISCONNECTED", "TIMEOUT", "OPENING"].includes(w.status)
      );
      setConnectionWarning(offline);
    }, 2000);
    return () => clearTimeout(t);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", { params: { searchParam, pageNumber } });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const SectionHeader = ({ children }) =>
    !collapsed && (
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          padding: "16px 16px 8px",
          lineHeight: 1,
          letterSpacing: "0.5px",
          color: theme.mode === "dark" ? "#ffffff" : "#888",
        }}
      >
        {children}
      </Typography>
    );

  const SubmenuItem = (props) => <ListItemLink small {...props} />;

  const ExpandableMenuItem = ({ icon, primary, iconKey, isActive, isOpen, onToggle, children }) => {
    const iconStyle = iconStyles[iconKey] || iconStyles.dashboard;
    const isDark = theme.mode === "dark" || theme.palette?.mode === "dark" || theme.palette?.type === "dark";
    const textColor = isDark ? "#ffffff" : "#666";
    const activeAccent = isDark ? "#ffffff" : "#666";

    if (collapsed) {
      return (
        <ListItemLink
          to="#"
          primary={primary}
          icon={icon}
          iconKey={iconKey}
          collapsed={collapsed}
        />
      );
    }

    return (
      <>
        <ListItem
          button
          onClick={onToggle}
          sx={{
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            minHeight: 48,
            background: isActive ? alpha(activeAccent, 0.12) : "transparent",
            "&:hover": { background: alpha(activeAccent, 0.08) },
            "& .MuiListItemText-primary": {
              color: `${textColor} !important`,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: textColor }}>{icon}</ListItemIcon>
          <ListItemText
            primary={primary}
            primaryTypographyProps={{
              sx: {
                fontSize: "0.875rem",
                fontWeight: isActive ? 500 : 400,
                color: `${textColor} !important`,
              },
            }}
          />
          {isOpen ? (
            <ExpandLess sx={{ color: theme.mode === "dark" ? "#ffffff" : "#666" }} />
          ) : (
            <ExpandMore sx={{ color: theme.mode === "dark" ? "#ffffff" : "#666" }} />
          )}
        </ListItem>
        <Collapse
          in={isOpen}
          timeout="auto"
          unmountOnExit
          sx={{
            backgroundColor: alpha(theme.palette.background.default, 0.5),
            mx: 1,
            borderRadius: 2,
          }}
        >
          <List dense component="div" disablePadding>
            {children}
          </List>
        </Collapse>
      </>
    );
  };

  // ---------------- Labels com fallback por idioma ----------------
  const L = {
    // Gerência
    management: tLang("mainDrawer.sections.management", "Gerência", "Management"),
    dashboard: tLang("mainDrawer.listItems.dashboard", "Dashboard", "Dashboard"),
    reports: tLang("mainDrawer.listItems.reports", "Relatórios", "Reports"),
    realtime: tLang("mainDrawer.listItems.chatsTempoReal", "Painel", "Panel"),

    // Principais
    tickets: tLang("mainDrawer.listItems.tickets", "Atendimentos", "Services"),
    quick: tLang("mainDrawer.listItems.quickMessages", "Respostas rápidas", "Quick Responses"),
    kanban: tLang("mainDrawer.listItems.kanban", "Kanban", "Kanban"),
    contacts: tLang("mainDrawer.listItems.contacts", "Contatos", "Contacts"),
    schedules: tLang("mainDrawer.listItems.schedules", "Agendamentos", "Schedules"),
    tags: tLang("mainDrawer.listItems.tags", "Tags", "Tags"),
    internalChat: tLang("mainDrawer.listItems.internalChat", "Chat Interno", "Internal Chat"),
    helps: tLang("mainDrawer.listItems.helps", "Ajuda", "Help"),

    // Administração
    admin: tLang("mainDrawer.listItems.administration", "Administração", "Administration"),
    campaigns: tLang("campaigns.title", "Campanhas", "Campaigns"),
    campaigns_list: tLang("campaigns.subMenus.list", "Listagem", "List"),
    campaigns_contacts: tLang("campaigns.subMenus.listContacts", "Lista de contatos", "Contact List"),
    campaigns_settings: tLang("campaigns.subMenus.settings", "Configurações", "Settings"),

    flowbuilder: tLang("flowbuilder.title", "Flowbuilder", "Flowbuilder"),
    flowbuilder_campaign: tLang("flowbuilder.subMenus.campaign", "Campaign Flow", "Campaign Flow"),
    flowbuilder_conversation: tLang("flowbuilder.subMenus.conversation", "Conversation Flow", "Conversation Flow"),

    announcements: tLang("announcements.title", "Informativos", "Announcements"),
    api: tLang("api.title", "API", "API"),
    users: tLang("users.title", "Usuários", "Users"),
    queues: tLang("queues.title", "Filas", "Queues"),
    prompts: tLang("prompts.title", "Prompts", "Prompts"),
    integrations: tLang("integrations.title", "Integrações", "Integrations"),
    connections: tLang("connections.title", "Conexões", "Connections"),
    allConnections: tLang("connections.manage", "Gerenciar conexões", "Manage connections"),
    files: tLang("mainDrawer.listItems.files", "Arquivos", "File List"),
    financial: tLang("financial.title", "Financeiro", "Financial"),
    settings: tLang("settings.title", "Configurações", "Settings"),
    companies: tLang("companies.title", "Empresas", "Companies"),
  };

  return (
    <div onClick={drawerClose}>
      <Can
        role={
          (user.profile === "user" &&
            (user.showDashboard === "enabled" || user.allowRealTime === "enabled"))
            ? "admin"
            : user.profile
        }
        perform={"drawer-admin-items:view"}
        yes={() => (
          <ExpandableMenuItem
            icon={<GerenciaIcon />}
            primary={L.management}
            iconKey="dashboard"
            isActive={isManagementActive}
            isOpen={openDashboardSubmenu}
            onToggle={() => setOpenDashboardSubmenu((p) => !p)}
          >
            <Can
              role={
                user.profile === "user" && user.showDashboard === "enabled"
                  ? "admin"
                  : user.profile
              }
              perform={"drawer-admin-items:view"}
              yes={() => (
                <>
                  <SubmenuItem
                    to="/"
                    primary={L.dashboard}
                    icon={<DashboardIcon />}
                    iconKey="dashboard"
                  />
                  <SubmenuItem
                    to="/reports"
                    primary={L.reports}
                    icon={<RelatoriosIcon />}
                    iconKey="dashboard"
                  />
                </>
              )}
            />
            <Can
              role={
                user.profile === "user" && user.allowRealTime === "enabled"
                  ? "admin"
                  : user.profile
              }
              perform={"drawer-admin-items:view"}
              yes={() => (
                <SubmenuItem
                  to="/moments"
                  primary={L.realtime}
                  icon={<PainelIcon />}
                  iconKey="dashboard"
                />
              )}
            />
          </ExpandableMenuItem>
        )}
      />

      <ListItemLink
        to="/tickets"
        primary={L.tickets}
        icon={<AtendimentosIcon />}
        iconKey="tickets"
        collapsed={collapsed}
      />

      <ListItemLink
        to="/quick-messages"
        primary={L.quick}
        icon={<QuickReplyIcon />}
        iconKey="messages"
        collapsed={collapsed}
      />

      {showKanban && (
        <ListItemLink
          to="/kanban"
          primary={L.kanban}
          icon={<KanbanIcon />}
          iconKey="kanban"
          collapsed={collapsed}
        />
      )}

      <ListItemLink
        to="/contacts"
        primary={L.contacts}
        icon={<ContatosIcon />}
        iconKey="contacts"
        collapsed={collapsed}
      />

      {showSchedules && (
        <ListItemLink
          to="/schedules"
          primary={L.schedules}
          icon={<AgendamentosIcon />}
          iconKey="schedules"
          collapsed={collapsed}
        />
      )}

      <ListItemLink
        to="/tags"
        primary={L.tags}
        icon={<TagIcon />}
        iconKey="tags"
        collapsed={collapsed}
      />

      {showInternalChat && (
        <ListItemLink
          to="/chats"
          primary={L.internalChat}
          icon={
            <Badge
              color="secondary"
              variant="dot"
              invisible={invisible}
              sx={{ "& .MuiBadge-dot": { backgroundColor: "#ef4444" } }}
            >
              <ChatIcon />
            </Badge>
          }
          iconKey="chats"
          collapsed={collapsed}
        />
      )}

      {hasHelps && (
        <ListItemLink
          to="/helps"
          primary={L.helps}
          icon={<HelpOutline />}
          iconKey="helps"
          collapsed={collapsed}
        />
      )}

      <Can
        role={
          user.profile === "user" && user.allowConnections === "enabled"
            ? "admin"
            : user.profile
        }
        perform="dashboard:view"
        yes={() => (
          <>
            <Divider sx={{ mx: 2, my: 2, backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
            <SectionHeader>{L.admin}</SectionHeader>

            {showCampaigns && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <ExpandableMenuItem
                    icon={<CampanhasIcon />}
                    primary={L.campaigns}
                    iconKey="campaigns"
                    isActive={isCampaignRouteActive}
                    isOpen={openCampaignSubmenu}
                    onToggle={() => setOpenCampaignSubmenu((p) => !p)}
                  >
                    <SubmenuItem
                      to="/campaigns"
                      primary={L.campaigns_list}
                      icon={<ListagemIcon />}
                      iconKey="campaigns"
                    />
                    <SubmenuItem
                      to="/contact-lists"
                      primary={L.campaigns_contacts}
                      icon={<ListaContatosIcon />}
                      iconKey="campaigns"
                    />
                    <SubmenuItem
                      to="/campaigns-config"
                      primary={L.campaigns_settings}
                      icon={<ConfiguracoesIcon />}
                      iconKey="campaigns"
                    />
                  </ExpandableMenuItem>
                )}
              />
            )}

            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ExpandableMenuItem
                  icon={<FluxoConversaIcon />}
                  primary={L.flowbuilder}
                  iconKey="flowbuilder"
                  isActive={isFlowbuilderRouteActive}
                  isOpen={openFlowSubmenu}
                  onToggle={() => setOpenFlowSubmenu((p) => !p)}
                >
                  <SubmenuItem
                    to="/phrase-lists"
                    primary={L.flowbuilder_campaign}
                    icon={<FluxoCampanhaIcon />}
                    iconKey="flowbuilder"
                  />
                  <SubmenuItem
                    to="/flowbuilders"
                    primary={L.flowbuilder_conversation}
                    icon={<FluxoConversaIcon />}
                    iconKey="flowbuilder"
                  />
                </ExpandableMenuItem>
              )}
            />

            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={L.announcements}
                icon={<InformativosIcon />}
                iconKey="announcements"
                collapsed={collapsed}
              />
            )}

            {showExternalApi && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <ListItemLink
                    to="/messages-api"
                    primary={L.api}
                    icon={<ApiIcon />}
                    iconKey="api"
                    collapsed={collapsed}
                  />
                )}
              />
            )}

            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/users"
                  primary={L.users}
                  icon={<UsuariosIcon />}
                  iconKey="users"
                  collapsed={collapsed}
                />
              )}
            />

            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/queues"
                  primary={L.queues}
                  icon={<FilasIcon />}
                  iconKey="queues"
                  collapsed={collapsed}
                />
              )}
            />

            {showOpenAi && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <ListItemLink
                    to="/prompts"
                    primary={L.prompts}
                    icon={<PromptsIcon />}
                    iconKey="prompts"
                    collapsed={collapsed}
                  />
                )}
              />
            )}

            {showIntegrations && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <ListItemLink
                    to="/queue-integration"
                    primary={L.integrations}
                    icon={<IntegracoesIcon />}
                    iconKey="integrations"
                    collapsed={collapsed}
                  />
                )}
              />
            )}

            <ListItemLink
              to="/connections"
              primary={L.connections}
              icon={<ConexoesIcon />}
              iconKey="connections"
              collapsed={collapsed}
            />

            {/* REMOVIDO: Lista de arquivos não é mais usado
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/files"
                  primary={L.files}
                  icon={<AttachFileRounded />}
                  iconKey="files"
                  collapsed={collapsed}
                />
              )}
            />
            */}

            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/financeiro"
                  primary={L.financial}
                  icon={<FinanceiroIcon />}
                  iconKey="financial"
                  collapsed={collapsed}
                />
              )}
            />

            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/settings"
                  primary={L.settings}
                  icon={<ConfiguracoesIcon />}
                  iconKey="settings"
                  collapsed={collapsed}
                />
              )}
            />

            {user.super && (
              <ListItemLink
                to="/companies"
                primary={L.companies}
                icon={<EmpresasIcon />}
                iconKey="companies"
                collapsed={collapsed}
              />
            )}
          </>
        )}
      />

      {!collapsed && (
        <React.Fragment>
          <Divider sx={{ mx: 2, my: 2, backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Chip
              label="V4.5.0"
              size="small"
              sx={{
                background: iconStyles.dashboard.gradient,
                color: "white",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          </Box>
        </React.Fragment>
      )}
    </div>
  );
};

export default MainListItems;
