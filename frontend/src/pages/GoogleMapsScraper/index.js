import React, { useState, useEffect, useCallback } from "react";
import {
  makeStyles,
  Paper,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  LinearProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import GetAppIcon from "@material-ui/icons/GetApp";
import DeleteIcon from "@material-ui/icons/Delete";
import MapIcon from "@material-ui/icons/Map";
import FolderIcon from "@material-ui/icons/Folder";
import AddIcon from "@material-ui/icons/Add";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import PhoneIcon from "@material-ui/icons/Phone";
import LanguageIcon from "@material-ui/icons/Language";
import EditIcon from "@material-ui/icons/Edit";
import Autocomplete from "@material-ui/lab/Autocomplete";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import api from "../../services/api";
import BRAZILIAN_CITIES from "./brazilianCities";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  folderCard: {
    padding: theme.spacing(2),
    cursor: "pointer",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    transition: "all 0.2s",
    "&:hover": {
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[2],
    },
  },
  folderIcon: {
    fontSize: 40,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
  folderCount: {
    color: theme.palette.text.secondary,
    fontSize: "0.85rem",
  },
  statusRunning: { backgroundColor: "#2196f3", color: "#fff" },
  statusDone: { backgroundColor: "#4caf50", color: "#fff" },
  statusError: { backgroundColor: "#f44336", color: "#fff" },
  searchField: { marginBottom: theme.spacing(2) },
  tableActions: { display: "flex", gap: 4 },
  scrapeForm: { marginBottom: theme.spacing(2) },
  backButton: { marginRight: theme.spacing(1) },
}));

