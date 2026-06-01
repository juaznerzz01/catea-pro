import React, {
    useState,
    useEffect,
    useReducer,
    useContext,
    useRef,
    useMemo,
} from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles, useTheme } from "@material-ui/core/styles"; // Certifique-se que 'useTheme' está importado
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Avatar from "@material-ui/core/Avatar";
import { Facebook, Instagram, WhatsApp } from "@material-ui/icons";
import SearchIcon from "@material-ui/icons/Search";
import GroupIcon from "@material-ui/icons/Group";
import Tooltip from "@material-ui/core/Tooltip";

import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Checkbox from "@material-ui/core/Checkbox"; // Importar Checkbox
import Box from "@material-ui/core/Box";

import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import BlockIcon from "@material-ui/icons/Block";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import ConfirmationModal from "../../components/ConfirmationModal";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";

import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";
import { TagsFilter } from "../../components/TagsFilter";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import formatSerializedId from '../../utils/formatSerializedId';
import { v4 as uuidv4 } from "uuid";

import {
    ArrowDropDown,
    Backup,
    ContactPhone,
} from "@material-ui/icons";
import { Menu, MenuItem, Chip } from "@material-ui/core";

import ContactImportWpModal from "../../components/ContactImportWpModal";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import PhoneNumberDisplay from "../../components/PhoneNumberDisplay";
import { filterValidContacts, isValidContact } from "../../utils/contactValidation";

const reducer = (state, action) => {
    if (action.type === "LOAD_CONTACTS") {
        const contacts = action.payload;

        // 🛡️ FILTRO CRÍTICO: Remover contatos fantasmas antes de adicionar ao estado
        const validContacts = filterValidContacts(contacts);

        const newContacts = [];

        validContacts.forEach((contact) => {
            const contactIndex = state.findIndex((c) => c.id === contact.id);
            if (contactIndex !== -1) {
                state[contactIndex] = contact;
            } else {
                newContacts.push(contact);
            }
        });

        return [...state, ...newContacts];
    }

    if (action.type === "UPDATE_CONTACTS") {
        const contact = action.payload;

        // 🛡️ FILTRO CRÍTICO: Validar contato antes de adicionar/atualizar
        if (!isValidContact(contact)) {
            console.warn('🚫 Contato fantasma bloqueado (UPDATE_CONTACTS):', {
                id: contact.id,
                name: contact.name,
                number: contact.number
            });
            return [...state]; // Retornar estado sem modificação
        }

        const contactIndex = state.findIndex((c) => c.id === contact.id);

        if (contactIndex !== -1) {
            state[contactIndex] = contact;
            return [...state];
        } else {
            return [contact, ...state];
        }
    }

    if (action.type === "DELETE_CONTACT") {
        const contactId = action.payload;

        const contactIndex = state.findIndex((c) => c.id === contactId);
        if (contactIndex !== -1) {
            state.splice(contactIndex, 1);
        }
        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }
};

const useStyles = makeStyles((theme) => ({
    mainPaper: {
        flex: 1,
        padding: 0,
        overflowY: "auto",
        minHeight: 0,
        borderRadius: 10,
        ...theme.scrollbarStyles,
    },
    excelTable: {
        tableLayout: "fixed",
        width: "100%",
        borderCollapse: "collapse",
        "& th": {
            backgroundColor: theme.palette.type === "dark" ? "#424242" : "#e0e0e0",
            color: theme.palette.type === "dark" ? "#fff" : "#333",
            fontWeight: 600,
            fontSize: 12,
            padding: "4px 4px 2px 4px",
            borderRight: `1px solid ${theme.palette.type === "dark" ? "rgba(255,255,255,0.15)" : "#bdbdbd"}`,
            borderBottom: `1px solid ${theme.palette.type === "dark" ? "rgba(255,255,255,0.15)" : "#bdbdbd"}`,
            verticalAlign: "top",
        },
        "& td": {
            fontSize: 12,
            padding: "4px",
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
        },
    },
    zebraRow: {
        "&:nth-of-type(even)": {
            backgroundColor: theme.palette.action.hover,
        },
        "&:hover": {
            backgroundColor: theme.palette.action.selected,
        },
    },
    headerCell: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        whiteSpace: "nowrap",
        gap: 2,
    },
    filterBtn: {
        padding: 1,
        marginLeft: 2,
        color: "inherit",
        "&:hover": {
            backgroundColor: "rgba(0,0,0,0.1)",
        },
    },
    filterBtnActive: {
        padding: 1,
        marginLeft: 2,
        color: theme.palette.primary.main,
        backgroundColor: "rgba(0,0,0,0.08)",
        "&:hover": {
            backgroundColor: "rgba(0,0,0,0.15)",
        },
    },
    filterMenu: {
        maxHeight: 300,
        minWidth: 160,
    },
    filterMenuItem: {
        fontSize: 12,
        minHeight: 30,
        padding: "4px 12px",
    },
    filterMenuItemActive: {
        fontSize: 12,
        minHeight: 30,
        padding: "4px 12px",
        fontWeight: 600,
        backgroundColor: theme.palette.action.selected,
    },
    truncatedCell: {
        maxWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
}));

