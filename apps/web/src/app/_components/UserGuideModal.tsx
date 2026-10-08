'use client';

import { useState } from 'react';
import {
  CloseOutlined,
  QuestionCircleOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  PieChartOutlined,
  CloudSyncOutlined,
  SafetyCertificateOutlined,
  RightOutlined,
} from '@ant-design/icons';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideSection = 'cards' | 'transactions' | 'stats' | 'export' | 'security';

export function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [activeSection, setActiveSection] = useState<GuideSection>('cards');

  if (!isOpen) return null;

  const sections: {
    id: GuideSection;
    title: string;
    icon: any;
    desc: string;
  }[] = [
    {
      id: 'cards',
      title: 'Quản Lý Thẻ',
      icon: <CreditCardOutlined />,
      desc: 'Thêm mới, quản lý hạn mức, khóa/mở thẻ và bảo vệ CVV',
    },
    {
      id: 'transactions',
      title: 'Lịch Sử Giao Dịch',
      icon: <HistoryOutlined />,
      desc: 'Ghi chép chi tiêu, bộ lọc ngày tháng và xem chi tiết giao dịch',
    },
    {
      id: 'stats',
      title: 'Thống Kê Chi Tiêu',
      icon: <PieChartOutlined />,
      desc: 'Phân tích cơ cấu danh mục, dòng tiền vào/ra và biểu đồ',
    },
    {
      id: 'export',
      title: 'Xuất & Đồng Bộ',
      icon: <CloudSyncOutlined />,
      desc: 'Xuất dữ liệu lên Google Sheets, Drive, file CSV & PDF',
    },
    {
      id: 'security',
      title: 'Bảo Mật & Riêng Tư',
      icon: <SafetyCertificateOutlined />,
      desc: 'Ẩn số dư nơi công cộng, mã PIN và kiểm soát giao dịch online',
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '24px',
          padding: '24px',
          boxSizing: 'border-box',
          position: 'relative',
          color: '#f8fafc',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              <QuestionCircleOutlined />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Hướng Dẫn Sử Dụng CardFlow
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Khám phá đầy đủ các tính năng thông minh giúp bạn làm chủ thẻ và chi tiêu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
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
            title="Đóng hướng dẫn"
          >
            <CloseOutlined style={{ fontSize: '14px' }} />
          </button>
        </div>

        {/* Content Body: Sidebar Navigation + Main Guide Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            gap: '20px',
            paddingTop: '16px',
            overflowY: 'auto',
            flex: 1,
            minHeight: '360px',
          }}
        >
          {/* Nav List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sections.map((s) => {
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: active ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.3)',
                    border: `1px solid ${active ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                    color: active ? '#38bdf8' : '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{s.icon}</span>
                    <span>{s.title}</span>
                  </div>
                  {active && <RightOutlined style={{ fontSize: '11px' }} />}
                </button>
              );
            })}
          </div>

          {/* Detailed Content Panel */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              overflowY: 'auto',
            }}
          >
            {activeSection === 'cards' && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#38bdf8', fontWeight: 800 }}>
                  💳 Quản Lý Thẻ Cá Nhân
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
                  CardFlow cho phép bạn quản lý nhiều thẻ ngân hàng (VISA, MasterCard, Napas) trên cùng một giao diện 3D trực quan.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      ➕ Thêm Thẻ Mới
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Bấm nút <strong>+ Thêm thẻ mới</strong> trên góc phải để nhập thông tin thẻ, chọn ngân hàng và cài đặt giao diện màu sắc tùy thích.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      🔒 Khóa Thẻ Tức Thì & Đổi Mã PIN
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Trong mục chi tiết thẻ, bạn có thể bấm <strong>Khóa thẻ</strong> ngay lập tức để tạm ngừng giao dịch khi nghi ngờ rò rỉ thông tin hoặc đổi mã PIN an toàn.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      🛡️ Xem Số Thẻ & CVV Bảo Mật
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Số thẻ đầy đủ và mã CVV được che dấu mặc định. Để xem, hệ thống yêu cầu xác thực mã PIN và sẽ tự động che lại sau 60 giây để đảm bảo an toàn tuyệt đối.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'transactions' && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#38bdf8', fontWeight: 800 }}>
                  🧾 Sổ Lịch Sử Giao Dịch
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
                  Theo dõi và tra cứu từng biến động số dư chi tiêu và tiền hoàn vào tài khoản của bạn.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      🔍 Nhấn Vào Giao Dịch Để Xem Chi Tiết
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Chỉ cần <strong>bấm vào bất kỳ dòng giao dịch nào</strong> trong danh sách, popup chi tiết sẽ hiển thị đầy đủ: Mã giao dịch, điểm bán, thẻ thanh toán, thời gian chuẩn xác và sao chép mã nhanh.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      📅 Bộ Lọc Khoảng Ngày & Mốc Nhanh
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Nhập ngày <strong>Từ ngày</strong> đến <strong>Đến ngày</strong> hoặc chọn nhanh: <em>Hôm nay, 7 ngày qua, 30 ngày qua, Tháng này</em> để lọc danh sách tức thì.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      💵 Thêm Giao Dịch Định Dạng Chuẩn
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Khi thêm giao dịch mới, số tiền sẽ tự động định dạng chuẩn dấu chấm (ví dụ: <code>20.000.000 VNĐ</code>) và hỗ trợ các nút bấm nhanh <code>+100K</code>, <code>+1.000.000</code> cùng bộ đọc tiếng Việt.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'stats' && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#38bdf8', fontWeight: 800 }}>
                  📊 Thống Kê & Phân Tích Chi Tiêu
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
                  Trang Thống kê là trung tâm dữ liệu độc lập giúp bạn kiểm soát thói quen tài chính.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      🍩 Biểu Đồ Tỷ Trọng Donut & Biểu Đồ Cột
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Trực quan hóa tỷ lệ chi tiêu theo từng nhóm (Ăn uống, Công nghệ, Đi lại, Mua sắm, v.v.) giúp bạn nắm bắt ngay nhóm chi tiêu nào đang chiếm ngân sách lớn nhất.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      ⚖️ Biến Động Ròng (Dòng Tiền)
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Hệ thống tự động tính: <code>Tổng Chi (-)</code> và <code>Tổng Thu/Hoàn (+)</code> để đưa ra con số <code>Biến Động Ròng</code> chính xác cho kỳ sao kê.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'export' && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#38bdf8', fontWeight: 800 }}>
                  ☁️ Xuất Báo Cáo & Kết Nối Google
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
                  Dễ dàng đồng bộ bảng tính lên Google Sheets hoặc tải về máy để đối chiếu.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: '13px', marginBottom: '4px' }}>
                      📊 Xuất Google Sheets Tự Động
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Sau khi kết nối tài khoản Google một lần, bấm <strong>Xuất Google Sheets</strong> để hệ thống tự tạo bảng tính sao kê đầy đủ cột và công thức trong thư mục <em>CardFlow</em> trên Drive của bạn.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginBottom: '4px' }}>
                      📥 Tải File CSV Chuẩn Tiếng Việt
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Tải file CSV tích hợp UTF-8 BOM, đảm bảo mở trực tiếp trên Microsoft Excel mà không bị lỗi phông chữ tiếng Việt.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      🖨️ In Báo Cáo / Xuất PDF
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Bản in chuyên nghiệp chuẩn định dạng tài chính ngân hàng, thuận tiện để lưu trữ chứng từ hoặc in ra giấy.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#38bdf8', fontWeight: 800 }}>
                  🔒 Bảo Mật & Quyền Riêng Tư
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
                  Các công cụ bảo vệ dữ liệu tài chính của bạn khỏi những ánh mắt tò mò.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      👁️ Nút Ẩn / Hiện Số Dư (Con Mắt)
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Nằm trên thanh tiêu đề phía trên cùng. Bấm vào nút này để che toàn bộ số dư và số tiền giao dịch thành dấu <code>•••••••• ₫</code> khi dùng máy ở nơi đông người hoặc chia sẻ màn hình.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', marginBottom: '4px' }}>
                      👤 Lưu Trữ Dữ Liệu Theo Tài Khoản
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Khi đăng ký tài khoản mới, hệ thống bắt đầu với danh sách thẻ trống để bạn tự thêm thẻ của riêng mình. Mọi thông tin thẻ, giao dịch đều được lưu trữ riêng biệt theo tài khoản của bạn.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            marginTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Hệ thống quản lý thẻ cá nhân CardFlow • Luôn bảo mật thông tin tài chính
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
            }}
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