const GoogleMapsScraper = () => {
  const classes = useStyles();

  // Estado geral
  const [view, setView] = useState("folders"); // "folders" | "results" | "scrape"
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [results, setResults] = useState([]);
  const [resultsCount, setResultsCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [loading, setLoading] = useState(false);

  // Novo folder dialog
  const [folderDialog, setFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDesc, setFolderDesc] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);

  // Scrape form
  const [term, setTerm] = useState("");
  const [city, setCity] = useState("");
  const [scrolls, setScrolls] = useState(30);
  const [scrapeJobs, setScrapeJobs] = useState([]);

  // ========== FOLDERS ==========

  const fetchFolders = useCallback(async () => {
    try {
      const { data } = await api.get("/scraper/folders");
      setFolders(data);
    } catch (err) {
      toastError(err);
    }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      if (editingFolder) {
        await api.put(`/scraper/folders/${editingFolder.id}`, {
          name: folderName, description: folderDesc
        });
        toast.success("Pasta atualizada");
      } else {
        await api.post("/scraper/folders", {
          name: folderName, description: folderDesc
        });
        toast.success("Pasta criada");
      }
      setFolderDialog(false);
      setFolderName("");
      setFolderDesc("");
      setEditingFolder(null);
      fetchFolders();
    } catch (err) {
      toastError(err);
    }
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    if (!window.confirm("Excluir esta pasta e todos os resultados?")) return;
    try {
      await api.delete(`/scraper/folders/${folderId}`);
      toast.success("Pasta removida");
      fetchFolders();
    } catch (err) {
      toastError(err);
    }
  };

  const handleEditFolder = (folder, e) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDesc(folder.description || "");
    setFolderDialog(true);
  };

  const openFolder = (folder) => {
    setSelectedFolder(folder);
    setView("results");
    setPageNumber(1);
    setSearchParam("");
  };

  // ========== RESULTS ==========

  const fetchResults = useCallback(async () => {
    if (!selectedFolder) return;
    try {
      const { data } = await api.get(`/scraper/folders/${selectedFolder.id}/results`, {
        params: { searchParam, pageNumber }
      });
      if (pageNumber === 1) {
        setResults(data.results);
      } else {
        setResults(prev => [...prev, ...data.results]);
      }
      setResultsCount(data.count);
      setHasMore(data.hasMore);
    } catch (err) {
      toastError(err);
    }
  }, [selectedFolder, searchParam, pageNumber]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleDeleteResult = async (resultId) => {
    try {
      await api.delete(`/scraper/results/${resultId}`);
      setResults(prev => prev.filter(r => r.id !== resultId));
      setResultsCount(prev => prev - 1);
    } catch (err) {
      toastError(err);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await api.get(`/scraper/folders/${selectedFolder.id}/export`);

      // Gera CSV
      const rows = data.data;
      if (!rows.length) { toast.error("Nenhum dado para exportar"); return; }

      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(";"),
        ...rows.map(r => headers.map(h => `"${(r[h] || "").replace(/"/g, '""')}"`).join(";"))
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.folder}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportado com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  // ========== SCRAPE ==========

  const fetchScrapeJobs = useCallback(async () => {
    try {
      const { data } = await api.get("/scraper/jobs");
      setScrapeJobs(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (view === "scrape") {
      fetchScrapeJobs();
      const interval = setInterval(fetchScrapeJobs, 3000);
      return () => clearInterval(interval);
    }
  }, [view, fetchScrapeJobs]);

  const handleStartScrape = async (e) => {
    e.preventDefault();
    if (!term.trim() || !selectedFolder) return;

    setLoading(true);
    try {
      await api.post("/scraper/scrape", {
        term: term.trim(),
        city: city.trim(),
        scrolls,
        folderId: selectedFolder.id,
      });
      toast.success("Scraping iniciado!");
      setTerm("");
      setCity("");
      fetchScrapeJobs();
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const map = {
      running: { label: "Em andamento", cls: classes.statusRunning },
      done: { label: "Concluído", cls: classes.statusDone },
      error: { label: "Erro", cls: classes.statusError },
      saved: { label: "Salvo", cls: classes.statusDone },
    };
    const s = map[status] || map.error;
    return <Chip size="small" label={s.label} className={s.cls} />;
  };

  // ========== RENDER ==========

  // Vista: Pastas
  const renderFolders = () => (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Minhas Pastas</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => { setEditingFolder(null); setFolderName(""); setFolderDesc(""); setFolderDialog(true); }}
        >
          Nova Pasta
        </Button>
      </Box>

      <Grid container spacing={2}>
        {folders.map((folder) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
            <Paper className={classes.folderCard} onClick={() => openFolder(folder)}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <FolderIcon className={classes.folderIcon} />
                <Box className={classes.tableActions}>
                  <IconButton size="small" onClick={(e) => handleEditFolder(folder, e)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={(e) => handleDeleteFolder(folder.id, e)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="subtitle1" noWrap><b>{folder.name}</b></Typography>
              {folder.description && (
                <Typography variant="body2" color="textSecondary" noWrap>{folder.description}</Typography>
              )}
              <Typography className={classes.folderCount}>
                {folder.resultsCount || 0} resultados
              </Typography>
            </Paper>
          </Grid>
        ))}
        {folders.length === 0 && (
          <Grid item xs={12}>
            <Typography align="center" color="textSecondary">
              Nenhuma pasta criada. Crie uma pasta para começar a buscar dados do Google Maps.
            </Typography>
          </Grid>
        )}
      </Grid>
    </>
  );

  // Vista: Resultados da pasta
  const renderResults = () => (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center">
          <IconButton className={classes.backButton} onClick={() => { setView("folders"); setSelectedFolder(null); }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">{selectedFolder?.name} ({resultsCount})</Typography>
        </Box>
        <Box display="flex" gap={1} style={{ gap: 8 }}>
          <Button variant="outlined" color="primary" startIcon={<SearchIcon />}
            onClick={() => setView("scrape")}>
            Nova Busca
          </Button>
          <Button variant="contained" color="primary" startIcon={<GetAppIcon />}
            onClick={handleExport} disabled={resultsCount === 0}>
            Exportar CSV
          </Button>
        </Box>
      </Box>

      <TextField
        className={classes.searchField}
        placeholder="Filtrar por nome, categoria, telefone..."
        fullWidth variant="outlined" size="small"
        value={searchParam}
        onChange={(e) => { setSearchParam(e.target.value); setPageNumber(1); }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon color="disabled" /></InputAdornment>
        }}
      />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Avaliação</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Endereço</TableCell>
              <TableCell>Website</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Nenhum resultado. Clique em "Nova Busca" para começar.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {results.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Tooltip title={r.mapsLink || ""}>
                    <span>{r.name}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell>{r.rating}{r.reviewCount ? ` (${r.reviewCount})` : ""}</TableCell>
                <TableCell>
                  {r.phone && (
                    <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      {r.phone}
                    </Box>
                  )}
                </TableCell>
                <TableCell style={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap>{r.address}</Typography>
                </TableCell>
                <TableCell>
                  {r.website && (
                    <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <LanguageIcon fontSize="small" />
                      <Typography variant="body2" noWrap style={{ maxWidth: 120 }}>{r.website}</Typography>
                    </a>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleDeleteResult(r.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hasMore && (
        <Box textAlign="center" mt={2}>
          <Button onClick={() => setPageNumber(prev => prev + 1)}>Carregar mais</Button>
        </Box>
      )}
    </>
  );

  // Vista: Tela de scrape
  const renderScrape = () => (
    <>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton className={classes.backButton} onClick={() => { setView("results"); fetchResults(); }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Buscar no Google Maps → {selectedFolder?.name}</Typography>
      </Box>

      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
        <form onSubmit={handleStartScrape} className={classes.scrapeForm}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={4}>
              <TextField label="Termo de Busca" placeholder="Ex: agência de turismo, pet shop..."
                fullWidth value={term} onChange={(e) => setTerm(e.target.value)}
                variant="outlined" size="small" required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={BRAZILIAN_CITIES}
                groupBy={(option) => option.state ? `${option.state}` : ""}
                getOptionLabel={(option) =>
                  option.state ? `${option.label} - ${option.state}` : option.label
                }
                value={BRAZILIAN_CITIES.find((c) => c.city === city) || BRAZILIAN_CITIES[0]}
                onChange={(e, newValue) => setCity(newValue ? newValue.city : "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cidade / Região"
                    variant="outlined"
                    size="small"
                    placeholder="Digite para buscar..."
                  />
                )}
                noOptionsText="Nenhuma cidade encontrada"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl variant="outlined" size="small" fullWidth>
                <InputLabel>Quantidade</InputLabel>
                <Select value={scrolls} onChange={(e) => setScrolls(e.target.value)} label="Quantidade">
                  <MenuItem value={5}>Poucos (~40)</MenuItem>
                  <MenuItem value={15}>Médio (~120)</MenuItem>
                  <MenuItem value={30}>Bastante (~240)</MenuItem>
                  <MenuItem value={50}>Máximo (~400)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button type="submit" variant="contained" color="primary" fullWidth
                disabled={loading || !term.trim()} startIcon={<SearchIcon />}>
                {loading ? "Iniciando..." : "Buscar"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Jobs em andamento */}
      <Typography variant="subtitle2" gutterBottom>Buscas em andamento</Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Termo</TableCell>
              <TableCell>Cidade</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Resultados</TableCell>
              <TableCell>Progresso</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scrapeJobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary">Nenhuma busca ativa</Typography>
                </TableCell>
              </TableRow>
            )}
            {scrapeJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.term}</TableCell>
                <TableCell>{job.city || "-"}</TableCell>
                <TableCell>{getStatusChip(job.status)}</TableCell>
                <TableCell>{job.results || 0}</TableCell>
                <TableCell>
                  <Typography variant="caption">{job.progress || "Aguardando..."}</Typography>
                  {job.status === "running" && <LinearProgress style={{ marginTop: 4 }} />}
                </TableCell>
                <TableCell align="right">
                  {job.status === "done" && (
                    <Button size="small" variant="contained" color="primary"
                      onClick={() => { setView("results"); fetchResults(); }}>
                      Ver Resultados
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  return (
    <MainContainer>
      <MainHeader>
        <Title>
          <MapIcon style={{ marginRight: 8, verticalAlign: "middle" }} />
          Google Maps Scraper
        </Title>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        {view === "folders" && renderFolders()}
        {view === "results" && renderResults()}
        {view === "scrape" && renderScrape()}
      </Paper>

      {/* Dialog criar/editar pasta */}
      <Dialog open={folderDialog} onClose={() => setFolderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFolder ? "Editar Pasta" : "Nova Pasta"}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Nome da Pasta"
            placeholder="Ex: Agências SP, Pet Shops RJ..."
            fullWidth value={folderName} onChange={(e) => setFolderName(e.target.value)}
            variant="outlined" />
          <TextField margin="dense" label="Descrição (opcional)"
            fullWidth value={folderDesc} onChange={(e) => setFolderDesc(e.target.value)}
            variant="outlined" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateFolder} color="primary" variant="contained"
            disabled={!folderName.trim()}>
            {editingFolder ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default GoogleMapsScraper;
