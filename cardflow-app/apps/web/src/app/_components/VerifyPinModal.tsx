'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  CloseOutlined,
  SafetyCertificateFilled,
  EyeOutlined,
  EyeInvisibleOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { verifyCardPinAction, type VerifyPinResult } from '../actions/card-security';

interface VerifyPinModalProps {
  isOpen: boolean;
  cardId: string;
  cardName: string;
  onClose: () => void;
  onSuccess: (result: VerifyPinResult) => void;
}

export function VerifyPinModal({
  isOpen,
  cardId,
  cardName,
  onClose,
  onSuccess,
}: VerifyPinModalProps) {
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);
  const [isShaking, setIsShaking] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setPinDigits(['', '', '', '', '', '']);
      setErrorMessage(null);
      setShowForgotHint(false);
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const remainingMs = lockedUntil - Date.now();
      if (remainingMs <= 0) {
        setLockedUntil(null);
        setLockoutRemainingSec(0);
        setErrorMessage(null);
        clearInterval(interval);
      } else {
        setLockoutRemainingSec(Math.ceil(remainingMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    if (lockedUntil && Date.now() < lockedUntil) return;

    // Only allow numeric digits
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...pinDigits];
      updated[index] = '';
      setPinDigits(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    const updated = [...pinDigits];
    updated[index] = digit;
    setPinDigits(updated);
    setErrorMessage(null);

    // Auto-focus next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        const updated = [...pinDigits];
        updated[index - 1] = '';
        setPinDigits(updated);
        inputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...pinDigits];
        updated[index] = '';
        setPinDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...pinDigits];
    for (let i = 0; i < pasted.length; i++) {
      const char = pasted[i];
      if (char) {
        updated[i] = char;
      }
    }
    setPinDigits(updated);
    setErrorMessage(null);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const isFullPin = pinDigits.every((d) => d.length === 1);
  const isLocked = Boolean(lockedUntil && Date.now() < lockedUntil);

  const handleVerify = async () => {
    if (!isFullPin || isVerifying || isLocked) return;

    const enteredPin = pinDigits.join('');
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await verifyCardPinAction({
        cardId,
        pin: enteredPin,
      });

      if (result.success) {
        onSuccess(result);
        onClose();
      } else {
        setErrorMessage(result.error || 'Mã PIN không chính xác.');
        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
        if (result.lockedUntil) {
          setLockedUntil(result.lockedUntil);
          setLockoutRemainingSec(Math.ceil((result.lockedUntil - Date.now()) / 1000));
        }

        // Trigger shake animation
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);

        // Clear digits for retry
        setPinDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMessage('Lỗi kết nối máy chủ xác thực. Vui lòng thử lại.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes pinModalShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes pinModalFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '24px',
          padding: '28px 24px',
          boxSizing: 'border-box',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 25px rgba(56, 189, 248, 0.15)',
          animation: isShaking ? 'pinModalShake 0.5s ease-in-out' : 'pinModalFadeIn 0.2s ease-out',
        }}
      >
        {/* Close Button */}
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
            transition: 'all 0.2s',
          }}
          title="Đóng"
        >
          <CloseOutlined style={{ fontSize: '14px' }} />
        </button>

        {/* Security Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontSize: '24px',
              marginBottom: '14px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
            }}
          >
            <SafetyCertificateFilled />
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
            Xác Thực Bảo Mật
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.45', maxWidth: '340px' }}>
            Vui lòng nhập mã PIN bảo mật để giải mã và hiển thị thông tin thẻ{' '}
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{cardName}</span>.
          </p>
        </div>

        {/* Lockout Banner */}
        {isLocked ? (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <LockOutlined style={{ fontSize: '18px', color: '#ef4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#fecaca', marginBottom: '2px' }}>Tài khoản bị tạm khóa</div>
              <div>
                Bạn đã nhập sai mã PIN quá số lần cho phép. Vui lòng thử lại sau{' '}
                <strong style={{ fontFamily: 'monospace', color: '#ffffff' }}>{lockoutRemainingSec}s</strong>.
              </div>
            </div>
          </div>
        ) : null}

        {/* 6-Digit OTP Box Inputs */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mã PIN (6 chữ số)
            </span>
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 6px',
              }}
            >
              {showPin ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              <span>{showPin ? 'Ẩn ký tự' : 'Hiện số'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={isLocked || isVerifying}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                style={{
                  width: '48px',
                  height: '56px',
                  textAlign: 'center',
                  fontSize: '22px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  borderRadius: '12px',
                  border: errorMessage
                    ? '2px solid #ef4444'
                    : digit
                    ? '2px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  background: errorMessage
                    ? 'rgba(239, 68, 68, 0.1)'
                    : digit
                    ? 'rgba(2, 132, 199, 0.15)'
                    : 'rgba(15, 23, 42, 0.7)',
                  color: errorMessage ? '#fca5a5' : digit ? '#38bdf8' : '#ffffff',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                  cursor: isLocked ? 'not-allowed' : 'text',
                  boxShadow: digit ? '0 0 14px rgba(56, 189, 248, 0.25)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && !isLocked ? (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>{errorMessage}</div>
            {attemptsLeft !== null && attemptsLeft > 0 ? (
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                (Khóa tạm thời nếu nhập sai {attemptsLeft} lần nữa)
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Demo PIN Helper Hint */}
        <div
          style={{
            marginBottom: '22px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8',
          }}
        >
          <span>💡 Mã PIN mẫu mặc định:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8', fontSize: '12px' }}>
            123456
          </span>
        </div>

        {/* Submit Action Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={!isFullPin || isVerifying || isLocked}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: '14px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxSizing: 'border-box',
            background:
              isFullPin && !isVerifying && !isLocked
                ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
                : 'rgba(30, 41, 59, 0.7)',
            color: isFullPin && !isVerifying && !isLocked ? '#ffffff' : '#64748b',
            cursor: isFullPin && !isVerifying && !isLocked ? 'pointer' : 'not-allowed',
            boxShadow:
              isFullPin && !isVerifying && !isLocked
                ? '0 10px 25px -5px rgba(2, 132, 199, 0.4)'
                : 'none',
          }}
        >
          {isVerifying ? (
            <>
              <LoadingOutlined />
              <span>Đang giải mã xác thực...</span>
            </>
          ) : (
            <span>Xác nhận & Xem thông tin</span>
          )}
        </button>

        {/* Secondary Link: Forgot PIN */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowForgotHint(!showForgotHint)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <QuestionCircleOutlined />
            <span>Quên mã PIN?</span>
          </button>

          {showForgotHint ? (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'left',
                fontSize: '11px',
                color: '#cbd5e1',
                lineHeight: '1.5',
              }}
            >
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                Cấp lại mã PIN:
              </div>
              <div>
                Để đảm bảo an toàn tuyệt đối theo tiêu chuẩn PCI-DSS, mã PIN không thể lấy lại trực tiếp. Vui lòng liên hệ tổng đài 24/7{' '}
                <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>1900-8899</span> hoặc mang CCCD/Hộ chiếu đến quầy giao dịch gần nhất.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
