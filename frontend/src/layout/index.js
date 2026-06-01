import React, { useState, useContext, useEffect, useMemo } from "react";
import clsx from "clsx";

import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
  Avatar,
  Badge,
  withStyles,
  Chip,
} from "@material-ui/core";

// Custom menu icon (hamburger)
const CustomMenuIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 5L16 5" />
    <path d="M4 12L20 12" />
    <path d="M4 19L12 19" />
  </svg>
);
// Custom refresh icon
const RefreshIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.5 5.5H9.5C5.78672 5.5 3 8.18503 3 12" />
    <path d="M3.5 18.5H14.5C18.2133 18.5 21 15.815 21 12" />
    <path d="M18.5 3C18.5 3 21 4.84122 21 5.50002C21 6.15882 18.5 8 18.5 8" />
    <path d="M5.49998 16C5.49998 16 3.00001 17.8412 3 18.5C2.99999 19.1588 5.5 21 5.5 21" />
  </svg>
);

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";
import ChatPopover from "../pages/Chat/ChatPopover";

import { useDate } from "../hooks/useDate";
import UserLanguageSelector from "../components/UserLanguageSelector";

import ColorModeContext from "./themeContext";
import { getBackendUrl } from "../config";
import useSettings from "../hooks/useSettings";
import VersionControl from "../components/VersionControl";

// logos (fallbacks)
const logo = "/logo-light.png";
const logoDark = "/logo-dark.png";

