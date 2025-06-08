import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Comm {
  @PrimaryGeneratedColumn()
  commId?: number;

  @Column({
    length: 36,
  })
  commGuid?: string;

  @Column('varchar', {
    length: 50,
    nullable: true,
  })
  commName!: string;
}
