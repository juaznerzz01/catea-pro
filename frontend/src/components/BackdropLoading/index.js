import React from "react";

const spinnerStyle = {
	position: "fixed",
	inset: 0,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	backgroundColor: "rgba(255, 255, 255, 0.8)",
	zIndex: 9999,
};

const dotStyle = {
	width: 40,
	height: 40,
	border: "3px solid rgba(107, 70, 193, 0.15)",
	borderTopColor: "#6B46C1",
	borderRadius: "50%",
	animation: "app-spin 0.7s linear infinite",
};

const BackdropLoading = () => {
	return (
		<div style={spinnerStyle}>
			<div style={dotStyle} />
		</div>
	);
};

export default BackdropLoading;
