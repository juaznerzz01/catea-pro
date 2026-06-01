import React, { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { i18n } from "../../translate/i18n";
import makeStyles from "@material-ui/core/styles/makeStyles";
import * as XLSX from "xlsx";
const { read, utils } = XLSX;
import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  MenuItem,
  Popover,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import FilterListIcon from "@material-ui/icons/FilterList";
import ClearIcon from "@material-ui/icons/Clear";
import api from "../../services/api";
import upload from "../../assets/upload.gif";
import { useHistory } from "react-router-dom";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

function WorksheetToDatagrid(ws) {
  const rows = utils.sheet_to_json(ws, { header: 1, defval: "" });
  const range = utils.decode_range(ws["!ref"] || "A1");
  const columns = Array.from({ length: range.e.c + 1 }, (_, i) => ({
    key: String(i),
    name: utils.encode_col(i),
  }));
  return { rows, columns };
}

const MAX_CELL_CHARS = 40;

const useStyles = makeStyles((theme) => ({
  tableWrapper: {
    flex: 1,
    overflow: "auto",
    border: "1px solid #d0d0d0",
    ...theme.scrollbarStyles,
  },
  excelTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: 13,
    "& th, & td": {
      border: "1px solid #d0d0d0",
      padding: "6px 10px",
      textAlign: "left",
      whiteSpace: "nowrap",
    },
  },
  headerRow: {
    backgroundColor: "#f0f0f0",
    position: "sticky",
    top: 0,
    zIndex: 3,
    "& th": {
      fontWeight: 600,
      color: "#333",
      borderBottom: "2px solid #b0b0b0",
    },
  },
  selectRow: {
    backgroundColor: "#fafafa",
    position: "sticky",
    top: 33,
    zIndex: 2,
    "& th": {
      fontWeight: 400,
      padding: "4px 6px",
    },
  },
  filterRow: {
    backgroundColor: "#f5f8ff",
    position: "sticky",
    top: 66,
    zIndex: 2,
    "& th": {
      padding: "4px 6px",
    },
  },
  dataRow: {
    "&:nth-child(even)": {
      backgroundColor: "#fafafa",
    },
    "&:hover": {
      backgroundColor: "#e8f0fe",
    },
  },
  selectedRow: {
    backgroundColor: "#d4e8fd !important",
  },
  cellText: {
    display: "inline-block",
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    cursor: "default",
  },
  checkboxCell: {
    width: 40,
    textAlign: "center",
    padding: "4px !important",
  },
  selectField: {
    fontSize: 12,
    minWidth: 130,
    "& .MuiSelect-select": {
      padding: "4px 8px",
    },
  },
  filterInput: {
    fontSize: 12,
    "& input": {
      padding: "4px 8px",
      fontSize: 12,
    },
  },
  filterActive: {
    color: theme.palette.primary.main,
  },
  actions: {
    padding: 8,
    border: "1px solid #CCC",
    boxShadow: "1px 1px 5px #CCC",
    marginTop: 4,
    display: "flex",
    justifyContent: "center",
    gap: 8,
  },
  importOptions: {
    padding: 8,
    border: "1px solid #CCC",
    boxShadow: "1px 1px 5px #CCC",
    marginTop: 4,
    marginBottom: 4,
  },
  backButtonContainer: {
    textAlign: "center",
    marginTop: 20,
  },
  filterChips: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    padding: "4px 8px",
    fontSize: 12,
    color: "#555",
    alignItems: "center",
  },
  filterChip: {
    background: "#e3ecfa",
    borderRadius: 4,
    padding: "2px 8px",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
  },
}));

