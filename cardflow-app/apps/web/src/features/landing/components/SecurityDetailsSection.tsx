'use client';

import {
  CreditCardOutlined,
  SafetyCertificateOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';

export function SecurityDetailsSection() {
  return (
    <section id="my-card" style={{ background: 'rgba(15, 23, 42, 0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '60px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 12px 0', color: '#ffffff' }}>
          Chi Tiết Thẻ Của Tôi & Công Nghệ Bảo Mật
        </h2>
        <p style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '36px' }}>
          Trải nghiệm kiểm soát thẻ cá nhân không phụ thuộc chi nhánh ngân hàng
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', textAlign: 'left' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '6px', fontSize: '15px' }}>
              <CreditCardOutlined /> Đổi Mã PIN Tức Thời
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Thay đổi mã PIN 4 chữ số trực tiếp trên ứng dụng mà không cần đến cây ATM.
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: '6px', fontSize: '15px' }}>
              <SafetyCertificateOutlined /> Chip EMV An Toàn
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Tiêu chuẩn chip mã hóa phần cứng chống sao chép dữ liệu thẻ tuyệt đối.
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '6px', fontSize: '15px' }}>
              <QrcodeOutlined /> Mã QR Cá Nhân
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Mã QR tĩnh/động hỗ trợ người khác truy cập danh thiếp của bạn tức thì.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
