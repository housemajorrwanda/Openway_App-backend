import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: 'default';
  priority: 'high';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly expoUrl = 'https://exp.host/--/push/v2/send';

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Send to a single user by userId
  async sendToUser(userId: string, message: PushMessage): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'expoPushToken'],
    });
    if (!user?.expoPushToken) return;
    await this.sendRaw([user.expoPushToken], message);
  }

  // Send to multiple users by userIds (e.g. traffic broadcast)
  async sendToUsers(userIds: string[], message: PushMessage): Promise<void> {
    if (!userIds.length) return;
    const users = await this.userRepo.find({
      where: { id: In(userIds) },
      select: ['id', 'expoPushToken'],
    });
    const tokens = users
      .map((u) => u.expoPushToken)
      .filter((t): t is string => !!t);
    if (!tokens.length) return;
    await this.sendRaw(tokens, message);
  }

  // Send to ALL users who have a push token (e.g. traffic/weather broadcast)
  async broadcast(message: PushMessage): Promise<void> {
    const users = await this.userRepo
      .createQueryBuilder('u')
      .select('u.expo_push_token', 'token')
      .where('u.expo_push_token IS NOT NULL')
      .getRawMany<{ token: string }>();

    const tokens = users.map((u) => u.token);
    if (!tokens.length) return;

    // Expo allows max 100 per request — chunk accordingly
    for (let i = 0; i < tokens.length; i += 100) {
      await this.sendRaw(tokens.slice(i, i + 100), message);
    }
  }

  private async sendRaw(tokens: string[], message: PushMessage): Promise<void> {
    const messages: ExpoMessage[] = tokens.map((to) => ({
      to,
      title: message.title,
      body: message.body,
      data: message.data,
      sound: 'default',
      priority: 'high',
    }));

    try {
      const res = await fetch(this.expoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Expo push failed (${res.status}): ${text}`);
        return;
      }

      const json = (await res.json()) as { data: { status: string; message?: string }[] };
      for (const ticket of json.data) {
        if (ticket.status === 'error') {
          this.logger.warn(`Expo push ticket error: ${ticket.message}`);
        }
      }
    } catch (err) {
      this.logger.error('Failed to reach Expo push service', err);
    }
  }
}
