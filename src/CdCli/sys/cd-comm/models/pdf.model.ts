import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PdfModel {
  @PrimaryGeneratedColumn({
    name: 'pdf_id',
  })
  pdfId?: number;

  @Column({
    name: 'pdf_guid',
  })
  pdfGuid!: string;

  @Column({
    name: 'pdf_name',
  })
  pdfName!: string;

  @Column({
    name: 'pdf_description',
  })
  companyDescription!: string;

  @Column({
    name: 'doc_id',
  })
  docId!: number;
}
