import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Container, Typography, Paper, Box, Link } from "@material-ui/core";
import Favicon from "react-favicon";
import { getBackendUrl } from "../../config";
import useSettings from "../../hooks/useSettings";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: theme.spacing(4, 0),
  },
  paper: {
    padding: theme.spacing(4, 5),
    maxWidth: 900,
    margin: "0 auto",
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(2),
    },
  },
  logo: {
    maxHeight: 60,
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 700,
    marginBottom: theme.spacing(3),
  },
  subtitle: {
    fontWeight: 600,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    color: "#333",
  },
  text: {
    marginBottom: theme.spacing(2),
    color: "#555",
    lineHeight: 1.7,
  },
  footer: {
    marginTop: theme.spacing(4),
    paddingTop: theme.spacing(2),
    borderTop: "1px solid #eee",
    color: "#999",
    textAlign: "center",
    fontSize: "0.85rem",
  },
}));

const DataDeletion = () => {
  const classes = useStyles();
  const [appName, setAppName] = useState("");
  const [appLogo, setAppLogo] = useState("");
  const [appFavicon, setAppFavicon] = useState("/favicon.png");
  const [primaryColor, setPrimaryColor] = useState("#065183");
  const { getPublicSetting } = useSettings();

  useEffect(() => {
    const loadSettings = async () => {
      const keys = [
        { key: "appName", setter: setAppName },
        { key: "primaryColorLight", setter: setPrimaryColor },
      ];

      for (const { key, setter } of keys) {
        try {
          const val = await getPublicSetting(key);
          if (val) setter(val);
        } catch (e) {}
      }

      try {
        const logo = await getPublicSetting("appLogoLight");
        if (logo) {
          setAppLogo(
            logo.startsWith("http") || logo.startsWith("/")
              ? logo
              : getBackendUrl() + "/public/" + logo
          );
        }
      } catch (e) {}

      try {
        const favicon = await getPublicSetting("appLogoFavicon");
        if (favicon) {
          setAppFavicon(
            favicon.startsWith("http") || favicon.startsWith("/")
              ? favicon
              : getBackendUrl() + "/public/" + favicon
          );
        }
      } catch (e) {}
    };
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toLocaleDateString("pt-BR");
  const displayName = appName || "nosso sistema";

  return (
    <div className={classes.root}>
      <Favicon url={appFavicon} />
      <Container>
        <Paper className={classes.paper} elevation={1}>
          {appLogo && (
            <Box textAlign="center" mb={2}>
              <img src={appLogo} alt={displayName} className={classes.logo} />
            </Box>
          )}

          <Typography
            variant="h4"
            className={classes.title}
            align="center"
            style={{ color: primaryColor }}
          >
            Solicitacao de Exclusao de Dados
          </Typography>

          <Typography className={classes.text}>
            O <strong>{displayName}</strong> respeita o seu direito a privacidade e ao controle dos
            seus dados pessoais. Esta pagina descreve como voce pode solicitar a exclusao dos seus
            dados em conformidade com a LGPD (Lei 13.709/2018) e as politicas da Meta (Facebook/Instagram).
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            1. Quais dados armazenamos
          </Typography>
          <Typography className={classes.text}>
            Quando voce interage conosco atraves do Facebook Messenger ou Instagram Direct, podemos
            armazenar as seguintes informacoes:
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>Identificador do perfil (ID do Facebook/Instagram);</li>
              <li>Nome do perfil;</li>
              <li>Foto do perfil (quando disponivel);</li>
              <li>Historico de mensagens trocadas;</li>
              <li>Dados fornecidos durante o atendimento (telefone, e-mail, etc.).</li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            2. Como solicitar a exclusao dos seus dados
          </Typography>
          <Typography className={classes.text}>
            Voce pode solicitar a exclusao dos seus dados pessoais de duas formas:
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>
                <strong>Por mensagem:</strong> envie uma mensagem pela mesma plataforma onde foi
                atendido (Facebook Messenger ou Instagram Direct) solicitando a exclusao dos seus dados.
              </li>
              <li>
                <strong>Por e-mail:</strong> entre em contato conosco atraves dos canais de
                atendimento disponiveis no sistema informando seu nome e a plataforma utilizada.
              </li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            3. O que acontece apos a solicitacao
          </Typography>
          <Typography className={classes.text} component="div">
            Apos recebermos sua solicitacao:
            <ul>
              <li>Seus dados serao identificados em nosso sistema;</li>
              <li>
                Todas as informacoes pessoais e historico de mensagens serao excluidos
                permanentemente em ate <strong>30 dias</strong>;
              </li>
              <li>
                Voce recebera uma confirmacao de que a exclusao foi realizada;
              </li>
              <li>
                Dados anonimizados e agregados (que nao permitem sua identificacao) podem ser
                mantidos para fins estatisticos.
              </li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            4. Dados que podem ser retidos
          </Typography>
          <Typography className={classes.text}>
            Em alguns casos, podemos ser obrigados a reter determinados dados por exigencia legal ou
            regulatoria, como registros de transacoes financeiras ou dados necessarios para o
            cumprimento de obrigacoes legais. Nesses casos, os dados serao mantidos apenas pelo
            periodo exigido por lei.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            5. Seus direitos (LGPD)
          </Typography>
          <Typography className={classes.text} component="div">
            Alem da exclusao, voce tambem tem direito a:
            <ul>
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos ou desatualizados;</li>
              <li>Solicitar a portabilidade dos dados;</li>
              <li>Revogar o consentimento a qualquer momento;</li>
              <li>Obter informacoes sobre o compartilhamento dos seus dados.</li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            6. Contato
          </Typography>
          <Typography className={classes.text}>
            Para solicitar a exclusao dos seus dados ou exercer qualquer outro direito, entre em
            contato conosco atraves dos canais de atendimento disponiveis no sistema.
          </Typography>

          <Box mt={2} textAlign="center">
            <Link href="/politicas" color="primary" style={{ marginRight: 16 }}>
              Politica de Privacidade
            </Link>
            <Link href="/termos" color="primary">
              Termos de Uso
            </Link>
          </Box>

          <Typography className={classes.footer}>
            Ultima atualizacao: {today} | {displayName}
          </Typography>
        </Paper>
      </Container>
    </div>
  );
};

export default DataDeletion;
