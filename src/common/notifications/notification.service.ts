import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User, NotificationPreferences } from '../../database/entities/user.entity';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Pass one of these keys to skip users who have that pref toggled off */
export type NotificationPrefKey = keyof NotificationPreferences;

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

  /**
   * Send to a single user by userId.
   * If prefKey is provided, the notification is skipped if the user has that pref disabled.
   */
  async sendToUser(
    userId: string,
    message: PushMessage,
    prefKey?: NotificationPrefKey,
  ): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'expoPushToken', 'notificationPrefs'],
    });
    if (!user?.expoPushToken) return;

    // Skip if user has disabled this notification type
    if (prefKey && user.notificationPrefs?.[prefKey] === false) return;

    await this.sendRaw([user.expoPushToken], message);
  }

  /**
   * Send to multiple users by userIds.
   * If prefKey is provided, only users with that pref enabled receive it.
   */
  async sendToUsers(
    userIds: string[],
    message: PushMessage,
    prefKey?: NotificationPrefKey,
  ): Promise<void> {
    if (!userIds.length) return;
    const users = await this.userRepo.find({
      where: { id: In(userIds) },
      select: ['id', 'expoPushToken', 'notificationPrefs'],
    });
    const tokens = users
      .filter((u) => {
        if (!u.expoPushToken) return false;
        if (prefKey && u.notificationPrefs?.[prefKey] === false) return false;
        return true;
      })
      .map((u) => u.expoPushToken as string);
    if (!tokens.length) return;
    await this.sendRaw(tokens, message);
  }

  /**
   * Broadcast to ALL users who have a push token.
   * If prefKey is provided, only users with that pref enabled receive it.
   */
  async broadcast(message: PushMessage, prefKey?: NotificationPrefKey): Promise<void> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .select(['u.expoPushToken'])
      .where('u.expo_push_token IS NOT NULL');

    if (prefKey) {
      // JSONB check: notification_prefs->>'prefKey' != 'false'  (default true when null)
      qb.andWhere(
        `(u.notification_prefs->>'${prefKey}' IS NULL OR u.notification_prefs->>'${prefKey}' != 'false')`,
      );
    }

    const users = await qb.getMany();
    const tokens = users
      .map((u) => u.expoPushToken)
      .filter((t): t is string => !!t);
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