const backendUrl = getBackendUrl();
const drawerWidth = 240;
const drawerWidthCollapsed = 72;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    [theme.breakpoints.down("sm")]: {
      height: "calc(100vh - 56px)",
    },
    backgroundColor: theme.palette.fancyBackground,
    "& .MuiButton-outlinedPrimary": {
      color: theme.palette.primary,
      border:
        theme.mode === "light"
          ? "1px solid rgba(0 124 102)"
          : "1px solid rgba(255, 255, 255, 0.5)",
    },
    "& .MuiTab-textColorPrimary.Mui-selected": {
      color: theme.palette.primary,
    },
  },

  chip: { background: "red", color: "white" },
  avatar: { width: "100%" },

  toolbar: {
    paddingRight: 24,
    color: theme.palette.dark.main,
    background: theme.palette.barraSuperior,
    gap: theme.spacing(1),
    overflow: "visible", // não corta o scroller
    position: "relative",
    zIndex: 1,
    [theme.breakpoints.down("sm")]: {
      paddingRight: theme.spacing(1),
      paddingLeft: theme.spacing(1),
      minHeight: 48,
      gap: theme.spacing(0.5),
      display: "flex",
      alignItems: "center",
      flexWrap: "nowrap",
    },
  },

  // SCROLLER HORIZONTAL (ícones)
  topbarScroller: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flex: "1 1 0%",
    minWidth: 0,
    maxWidth: "100%",
    flexWrap: "nowrap",

    // DESKTOP: alinhar à direita
    justifyContent: "flex-end",
    overflowX: "visible",

    // cada filho não encolhe => gera overflow quando somar mais que a largura
    "& > *": { flex: "0 0 auto" },

    // MOBILE: alinhar à esquerda + scroll horizontal invisível
    [theme.breakpoints.down("sm")]: {
      justifyContent: "flex-start",
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-x",
      overscrollBehaviorX: "contain",
      msOverflowStyle: "none",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
    },
  },

  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundSize: "cover",
    padding: "0 8px",
    minHeight: "48px",
    [theme.breakpoints.down("sm")]: { height: "48px" },
  },

  appBar: {
    zIndex: theme.zIndex.drawer - 1,
    marginLeft: drawerWidthCollapsed,
    width: `calc(100% - ${drawerWidthCollapsed}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: {
      marginLeft: 0,
      width: "100%",
    },
  },
  "@keyframes headerBubbleFloat1": {
    "0%":   { transform: "translateX(0) translateY(0)" },
    "50%":  { transform: "translateX(80px) translateY(-8px)" },
    "100%": { transform: "translateX(0) translateY(0)" },
  },
  "@keyframes headerBubbleFloat2": {
    "0%":   { transform: "translateX(0) translateY(0)" },
    "50%":  { transform: "translateX(-60px) translateY(6px)" },
    "100%": { transform: "translateX(0) translateY(0)" },
  },
  "@keyframes headerBubbleFloat3": {
    "0%":   { transform: "translateX(0) scale(1)" },
    "50%":  { transform: "translateX(50px) scale(1.2)" },
    "100%": { transform: "translateX(0) scale(1)" },
  },
  headerBubblesWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 0,
  },
  hBubble: {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.22)",
  },
  hb1: { width: 18, height: 18, top: 6, left: "5%", animation: "$headerBubbleFloat1 12s ease-in-out infinite" },
  hb2: { width: 10, height: 10, top: 20, left: "15%", animation: "$headerBubbleFloat2 9s ease-in-out infinite" },
  hb3: { width: 14, height: 14, top: 4, left: "30%", animation: "$headerBubbleFloat3 14s ease-in-out infinite" },
  hb4: { width: 8, height: 8, top: 22, left: "50%", animation: "$headerBubbleFloat1 10s ease-in-out infinite reverse" },
  hb5: { width: 12, height: 12, top: 8, left: "65%", animation: "$headerBubbleFloat2 11s ease-in-out infinite reverse" },
  hb6: { width: 16, height: 16, top: 3, left: "80%", animation: "$headerBubbleFloat3 13s ease-in-out infinite" },
  hb7: { width: 6, height: 6, top: 26, left: "92%", animation: "$headerBubbleFloat1 8s ease-in-out infinite" },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("sm")]: {
      marginLeft: 0,
      width: "100%",
    },
  },

  title: {
    flexGrow: 0,
    fontSize: 14,
    color: "white",
    marginLeft: theme.spacing(1),
    [theme.breakpoints.down("sm")]: { display: "none" },
  },

  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    height: "100vh",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
    overflowY: "hidden",
    backgroundColor: theme.mode === "light" ? "#fff" : "#2c2c2c",
    zIndex: theme.zIndex.drawer + 2,
    display: "flex",
    flexDirection: "column",
  },
  drawerPaperClose: {
    overflowX: "hidden",
    overflowY: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: { width: theme.spacing(9) },
  },

  appBarSpacer: { minHeight: 48 },

  content: { flex: 1, overflow: "hidden", position: "relative" },

  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },

  containerWithScroll: {
    flex: 1,
    overflowY: "scroll",
    overflowX: "hidden",
    ...theme.scrollbarStyles,
    borderRadius: "8px",
    border: "2px solid transparent",
    "&::-webkit-scrollbar": { display: "none" },
    "-ms-overflow-style": "none",
    "scrollbar-width": "none",
  },

  logoImg: {
    width: "100%",
    height: 45,
    maxWidth: 180,
    objectFit: "contain",
  },
  hideLogo: { display: "none" },

  avatar2: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    cursor: "pointer",
    borderRadius: "50%",
    border: "2px solid #ccc",
  },

  compressIconButton: {
    [theme.breakpoints.down("sm")]: { padding: 6 },
  },
}));

const StyledBadge = withStyles((theme) => ({
  badge: {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "$ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": { transform: "scale(.8)", opacity: 1 },
    "100%": { transform: "scale(2.4)", opacity: 0 },
  },
}))(Badge);

const LoggedInLayout = ({ children }) => {
  const classes = useStyles();
  const [userToken, setUserToken] = useState("disabled");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const saved = localStorage.getItem("drawerOpen");
    if (saved !== null) return saved === "true";
    return document.body.offsetWidth > 600;
  });
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  const { user, socket } = useContext(AuthContext);

  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);
  const { dateToClient } = useDate();
  const [profileUrl, setProfileUrl] = useState(null);

  const mainListItems = useMemo(
    () => <MainListItems drawerOpen={drawerOpen} collapsed={!drawerOpen} />,
    [user, drawerOpen]
  );

  const settings = useSettings();

  useEffect(() => {
    const getSetting = async () => {
      // Não fazer requisição se não houver usuário autenticado
      if (!user || !user.id) return;

      try {
        const response = await settings.get("wtV");
        setUserToken("disabled");
      } catch (error) {
        // Ignora erros de autenticação durante logout
        if (error?.response?.status !== 401) {
          console.error("Erro ao buscar setting wtV:", error);
        }
      }
    };
    getSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vazio = executa apenas uma vez

  useEffect(() => {
    // Aplica defaultMenu só se o usuário nunca alterou manualmente
    if (document.body.offsetWidth > 600 && localStorage.getItem("drawerOpen") === null) {
      if (user.defaultMenu === "closed") setDrawerOpen(false);
      else setDrawerOpen(true);
    }
    if (user.defaultTheme === "dark" && theme.mode === "light") {
      colorMode.toggleColorMode();
    }
  }, [user.defaultMenu]);

  useEffect(() => {
    if (document.body.offsetWidth < 600) setDrawerVariant("temporary");
    else setDrawerVariant("permanent");
  }, [drawerOpen]);

  useEffect(() => {
    const companyId = user.companyId;
    const userId = user.id;
    if (companyId) {
      const ImageUrl = user.profileImage;
      if (ImageUrl !== undefined && ImageUrl !== null)
        setProfileUrl(`${backendUrl}/public/avatar/${ImageUrl}`);
      else setProfileUrl("/nopicture.png");

      const onCompanyAuthLayout = (data) => {
        if (data.user.id === +userId) {
          toastError("Sua conta foi acessada em outro computador.");
          setTimeout(() => {
            localStorage.clear();
            window.location.reload();
          }, 1000);
        }
      };

      socket.on(`company-${companyId}-auth`, onCompanyAuthLayout);

      socket.emit("userStatus");
      const interval = setInterval(() => {
        socket.emit("userStatus");
      }, 1000 * 60 * 5);

      return () => {
        socket.off(`company-${companyId}-auth`, onCompanyAuthLayout);
        clearInterval(interval);
      };
    }
  }, [socket]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };
  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };
  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };
  const drawerClose = () => {
    if (document.body.offsetWidth < 600) {
      setDrawerOpen(false);
    }
  };
  const handleRefreshPage = () => window.location.reload(false);

  if (loading) return <BackdropLoading />;

  // src da logo com fallback ao tema
  const logoSrc =
    theme.mode === "light"
      ? (typeof theme.calculatedLogoLight === "function"
          ? theme.calculatedLogoLight()
          : logo)
      : (typeof theme.calculatedLogoDark === "function"
          ? theme.calculatedLogoDark()
          : logoDark);

  return (
    <div className={classes.root}>
      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        classes={{
          paper: clsx(classes.drawerPaper, !drawerOpen && classes.drawerPaperClose),
        }}
        open={drawerOpen}
      >
        <div className={classes.toolbarIcon} style={drawerOpen ? { justifyContent: "space-between" } : { justifyContent: "center" }}>
          {drawerOpen && (
            <img
              src={logoSrc}
              alt="logo"
              className={classes.logoImg}
              style={{ display: "block", margin: "0 auto", flex: 1 }}
            />
          )}
          <IconButton onClick={() => { const next = !drawerOpen; setDrawerOpen(next); localStorage.setItem("drawerOpen", String(next)); }} style={{ flexShrink: 0 }}>
            <CustomMenuIcon style={{ color: theme.mode === "dark" ? "#ffffff" : "#666" }} />
          </IconButton>
        </div>
        <List className={classes.containerWithScroll} style={{ flex: 1 }}>
          <MainListItems collapsed={!drawerOpen} />
        </List>
        <Divider style={{ backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
      </Drawer>

      <AppBar
        position="fixed"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        color="primary"
      >
        <div className={classes.headerBubblesWrap}>
          <span className={`${classes.hBubble} ${classes.hb1}`} />
          <span className={`${classes.hBubble} ${classes.hb2}`} />
          <span className={`${classes.hBubble} ${classes.hb3}`} />
          <span className={`${classes.hBubble} ${classes.hb4}`} />
          <span className={`${classes.hBubble} ${classes.hb5}`} />
          <span className={`${classes.hBubble} ${classes.hb6}`} />
          <span className={`${classes.hBubble} ${classes.hb7}`} />
        </div>
        <Toolbar variant="dense" className={classes.toolbar}>
          {/* Título (desktop apenas) */}
          <Typography component="h2" variant="h6" color="inherit" noWrap className={classes.title}>
            {greaterThenSm && user?.profile === "admin" && user?.company?.dueDate ? (
              <>
                {i18n.t("mainDrawer.appBar.user.message")} <b>{user.name}</b>,{" "}
                {i18n.t("mainDrawer.appBar.user.messageEnd")} <b>{user?.company?.name}</b>! (
                {i18n.t("mainDrawer.appBar.user.active")} {dateToClient(user?.company?.dueDate)})
              </>
            ) : (
              <>
                {i18n.t("mainDrawer.appBar.user.message")} <b>{user.name}</b>,{" "}
                {i18n.t("mainDrawer.appBar.user.messageEnd")} <b>{user?.company?.name}</b>!
              </>
            )}
          </Typography>

          {/* Direita: Ícones no scroller */}
          <div className={classes.topbarScroller}>
            {userToken === "enabled" && user?.companyId === 1 && (
              <Chip className={classes.chip} label={i18n.t("mainDrawer.appBar.user.token")} />
            )}

            <VersionControl />
            <UserLanguageSelector />

            <IconButton
              edge="start"
              onClick={colorMode.toggleColorMode}
              style={{ padding: 8 }}
            >
              {theme.mode === "dark" ? (
                <img
                  src="/theme/sol.png"
                  alt="Modo claro"
                  style={{ width: '24px', height: '24px' }}
                />
              ) : (
                <img
                  src="/theme/lua-clara.png"
                  alt="Modo escuro"
                  style={{ width: '24px', height: '24px' }}
                />
              )}
            </IconButton>

            <NotificationsVolume setVolume={setVolume} volume={volume} />

            <IconButton
              onClick={handleRefreshPage}
              aria-label={i18n.t("mainDrawer.appBar.refresh")}
              color="inherit"
            >
              <RefreshIcon style={{ color: "white" }} />
            </IconButton>

            {user.id && <NotificationsPopOver volume={volume} />}

            <AnnouncementsPopover />
            <ChatPopover />

            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              onClick={handleMenu}
            >
              <Avatar alt="Multi100" className={classes.avatar2} src={profileUrl} />
            </StyledBadge>

            {/* Menu do usuário */}
            <UserModal
              open={userModalOpen}
              onClose={() => setUserModalOpen(false)}
              onImageUpdate={(newProfileUrl) => setProfileUrl(newProfileUrl)}
              userId={user?.id}
            />
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              open={menuOpen}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUserModal}>{i18n.t("mainDrawer.appBar.user.profile")}</MenuItem>
              <MenuItem onClick={handleClickLogout}>{i18n.t("mainDrawer.appBar.user.logout")}</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        {children ? children : null}
      </main>
    </div>
  );
};

export default LoggedInLayout;
