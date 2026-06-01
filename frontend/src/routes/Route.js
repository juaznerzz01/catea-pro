import React, { useContext } from "react";
import { Route as RouterRoute, Redirect } from "react-router-dom";

import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";

const publicAlwaysAccessible = ["/login", "/signup", "/forgot-password", "/reset-password"];

const Route = ({ component: Component, isPrivate = false, ...rest }) => {
	const { isAuth, loading } = useContext(AuthContext);

	// Enquanto verifica autenticação, só mostra loading (sem redirect)
	if (loading) {
		return <BackdropLoading />;
	}

	if (!isAuth && isPrivate) {
		return <Redirect to={{ pathname: "/login", state: { from: rest.location } }} />;
	}

	// Rotas públicas que devem ser acessíveis mesmo logado (ex: reset-password)
	if (isAuth && !isPrivate && !publicAlwaysAccessible.includes(rest.path)) {
		return <Redirect to={{ pathname: "/", state: { from: rest.location } }} />;
	}

	return <RouterRoute {...rest} component={Component} />;
};

export default Route;
