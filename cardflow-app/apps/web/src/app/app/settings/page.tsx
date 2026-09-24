'use client';

import { useState, useEffect } from 'react';
import { message } from 'antd';
import { DEFAULT_USER_PROFILE, type UserProfile } from '@cardflow-app/shared';
import { AppSettingsHub } from '../../_components/AppSettingsHub';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cardflow_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.fullName) {
            setProfile(parsed);
          }
        }
        const savedBalance = localStorage.getItem('cardflow_balance_hidden');
        if (savedBalance !== null) {
          setIsBalanceHidden(savedBalance === 'true');
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const handleProfileSave = (updated: UserProfile) => {
    setProfile(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cardflow_user_profile', JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }
  };

  const handleToggleBalance = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cardflow_balance_hidden', String(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });
  };

  const showToast = (content: string) => {
    messageApi.open({
      type: 'info',
      content,
      duration: 3,
    });
  };

  return (
    <div className={styles.page}>
      {contextHolder}
      <AppSettingsHub
        userProfile={profile}
        onProfileSave={handleProfileSave}
        isBalanceHidden={isBalanceHidden}
        onToggleBalance={handleToggleBalance}
        onToast={showToast}
      />
    </div>
  );
}
