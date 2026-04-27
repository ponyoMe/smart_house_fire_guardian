import * as admin from 'firebase-admin';
import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

export interface SendPushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class FcmPushProvider {
  private readonly logger = new Logger(FcmPushProvider.name);

  constructor() {
    if (!admin.apps.length) {
      const serviceAccount = this.getServiceAccount();

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.project_id,
          privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
          clientEmail: serviceAccount.client_email,
        }),
      });

      this.logger.log('Firebase Admin initialized');
    }
  }

  private getServiceAccount() {
    // For Render: full JSON string in environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }

    // For local development: path to JSON file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

    if (!serviceAccountPath) {
      this.logger.error(
        'Firebase credentials are not set. Use FIREBASE_SERVICE_ACCOUNT_KEY on Render or FIREBASE_SERVICE_ACCOUNT_KEY_PATH locally.',
      );
      throw new Error('Firebase service account credentials are required');
    }

    return JSON.parse(
      fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'),
    );
  }

  async send(payload: SendPushPayload): Promise<void> {
    try {
      const message = {
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'alerts',
            sound: 'default',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      await admin.messaging().send(message);
      this.logger.log(`Notification sent to token=${payload.token}`);
    } catch (error: any) {
      this.logger.error('Failed to send FCM push notification', error);
      throw error;
    }
  }
}