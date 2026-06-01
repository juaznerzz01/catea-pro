import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

const useStyles = makeStyles(theme => ({
	mainContainer: {
		flex: 1,
		padding: "12px !important",
		height: `calc(100% - 48px)`,
		overflow: "hidden",
	},

	contentWrapper: {
		height: "100%",
		overflowY: "hidden",
		display: "flex",
		flexDirection: "column",
	},
}));

const MainContainer = ({ children, maxWidth = false, ...props }) => {
	const classes = useStyles();

	return (
		<Container className={classes.mainContainer} maxWidth={maxWidth} {...props}>
			<div className={classes.contentWrapper}>{children}</div>
		</Container>
	);
};

export default MainContainer;
