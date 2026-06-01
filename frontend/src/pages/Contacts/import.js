import { Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { i18n } from "../../translate/i18n";
import ContactImport from "../../components/ContactImport";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";

const useStyles = makeStyles(theme => ({
    mainPaper: {
        flex: 1,
        padding: 1,
        borderRadius: 0,
        overflowY: "scroll",
        padding: 1,
        ...theme.scrollbarStylesSoftBig
    },
}));

const ContactImportPage = () => {
    const classes = useStyles();

    return <MainContainer className={classes.mainContainer}>
        <MainHeader>
            <Title>{i18n.t("contactImport.title")}</Title>
        </MainHeader>
        <Paper
            className={classes.mainPaper}
            variant="outlined">
            <ContactImport />
        </Paper>
    </MainContainer>
}

export default ContactImportPage;