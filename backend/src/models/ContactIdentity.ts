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

@Table({ tableName: "ContactIdentities" })
class ContactIdentity extends Model<ContactIdentity> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @AllowNull(false)
  @Column(DataType.ENUM("lid", "jid", "phone"))
  identityType: "lid" | "jid" | "phone";

  @AllowNull(false)
  @Column
  identityValue: string;

  @Default(false)
  @Column
  isPrimary: boolean;

  @AllowNull(true)
  @Column
  lastSeenAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ContactIdentity;
