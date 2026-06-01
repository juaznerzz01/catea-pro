import React, { useEffect, useState, useContext } from 'react';
import { Dialog, DialogTitle, DialogActions, Button, Box, } from '@material-ui/core';
import { i18n } from '../../translate/i18n';
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { Can } from "../Can";

import { AuthContext } from "../../context/Auth/AuthContext";
import * as XLSX from "xlsx";
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import toastError from '../../errors/toastError';
const useStyles = makeStyles((theme) => ({
  multFieldLine: {
    display: "flex",
    // "& > *:not(:last-child)": {
    //   marginRight: theme.spacing(1),
    // },
    marginTop: 8,
  },
  uploadInput: {
    display: "none",
  },

  btns: {

    margin: 15,

  },
  label: {
    padding: 18,
    width: "100%",
    textTransform: 'uppercase',
    display: 'block',
    marginTop: 10,
    border: "solid 2px grey",
    textAlign: 'center',
    cursor: 'pointer',
    borderRadius: 8

  },

}));

const ContactImportWpModal = ({ isOpen, handleClose, selectedTags, hideNum, userProfile }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const history = useHistory();

  const initialContact = { name: "", number: "", error: "" }

  const [contactsToImport, setContactsToImport] = useState([])
  const [statusMessage, setStatusMessage] = useState("")
  const [currentContact, setCurrentContact] = useState(initialContact)

  const handleClosed = () => {
    setContactsToImport([])
    setStatusMessage("")
    setCurrentContact(initialContact)
    handleClose()
  }

  useEffect(() => {
    console.log(contactsToImport?.length)
    if (contactsToImport?.length) {
      contactsToImport.map(async (item, index) => {
        setTimeout(async () => {
          try {
            if (index >= contactsToImport?.length - 1) {
              setStatusMessage(`importação concluída com exito a importação`)
              //setContactsToImport([])
              setCurrentContact(initialContact)

              setTimeout(() => {
                handleClosed()
              }, 15000);
            }
            if (index % 5 === 0) {

              setStatusMessage(`importação em andamento ${index} de ${contactsToImport?.length} não saia desta tela até concluir a importação`)
              // toast.info(
              // );
            }
            console.log("antes do import: ", item[0])
            const getName = item.name || item[i18n.t("contactImportWpModal.columns.name")] || "";
            const getNumber = item.number || item[i18n.t("contactImportWpModal.columns.number")] || "";
            const getEmail = item.email || item[i18n.t("contactImportWpModal.columns.email")] || "";
            const getTags = item.tags || item[i18n.t("contactImportWpModal.columns.tags")] || "";
            const getFollowUp = item.followUp || item[i18n.t("contactImportWpModal.columns.followUp")] || "";
            const getProductName = item.productName || item[i18n.t("contactImportWpModal.columns.productName")] || "";
            const getProductStatus = item.productStatus || item[i18n.t("contactImportWpModal.columns.productStatus")] || "";
            await api.post(`/contactsImport`, {
              name: getName,
              number: getNumber.toString(),
              email: getEmail,
              tags: getTags,
              followUp: getFollowUp,
              productName: getProductName,
              productStatus: getProductStatus,
            });

            setCurrentContact({ name: item.name, number: item.number, error: "success" })
          } catch (err) {
            setCurrentContact({ name: item.name, number: item.number, error: err })
          }
        }, 330 * index);
      });
    }
  }, [contactsToImport]);

  const handleOnExportContacts = async (model = false) => {
    const allDatas = []; //const { data } = await api.get("/contacts");

    let i = 1;
    if (!model) {
      while (i !== 0) {
        const { data } = await api.get("/contacts/", {
          params: { searchParam: "", pageNumber: i, contactTag: JSON.stringify(selectedTags) },
        });
        console.log(data)
        data.contacts.forEach((element) => {
          const tagsContact = element?.tags?.map(tag => tag?.name).join(', '); // Concatenando as tags com vírgula
          const contactWithTags = { ...element, tags: tagsContact }; // Substituindo as tags pelo valor concatenado
          allDatas.push(contactWithTags);
        });

        const pages = data?.count / 20;
        i++;
        if (i > pages) {
          i = 0;
        }
      }
    } else {
      const sample = {
        [i18n.t("contactImportWpModal.columns.name")]: i18n.t("contactImportWpModal.sampleContact.name"),
        [i18n.t("contactImportWpModal.columns.number")]: i18n.t("contactImportWpModal.sampleContact.number"),
        [i18n.t("contactImportWpModal.columns.email")]: i18n.t("contactImportWpModal.sampleContact.email"),
        [i18n.t("contactImportWpModal.columns.tags")]: i18n.t("contactImportWpModal.sampleContact.tags"),
        [i18n.t("contactImportWpModal.columns.followUp")]: i18n.t("contactImportWpModal.sampleContact.followUp"),
        [i18n.t("contactImportWpModal.columns.productName")]: i18n.t("contactImportWpModal.sampleContact.productName"),
        [i18n.t("contactImportWpModal.columns.productStatus")]: i18n.t("contactImportWpModal.sampleContact.productStatus"),
      };
      let wb = XLSX.utils.book_new();
      let ws = XLSX.utils.json_to_sheet([sample]);
      XLSX.utils.book_append_sheet(wb, ws, i18n.t("contactImportWpModal.sheetName"));
      XLSX.writeFile(wb, "modelo_contatos.xlsx");
      return;
    }

    const exportData = allDatas.map((e) => {
      const productsList = Array.isArray(e.products) ? e.products : [];
      const productNames = productsList.map(p => p.name).join(', ');
      const productStatuses = productsList.map(p => p.status || 'pending').join(', ');
      return {
        [i18n.t("contactImportWpModal.columns.name")]: e.name,
        [i18n.t("contactImportWpModal.columns.number")]: (hideNum && userProfile === "user" ? e.isGroup ? e.number : e.number.slice(0, -6) + "**-**" + e.number.slice(-2) : e.number),
        [i18n.t("contactImportWpModal.columns.email")]: e.email,
        [i18n.t("contactImportWpModal.columns.tags")]: typeof e.tags === 'string' ? e.tags : (e.tags?.map(t => t.name).join(', ') || ""),
        [i18n.t("contactImportWpModal.columns.followUp")]: e.followUp || "",
        [i18n.t("contactImportWpModal.columns.productName")]: productNames,
        [i18n.t("contactImportWpModal.columns.productStatus")]: productStatuses,
      };
    });
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, i18n.t("contactImportWpModal.sheetName"));
    XLSX.writeFile(wb, "backup_contatos.xlsx");
  };

  const handleImportChange = (e) => {
    const [file] = e.target.files;
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setContactsToImport(data)
      } catch (err) {
        console.log(err);
        setContactsToImport([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  const handleimportContact = async () => {
    try {
      history.push('/contacts/import');
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <Dialog fullWidth open={isOpen} onClose={handleClosed}>
      <DialogTitle>{i18n.t("contactImportWpModal.modalTitle")}</DialogTitle>
      <div>
        <Box style={{ padding: "0px 10px 10px" }} >
          <Can
            role={user.profile}
            perform="contacts-page:deleteContact"
            yes={() => (
              <div className={classes.multFieldLine}>
                <Button
                  fullWidth
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => handleOnExportContacts(false)}
                >
                  {i18n.t("contactImportWpModal.title")}
                </Button>
              </div>
            )}
          />
          <div className={classes.multFieldLine}>
            <Button
              fullWidth
              size="small"
              color="primary"
              variant="contained"
              onClick={() => handleOnExportContacts(true)}
            >
              {i18n.t("contactImportWpModal.buttons.downloadModel")}
            </Button>
          </div>
          <div className={classes.multFieldLine}>
            <Button
              fullWidth
              size="small"
              color="primary"
              variant="contained"
              onClick={() => handleimportContact()}
            >
              {i18n.t("contactImportWpModal.buttons.import")}
            </Button>
          </div>
          {/* <div className={classes.multFieldLine}>
            <div style={{ minWidth: "100%" }}>
              {contactsToImport?.length ?
                <>
                  <div className={classes.label}>
                    <h4>{statusMessage}</h4>
                    {currentContact?.name ?
                      <Button
                        fullWidth
                        disabled
                        size="small"
                        color={currentContact?.error === "success" ? "primary" : "error"}
                        variant="text"
                      >
                        {`${currentContact?.name} => ${currentContact?.number} `}
                      </Button>
                      : <></>}
                  </div>
                </> :
                <>
                  <label className={classes.label} htmlFor="contacts"> <AttachFileIcon /> <div> {i18n.t("contactImportWpModal.buttons.import")}</div> </label>
                  <input className={classes.uploadInput} name='contacts' id='contacts' type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleImportChange}
                  />
                </>
              }
            </div>
          </div> */}
        </Box>
      </div>

      <DialogActions>
        <Button onClick={handleClose} color="primary">
          {i18n.t("contactImportWpModal.buttons.closed")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactImportWpModal;
