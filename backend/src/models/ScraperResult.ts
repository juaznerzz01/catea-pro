import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Company from "./Company";
import ScraperFolder from "./ScraperFolder";

@Table
class ScraperResult extends Model<ScraperResult> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => ScraperFolder)
  @Column
  folderId: number;

  @BelongsTo(() => ScraperFolder)
  folder: ScraperFolder;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @AllowNull(true)
  @Column
  name: string;

  @AllowNull(true)
  @Column
  category: string;

  @AllowNull(true)
  @Column
  rating: string;

  @AllowNull(true)
  @Column
  reviewCount: string;

  @AllowNull(true)
  @Column
  phone: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  address: string;

  @AllowNull(true)
  @Column
  website: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  hours: string;

  @AllowNull(true)
  @Column
  plusCode: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  mapsLink: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ScraperResult;
