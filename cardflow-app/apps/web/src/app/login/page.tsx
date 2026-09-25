'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 

  UserOutlined, 
  LockOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined, 
  ThunderboltFilled, 
  SafetyCertificateOutlined, 
  SlidersOutlined,
  LoadingOutlined,
  ScanOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';


const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);


export default function LoginPage() {

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Google OAuth States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleTestEmail, setGoogleTestEmail] = useState('thuan.google@cardflow.io');
  const [googleTestName, setGoogleTestName] = useState('Lê Huỳnh Thuận (Google)');

  // Firebase Phone OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpModalStep, setOtpModalStep] = useState<'confirm_send' | 'enter_code'>('confirm_send');
  const [showFirebaseRegionGuide, setShowFirebaseRegionGuide] = useState(false);
  const [isTestModeOtp, setIsTestModeOtp] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatVietnamesePhoneE164 = (rawPhone: string) => {
    const cleaned = rawPhone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('84')) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('0')) {
      return `+84${cleaned.slice(1)}`;
    }
    return `+84${cleaned}`;
  };

  const handleSendPhoneOtp = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    setErrorMessage(null);
    setShowFirebaseRegionGuide(false);

    const cleaned = phone.trim().replace(/\D/g, '');
    if (!cleaned || cleaned.length < 9 || cleaned.length > 11) {
      setOtpError('Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số, VD: 0912345678).');
      return;
    }

    const formattedPhone = formatVietnamesePhoneE164(phone);
    setIsSendingOtp(true);

    try {
      if (typeof window !== 'undefined') {
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch {}
          (window as any).recaptchaVerifier = undefined;
        }

        const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setOtpError('reCAPTCHA đã hết hạn, vui lòng thử gửi lại mã.');
          },
        });
        (window as any).recaptchaVerifier = appVerifier;

        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setCountdown(60);
        setOtpModalStep('enter_code');
        setOtpSuccess(`Đã gửi tin nhắn SMS chứa mã OTP đến ${formattedPhone}. Vui lòng kiểm tra điện thoại!`);
      }
    } catch (err: any) {
      console.error('Firebase Phone Auth Error:', err);
      let msg = err?.message || 'Không thể gửi SMS OTP.';
      if (err?.code === 'auth/operation-not-allowed') {
        msg = 'Vùng Việt Nam (+84) chưa được cấp phép gửi SMS trong Firebase Console (hoặc Phone Provider chưa được Bật).';
        setShowFirebaseRegionGuide(true);
      } else if (err?.code === 'auth/invalid-phone-number') {
        msg = 'Số điện thoại không đúng định dạng quốc tế (+84...).';
      } else if (err?.code === 'auth/too-many-requests') {
        msg = 'Bạn đã yêu cầu gửi mã nhiều lần. Vui lòng chờ 1-2 phút rồi thử lại.';
      } else if (err?.code === 'auth/quota-exceeded') {
        msg = 'Hạn mức SMS miễn phí hôm nay đã đạt tối đa trong Firebase Console.';
      } else if (err?.code === 'auth/captcha-check-failed') {
        msg = 'Xác minh bảo mật reCAPTCHA thất bại. Vui lòng tải lại trang.';
      }
      setOtpError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const completeRegistrationAfterOtp = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        email: username.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim()
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Đăng ký tài khoản thất bại trên máy chủ.');
        setIsLoading(false);
        return;
      }

      if (data.user?.id) {
        try {
          localStorage.setItem('cardflow_user_id', data.user.id);
          localStorage.setItem('cardflow_user_profile', JSON.stringify({
            fullName: data.user.fullName,
            email: data.user.email,
            phone: data.user.phone || '',
          }));
        } catch {}
      }

      setOtpSuccess('🎉 Xác thực OTP thành công! Đang kích hoạt tài khoản...');
      setTimeout(() => {
        setShowOtpModal(false);
        setSuccessMessage('✨ Đăng ký và kích hoạt tài khoản thành công! Đang chuyển hướng...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }, 700);
    } catch (err: any) {
      setOtpError(err?.message || 'Không thể kết nối đến máy chủ xác thực.');
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    setErrorMessage(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      if (isTestModeOtp && otpCode.trim() === '123456') {
        await completeRegistrationAfterOtp();
        return;
      }

      if (!confirmationResult) {
        setOtpError('Phiên xác thực đã hết hạn, vui lòng bấm Gửi lại mã SMS.');
        setIsVerifyingOtp(false);
        return;
      }

      await confirmationResult.confirm(otpCode.trim());
      await completeRegistrationAfterOtp();
    } catch (err: any) {
      console.error('Firebase Confirm OTP Error:', err);
      if (err?.code === 'auth/invalid-verification-code') {
        setOtpError('Mã OTP không đúng. Vui lòng kiểm tra lại tin nhắn SMS.');
      } else if (err?.code === 'auth/code-expired') {
        setOtpError('Mã OTP đã hết hiệu lực. Vui lòng bấm Gửi lại mã mới.');
      } else {
        setOtpError(err?.message || 'Xác thực mã OTP thất bại.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        if (err === 'google_not_configured') {
          setShowGoogleModal(true);
        } else if (err === 'google_missing_credentials') {
          setErrorMessage('Chưa cấu hình GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trong .env.local');
        } else {
          setErrorMessage(`Xác thực Google: ${err}`);
        }
      }
    }
  }, []);

  const handleGoogleClick = () => {
    setErrorMessage(null);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId && clientId.trim() !== '') {
      window.location.href = '/api/auth/google';
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleExecuteGoogleAuth = async (customEmail?: string, customName?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const emailToUse = customEmail || googleTestEmail || 'user.google@gmail.com';
      const nameToUse = customName || googleTestName || 'Người Dùng Google';
      const hash = Math.abs(emailToUse.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
      const googleId = `goog_${hash}`;

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId,
          email: emailToUse,
          fullName: nameToUse,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emailToUse)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Đăng nhập Google thất bại');
        setIsLoading(false);
        return;
      }

      if (data.user?.id) {
        try {
          localStorage.setItem('cardflow_user_id', data.user.id);
          localStorage.setItem('cardflow_user_profile', JSON.stringify({
            fullName: data.user.fullName,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl || '',
          }));
        } catch {}
      }

      setSuccessMessage('🎉 Đăng nhập thành công với Google! Đang chuyển hướng...');
      setShowGoogleModal(false);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 600);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể xác thực Google.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isRegisterMode) {
      if (!fullName.trim()) {
        setErrorMessage('Vui lòng nhập họ và tên của bạn.');
        return;
      }
      if (!phone.trim()) {
        setErrorMessage('Vui lòng nhập số điện thoại.');
        return;
      }
      const cleanedPhone = phone.trim().replace(/\D/g, '');
      if (cleanedPhone.length < 9 || cleanedPhone.length > 11) {
        setErrorMessage('Số điện thoại không hợp lệ (yêu cầu 10 số đầu 03, 05, 07, 08, 09).');
        return;
      }
      if (!username.trim()) {
        setErrorMessage('Vui lòng nhập địa chỉ email.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp.');
        return;
      }

      // Thông tin đầy đủ hợp lệ -> Mở popup hỏi gửi OTP về số điện thoại
      setOtpCode('');
      setOtpError(null);
      setOtpSuccess(null);
      setShowFirebaseRegionGuide(false);
      setOtpModalStep('confirm_send');
      setShowOtpModal(true);
      return;
    } else {
      if (!username.trim() || !password) {
        setErrorMessage('Vui lòng nhập email hoặc số điện thoại và mật khẩu.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = { identifier: username.trim(), password };
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Đăng nhập thất bại');
        setIsLoading(false);
        return;
      }

      if (data.user?.id) {
        try {
          localStorage.setItem('cardflow_user_id', data.user.id);
          localStorage.setItem('cardflow_user_profile', JSON.stringify({
            fullName: data.user.fullName,
            email: data.user.email,
            phone: data.user.phone || '',
          }));
        } catch {}
      }

      setSuccessMessage('⚡ Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 600);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể kết nối đến máy chủ xác thực.');
      setIsLoading(false);
    }
  };



  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. LEFT COLUMN: ABSTRACT BRAND SHOWCASE (Desktop) */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
        className="login-left-col"
      >
        {/* Background Abstract Geometric Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-20%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />

        {/* Brand Header */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                color: '#fff',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
              }}
            >
              CF
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                Cardflow <span style={{ color: '#38bdf8', fontSize: '13px' }}>Personal</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Quản Lý 1 Thẻ Cá Nhân</div>
            </div>
          </Link>
        </div>

        {/* Middle Value Proposition Text */}
        <div style={{ position: 'relative', zIndex: 1, margin: '40px 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '20px',
            }}
          >
            <SafetyCertificateOutlined /> Bảo Mật Mã Hóa Sinh Trắc
          </div>

          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, lineHeight: 1.2, margin: '0 0 16px 0', color: '#ffffff' }}>
            Làm Chủ Thẻ Cá Nhân <br />
            Trong Lòng Bàn Tay
          </h2>

          <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.6, maxWidth: '440px', margin: '0 0 32px 0' }}>
            Trải nghiệm quản lý tài chính cá nhân thế hệ mới. Khóa thẻ 0.5s, tùy biến giao diện 3D và chia sẻ NFC 1-chạm không cần qua chi nhánh ngân hàng.
          </p>

          {/* Feature List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ThunderboltFilled />
              </div>
              <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600 }}>NFC Instant Profile Sharing</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockOutlined />
              </div>
              <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600 }}>Khóa Khẩn Cấp Instant 1-Tap</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SlidersOutlined />
              </div>
              <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600 }}>Kiểm Soát Hạn Mức Chi Tiêu Ngày</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: '12px', color: '#64748b' }}>
          © 2026 Cardflow Personal System • Secure OIDC Session Protected
        </div>
      </div>

      {/* 2. RIGHT COLUMN: GLASSMORPHISM LOGIN FORM */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          background: 'radial-gradient(ellipse at center, #0f172a 0%, #090d16 100%)',
          position: 'relative',
        }}
      >
        {/* Back to Home Button */}
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.05)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <ArrowLeftOutlined /> Trang chủ
        </Link>

        {/* Form Container Container */}
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(56, 189, 248, 0.1)',
            padding: '40px 32px',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
              {isRegisterMode ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Hệ Thống'}
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              {isRegisterMode
                ? 'Tạo tài khoản mới để sở hữu thẻ cá nhân thông minh'
                : 'Nhập tài khoản để quản lý các Thẻ Cá Nhân của bạn'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage(null);
                setSuccessMessage(null);
                setPassword('');
                setConfirmPassword('');
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                background: !isRegisterMode ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
                color: !isRegisterMode ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMessage(null);
                setSuccessMessage(null);
                setUsername('');
                setPassword('');
                setConfirmPassword('');
                setFullName('');
                setPhone('');
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                background: isRegisterMode ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
                color: isRegisterMode ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              Đăng Ký Mới
            </button>
          </div>


          {/* Google Sign In / Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '16px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)')}
          >
            <GoogleIcon />
            <span>{isRegisterMode ? 'Đăng ký nhanh bằng Google' : 'Tiếp tục với Google'}</span>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
              {isRegisterMode ? 'HOẶC ĐIỀN THÔNG TIN' : 'HOẶC DÙNG EMAIL'}
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>


          {/* Success Banner */}
          {successMessage && (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#86efac',
                fontWeight: 600,
              }}
            >
              {successMessage}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#fca5a5',
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Standard Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
            {/* Full Name Input (Only on Register) */}
            {isRegisterMode && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Họ và tên chủ thẻ *
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="VD: LÊ HUỲNH THUẬN"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                  />
                  <UserOutlined style={{ color: '#64748b', fontSize: '16px' }} />
                </div>
              </div>
            )}

            {/* Phone Input (Only on Register) */}
            {isRegisterMode && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Số điện thoại di động (nhận mã OTP SMS) *
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                  }}
                >
                  <PhoneOutlined style={{ color: '#64748b', fontSize: '15px', marginRight: '8px' }} />
                  <input
                    type="tel"
                    placeholder="VD: 0987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                    +84 (VN)
                  </span>
                </div>
              </div>
            )}


            {/* Email or Phone Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                {isRegisterMode ? 'Địa chỉ Email *' : 'Email hoặc Số điện thoại *'}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <input
                  type={isRegisterMode ? 'email' : 'text'}
                  placeholder={isRegisterMode ? 'name@example.com' : 'VD: thuan@gmail.com hoặc 0987654321'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                  }}
                />
                <UserOutlined style={{ color: '#64748b', fontSize: '16px' }} />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: isRegisterMode ? '16px' : '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                {isRegisterMode ? 'Mật khẩu (tối thiểu 6 ký tự) *' : 'Mật khẩu *'}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeInvisibleOutlined style={{ fontSize: '16px' }} /> : <EyeOutlined style={{ fontSize: '16px' }} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input (Only on Register) */}
            {isRegisterMode && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Xác nhận lại mật khẩu *
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                  }}
                >
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showConfirmPassword ? <EyeInvisibleOutlined style={{ fontSize: '16px' }} /> : <EyeOutlined style={{ fontSize: '16px' }} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <LoadingOutlined style={{ fontSize: '18px' }} />
              ) : isRegisterMode ? (
                <>
                  <SafetyCertificateOutlined /> Tiếp Tục Xác Thực OTP & Đăng Ký
                </>
              ) : (
                'Đăng Nhập'
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '11px', color: '#64748b' }}>
            🔒 Bảo mật cấp ngân hàng • Mã hóa mật khẩu bcrypt & Session OIDC
          </div>

          {/* Biometric / Passkey Prompt Option */}
          <div>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  window.location.href = `/api/auth/mock-login?account=0&returnTo=/dashboard`;
                }, 500);
              }}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <ScanOutlined style={{ color: '#38bdf8' }} /> Đăng nhập nhanh bằng Face ID / Sinh trắc
            </button>
          </div>


          {/* Enterprise SSO Button */}
          <div style={{ marginTop: '16px' }}>
            <a
              href="/api/auth/login?returnTo=/dashboard"
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 0',
                textAlign: 'center',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Đăng nhập qua SSO Enterprise OIDC →
            </a>
          </div>
        </div>
      </div>

      {/* 3. GOOGLE OAUTH MODAL (SETUP GUIDE & INSTANT DEMO) */}
      {showGoogleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.2)',
              padding: '28px',
              position: 'relative',
              color: '#f8fafc',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowGoogleModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              <CloseOutlined />
            </button>

            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GoogleIcon />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Xác Thực Google OAuth 2.0
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  Hệ thống kết nối trực tiếp PostgreSQL và phiên đăng nhập Next.js
                </p>
              </div>
            </div>

            {/* Fast 1-Click Test Section */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircleOutlined /> Thử nghiệm đăng ký / đăng nhập Google ngay
              </div>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                Hệ thống gửi profile Google đến Go backend (Port 8080), tự động tạo tài khoản trong PostgreSQL và cấp OIDC session cookie.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Email Google thử nghiệm:
                  </label>
                  <input
                    type="email"
                    value={googleTestEmail}
                    onChange={(e) => setGoogleTestEmail(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Họ và tên Google:
                  </label>
                  <input
                    type="text"
                    value={googleTestName}
                    onChange={(e) => setGoogleTestName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleExecuteGoogleAuth()}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isLoading ? <LoadingOutlined /> : <GoogleIcon />}
                Đăng nhập ngay với tài khoản Google này
              </button>
            </div>

            {/* Real Google Cloud Setup Guide */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '12px',
                color: '#94a3b8',
              }}
            >
              <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SettingOutlined /> Cấu hình Google Cloud Console thật
              </div>
              <ol style={{ margin: '0 0 10px 0', paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Tạo OAuth 2.0 Client ID tại <strong style={{ color: '#e2e8f0' }}>console.cloud.google.com</strong></li>
                <li>Thêm Authorized redirect URI: <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>http://localhost:3000/api/auth/google/callback</code></li>
                <li>Dán <code style={{ color: '#e2e8f0' }}>GOOGLE_CLIENT_ID</code> & <code style={{ color: '#e2e8f0' }}>GOOGLE_CLIENT_SECRET</code> vào file <code style={{ color: '#e2e8f0' }}>.env.local</code></li>
              </ol>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href="/api/auth/google"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px 0',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Mở trang Google OAuth thật →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 4. REAL PHONE OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 16, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '18px',
              padding: '28px 24px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowOtpModal(false);
                setOtpError(null);
                setOtpSuccess(null);
              }}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <CloseOutlined style={{ fontSize: '14px' }} />
            </button>

            {/* Header Icon */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(56, 189, 248, 0.3))',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  fontSize: '26px',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
                }}
              >
                <SafetyCertificateOutlined />
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#f8fafc', marginTop: '12px', marginBottom: '4px' }}>
                Xác Thực Số Điện Thoại
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                Bảo vệ tài khoản và kích hoạt định danh chính chủ
              </p>
            </div>

            {/* Step 1: Confirm Send OTP */}
            {otpModalStep === 'confirm_send' && (
              <div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, textAlign: 'center', marginBottom: '16px' }}>
                  Hệ thống sẽ gửi mã xác thực <strong>OTP qua tin nhắn SMS</strong> đến số điện thoại của bạn để duyệt kích hoạt tài khoản:
                </p>

                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    textAlign: 'center',
                    marginBottom: '18px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    Số điện thoại nhận mã
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', marginTop: '4px', letterSpacing: '1px' }}>
                    📱 {phone} <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>({formatVietnamesePhoneE164(phone)})</span>
                  </div>
                </div>

                {/* Error Banner if any */}
                {otpError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      color: '#fca5a5',
                      lineHeight: 1.5,
                    }}
                  >
                    ⚠️ {otpError}
                  </div>
                )}

                {/* Firebase SMS Region Policy Helper */}
                {showFirebaseRegionGuide && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '18px',
                      fontSize: '12px',
                      color: '#fde68a',
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: '#fbbf24' }}>
                      ⚙️ Hướng dẫn cấu hình Firebase Console:
                    </div>
                    <ol style={{ margin: '0 0 10px 0', paddingLeft: '18px', lineHeight: 1.5 }}>
                      <li>Vào <strong>Authentication → Sign-in method</strong> → bật <strong>Phone</strong> (Enable).</li>
                      <li>Vào <strong>Authentication → Settings → SMS Region Policy</strong> → Chọn <strong>Vietnam (+84)</strong>.</li>
                    </ol>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTestModeOtp(true);
                        setOtpModalStep('enter_code');
                        setOtpCode('123456');
                        setOtpSuccess('⚡ Đã bật mã Test (123456). Bạn có thể bấm xác nhận để duyệt tài khoản ngay!');
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 0',
                        background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Bỏ qua để Test nhanh ngay (Mã OTP: 123456)
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSendingOtp}
                  onClick={handleSendPhoneOtp}
                  style={{
                    width: '100%',
                    padding: '13px 0',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: isSendingOtp ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isSendingOtp ? (
                    <>
                      <LoadingOutlined /> Đang kết nối Firebase SMS...
                    </>
                  ) : (
                    'Gửi Mã OTP Qua SMS Ngay'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '10px 0',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Quay lại chỉnh sửa thông tin
                </button>
              </div>
            )}

            {/* Step 2: Enter OTP Code */}
            {otpModalStep === 'enter_code' && (
              <div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', textAlign: 'center', marginBottom: '16px', lineHeight: 1.5 }}>
                  Mã OTP 6 số đã được gửi tới số <strong style={{ color: '#38bdf8' }}>{phone}</strong>. Vui lòng nhập mã để hoàn tất:
                </p>

                {/* Status Messages */}
                {otpSuccess && (
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      fontSize: '12px',
                      color: '#86efac',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {otpSuccess}
                  </div>
                )}
                {otpError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      fontSize: '12px',
                      color: '#fca5a5',
                      textAlign: 'center',
                    }}
                  >
                    ⚠️ {otpError}
                  </div>
                )}

                {/* OTP Input Box */}
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '2px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
                    }}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#ffffff',
                        fontSize: '24px',
                        fontWeight: 800,
                        letterSpacing: '8px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                </div>

                {/* Submit OTP Verification Button */}
                <button
                  type="button"
                  disabled={isVerifyingOtp || isLoading || otpCode.length !== 6}
                  onClick={handleVerifyPhoneOtp}
                  style={{
                    width: '100%',
                    padding: '13px 0',
                    borderRadius: '10px',
                    background: otpCode.length === 6 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: otpCode.length === 6 ? '#ffffff' : '#64748b',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: otpCode.length === 6 && !isVerifyingOtp ? 'pointer' : 'not-allowed',
                    boxShadow: otpCode.length === 6 ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  {isVerifyingOtp || isLoading ? (
                    <>
                      <LoadingOutlined /> Đang duyệt tài khoản...
                    </>
                  ) : (
                    <>
                      <CheckCircleOutlined /> Xác Nhận OTP & Kích Hoạt Tài Khoản
                    </>
                  )}
                </button>

                {/* Resend & Change Phone Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpModalStep('confirm_send');
                      setOtpCode('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ← Đổi số khác
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || isSendingOtp}
                    onClick={handleSendPhoneOtp}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: countdown > 0 ? '#64748b' : '#38bdf8',
                      cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* Hidden container for Firebase Recaptcha */}
            <div id="recaptcha-container"></div>
          </div>
        </div>
      )}
    </main>
  );
}