const Contacts = () => {
    const classes = useStyles();
    const history = useHistory();
    const theme = useTheme(); // Adicione esta linha para acessar o tema

    const { user, socket } = useContext(AuthContext);

    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [searchParam, setSearchParam] = useState("");
    const [contacts, dispatch] = useReducer(reducer, []);
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [contactModalOpen, setContactModalOpen] = useState(false);

    const [importContactModalOpen, setImportContactModalOpen] = useState(false);
    const [deletingContact, setDeletingContact] = useState(null);
    const [ImportContacts, setImportContacts] = useState(null);
    
    const [blockingContact, setBlockingContact] = useState(null);
    const [unBlockingContact, setUnBlockingContact] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [exportContact, setExportContact] = useState(false);
    const [confirmChatsOpen, setConfirmChatsOpen] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [totalFiltered, setTotalFiltered] = useState(0);
    const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
    const [contactTicket, setContactTicket] = useState({});
    const fileUploadRef = useRef(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const { setCurrentTicket } = useContext(TicketsContext);

    const [importWhatsappId, setImportWhatsappId] = useState()

    // NOVOS ESTADOS PARA SELEÇÃO E DELEÇÃO EM MASSA
    const [selectedContactIds, setSelectedContactIds] = useState([]); // Array de IDs dos contatos selecionados
    const [isSelectAllChecked, setIsSelectAllChecked] = useState(false); // Estado para o checkbox "Selecionar Tudo"
    const [confirmDeleteManyOpen, setConfirmDeleteManyOpen] = useState(false); // Estado para o modal de confirmação de deleção em massa

    const [columnFilters, setColumnFilters] = useState({});
    const [filterAnchor, setFilterAnchor] = useState({ el: null, field: null });

    const { getAll: getAllSettings } = useCompanySettings();
    const [hideNum, setHideNum] = useState(false);
    const [enableLGPD, setEnableLGPD] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const settingList = await getAllSettings(user.companyId);
            for (const [key, value] of Object.entries(settingList)) {
                if (key === "enableLGPD") setEnableLGPD(value === "enabled");
                if (key === "lgpdHideNumber") setHideNum(value === "enabled");
            }
        }
        fetchData();
    }, []);

    // Buscar opções de filtro do backend (valores distintos de cada coluna)
    const [columnOptions, setColumnOptions] = useState({ name: [], number: [], email: [], followUp: [], tags: [], products: [], attendant: [], payment: [] });

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const { data } = await api.get("/contacts/filter-options");
                setColumnOptions(data);
            } catch (err) {
                // Fallback silencioso - opções ficarão vazias
            }
        };
        fetchFilterOptions();
    }, []);

    // Filtros de coluna agora são aplicados server-side, então filteredContacts = contacts
    const filteredContacts = contacts;

    const handleColumnFilterChange = (field) => (e) => {
        setColumnFilters(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleOpenFilter = (field) => (e) => {
        setFilterAnchor({ el: e.currentTarget, field });
    };

    const handleCloseFilter = () => {
        setFilterAnchor({ el: null, field: null });
    };

    const handleSelectFilter = (field, value) => {
        setColumnFilters(prev => {
            const next = { ...prev };
            if (value === "") {
                delete next[field];
            } else {
                next[field] = value;
            }
            return next;
        });
        handleCloseFilter();
    };

    const handleImportExcel = async () => {
        try {
            const formData = new FormData();
            formData.append("file", fileUploadRef.current.files[0]);
            await api.request({
                url: `/contacts/upload`,
                method: "POST",
                data: formData,
            });
            history.go(0);
        } catch (err) {
            toastError(err);
        }
    };

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
        setSelectedContactIds([]); // Limpar seleção ao mudar filtro/pesquisa
        setIsSelectAllChecked(false); // Desmarcar "Selecionar Tudo"
    }, [searchParam, selectedTags, columnFilters]);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchContacts = async () => {
                try {
                    // Mapear columnFilters do frontend para o formato do backend
                    const activeFilters = Object.entries(columnFilters).filter(([, v]) => v !== "" && v !== undefined);
                    let backendFilters;
                    if (activeFilters.length > 0) {
                        backendFilters = {};
                        activeFilters.forEach(([field, val]) => {
                            switch (field) {
                                case "name": backendFilters.name = val; break;
                                case "number": backendFilters.number = val; break;
                                case "email": backendFilters.email = val; break;
                                case "followUp": backendFilters.followUp = val; break;
                                case "tags": backendFilters.tagName = val; break;
                                case "products": backendFilters.productName = val; break;
                                case "payment": backendFilters.productStatus = val; break;
                                case "attendant": backendFilters.attendantName = val; break;
                                default: break;
                            }
                        });
                    }

                    const params = {
                        searchParam,
                        pageNumber,
                        contactTag: JSON.stringify(selectedTags),
                    };
                    if (backendFilters) {
                        params.columnFilters = JSON.stringify(backendFilters);
                    }

                    const { data } = await api.get("/contacts/", { params });
                    dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
                    setHasMore(data.hasMore);
                    setTotalFiltered(data.count);
                    setLoading(false);

                    // Atualizar o estado do "Selecionar Tudo" baseado nos contatos carregados e selecionados
                    const allCurrentContactIds = data.contacts.map(c => c.id);
                    const newSelected = selectedContactIds.filter(id => allCurrentContactIds.includes(id));
                    setSelectedContactIds(newSelected); // Mantenha apenas os IDs que ainda estão na lista
                    setIsSelectAllChecked(newSelected.length === allCurrentContactIds.length && allCurrentContactIds.length > 0);

                } catch (err) {
                    toastError(err);
                }
            };
            fetchContacts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber, selectedTags, columnFilters]);

    useEffect(() => {
        const companyId = user.companyId;
        const onContactEvent = (data) => {
            if (data.action === "update" || data.action === "create") {
                const contact = data.contact;

                // 🛡️ FILTRO CRÍTICO #1: Validar se é um contato válido (não fantasma)
                if (!isValidContact(contact)) {
                    console.warn('🚫 Socket.IO: Contato fantasma bloqueado', {
                        id: contact.id,
                        name: contact.name,
                        number: contact.number,
                        reason: 'Número inválido'
                    });
                    return; // Bloquear contato fantasma
                }

                // 🛡️ FILTRO CRÍTICO #2: Validar filtro de busca
                if (searchParam && searchParam.trim() !== "") {
                    const contactName = contact.name?.toLowerCase() || "";
                    const contactNumber = contact.number?.toLowerCase() || "";
                    const contactEmail = contact.email?.toLowerCase() || "";

                    const matchesSearch =
                        contactName.includes(searchParam) ||
                        contactNumber.includes(searchParam) ||
                        contactEmail.includes(searchParam);

                    if (!matchesSearch) {
                        console.log("🚫 Socket.IO: Contato ignorado (não corresponde à busca)", {
                            contactId: contact.id,
                            contactName: contact.name,
                            searchParam
                        });
                        return;
                    }
                }

                // 🛡️ FILTRO CRÍTICO #3: Validar filtro de tags
                if (selectedTags.length > 0) {
                    const contactTagIds = contact.tags?.map(t => t.id) || [];
                    const hasSelectedTags = selectedTags.some(tagId =>
                        contactTagIds.includes(tagId)
                    );

                    if (!hasSelectedTags) {
                        console.log("🚫 Socket.IO: Contato ignorado (sem tags selecionadas)", {
                            contactId: contact.id,
                            contactName: contact.name,
                            contactTags: contactTagIds,
                            selectedTags
                        });
                        return;
                    }
                }

                // ✅ Contato passou em TODAS as validações
                console.log("✅ Socket.IO: Contato adicionado/atualizado", {
                    action: data.action,
                    contactId: contact.id,
                    contactName: contact.name
                });

                dispatch({ type: "UPDATE_CONTACTS", payload: contact });
            }

            if (data.action === "delete") {
                dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
                setSelectedContactIds((prevSelected) =>
                    prevSelected.filter((id) => id !== +data.contactId)
                );
            }
        };
        socket.on(`company-${companyId}-contact`, onContactEvent);

        return () => {
            socket.off(`company-${companyId}-contact`, onContactEvent);
        };
    }, [socket, searchParam, selectedTags]);

    const handleSelectTicket = (ticket) => {
        const code = uuidv4();
        const { id, uuid } = ticket;
        setCurrentTicket({ id, uuid, code });
    }

    const handleCloseOrOpenTicket = (ticket) => {
        setNewTicketModalOpen(false);
        if (ticket !== undefined && ticket.uuid !== undefined) {
            window.open(`/tickets/${ticket.uuid}`, "_blank");
        }
    };

    const handleSelectedTags = (selecteds) => {
        const tags = selecteds.map((t) => t.id);
        setSelectedTags(tags);
    };

    const handleSearch = (event) => {
        setSearchParam(event.target.value.toLowerCase());
    };

    const handleOpenContactModal = () => {
        setSelectedContactId(null);
        setContactModalOpen(true);
    };

    const handleCloseContactModal = () => {
        setSelectedContactId(null);
        setContactModalOpen(false);
    };

    const handleRefreshContacts = async () => {
        // Força atualização da lista de contatos
        try {
            const { data } = await api.get("/contacts/", {
                params: {
                    searchParam,
                    pageNumber: 1,
                    contactTag: JSON.stringify(selectedTags)
                },
            });
            dispatch({ type: "RESET" });
            dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
            setHasMore(data.hasMore);
        } catch (err) {
            toastError(err);
        }
    };

    const hadleEditContact = (contactId) => {
        setSelectedContactId(contactId);
        setContactModalOpen(true);
    };

    const handleDeleteContact = async (contactId) => {
        try {
            await api.delete(`/contacts/${contactId}`);
            toast.success(i18n.t("contacts.toasts.deleted"));
        } catch (err) {
            toastError(err);
        }
        setDeletingContact(null);
    };

    // NOVA FUNÇÃO: SELECIONAR UM CONTATO INDIVIDUALMENTE
    const handleToggleSelectContact = (contactId) => (event) => {
        if (event.target.checked) {
            setSelectedContactIds((prevSelected) => [...prevSelected, contactId]);
        } else {
            setSelectedContactIds((prevSelected) => prevSelected.filter((id) => id !== contactId));
            setIsSelectAllChecked(false); // Se um individual é desmarcado, "Selecionar Tudo" deve ser desmarcado
        }
    };

    // NOVA FUNÇÃO: SELECIONAR/DESSELECIONAR TODOS OS CONTATOS
    const handleSelectAllContacts = (event) => {
        const checked = event.target.checked;
        setIsSelectAllChecked(checked);

        if (checked) {
            // Seleciona todos os IDs dos contatos filtrados visíveis
            const allContactIds = filteredContacts.map((contact) => contact.id);
            setSelectedContactIds(allContactIds);
        } else {
            setSelectedContactIds([]);
        }
    };

    // NOVA FUNÇÃO: DELETAR CONTATOS SELECIONADOS EM MASSA
    const handleDeleteSelectedContacts = async () => {
        try {
            setLoading(true);
            await api.delete("/contacts/batch-delete", {
                data: { contactIds: selectedContactIds } // Envia os IDs no corpo da requisição DELETE
            });
            toast.success(i18n.t("contacts.bulkActions.deleteSuccess"));
            setSelectedContactIds([]); // Limpa a seleção
            setIsSelectAllChecked(false); // Desmarca o "Selecionar Tudo"
            setConfirmDeleteManyOpen(false); // Fecha o modal de confirmação
            // Re-fetch os contatos para atualizar a lista
            dispatch({ type: "RESET" });
            setPageNumber(1);
        } catch (err) {
            toastError(err);
        } finally {
            setLoading(false);
        }
    };


    const handleBlockContact = async (contactId) => {
        try {
            await api.put(`/contacts/block/${contactId}`, { active: false });
            toast.success(i18n.t("contacts.bulkActions.blockContact"));
        } catch (err) {
            toastError(err);
        }
        setDeletingContact(null);
        setSearchParam("");
        setPageNumber(1);
        setBlockingContact(null);
    };

    const handleUnBlockContact = async (contactId) => {
        try {
            await api.put(`/contacts/block/${contactId}`, { active: true });
            toast.success(i18n.t("contacts.bulkActions.unblockContact"));
        } catch (err) {
            toastError(err);
        }
        setDeletingContact(null);
        setSearchParam("");
        setPageNumber(1);
        setUnBlockingContact(null);
    };

    const onSave = (whatsappId) => {
        setImportWhatsappId(whatsappId)
    }

    const handleimportContact = async () => {
        setImportContactModalOpen(false)

        try {
            await api.post("/contacts/import", { whatsappId: importWhatsappId });
            history.go(0);
            setImportContactModalOpen(false);
        } catch (err) {
            toastError(err);
            setImportContactModalOpen(false);
        }
    };

    const handleimportChats = async () => {
        console.log("handleimportChats")
        try {
            await api.post("/contacts/import/chats");
            history.go(0);
        } catch (err) {
            toastError(err);
        }
    };

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

    return (
        <MainContainer className={classes.mainContainer}>
            <NewTicketModal
                modalOpen={newTicketModalOpen}
                initialContact={contactTicket}
                onClose={(ticket) => {
                    handleCloseOrOpenTicket(ticket);
                }}
            />
            <ContactModal
                open={contactModalOpen}
                onClose={handleCloseContactModal}
                aria-labelledby="form-dialog-title"
                contactId={selectedContactId}
                onSaveSuccess={handleRefreshContacts}
            ></ContactModal>
            
            <ConfirmationModal
                title={
                    deletingContact
                        ? `${i18n.t(
                            "contacts.confirmationModal.deleteTitle"
                        )} ${deletingContact.name}?`
                        : blockingContact
                            ? i18n.t("contacts.confirmationModal.blockContact")
                            : unBlockingContact
                                ? i18n.t("contacts.confirmationModal.unblockContact")
                                : ImportContacts
                                    ? `${i18n.t("contacts.confirmationModal.importTitlte")}`
                                    : `${i18n.t("contactListItems.confirmationModal.importTitlte")}`
                }
                onSave={onSave}
                isCellPhone={ImportContacts}
                open={confirmOpen}
                onClose={setConfirmOpen}
                onConfirm={(e) =>
                    deletingContact
                        ? handleDeleteContact(deletingContact.id)
                        : blockingContact
                            ? handleBlockContact(blockingContact.id)
                            : unBlockingContact
                                ? handleUnBlockContact(unBlockingContact.id)
                                : ImportContacts
                                    ? handleimportContact()
                                    : handleImportExcel()
                }
            >
                {exportContact
                    ?
                    `${i18n.t("contacts.confirmationModal.exportContact")}`
                    : deletingContact
                        ? `${i18n.t("contacts.confirmationModal.deleteMessage")}`
                        : blockingContact
                            ? `${i18n.t("contacts.confirmationModal.blockContact")}`
                            : unBlockingContact
                                ? `${i18n.t("contacts.confirmationModal.unblockContact")}`
                                : ImportContacts
                                    ? i18n.t("contacts.bulkActions.selectConnectionToImport")
                                    : `${i18n.t(
                                        "contactListItems.confirmationModal.importMessage"
                                    )}`}
            </ConfirmationModal>

            {/* NOVO MODAL DE CONFIRMAÇÃO PARA DELEÇÃO EM MASSA */}
            <ConfirmationModal
                title={i18n.t("contacts.bulkActions.deleteConfirmTitle", { count: selectedContactIds.length })}
                open={confirmDeleteManyOpen}
                onClose={() => setConfirmDeleteManyOpen(false)}
                onConfirm={handleDeleteSelectedContacts}
            >
                {i18n.t("contacts.bulkActions.deleteConfirmMessage")}
            </ConfirmationModal>

            <ConfirmationModal
                title={i18n.t("contacts.confirmationModal.importChat")}
                open={confirmChatsOpen}
                onClose={setConfirmChatsOpen}
                onConfirm={(e) => handleimportChats()}
            >
                {i18n.t("contacts.confirmationModal.wantImport")}
            </ConfirmationModal>

            <MainHeader>
                <Title>{i18n.t("contacts.title")} ({contacts.length}{totalFiltered > contacts.length ? `/${totalFiltered}` : ""})</Title>
                <MainHeaderButtonsWrapper>
                    <TagsFilter
                        onFiltered={handleSelectedTags}
                    />
                    <TextField
                        placeholder={i18n.t("contacts.searchPlaceholder")}
                        type="search"
                        value={searchParam}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="secondary" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <PopupState variant="popover" popupId="demo-popup-menu">
                        {(popupState) => (
                            <React.Fragment>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    {...bindTrigger(popupState)}
                                >
                                    {i18n.t("contacts.menu.importExport")}
                                    <ArrowDropDown />
                                </Button>
                                <Menu {...bindMenu(popupState)}>
                                    <MenuItem
                                        onClick={() => {
                                            setConfirmOpen(true);
                                            setImportContacts(true);
                                            popupState.close();
                                        }}
                                    >
                                        <ContactPhone
                                            fontSize="small"
                                            color="primary"
                                            style={{
                                                marginRight: 10,
                                            }}
                                        />
                                        {i18n.t("contacts.menu.importYourPhone")}
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => { setImportContactModalOpen(true) }}

                                    >
                                        <Backup
                                            fontSize="small"
                                            color="primary"
                                            style={{
                                                marginRight: 10,
                                            }}
                                        />
                                        {i18n.t("contacts.menu.importToExcel")}

                                    </MenuItem>
                                </Menu>
                            </React.Fragment>
                        )}
                    </PopupState>

                    {/* BOTÃO DE DELETAR SELECIONADOS PADRONIZADO COM A COR DO WHITELABEL E TEXTO BRANCO */}
                    <Button
                        variant="contained"
                        onClick={() => setConfirmDeleteManyOpen(true)}
                        disabled={selectedContactIds.length === 0 || loading}
                        style={{
                            marginRight: 8,
                            backgroundColor: theme.palette.primary.main, // Utiliza a cor primária do tema
                            color: 'white' // Adiciona a cor do texto como branco
                        }}
                    >
                        {i18n.t("contacts.bulkActions.deleteSelected", { count: selectedContactIds.length })}
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenContactModal}
                    >
                        {i18n.t("contacts.buttons.add")}
                    </Button>
                </MainHeaderButtonsWrapper>
            </MainHeader>

            {importContactModalOpen && (
                <ContactImportWpModal
                    isOpen={importContactModalOpen}
                    handleClose={() => setImportContactModalOpen(false)}
                    selectedTags={selectedTags}
                    hideNum={hideNum}
                    userProfile={user.profile}
                />
            )}
            <Paper
                className={classes.mainPaper}
                variant="outlined"
            >
                <>
                    <input
                        style={{ display: "none" }}
                        id="upload"
                        name="file"
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={() => {
                            setConfirmOpen(true);
                        }}
                        ref={fileUploadRef}
                    />
                </>
                {/* Menu popup de filtro por coluna (fora da Table) */}
                <Menu
                    anchorEl={filterAnchor.el}
                    open={Boolean(filterAnchor.el)}
                    onClose={handleCloseFilter}
                    PaperProps={{ className: classes.filterMenu }}
                >
                    <MenuItem
                        className={!columnFilters[filterAnchor.field] ? classes.filterMenuItemActive : classes.filterMenuItem}
                        onClick={() => handleSelectFilter(filterAnchor.field, "")}
                    >
                        (Todos)
                    </MenuItem>
                    {(columnOptions[filterAnchor.field] || []).map(opt => (
                        <MenuItem
                            key={opt}
                            className={columnFilters[filterAnchor.field] === opt ? classes.filterMenuItemActive : classes.filterMenuItem}
                            onClick={() => handleSelectFilter(filterAnchor.field, opt)}
                        >
                            {opt}
                        </MenuItem>
                    ))}
                </Menu>
                <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 260px)" }} onScroll={handleScroll}>
                <Table size="small" stickyHeader className={classes.excelTable}>
                    <colgroup>
                        <col style={{ width: 40 }} />
                        <col style={{ width: 40 }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "12%" }} />
                        <col />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: 50 }} />
                        <col style={{ width: 120 }} />
                    </colgroup>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={isSelectAllChecked}
                                    onChange={handleSelectAllContacts}
                                    inputProps={{ "aria-label": i18n.t("contacts.table.selectAll") }}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell />
                            {[
                                { field: "name", label: i18n.t("contacts.table.name") },
                                { field: "number", label: i18n.t("contacts.table.whatsapp") },
                                { field: "email", label: i18n.t("contacts.table.email") },
                                { field: "followUp", label: i18n.t("contacts.table.followUp") },
                                { field: "tags", label: i18n.t("contacts.table.tags") },
                                { field: "products", label: i18n.t("contacts.table.products") },
                                { field: "payment", label: i18n.t("contacts.table.payment") },
                                { field: "attendant", label: i18n.t("contacts.table.attendant") },
                            ].map(({ field, label }) => (
                                <TableCell key={field} align="center">
                                    <div className={classes.headerCell}>
                                        <span>{label}</span>
                                        <IconButton
                                            size="small"
                                            className={columnFilters[field] ? classes.filterBtnActive : classes.filterBtn}
                                            onClick={handleOpenFilter(field)}
                                        >
                                            <ArrowDropDown style={{ fontSize: 16 }} />
                                        </IconButton>
                                    </div>
                                </TableCell>
                            ))}
                            <TableCell align="center">{i18n.t("contacts.table.status")}</TableCell>
                            <TableCell align="center">{i18n.t("contacts.table.actions")}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <>
                            {filteredContacts.map((contact) => (
                                <TableRow key={contact.id} className={classes.zebraRow}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedContactIds.includes(contact.id)}
                                            onChange={handleToggleSelectContact(contact.id)}
                                            size="small"
                                            inputProps={{ "aria-label": i18n.t("contacts.table.selectContact", { name: contact.name }) }}
                                        />
                                    </TableCell>
                                    <TableCell style={{ paddingRight: 0, overflow: "visible" }}>
                                        <Avatar src={`${contact?.urlPicture}`} style={{ width: 30, height: 30 }} />
                                    </TableCell>
                                    <TableCell className={classes.truncatedCell}>
                                        <Tooltip title={contact.name || ""} arrow>
                                            <span>{contact.name}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center" className={classes.truncatedCell}>
                                        <Box display="flex" alignItems="center" justifyContent="center" style={{ gap: '4px' }}>
                                            {contact.isGroup && (
                                                <GroupIcon style={{ color: '#25D366', fontSize: '1em' }} />
                                            )}
                                            {((enableLGPD && hideNum && user.profile === "user")
                                                ? contact.isGroup
                                                    ? contact.number :
                                                    formatSerializedId(contact?.number) === null ? contact.number.slice(0, -6) + "**-**" + contact?.number.slice(-2) :
                                                        formatSerializedId(contact?.number)?.slice(0, -6) + "**-**" + contact?.number?.slice(-2) :
                                                contact.isGroup ? contact.number : <PhoneNumberDisplay phoneNumber={contact?.number} />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center" className={classes.truncatedCell}>
                                        <Tooltip title={contact.email || ""} arrow>
                                            <span>{contact.email}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center" className={classes.truncatedCell}>
                                        <Tooltip title={contact.followUp || ""} arrow>
                                            <span>{contact.followUp}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title={contact.tags?.map(t => t.name).join(", ") || ""} arrow>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", overflow: "hidden", maxHeight: 48 }}>
                                                {contact.tags?.slice(0, 3).map((tag) => (
                                                    <Chip
                                                        key={tag.id}
                                                        label={tag.name}
                                                        size="small"
                                                        style={{
                                                            backgroundColor: tag.color || "#ccc",
                                                            color: "#fff",
                                                            fontSize: 10,
                                                            height: 20,
                                                            maxWidth: 80,
                                                        }}
                                                    />
                                                ))}
                                                {contact.tags?.length > 3 && (
                                                    <Chip label={`+${contact.tags.length - 3}`} size="small" style={{ fontSize: 10, height: 20 }} />
                                                )}
                                            </div>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title={contact.products?.map(p => p.name).join(", ") || ""} arrow>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", overflow: "hidden", maxHeight: 48 }}>
                                                {contact.products?.slice(0, 2).map((p) => (
                                                    <Chip
                                                        key={p.id}
                                                        label={p.name}
                                                        size="small"
                                                        variant="outlined"
                                                        style={{ fontSize: 10, height: 20, maxWidth: 100 }}
                                                    />
                                                ))}
                                                {contact.products?.length > 2 && (
                                                    <Chip label={`+${contact.products.length - 2}`} size="small" style={{ fontSize: 10, height: 20 }} />
                                                )}
                                            </div>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">
                                        <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", overflow: "hidden", maxHeight: 48 }}>
                                            {contact.products?.slice(0, 2).map((p) => {
                                                const s = (p.status || "").toLowerCase();
                                                const bg =
                                                    (s.includes("complet") || s.includes("comprado") || s.includes("aprovado")) ? "#4caf50" :
                                                    (s.includes("cancel") || s.includes("chargeback")) ? "#f44336" :
                                                    (s.includes("reembols") || s.includes("refund")) ? "#ff9800" :
                                                    (s.includes("pend") || s.includes("aguardando")) ? "#2196f3" :
                                                    (s.includes("expirado") || s.includes("carrinho")) ? "#9c27b0" :
                                                    "#9e9e9e";
                                                return (
                                                    <Chip
                                                        key={`pay-${p.id}`}
                                                        label={p.status}
                                                        size="small"
                                                        style={{ fontSize: 10, height: 20, backgroundColor: bg, color: "#fff" }}
                                                    />
                                                );
                                            })}
                                            {contact.products?.length > 2 && (
                                                <Chip label={`+${contact.products.length - 2}`} size="small" style={{ fontSize: 10, height: 20 }} />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell align="center" className={classes.truncatedCell}>
                                        <Tooltip title={(() => { const t = contact.tickets?.find(t => t.status === "open" || t.status === "pending"); return t?.user?.name || "-"; })()} arrow>
                                            <span>
                                                {(() => {
                                                    const openTicket = contact.tickets?.find(t => t.status === "open" || t.status === "pending");
                                                    return openTicket?.user?.name || "-";
                                                })()}
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">
                                        {contact.active ? (
                                            <CheckCircleIcon style={{ color: "green", fontSize: 16 }} />
                                        ) : (
                                            <CancelIcon style={{ color: "red", fontSize: 16 }} />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            disabled={!contact.active}
                                            onClick={() => {
                                                setContactTicket(contact);
                                                setNewTicketModalOpen(true);
                                            }}
                                        >
                                            {contact.channel === "whatsapp" && (<WhatsApp style={{ color: "green", fontSize: 18 }} />)}
                                            {contact.channel === "instagram" && (<Instagram style={{ color: "purple", fontSize: 18 }} />)}
                                            {contact.channel === "facebook" && (<Facebook style={{ color: "blue", fontSize: 18 }} />)}
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => hadleEditContact(contact.id)}
                                        >
                                            <EditIcon color="secondary" style={{ fontSize: 18 }} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={
                                                contact.active
                                                    ? () => { setConfirmOpen(true); setBlockingContact(contact); }
                                                    : () => { setConfirmOpen(true); setUnBlockingContact(contact); }
                                            }
                                        >
                                            {contact.active ? (
                                                <BlockIcon color="secondary" style={{ fontSize: 18 }} />
                                            ) : (
                                                <CheckCircleIcon color="secondary" style={{ fontSize: 18 }} />
                                            )}
                                        </IconButton>
                                        <Can
                                            role={user.profile}
                                            perform="contacts-page:deleteContact"
                                            yes={() => (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => { setConfirmOpen(true); setDeletingContact(contact); }}
                                                >
                                                    <DeleteOutlineIcon color="secondary" style={{ fontSize: 18 }} />
                                                </IconButton>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {loading && <TableRowSkeleton avatar columns={10} />}
                        </>
                    </TableBody>
                </Table>
                </div>
            </Paper>
        </MainContainer >
    );
};

export default Contacts;