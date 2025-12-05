/* eslint-disable
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-return
*/

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string; // 👈 solo string, sin | null

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  source?: string; // ej: 'freebie-mini-ritual'

  @Column({ nullable: true })
  eventName?: string; // 'lead', 'purchase', etc.

  @Column({ nullable: true })
  eventId?: string;

  @Column({ nullable: true })
  ip?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
