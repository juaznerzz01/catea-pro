import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Company from "./Company";
import Contact from "./Contact";
import Whatsapp from "./Whatsapp";

@Table({ tableName: "PendingIdentityResolutions" })
class PendingIdentityResolution extends Model<PendingIdentityResolution> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @AllowNull(false)
  @Column
  lidValue: string;

  @AllowNull(true)
  @Column
  messageWid: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  messageDataJson: string;

  @AllowNull(true)
  @Column
  pushName: string;

  @Default("pending")
  @Column(DataType.ENUM("pending", "resolved", "expired"))
  status: "pending" | "resolved" | "expired";

  @ForeignKey(() => Contact)
  @AllowNull(true)
  @Column
  resolvedContactId: number;

  @BelongsTo(() => Contact)
  resolvedContact: Contact;

  @AllowNull(true)
  @Column
  resolvedAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default PendingIdentityResolution;
