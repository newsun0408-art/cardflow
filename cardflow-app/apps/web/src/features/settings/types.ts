export type SettingsSubTab = 'profile' | 'security' | 'payments' | 'preferences' | 'sessions';

export type AccentColor = 'cyan' | 'gold' | 'emerald' | 'ruby';

export interface DeviceSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  type: 'desktop' | 'mobile' | 'tablet';
  isCurrent: boolean;
  lastActive: string;
}
