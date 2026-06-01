import nodemailer from "nodemailer";
import CompaniesSettings from "../models/CompaniesSettings";

export interface MailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export async function getSMTPConfig(companyId?: number): Promise<SMTPConfig | null> {
  // 1. Buscar SMTP da empresa principal (companyId=1) — config global do super admin
  try {
    const settings = await CompaniesSettings.findOne({
      where: { companyId: 1 }
    });
    if (settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
      return {
        host: settings.smtpHost,
        port: parseInt(settings.smtpPort || "465", 10),
        secure: settings.smtpSecure === "true",
        user: settings.smtpUser,
        pass: settings.smtpPass,
        from: settings.smtpFrom || settings.smtpUser
      };
    }
  } catch (err) {
    console.error("Error fetching SMTP config from DB:", err);
  }

  // 2. Fallback para variáveis de ambiente
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;

  if (host && user && pass) {
    return {
      host,
      port: parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || "587", 10),
      secure: (process.env.SMTP_SECURE || "false") === "true",
      user,
      pass,
      from: process.env.SMTP_FROM || process.env.MAIL_FROM || user
    };
  }

  return null;
}

export async function SendMail(mailData: MailData, companyId?: number) {
  const config = await getSMTPConfig(companyId);

  if (!config) {
    throw new Error("SMTP não configurado. Configure nas Configurações > Email/SMTP.");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  const info = await transporter.sendMail({
    from: config.from,
    to: mailData.to,
    subject: mailData.subject,
    text: mailData.text,
    html: mailData.html || mailData.text
  });

  console.log("Message sent: %s", info.messageId);
  return info;
}

export async function testSMTPConnection(companyId: number): Promise<{ success: boolean; message: string }> {
  const config = await getSMTPConfig(companyId);

  if (!config) {
    return { success: false, message: "SMTP não configurado." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    await transporter.verify();
    return { success: true, message: "Conexão SMTP bem-sucedida!" };
  } catch (err: any) {
    return { success: false, message: err.message || "Falha na conexão SMTP." };
  }
}
