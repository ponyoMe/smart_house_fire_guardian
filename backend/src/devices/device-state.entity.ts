import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { DeviceStatus } from './device.enums';

@Entity('device_current_state')
export class DeviceStateEntity {
  @PrimaryColumn({ name: 'device_id', type: 'varchar', length: 100 })
  deviceId!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: DeviceStatus;

  @Column({ name: 'last_seen', type: 'timestamp', nullable: true })
  lastSeen!: Date | null;

  @Column({ name: 'last_telemetry', type: 'jsonb', nullable: true })
  lastTelemetry!: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  state!: Record<string, any> | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}