const ContactImport = () => {
  const t = i18n.t.bind(i18n);
  const classes = useStyles();
  const history = useHistory();

  const [rows, setRows] = useState(null);
  const [columns, setColumns] = useState(null);
  const [columnValue, setColumnValue] = useState({});
  const [selectedFields, setSelectedFields] = useState({});
  const [openingFile, setOpeningFile] = useState(false);
  const [selection, setSelection] = useState({});
  const [invalidFile, setInvalidFile] = useState(false);
  const [error, setError] = useState(null);
  const [countCreated, setCountCreated] = useState(0);
  const [countIgnored, setCountIgnored] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [imported, setImported] = useState(false);
  const [selectedRows, setSelectedRows] = useState({});
  const [validateContact, setValidateContact] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});

  const contactFields = [
    { id: "name", label: t("contactImport.fields.name"), required: true },
    { id: "number", label: t("contactImport.fields.number"), required: true },
    { id: "email", label: t("contactImport.fields.email"), required: false },
    { id: "tags", label: t("contactImport.fields.tags"), required: false },
    { id: "followUp", label: t("contactImport.fields.followUp"), required: false },
    { id: "productName", label: t("contactImport.fields.productName"), required: false },
    { id: "productStatus", label: t("contactImport.fields.productStatus"), required: false },
  ];

  // Filtra as linhas de dados (exclui header = row 0) com base nos filtros por coluna
  const filteredDataRows = useMemo(() => {
    if (!rows || rows.length <= 1) return [];
    const dataRows = rows.slice(1).map((row, i) => ({ row, originalIndex: i + 1 }));

    const activeFilters = Object.entries(columnFilters).filter(([, v]) => v && v.trim());
    if (activeFilters.length === 0) return dataRows;

    return dataRows.filter(({ row }) =>
      activeFilters.every(([colIdx, filterText]) => {
        const cellVal = String(row[Number(colIdx)] || "").toLowerCase();
        return cellVal.includes(filterText.toLowerCase());
      })
    );
  }, [rows, columnFilters]);

  const handleFilterChange = (colIndex, value) => {
    setColumnFilters((prev) => ({ ...prev, [colIndex]: value }));
  };

  const clearFilter = (colIndex) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[colIndex];
      return next;
    });
  };

  const clearAllFilters = () => setColumnFilters({});

  const activeFilterCount = Object.values(columnFilters).filter((v) => v && v.trim()).length;

  const processImport = async () => {
    setUploading(true);

    if (!selection.number) {
      toastError(t("contactImport.validation.noNumberField"));
      setUploading(false);
      return;
    }
    if (!selection.name) {
      toastError(t("contactImport.validation.noNameField"));
      setUploading(false);
      return;
    }
    if (Object.keys(selectedRows).length === 0) {
      toastError(t("contactImport.validation.noContactsSelected"));
      setUploading(false);
      return;
    }

    let created = 0;
    let ignored = 0;

    for (const { row: item, originalIndex } of filteredDataRows) {
      if (!selectedRows[originalIndex]) continue;

      const contactData = {};
      for (let ci = 0; ci < columns.length; ci++) {
        const field = columnValue[columns[ci].key];
        if (field) contactData[field] = item[ci];
      }

      const missingRequired = contactFields.some((f) => f.required && !contactData[f.id]);
      if (missingRequired) {
        ignored++;
        continue;
      }

      try {
        const payload = { ...contactData, validateContact: validateContact ? "true" : "false" };
        delete payload.productName;
        delete payload.productStatus;
        if (contactData.productName) {
          payload.productName = contactData.productName;
          payload.productStatus = contactData.productStatus || "";
        }
        const res = await api.post("/contactsImport", payload);
        if (res.status === 200) created++;
        else ignored++;
      } catch {
        ignored++;
      }
    }

    setCountCreated(created);
    setCountIgnored(ignored);
    setValidateContact(false);
    setSelectedRows({});
    setImported(true);
    setUploading(false);

    if (ignored === 0) {
      toast.success(t("contactImport.messages.successComplete"));
    } else {
      toast.warn(t("contactImport.messages.successWithErrors"));
    }
  };

  const onChangeFile = (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    setOpeningFile(true);
    setInvalidFile(false);
    setImported(false);
    setUploading(false);
    setColumnFilters({});
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = read(e.target.result);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const { rows, columns } = WorksheetToDatagrid(ws);
        setRows(rows);
        setColumns(columns);
        setOpeningFile(false);
      } catch (err) {
        console.error(err);
        setInvalidFile(true);
        setOpeningFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSelectChange = (event) => {
    const newValue = event.target.value;
    const columnKey = event.target.name;

    if (columnValue[columnKey]) {
      const oldValue = columnValue[columnKey];
      setSelectedFields((prev) => { const n = { ...prev }; delete n[oldValue]; return n; });
    }

    if (newValue === "") {
      setColumnValue((prev) => { const n = { ...prev }; delete n[columnKey]; return n; });
      setSelection((prev) => {
        const n = { ...prev };
        Object.keys(n).forEach((k) => { if (n[k] === columnKey) delete n[k]; });
        return n;
      });
      return;
    }

    if (selectedFields[newValue]) {
      const fieldLabel = contactFields.find((f) => f.id === newValue)?.label || newValue;
      toastError(t("contactImport.validation.fieldAlreadySelected", { field: fieldLabel }));
      return;
    }

    setSelection((prev) => ({ ...prev, [newValue]: columnKey }));
    setSelectedFields((prev) => ({ ...prev, [newValue]: columnKey }));
    setColumnValue((prev) => ({ ...prev, [columnKey]: newValue }));
  };

  // Select all visíveis (filtrados)
  const allVisibleSelected = filteredDataRows.length > 0 && filteredDataRows.every(({ originalIndex }) => selectedRows[originalIndex]);

  const handleSelectAll = (checked) => {
    if (checked) {
      const newSelected = { ...selectedRows };
      filteredDataRows.forEach(({ originalIndex }) => { newSelected[originalIndex] = true; });
      setSelectedRows(newSelected);
    } else {
      const newSelected = { ...selectedRows };
      filteredDataRows.forEach(({ originalIndex }) => { delete newSelected[originalIndex]; });
      setSelectedRows(newSelected);
    }
  };

  const truncate = (text, max = MAX_CELL_CHARS) => {
    const str = String(text || "");
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const renderTable = () => (
    <div className={classes.tableWrapper} style={{ maxHeight: "70vh" }}>
      {activeFilterCount > 0 && (
        <div className={classes.filterChips}>
          <FilterListIcon fontSize="small" />
          {Object.entries(columnFilters)
            .filter(([, v]) => v && v.trim())
            .map(([colIdx, val]) => (
              <span key={colIdx} className={classes.filterChip}>
                {columns[colIdx]?.name}: &quot;{val}&quot;
                <ClearIcon style={{ fontSize: 14, cursor: "pointer" }} onClick={() => clearFilter(colIdx)} />
              </span>
            ))}
          <span style={{ cursor: "pointer", color: "#1976d2", marginLeft: 4 }} onClick={clearAllFilters}>
            {t("contactImport.filters.clearAll")}
          </span>
          <span style={{ marginLeft: "auto", color: "#888" }}>
            {filteredDataRows.length} / {rows.length - 1}
          </span>
        </div>
      )}

      <table className={classes.excelTable}>
        <thead>
          {/* Cabeçalho com letras das colunas */}
          <tr className={classes.headerRow}>
            <th className={classes.checkboxCell}>
              <Checkbox
                size="small"
                checked={allVisibleSelected}
                indeterminate={!allVisibleSelected && Object.keys(selectedRows).length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                style={{ padding: 2 }}
              />
            </th>
            {columns.map((col) => (
              <th key={col.key}>{col.name}</th>
            ))}
          </tr>

          {/* Linha de seleção de campo */}
          <tr className={classes.selectRow}>
            <th></th>
            {columns.map((col) => (
              <th key={col.key}>
                <Select
                  value={columnValue[col.key] || ""}
                  name={col.key}
                  onChange={handleSelectChange}
                  displayEmpty
                  className={classes.selectField}
                  variant="outlined"
                >
                  <MenuItem value=""><em>—</em></MenuItem>
                  {contactFields.map((cf) => (
                    <MenuItem key={cf.id} value={cf.id}>{cf.label}</MenuItem>
                  ))}
                </Select>
              </th>
            ))}
          </tr>

          {/* Linha de filtros */}
          <tr className={classes.filterRow}>
            <th>
              {activeFilterCount > 0 && (
                <Tooltip title={t("contactImport.filters.clearAll")}>
                  <IconButton size="small" onClick={clearAllFilters}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </th>
            {columns.map((col, idx) => (
              <th key={col.key}>
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder={t("contactImport.filters.filter")}
                  value={columnFilters[idx] || ""}
                  onChange={(e) => handleFilterChange(idx, e.target.value)}
                  className={classes.filterInput}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterListIcon
                          fontSize="small"
                          className={columnFilters[idx] ? classes.filterActive : ""}
                          style={{ fontSize: 16 }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: columnFilters[idx] ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => clearFilter(idx)} style={{ padding: 2 }}>
                          <ClearIcon style={{ fontSize: 14 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredDataRows.map(({ row, originalIndex }) => (
            <tr
              key={originalIndex}
              className={`${classes.dataRow} ${selectedRows[originalIndex] ? classes.selectedRow : ""}`}
            >
              <td className={classes.checkboxCell}>
                <Checkbox
                  size="small"
                  checked={!!selectedRows[originalIndex]}
                  onChange={() =>
                    setSelectedRows((prev) => ({
                      ...prev,
                      [originalIndex]: !prev[originalIndex],
                    }))
                  }
                  style={{ padding: 2 }}
                />
              </td>
              {row.map((cell, ci) => {
                const text = String(cell || "");
                const truncated = truncate(text);
                return (
                  <td key={ci}>
                    {text.length > MAX_CELL_CHARS ? (
                      <Tooltip title={text} arrow placement="top-start">
                        <span className={classes.cellText}>{truncated}</span>
                      </Tooltip>
                    ) : (
                      <span className={classes.cellText}>{text}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {filteredDataRows.length === 0 && (
            <tr>
              <td colSpan={(columns?.length || 0) + 1} style={{ textAlign: "center", padding: 20, color: "#999" }}>
                {activeFilterCount > 0 ? t("contactImport.filters.noResults") : t("contactImport.messages.processing")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => (
    <div>
      <div className={classes.importOptions}>
        <FormGroup row style={{ width: "100%", display: "flex", justifyContent: "space-around" }}>
          <FormControlLabel
            control={
              <Switch
                checked={validateContact}
                onChange={(e) => setValidateContact(e.target.checked)}
                color="primary"
              />
            }
            label={t("contactImport.buttons.validateWhatsApp")}
          />
        </FormGroup>
      </div>
      {renderTable()}
      <div className={classes.actions}>
        {uploading && <div>{t("contactImport.messages.importing")}</div>}
        <Button
          variant="contained"
          color="primary"
          disabled={uploading}
          onClick={() => processImport()}
        >
          {t("contactImport.buttons.importContacts")}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled={uploading}
          onClick={() => {
            setRows(null);
            setColumns(null);
            setColumnFilters({});
          }}
        >
          {t("contactImport.buttons.cancel")}
        </Button>
        {error && <div style={{ color: "red" }}>{error}</div>}
      </div>
    </div>
  );

  const handleCloseImport = () => history.push("/contacts");

  const handleDownloadModel = () => {
    const sample = {
      [t("contactImport.fields.name")]: t("contactImport.sampleContact.name"),
      [t("contactImport.fields.number")]: t("contactImport.sampleContact.number"),
      [t("contactImport.fields.email")]: t("contactImport.sampleContact.email"),
      [t("contactImport.fields.tags")]: t("contactImport.sampleContact.tags"),
      [t("contactImport.fields.followUp")]: t("contactImport.sampleContact.followUp"),
      [t("contactImport.fields.productName")]: t("contactImport.sampleContact.productName"),
      [t("contactImport.fields.productStatus")]: t("contactImport.sampleContact.productStatus"),
    };
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([sample]);
    XLSX.utils.book_append_sheet(wb, ws, t("contactImport.sheetName"));
    XLSX.writeFile(wb, "modelo_contatos.xlsx");
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onChangeFile,
    maxFiles: 1,
  });

  return (
    <div style={{ alignContent: "center" }}>
      {imported && (
        <div style={{ padding: 16 }}>
          <ul>
            <li>{countCreated} {t("contactImport.messages.contactsCreated")}</li>
            <li>{countIgnored} {t("contactImport.messages.contactsIgnored")}</li>
          </ul>
        </div>
      )}
      {openingFile && <div style={{ padding: 16 }}>{t("contactImport.messages.processing")}</div>}
      {invalidFile && <div style={{ padding: 16, color: "red" }}>{t("contactImport.messages.invalidFile")}</div>}
      {!imported && rows && columns ? (
        renderContent()
      ) : (
        <>
          <div
            {...getRootProps()}
            style={{
              borderRadius: 20,
              maxWidth: 500,
              margin: "20px auto",
              border: "3px dotted #ddd",
              padding: 20,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              cursor: "pointer",
            }}
          >
            <img src={upload} height={200} alt="Upload" />
            <h5>{t("contactImport.dropzone.clickOrDrag")}</h5>
            <p style={{ color: "#e74c3c", fontWeight: "bold", textAlign: "center" }}>
              {t("contactImport.dropzone.importantNote")}
            </p>
          </div>
          <input {...getInputProps()} />
          <div className={classes.backButtonContainer}>
            <Button variant="contained" color="primary" onClick={handleDownloadModel} style={{ marginRight: 10 }}>
              {t("contactImport.buttons.downloadModel")}
            </Button>
            <Button variant="contained" color="secondary" disabled={uploading} onClick={handleCloseImport}>
              {t("contactImport.buttons.back")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ContactImport;
