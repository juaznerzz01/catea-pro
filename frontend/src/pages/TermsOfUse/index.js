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

const TermsOfUse = () => {
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
            Termos de Uso
          </Typography>

          <Typography className={classes.text}>
            Bem-vindo ao <strong>{displayName}</strong>. Ao acessar e utilizar nosso sistema, voce
            concorda com os termos e condicoes descritos abaixo. Leia atentamente antes de utilizar
            nossos servicos.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            1. Aceitacao dos Termos
          </Typography>
          <Typography className={classes.text}>
            Ao criar uma conta ou utilizar qualquer funcionalidade do {displayName}, voce declara
            que leu, compreendeu e concorda com estes Termos de Uso. Caso nao concorde com algum dos
            termos, nao utilize o sistema.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            2. Descricao do Servico
          </Typography>
          <Typography className={classes.text}>
            O {displayName} e uma plataforma de atendimento multicanal que permite gerenciar
            conversas e interacoes com clientes atraves de canais como WhatsApp, Facebook Messenger e
            Instagram Direct. O sistema oferece funcionalidades como:
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>Gerenciamento de tickets de atendimento;</li>
              <li>Multiplos atendentes e filas de atendimento;</li>
              <li>Chatbots e automacoes;</li>
              <li>Envio de mensagens e campanhas;</li>
              <li>Relatorios e dashboards;</li>
              <li>Integracoes com plataformas de terceiros.</li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            3. Cadastro e Conta
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>
                Voce e responsavel por fornecer informacoes verdadeiras e atualizadas no cadastro.
              </li>
              <li>
                A conta e pessoal e intransferivel. Voce e responsavel por manter a
                confidencialidade de suas credenciais de acesso.
              </li>
              <li>
                Qualquer atividade realizada com suas credenciais sera de sua responsabilidade.
              </li>
              <li>
                Notifique-nos imediatamente caso suspeite de uso nao autorizado de sua conta.
              </li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            4. Uso Adequado
          </Typography>
          <Typography className={classes.text}>
            Ao utilizar o {displayName}, voce se compromete a:
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>
                Utilizar o sistema apenas para fins licitos e em conformidade com a legislacao
                vigente;
              </li>
              <li>
                Nao enviar mensagens de spam, conteudo ilegal, ofensivo ou que viole direitos de
                terceiros;
              </li>
              <li>
                Respeitar as politicas de uso das plataformas integradas (WhatsApp, Facebook,
                Instagram);
              </li>
              <li>
                Nao tentar acessar areas restritas do sistema ou explorar vulnerabilidades;
              </li>
              <li>Nao utilizar o sistema para assedio, ameacas ou qualquer forma de abuso;</li>
              <li>
                Manter-se em conformidade com a LGPD ao tratar dados pessoais de seus clientes.
              </li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            5. Obrigacoes do Usuario
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>Obter consentimento dos contatos antes de enviar mensagens;</li>
              <li>Manter seus dados de cadastro atualizados;</li>
              <li>Cumprir com as politicas de mensagens do WhatsApp Business e Meta;</li>
              <li>Nao compartilhar credenciais de acesso com terceiros nao autorizados;</li>
              <li>Reportar qualquer problema ou vulnerabilidade identificada.</li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            6. Limitacoes de Responsabilidade
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>
                O {displayName} nao se responsabiliza por interrupcoes de servico causadas por
                fatores externos (falhas de internet, indisponibilidade de APIs de terceiros, etc.).
              </li>
              <li>
                Nao nos responsabilizamos pelo conteudo das mensagens enviadas pelos usuarios
                atraves do sistema.
              </li>
              <li>
                O sistema e fornecido "como esta", sem garantias de que funcionara de forma
                ininterrupta ou livre de erros.
              </li>
              <li>
                Nao somos responsaveis por perdas ou danos decorrentes do uso inadequado do sistema.
              </li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            7. Propriedade Intelectual
          </Typography>
          <Typography className={classes.text}>
            Todo o conteudo, design, codigo-fonte, marcas e logos do {displayName} sao de
            propriedade exclusiva da empresa. E proibida a reproducao, distribuicao ou modificacao
            sem autorizacao previa e por escrito.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            8. Pagamentos e Planos
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>
                O acesso ao sistema pode estar sujeito a planos pagos conforme tabela vigente.
              </li>
              <li>
                Os pagamentos devem ser realizados conforme as condicoes do plano contratado.
              </li>
              <li>O nao pagamento pode resultar na suspensao ou cancelamento do acesso.</li>
              <li>Reembolsos serao tratados conforme a politica especifica de cada plano.</li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            9. Suspensao e Cancelamento
          </Typography>
          <Typography className={classes.text}>
            Reservamo-nos o direito de suspender ou cancelar o acesso de usuarios que:
          </Typography>
          <Typography className={classes.text} component="div">
            <ul>
              <li>Violem estes Termos de Uso;</li>
              <li>Utilizem o sistema para fins ilegais;</li>
              <li>Enviem spam ou mensagens em massa nao autorizadas;</li>
              <li>Comprometam a seguranca ou estabilidade do sistema;</li>
              <li>Estejam inadimplentes com pagamentos.</li>
            </ul>
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            10. Protecao de Dados
          </Typography>
          <Typography className={classes.text}>
            O tratamento de dados pessoais e regido pela nossa{" "}
            <Link href="/politicas">Politica de Privacidade</Link>, que e parte integrante destes
            Termos de Uso. Ao utilizar o sistema, voce tambem concorda com a Politica de
            Privacidade.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            11. Alteracoes nos Termos
          </Typography>
          <Typography className={classes.text}>
            Estes termos podem ser atualizados a qualquer momento. Alteracoes significativas serao
            comunicadas atraves do sistema. O uso continuado apos alteracoes constitui aceitacao dos
            novos termos.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            12. Legislacao Aplicavel
          </Typography>
          <Typography className={classes.text}>
            Estes Termos de Uso sao regidos pela legislacao brasileira. Quaisquer disputas serao
            resolvidas no foro da comarca da sede da empresa.
          </Typography>

          <Typography variant="h6" className={classes.subtitle}>
            13. Contato
          </Typography>
          <Typography className={classes.text}>
            Para duvidas, sugestoes ou reclamacoes sobre estes Termos de Uso, entre em contato
            conosco atraves dos canais de atendimento disponiveis no sistema.
          </Typography>

          <Box mt={2} textAlign="center">
            <Link href="/politicas" color="primary">
              Politica de Privacidade
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

export default TermsOfUse;
