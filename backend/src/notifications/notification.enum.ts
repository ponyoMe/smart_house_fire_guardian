export enum NotificationType {
  ALERT = 'alert',
  INFO = 'info',
  SYSTEM = 'system',
  DEVICE = 'device',
  DAILY_SUMMARY = 'daily_summary',
}

export enum NotificationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

export enum PushPlatform {
  ANDROID = 'android',
  IOS = 'ios'
}