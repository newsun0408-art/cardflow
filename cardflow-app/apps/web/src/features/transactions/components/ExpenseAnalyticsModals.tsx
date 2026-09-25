'use client';

import {
  CloseOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  PlusOutlined,
  RobotOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import type { CategoryBreakdownItem, TransactionItem } from '../types';
import styles from '@/app/_components/TransactionExpenseManager.module.css';

interface ExpenseAnalyticsModalsProps {
  selectedCategoryDetail: CategoryBreakdownItem | null;
  onCloseCategoryDetail: () => void;
  categoryTransactions: TransactionItem[];
  isBalanceHidden: boolean;
  onFilterByCategory: (key: string) => void;
  onAddCategoryExpense: (key: string) => void;
  isAIModalOpen: boolean;
  onCloseAIModal: () => void;
  isTipsModalOpen: boolean;
  onCloseTipsModal: () => void;
}

export function ExpenseAnalyticsModals({
  selectedCategoryDetail,
  onCloseCategoryDetail,
  categoryTransactions,
  isBalanceHidden,
  onFilterByCategory,
  onAddCategoryExpense,
  isAIModalOpen,
  onCloseAIModal,
  isTipsModalOpen,
  onCloseTipsModal,
}: ExpenseAnalyticsModalsProps) {
  return (
    <>
      {/* Category Detail Modal */}
      {selectedCategoryDetail && (
        <div className={styles.modalOverlay} onClick={onCloseCategoryDetail}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: `${selectedCategoryDetail.color}22`,
                    border: `1px solid ${selectedCategoryDetail.color}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  {selectedCategoryDetail.icon}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                    {selectedCategoryDetail.label}
                  </div>
                  <div style={{ fontSize: '12px', color: selectedCategoryDetail.color, fontWeight: 700, marginTop: '2px' }}>
                    Chiếm {selectedCategoryDetail.percent}% tổng chi tiêu tháng này
                  </div>
                </div>
              </div>

              <button
                onClick={onCloseCategoryDetail}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className={styles.categoryStatCard}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tổng đã chi tiêu</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  {isBalanceHidden ? '•••••••• ₫' : `${selectedCategoryDetail.amount.toLocaleString('vi-VN')} ₫`}
                </span>
              </div>
              <div className={styles.categoryStatCard}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Ngân sách dự kiến</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>
                  {isBalanceHidden ? '•••••••• ₫' : `${selectedCategoryDetail.budgetLimit.toLocaleString('vi-VN')} ₫`}
                </span>
              </div>
            </div>

            {/* Budget Progress Indicator */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Tiến độ sử dụng ngân sách:</span>
                <span style={{ color: selectedCategoryDetail.color, fontWeight: 700 }}>
                  {Math.round((selectedCategoryDetail.amount / selectedCategoryDetail.budgetLimit) * 100)}%
                </span>
              </div>
              <div className={styles.progressBarBg} style={{ height: '8px' }}>
                <div
                  className={styles.progressBarFill}
                  style={{
                    width: `${Math.min(100, Math.round((selectedCategoryDetail.amount / selectedCategoryDetail.budgetLimit) * 100))}%`,
                    background: selectedCategoryDetail.color,
                  }}
                />
              </div>
            </div>

            {/* AI Advice for this category */}
            <div
              style={{
                background: `${selectedCategoryDetail.color}15`,
                border: `1px solid ${selectedCategoryDetail.color}35`,
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                gap: '10px',
                fontSize: '13px',
                color: '#e2e8f0',
                lineHeight: '1.5',
              }}
            >
              <InfoCircleOutlined style={{ color: selectedCategoryDetail.color, fontSize: '16px', marginTop: '2px', flexShrink: 0 }} />
              <div>{selectedCategoryDetail.advice}</div>
            </div>

            {/* Transactions in this category */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                Các hóa đơn trong nhóm này ({categoryTransactions.length})
              </div>
              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {categoryTransactions.length > 0 ? (
                  categoryTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(30, 41, 59, 0.4)',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <div style={{ color: '#ffffff', fontWeight: 600 }}>{tx.merchant}</div>
                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>{tx.dateDisplay} • {tx.time}</div>
                      </div>
                      <div style={{ color: '#f472b6', fontWeight: 800 }}>
                        {isBalanceHidden ? '•••••• ₫' : `${tx.amount.toLocaleString('vi-VN')} ₫`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '12px' }}>
                    Chưa có giao dịch thực tế nào trong tháng này.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                className={styles.ghostBtn}
                onClick={() => onFilterByCategory(selectedCategoryDetail.key)}
              >
                <FilterOutlined /> Xem ở danh sách
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => onAddCategoryExpense(selectedCategoryDetail.key)}
              >
                <PlusOutlined /> Thêm Khoản Chi Mục Này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {isAIModalOpen && (
        <div className={styles.modalOverlay} onClick={onCloseAIModal}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#f472b6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RobotOutlined /> Trợ Lý Tài Chính Cardflow AI
              </div>
              <button onClick={onCloseAIModal} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>
                <CloseOutlined />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p>Xin chào! Dựa trên phân tích 30 ngày qua, đây là nhận định cho danh mục chi tiêu của bạn:</p>
              <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
                <strong>⚠️ Cảnh báo danh mục Công nghệ:</strong> Đang chiếm <strong>35%</strong> tổng chi. Bạn đã chi 12.5 triệu cho laptop, vượt 15% hạn mức khuyến nghị thông thường.
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <strong>💡 Đề xuất tối ưu:</strong> Tận dụng chương trình hoàn tiền 1.5% của thẻ <em>Thẻ Chính Platinum (••9921)</em> cho các hóa đơn siêu thị vào cuối tuần để tiết kiệm thêm ~250.000 ₫.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className={styles.primaryBtn} onClick={onCloseAIModal}>
                Đã hiểu, cảm ơn AI!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Modal */}
      {isTipsModalOpen && (
        <div className={styles.modalOverlay} onClick={onCloseTipsModal}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BulbOutlined /> 5 Mẹo Chi Tiêu Thông Minh
              </div>
              <button onClick={onCloseTipsModal} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>
                <CloseOutlined />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div><strong>1. Quy tắc 50/30/20:</strong> Dành 50% cho nhu cầu thiết yếu, 30% cho mong muốn, và ít nhất 20% cho tiết kiệm / đầu tư.</div>
              <div><strong>2. Trì hoãn 24 giờ:</strong> Đối với các món đồ công nghệ hoặc quần áo không bắt buộc, hãy đợi 24h trước khi bấm quẹt thẻ.</div>
              <div><strong>3. Khóa thẻ tạm thời khi đi du lịch:</strong> Dùng nút khóa thẻ nhanh trên Cardflow để tránh bị lộ thông tin tại điểm thanh toán lạ.</div>
              <div><strong>4. Luôn kiểm tra phí ẩn:</strong> Tắt các gói đăng ký dịch vụ (subscriptions) không dùng qua tính năng lọc danh mục.</div>
              <div><strong>5. Tận dụng ngày sao kê:</strong> Chi tiêu ngay sau ngày chốt sao kê để được miễn lãi lên đến 45-55 ngày tối đa.</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className={styles.primaryBtn} onClick={onCloseTipsModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
