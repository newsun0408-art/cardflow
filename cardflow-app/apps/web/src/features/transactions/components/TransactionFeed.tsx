'use client';

import {
  SearchOutlined,
  CoffeeOutlined,
  LaptopOutlined,
  CarOutlined,
  ShoppingOutlined,
  CheckCircleFilled,
  HomeOutlined,
  FundProjectionScreenOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import type { CardDataModel } from '@/app/_components/AddCardModal';
import type { TransactionItem } from '../types';
import styles from '@/app/_components/TransactionExpenseManager.module.css';

interface TransactionFeedProps {
  transactions: TransactionItem[];
  cards: CardDataModel[];
  isBalanceHidden: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCardFilter: string;
  setSelectedCardFilter: (val: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (val: string) => void;
}

export function TransactionFeed({
  transactions,
  cards,
  isBalanceHidden,
  searchQuery,
  setSearchQuery,
  selectedCardFilter,
  setSelectedCardFilter,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
}: TransactionFeedProps) {
  return (
    <div className={styles.cardBox} id="transaction-list-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
            Danh Sách Giao Dịch Chi Tiết ({transactions.length})
          </h3>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Lọc và theo dõi chi tiết từng dòng tiền ra vào</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: 'rgba(30, 41, 59, 0.6)', padding: '8px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <SearchOutlined style={{ color: '#64748b', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Tìm điểm bán, mã giao dịch, số thẻ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
          />
        </div>

        <select
          value={selectedCardFilter}
          onChange={(e) => setSelectedCardFilter(e.target.value)}
          style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.12)', color: '#ffffff', padding: '8px 14px', borderRadius: '12px', fontSize: '13px', outline: 'none' }}
        >
          <option value="all">Tất cả các thẻ</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nickname} (•••• {c.lastFourDigits})
            </option>
          ))}
        </select>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.12)', color: '#ffffff', padding: '8px 14px', borderRadius: '12px', fontSize: '13px', outline: 'none' }}
        >
          <option value="all">Tất cả danh mục</option>
          <option value="dining">🍔 Ăn uống & Cà phê</option>
          <option value="tech">💻 Công nghệ & Mua sắm</option>
          <option value="transport">🚗 Di chuyển & Grab</option>
          <option value="housing">🏠 Nhà cửa & Hóa đơn</option>
          <option value="refund">💸 Hoàn tiền & Thu nhập</option>
        </select>
      </div>

      {/* Transaction Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: tx.type === 'expense' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: tx.type === 'expense' ? '#f472b6' : '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                {tx.category === 'dining' && <CoffeeOutlined />}
                {tx.category === 'tech' && <LaptopOutlined />}
                {tx.category === 'transport' && <CarOutlined />}
                {tx.category === 'shopping' && <ShoppingOutlined />}
                {tx.category === 'refund' && <CheckCircleFilled />}
                {tx.category === 'housing' && <HomeOutlined />}
                {tx.category === 'investment' && <FundProjectionScreenOutlined />}
                {!['dining', 'tech', 'transport', 'shopping', 'refund', 'housing', 'investment'].includes(tx.category) && (
                  <CreditCardOutlined />
                )}
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{tx.merchant}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {tx.dateDisplay} • {tx.time} • <span style={{ fontFamily: 'monospace' }}>Thẻ •••• {tx.cardLast4}</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: tx.type === 'expense' ? '#f472b6' : '#34d399',
                }}
              >
                {isBalanceHidden
                  ? '•••••••• ₫'
                  : `${tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString('vi-VN')} ₫`}
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                {tx.status}
              </div>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b', fontSize: '13px' }}>
            Không tìm thấy giao dịch nào khớp với bộ lọc.
          </div>
        )}
      </div>
    </div>
  );
}
