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
  AllowNull,
  Default,
  DataType
} from "sequelize-typescript";

import Ticket from "./Ticket";
import Company from "./Company";
import User from "./User";

@Table({ tableName: "TicketAiSummaries" })
class TicketAiSummary extends Model<TicketAiSummary> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @AllowNull(true)
  @Column
  fromMessageId: number;

  @Column
  toMessageId: number;

  @Default(0)
  @Column
  messageCount: number;

  @Column(DataType.JSONB)
  summary: object;

  @Column(DataType.TEXT)
  summaryText: string;

  @Default("manual")
  @Column
  generatedBy: string;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default TicketAiSummary;
