'use client';

import { useState } from 'react';
import { CloseOutlined, SlidersOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface SetLimitModalProps {
  isOpen: boolean;
  currentLimit: number;
  onClose: () => void;
  onSaveLimit: (newLimit: number) => void;
}

export function SetLimitModal({
  isOpen,
  currentLimit,
  onClose,
  onSaveLimit,
}: SetLimitModalProps) {
  const [limit, setLimit] = useState(currentLimit);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onSaveLimit(limit);
      onClose();
    }, 1200);
  };

  const presetLimits = [20000000, 50000000, 100000000, 200000000];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '20px',
          padding: '24px',
          boxSizing: 'border-box',
          position: 'relative',
          color: '#f8fafc',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <CloseOutlined />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <SlidersOutlined style={{ color: '#38bdf8', fontSize: '20px' }} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            Cài Đặt Hạn Mức Giao Dịch
          </h3>
        </div>
        <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#94a3b8' }}>
          Tối đa hóa mức chi tiêu mỗi ngày cho thẻ cá nhân
        </p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#4ade80' }}>
            <CheckCircleOutlined style={{ fontSize: '40px', marginBottom: '8px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Đã Cập Nhật Hạn Mức Mới!</div>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                Hạn Mức Ngày Được Chọn
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '12px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                }}
              >
                {limit.toLocaleString('vi-VN')} ₫
              </div>
            </div>

            {/* Slider */}
            <div>
              <input
                type="range"
                min={10000000}
                max={300000000}
                step={5000000}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
              />
            </div>

            {/* Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {presetLimits.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLimit(preset)}
                  style={{
                    background: limit === preset ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${limit === preset ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: limit === preset ? '#38bdf8' : '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {(preset / 1000000).toFixed(0)} Triệu ₫
                </button>
              ))}
            </div>

            <button
              type="submit"
              style={{
                marginTop: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 0',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Lưu Thay Đổi Hạn Mức
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
