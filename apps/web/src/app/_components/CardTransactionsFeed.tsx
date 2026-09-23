'use client';

import { useState } from 'react';
import { 
  HistoryOutlined, 
  ShoppingOutlined, 
  CoffeeOutlined, 
  PlusCircleOutlined, 
  ThunderboltOutlined,
  CheckCircleFilled,
  RightOutlined
} from '@ant-design/icons';

export interface TransactionItem {
  id: string;
  title: string;
  category: string;
  amount: number; // positive = topup, negative = spend
  date: string;
  time: string;
  merchant: string;
  cardLast4: string;
  icon: 'shopping' | 'coffee' | 'topup' | 'service';
}

export const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'TX-9921-01',
    title: 'Thanh toán Shopee Express',
    category: 'Mua sắm',
    amount: -450000,
    date: 'Hôm nay',
    time: '11:42',
    merchant: 'Shopee Vietnam',
    cardLast4: '9921',
    icon: 'shopping',
  },
  {
    id: 'TX-9921-02',
    title: 'Highlands Coffee Landmark',
    category: 'Ẩm thực',
    amount: -65000,
    date: 'Hôm nay',
    time: '08:30',
    merchant: 'Highlands Coffee',
    cardLast4: '9921',
    icon: 'coffee',
  },
  {
    id: 'TX-9921-03',
    title: 'Nạp tiền thẻ cá nhân',
    category: 'Nạp tiền',
    amount: 5000000,
    date: 'Hôm qua',
    time: '19:15',
    merchant: 'Chuyển khoản Ngân hàng',
    cardLast4: '9921',
    icon: 'topup',
  },
  {
    id: 'TX-9921-04',
    title: 'Đăng ký Netflix Premium',
    category: 'Giải trí',
    amount: -260000,
    date: '20/09/2026',
    time: '14:00',
    merchant: 'Netflix International',
    cardLast4: '9921',
    icon: 'service',
  },
  {
    id: 'TX-9921-05',
    title: 'Cây xăng Petrolimex Q1',
    category: 'Di chuyển',
    amount: -500000,
    date: '19/09/2026',
    time: '17:45',
    merchant: 'Petrolimex',
    cardLast4: '9921',
    icon: 'service',
  },
];

export function CardTransactionsFeed() {
  const [filter, setFilter] = useState<'all' | 'spend' | 'topup'>('all');
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  const filtered = INITIAL_TRANSACTIONS.filter((tx) => {
    if (filter === 'spend') return tx.amount < 0;
    if (filter === 'topup') return tx.amount > 0;
    return true;
  });

  const renderIcon = (type: TransactionItem['icon']) => {
    switch (type) {
      case 'shopping':
        return <ShoppingOutlined style={{ color: '#f59e0b' }} />;
      case 'coffee':
        return <CoffeeOutlined style={{ color: '#fb923c' }} />;
      case 'topup':
        return <PlusCircleOutlined style={{ color: '#4ade80' }} />;
      case 'service':
      default:
        return <ThunderboltOutlined style={{ color: '#38bdf8' }} />;
    }
  };

  const formatVND = (amount: number) => {
    const prefix = amount > 0 ? '+' : '';
    return prefix + amount.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div
      style={{
        maxWidth: '440px',
        margin: '24px auto 0 auto',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '20px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Feed Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HistoryOutlined style={{ color: '#818cf8', fontSize: '18px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            LỊCH SỬ GIAO DỊCH THẺ
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              background: filter === 'all' ? '#38bdf8' : 'transparent',
              color: filter === 'all' ? '#0f172a' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tất cả
          </button>

          <button
            type="button"
            onClick={() => setFilter('spend')}
            style={{
              background: filter === 'spend' ? '#38bdf8' : 'transparent',
              color: filter === 'spend' ? '#0f172a' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Chi tiêu
          </button>

          <button
            type="button"
            onClick={() => setFilter('topup')}
            style={{
              background: filter === 'topup' ? '#38bdf8' : 'transparent',
              color: filter === 'topup' ? '#0f172a' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Nạp tiền
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((tx) => (
          <div
            key={tx.id}
            onClick={() => setSelectedTx(tx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                {renderIcon(tx.icon)}
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  {tx.title}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {tx.date} • {tx.time}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: tx.amount > 0 ? '#4ade80' : '#f8fafc',
                  }}
                >
                  {formatVND(tx.amount)}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  •••• {tx.cardLast4}
                </div>
              </div>
              <RightOutlined style={{ fontSize: '10px', color: '#64748b' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Detail Receipt Modal */}
      {selectedTx && (
        <div
          onClick={() => setSelectedTx(null)}
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
              maxWidth: '340px',
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              boxSizing: 'border-box',
              color: '#f8fafc',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <CheckCircleFilled style={{ color: '#22c55e', fontSize: '40px' }} />
              <h4 style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 800 }}>
                Giao Dịch Thành Công
              </h4>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: selectedTx.amount > 0 ? '#4ade80' : '#38bdf8',
                  fontFamily: 'monospace',
                  marginTop: '8px',
                }}
              >
                {formatVND(selectedTx.amount)}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Nội dung:</span>
                <span style={{ fontWeight: 600 }}>{selectedTx.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Đơn vị chấp nhận:</span>
                <span style={{ fontWeight: 600 }}>{selectedTx.merchant}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Thời gian:</span>
                <span style={{ fontWeight: 600 }}>{selectedTx.date} {selectedTx.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Thẻ sử dụng:</span>
                <span style={{ fontWeight: 600 }}>Visa •••• {selectedTx.cardLast4}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Mã tham chiếu:</span>
                <span style={{ fontFamily: 'monospace', color: '#7dd3fc' }}>{selectedTx.id}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              style={{
                marginTop: '16px',
                width: '100%',
                background: '#0284c7',
                border: 'none',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 0',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Đóng Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
