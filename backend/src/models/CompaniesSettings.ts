/**
 * @TercioSantos-0 |
 * model/CompaniesSettings |
 * @descrição:modelo para tratar as configurações das empresas
 */
import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  DataType,           // 👈 adicionar
} from "sequelize-typescript";
import Company from "./Company";

@Table({ tableName: "CompaniesSettings" })
class CompaniesSettings extends Model<CompaniesSettings> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Column
  hoursCloseTicketsAuto: string;

  @Column
  chatBotType: string;

  @Column
  acceptCallWhatsapp: string;

  //inicio de opções: enabled ou disabled
  @Column
  userRandom: string;

  @Column
  sendGreetingMessageOneQueues: string;

  @Column
  sendSignMessage: string;

  @Column
  sendFarewellWaitingTicket: string;

  @Column
  userRating: string;

  @Column
  sendGreetingAccepted: string;

  @Column
  CheckMsgIsGroup: string;

  @Column
  sendQueuePosition: string;

  @Column
  scheduleType: string;

  @Column
  acceptAudioMessageContact: string;

  // 👇 manter como string, mas com default (alinha com migration: 'disabled')
  @Default("disabled")
  @Column
  sendMsgTransfTicket: string;

  @Column
  enableLGPD: string;

  @Column
  requiredTag: string;

  @Column
  lgpdDeleteMessage: string;

  @Column
  lgpdHideNumber: string;

  @Column
  lgpdConsent: string;

  @Column
  lgpdLink: string;   // 👈 ; faltava

  //fim de opções: enabled ou disabled
  @Column
  lgpdMessage: string;   // 👈 ; faltava

  // Campo para controlar criação automática de usuário demo
  @Default("disabled")
  @Column
  createDemoUser: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  DirectTicketsToWallets: boolean;

  // 👇 novo campo com default false
  @Default(false)
  @Column(DataType.BOOLEAN)
  closeTicketOnTransfer: boolean;

  // 👇 texto longo + default vazio (igual migration)
  @Default("")
  @Column(DataType.TEXT)
  transferMessage: string;

  @Column
  greetingAcceptedMessage: string;

  @Column
  AcceptCallWhatsappMessage: string;

  @Column
  sendQueuePositionMessage: string;

  // (opcional) definir default false aqui também
  @Default(false)
  @Column(DataType.BOOLEAN)
  showNotificationPending: boolean;

  // Campo para controlar se a empresa vai usar timezone próprio
  @Default(false)
  @Column(DataType.BOOLEAN)
  overrideDefaultTimezone: boolean;

  // Tradução automática de mensagens
  @Default("disabled")
  @Column
  autoTranslate: string;

  @Column
  translateApiKey: string;

  @Default("")
  @Column(DataType.TEXT)
  aiSuggestionsPrompt: string;

  @Default("disabled")
  @Column
  aiAutoSummary: string;

  @Default("23:00")
  @Column
  aiAutoSummaryTime: string;

  @Default("")
  @Column
  facebookAppId: string;

  @Default("")
  @Column
  facebookAppSecret: string;

  @Default("")
  @Column
  facebookVerifyToken: string;

  // Mensagem de boas-vindas ao se cadastrar
  @Default("disabled")
  @Column
  sendWelcomeMessage: string;

  @Column(DataType.TEXT)
  welcomeMessageTemplate: string;

  // Configurações SMTP
  @Column
  smtpHost: string;

  @Default("465")
  @Column
  smtpPort: string;

  @Column
  smtpUser: string;

  @Column
  smtpPass: string;

  @Default("true")
  @Column
  smtpSecure: string;

  @Column
  smtpFrom: string;

  // Saída IA do FlowBuilder
  @Default("disabled")
  @Column
  flowbuilderAI: string;

  @Default("")
  @Column(DataType.TEXT)
  flowbuilderAIApiKey: string;

  @Default("")
  @Column(DataType.TEXT)
  flowbuilderAIPrompt: string;
}

export default CompaniesSettings;
