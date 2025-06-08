import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
    validateOrReject,
} from 'class-validator';

@Entity(
    {
        name: 'group',
        synchronize: false
    }
)
// @CdModel
export class CdPushViewModel {

    @PrimaryGeneratedColumn(
        {
            name: 'group_id'
        }
    )
    groupId?: number;
}