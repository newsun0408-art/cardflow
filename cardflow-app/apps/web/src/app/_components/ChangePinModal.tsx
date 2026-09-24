'use client';

import { useState } from 'react';
import { CloseOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { changePinAction } from '../actions/card-security';

interface ChangePinModalProps {
  isOpen: boolean;
  cardId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePinModal({ isOpen, cardId, onClose, onSuccess }: ChangePinModalProps) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (oldPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4) {
      setError('Mã PIN phải bao gồm đúng 4 chữ số');
      return;
    }

    if (newPin !== confirmPin) {
      setError('Mã PIN mới và xác nhận mã PIN không trùng khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await changePinAction({ cardId, oldPin, newPin });
      if (!res.success) {
        setError(res.error || 'Đổi mã PIN thất bại. Vui lòng kiểm tra mã PIN hiện tại.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setLoading(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setError('Lỗi kết nối máy chủ');
      setLoading(false);
    }
  };

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
          border: '1px solid rgba(251, 191, 36, 0.4)',
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
          <KeyOutlined style={{ color: '#fbbf24', fontSize: '20px' }} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            Đổi Mã PIN Thẻ Cá Nhân
          </h3>
        </div>
        <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#94a3b8' }}>
          Cập nhật mã PIN 4 chữ số cho giao dịch rút tiền & thanh toán
        </p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#4ade80' }}>
            <CheckCircleOutlined style={{ fontSize: '40px', marginBottom: '8px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Đổi Mã PIN Thành Công!</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Mã PIN Hiện Tại (4 chữ số)
              </label>
              <input
                type="password"
                maxLength={4}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  letterSpacing: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Mã PIN Mới
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  letterSpacing: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Xác Nhận Mã PIN Mới
              </label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  letterSpacing: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                background: loading ? '#475569' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 0',
                fontWeight: 700,
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Đang xử lý...' : 'Xác Nhận Đổi Mã PIN'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
