import * as admin from 'firebase-admin';
import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

export interface SendPushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

dotenv.config();

@Injectable()
export class FcmPushProvider {
  private readonly logger = new Logger(FcmPushProvider.name);

   constructor() {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    if (!serviceAccountPath) {
      this.logger.error('FIREBASE_SERVICE_ACCOUNT_KEY_PATH is not set in environment variables');
      throw new Error('Firebase service account key path is required');
    }

    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')
      );

      // Initialize Firebase Admin SDK using parsed JSON credentials
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.project_id,
          privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),  // Fix line breaks in private_key
          clientEmail: serviceAccount.client_email,
        }),
      });
    }
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

      // Send the push notification via Firebase Cloud Messaging
      await admin.messaging().send(message);
      this.logger.log(`Notification sent to token=${payload.token}`);
    } catch (error: any) {
      this.logger.error('Failed to send FCM push notification', error);
      throw error;
    }
  }
}