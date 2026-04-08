import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { PushPlatform } from '../notification.enum';

@Entity('user_push_tokens')
export class UserPushTokenEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'varchar', length: 20 })
  platform!: PushPlatform;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}