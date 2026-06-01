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

const PrivacyPolicy = () => {
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
            Politica de Privacidade
          </Typography>

          <Typography className={classes.text}>
            A sua privacidade e importante para nos. Esta Politica de Privacidade descreve como o{" "}
            <strong>{displayName}</strong> coleta, usa, armazena e protege as informacoes dos
            usuarios.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            1. Informacoes Coletadas
          </Typography>
          <Typography className={classes.text}>
            Coletamos as seguintes informacoes quando voce utiliza nossos servicos:
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>
                <strong>Dados de cadastro:</strong> nome, e-mail, telefone e informacoes da empresa.
              </li>
              <li>
                <strong>Dados de uso:</strong> registros de acesso, interacoes com o sistema,
                mensagens trocadas e historico de atendimento.
              </li>
              <li>
                <strong>Dados de conexao:</strong> informacoes tecnicas como endereco IP, tipo de
                navegador e sistema operacional.
              </li>
              <li>
                <strong>Dados de integracao:</strong> informacoes provenientes de plataformas
                conectadas como WhatsApp, Facebook e Instagram.
              </li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            2. Como Utilizamos as Informacoes
          </Typography>
          <Typography className={classes.text} component="div">
            As informacoes coletadas sao utilizadas para:
            <ul>
              <li>Fornecer e manter nossos servicos de atendimento ao cliente;</li>
              <li>Processar e gerenciar tickets de atendimento;</li>
              <li>Enviar mensagens e notificacoes relacionadas ao servico;</li>
              <li>Melhorar a experiencia do usuario e a qualidade dos servicos;</li>
              <li>Cumprir obrigacoes legais e regulatorias;</li>
              <li>Garantir a seguranca e prevenir fraudes.</li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            3. Compartilhamento de Dados
          </Typography>
          <Typography className={classes.text}>
            Nao vendemos, alugamos ou compartilhamos suas informacoes pessoais com terceiros para
            fins de marketing. Podemos compartilhar dados com:
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>
                <strong>Provedores de servico:</strong> empresas que nos auxiliam na operacao do
                sistema (hospedagem, processamento de pagamentos).
              </li>
              <li>
                <strong>Plataformas integradas:</strong> como Meta (Facebook/Instagram) e WhatsApp,
                conforme necessario para o funcionamento das integracoes.
              </li>
              <li>
                <strong>Autoridades legais:</strong> quando exigido por lei ou ordem judicial.
              </li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            4. Armazenamento e Seguranca
          </Typography>
          <Typography className={classes.text}>
            Seus dados sao armazenados em servidores seguros com criptografia e protecao contra
            acesso nao autorizado. Adotamos medidas tecnicas e organizacionais para proteger suas
            informacoes, incluindo:
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>Criptografia de dados em transito (HTTPS/SSL);</li>
              <li>Controle de acesso baseado em funcoes;</li>
              <li>Backups regulares;</li>
              <li>Monitoramento de seguranca.</li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            5. Retencao de Dados
          </Typography>
          <Typography className={classes.text}>
            Mantemos seus dados pelo tempo necessario para fornecer os servicos contratados ou
            conforme exigido por lei. Apos o termino da relacao contratual, os dados serao excluidos
            ou anonimizados, salvo obrigacao legal de retencao.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            6. Direitos do Usuario (LGPD)
          </Typography>
          <Typography className={classes.text}>
            Em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018), voce tem
            direito a:
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>Confirmar a existencia de tratamento de dados;</li>
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>
                Solicitar a anonimizacao, bloqueio ou eliminacao de dados desnecessarios;
              </li>
              <li>Solicitar a portabilidade dos dados;</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            7. Cookies e Tecnologias Similares
          </Typography>
          <Typography className={classes.text}>
            Utilizamos cookies e tecnologias similares para manter sua sessao ativa, lembrar suas
            preferencias e melhorar a experiencia de uso do sistema.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            8. Integracoes com Terceiros
          </Typography>
          <Typography className={classes.text}>
            O {displayName} pode se integrar com plataformas de terceiros como WhatsApp (via API),
            Facebook Messenger e Instagram Direct. Ao utilizar essas integracoes, voce tambem esta
            sujeito as politicas de privacidade dessas plataformas.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            9. Exclusao de Dados
          </Typography>
          <Typography className={classes.text}>
            Voce pode solicitar a exclusao dos seus dados pessoais a qualquer momento entrando em
            contato conosco. Apos a solicitacao, seus dados serao removidos de nossos sistemas em
            ate 30 dias, salvo obrigacoes legais de retencao.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            10. Alteracoes nesta Politica
          </Typography>
          <Typography className={classes.text}>
            Esta politica pode ser atualizada periodicamente. Recomendamos que voce a revise
            regularmente. Alteracoes significativas serao comunicadas por meio do sistema.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            11. Contato
          </Typography>
          <Typography className={classes.text}>
            Para exercer seus direitos ou esclarecer duvidas sobre esta politica, entre em contato
            conosco atraves dos canais de atendimento disponiveis no sistema.
          </Typography>

          <Box mt={2} textAlign="center">
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

export default PrivacyPolicy;
