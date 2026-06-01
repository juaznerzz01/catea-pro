import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  Default,
  HasMany,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  DataType,
  BeforeCreate,
  BeforeUpdate
} from "sequelize-typescript";
import ContactCustomField from "./ContactCustomField";
import ContactIdentity from "./ContactIdentity";
import Ticket from "./Ticket";
import Company from "./Company";
import Schedule from "./Schedule";
import ContactTag from "./ContactTag";
import Tag from "./Tag";
import ContactWallet from "./ContactWallet";
import ContactProduct from "./ContactProduct";
import User from "./User";
import Whatsapp from "./Whatsapp";
import { normalizePhoneNumber } from "../utils/normalizePhoneNumber";
import AppError from "../errors/AppError";
import logger from "../utils/logger";

@Table
class Contact extends Model<Contact> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @AllowNull(true)
  @Column
  number: string;

  @AllowNull(false)
  @Default("")
  @Column
  email: string;

  @Default("")
  @Column
  profilePicUrl: string;

  @Default(false)
  @Column
  isGroup: boolean;

  @Default(false)
  @Column
  disableBot: boolean;

  @Default(true)
  @Column
  acceptAudioMessage: boolean;

  @Default(true)
  @Column
  active: boolean;

  @Default("whatsapp")
  @Column
  channel: string;

  @Default("manual")
  @Column({
    type: DataType.ENUM('manual', 'whatsapp_roster', 'excel_import', 'auto_created', 'chat_import')
  })
  source: string;

  @AllowNull(true)
  @Column(DataType.STRING(10))
  language: string;

  @Default(true)
  @Column
  isInAgenda: boolean;

  @AllowNull(true)
  @Column(DataType.TEXT)
  followUp: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @HasMany(() => ContactCustomField)
  extraInfo: ContactCustomField[];

  @HasMany(() => ContactIdentity)
  identities: ContactIdentity[];

  @HasMany(() => ContactTag)
  contactTags: ContactTag[];

  @BelongsToMany(() => Tag, () => ContactTag)
  tags: Tag[];

  @HasMany(() => ContactProduct)
  products: ContactProduct[];

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Schedule, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  schedules: Schedule[];

  @Column
  remoteJid: string;

  /* ====== ADIÇÕES PARA SUPORTE A LID/JID (não quebram nada existente) ====== */
  @AllowNull(true)
  @Column
  lid?: string | null;

  @AllowNull(true)
  @Column
  jid?: string | null;

  // Getter utilitário (não persiste em DB): chave canônica do chat
  get chatKey(): string | null {
    return this.lid ?? this.jid ?? null;
  }
  /* ======================================================================== */

  /* ====== SOFT MERGE: contatos fantasma são marcados, não deletados ====== */
  @Default(false)
  @Column
  isMerged: boolean;

  @AllowNull(true)
  @ForeignKey(() => Contact)
  @Column
  mergedIntoContactId: number;
  /* ======================================================================== */

  @Column
  lgpdAcceptedAt: Date;

  @Column
  pictureUpdated: boolean;

  @Column
  get urlPicture(): string | null {
    if (this.getDataValue("urlPicture")) {
      // BACKEND_URL já inclui a porta, não precisa adicionar PROXY_PORT
      return this.getDataValue("urlPicture") === 'nopicture.png' ?
        `${process.env.FRONTEND_URL}/nopicture.png` :
        `${process.env.BACKEND_URL}/public/company${this.companyId}/contacts/${this.getDataValue("urlPicture")}`;
    }
    return null;
  }

  @BelongsToMany(() => User, () => ContactWallet, "contactId", "walletId")
  wallets: ContactWallet[];

  @HasMany(() => ContactWallet)
  contactWallets: ContactWallet[];

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  /**
   * Hook de normalização E.164 para números de telefone
   * Executado antes de criar ou atualizar contatos
   * Controlado pela feature flag FEATURE_CONTACTS_NORMALIZE_E164
   */
  @BeforeCreate
  @BeforeUpdate
  static async normalizeNumberHook(contact: Contact) {
    // Pular se feature flag desabilitada
    if (process.env.FEATURE_CONTACTS_NORMALIZE_E164 !== 'true') {
      return;
    }

    // Pular se é grupo
    if (contact.isGroup) {
      return;
    }

    // Pular se número está vazio (permite contatos sem número)
    if (!contact.number || contact.number.trim() === '') {
      logger.info({
        action: 'contact_without_number',
        contactId: contact.id || 'new',
        message: 'Contact created/updated without phone number',
        companyId: contact.companyId
      });
      return; // Pular normalização, permitir contato sem número
    }

    // Salvar número original para log
    const rawNumber = contact.number;

    // Normalizar
    const normalized = normalizePhoneNumber(contact.number);

    if (normalized) {
      logger.info({
        action: 'contact_number_normalized',
        contactId: contact.id || 'new',
        rawNumber,
        normalizedNumber: normalized,
        companyId: contact.companyId
      });
      contact.number = normalized;
    } else {
      logger.error({
        action: 'contact_number_normalization_failed',
        contactId: contact.id || 'new',
        rawNumber,
        companyId: contact.companyId
      });
      throw new AppError('ERR_INVALID_PHONE_NUMBER', 400);
    }
  }
}

export default Contact;
