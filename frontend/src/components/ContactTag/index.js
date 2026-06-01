import { makeStyles } from "@material-ui/styles";
import React from "react";

const useStyles = makeStyles(theme => ({
    tag: {
        padding: "1px 6px",
        borderRadius: "10px",
        fontSize: "0.6em",
        fontWeight: "bold",
        color: "#FFF",
        marginRight: "1px",
        whiteSpace: "nowrap"
    }
}));

const ContactTag = ({ tag }) => {
    const classes = useStyles();

    return (
        <div className={classes.tag} style={{ backgroundColor: tag.color }}>
           {tag.name.toUpperCase()}
        </div>
    )
}

export default ContactTag;