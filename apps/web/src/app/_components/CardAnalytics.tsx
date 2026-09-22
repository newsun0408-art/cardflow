'use client';

import { 
  EyeOutlined, 
  UserAddOutlined, 
  QrcodeOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons';

interface CardAnalyticsProps {
  viewsCount: number;
  savesCount: number;
  scansCount: number;
}

export function CardAnalytics({ viewsCount, savesCount, scansCount }: CardAnalyticsProps) {
  const stats = [
    { title: 'Lượt xem thẻ', value: viewsCount, icon: <EyeOutlined style={{ color: '#38bdf8' }} /> },
    { title: 'Đã lưu danh bạ', value: savesCount, icon: <UserAddOutlined style={{ color: '#4ade80' }} /> },
    { title: 'Lượt quét QR', value: scansCount, icon: <QrcodeOutlined style={{ color: '#a78bfa' }} /> },
    { title: 'NFC Bảo mật', value: 'Sẵn sàng', icon: <SafetyCertificateOutlined style={{ color: '#f59e0b' }} /> },
  ];

  return (
    <div
      style={{
        maxWidth: '440px',
        margin: '28px auto 0 auto',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '16px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>
          THỐNG KÊ TƯƠNG TÁC THẺ CÁ NHÂN
        </span>
        <span style={{ fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
          Realtime
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {stats.map((s) => (
          <div
            key={s.title}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '18px' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.title}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
