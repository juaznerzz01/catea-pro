import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from "@material-ui/core";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const FIELD_OPTIONS = [
  { value: "email", label: "E-mail" },
  { value: "name", label: "Nome" },
  { value: "custom", label: "Campo personalizado" },
];

const SaveFieldFromTextMenu = ({ open, onClose, selectedText, contactId }) => {
  const [fieldType, setFieldType] = useState("email");
  const [customFieldName, setCustomFieldName] = useState("");
  const [value, setValue] = useState(selectedText || "");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setValue(selectedText || "");
  }, [selectedText]);

  const handleSave = async () => {
    if (!value.trim()) {
      toast.error("O valor não pode estar vazio");
      return;
    }

    if (fieldType === "custom" && !customFieldName.trim()) {
      toast.error("Informe o nome do campo personalizado");
      return;
    }

    setLoading(true);
    try {
      if (fieldType === "email" || fieldType === "name") {
        await api.put(`/contacts/${contactId}`, { [fieldType]: value.trim() });
      } else {
        const { data: contact } = await api.get(`/contacts/${contactId}`);
        const extraInfo = contact.extraInfo || [];
        const existingIndex = extraInfo.findIndex(
          (info) => info.name.toLowerCase() === customFieldName.trim().toLowerCase()
        );

        let updatedExtraInfo;
        if (existingIndex >= 0) {
          updatedExtraInfo = extraInfo.map((info, i) =>
            i === existingIndex ? { ...info, value: value.trim() } : info
          );
        } else {
          updatedExtraInfo = [...extraInfo, { name: customFieldName.trim(), value: value.trim() }];
        }

        await api.put(`/contacts/${contactId}`, { extraInfo: updatedExtraInfo });
      }

      toast.success("Campo salvo com sucesso!");
      onClose();
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Salvar no contato</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
          Texto selecionado:
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <FormControl fullWidth variant="outlined" size="small" style={{ marginBottom: 16 }}>
          <InputLabel>Salvar como</InputLabel>
          <Select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            label="Salvar como"
          >
            {FIELD_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {fieldType === "custom" && (
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label="Nome do campo"
            value={customFieldName}
            onChange={(e) => setCustomFieldName(e.target.value)}
            placeholder="Ex: CPF, Endereço, Empresa..."
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={loading}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveFieldFromTextMenu;
