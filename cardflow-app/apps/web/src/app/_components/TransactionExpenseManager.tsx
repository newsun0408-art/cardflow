'use client';

import React, { useState, useMemo } from 'react';
import {
  FileAddOutlined,
  LineChartOutlined,
  TagsOutlined,
  AppstoreOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FireOutlined,
  PieChartOutlined,
  BarChartOutlined,
  DownOutlined,
  UpOutlined,
  RobotOutlined,
  BulbOutlined,
  SearchOutlined,
  CheckCircleFilled,
  CloseOutlined,
  CreditCardOutlined,
  ShoppingOutlined,
  CoffeeOutlined,
  CarOutlined,
  LaptopOutlined,
  HomeOutlined,
  FundProjectionScreenOutlined,
  PlusOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  TableOutlined,
} from '@ant-design/icons';
import type { CardDataModel } from './AddCardModal';
import styles from './TransactionExpenseManager.module.css';

export interface TransactionItem {
  id: string;
  cardId: string;
  cardLast4: string;
  merchant: string;
  category: 'dining' | 'shopping' | 'transport' | 'tech' | 'salary' | 'refund' | 'housing' | 'investment' | 'education' | 'other';
  categoryLabel: string;
  amount: number;
  type: 'expense' | 'income';
  date: string; // YYYY-MM-DD
  dateDisplay: string;
  time: string;
  status: 'Thành công' | 'Đang xử lý' | 'Thất bại';
  referenceId: string;
}

export interface TransactionExpenseManagerProps {
  transactions: TransactionItem[];
  cards: CardDataModel[];
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onAddTransaction: (newTx: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>) => void;
  onOpenExportReport: () => void;
  onOpenImportSheet?: () => void;
  onToast: (msg: string) => void;
}


export interface CategoryBreakdownItem {
  key: string;
  label: string;
  shortLabel: string;
  amount: number;
  percent: number;
  color: string;
  icon: string;
  budgetLimit: number;
  advice: string;
}

export function TransactionExpenseManager({
  transactions,
  cards,
  isBalanceHidden,
  onToggleBalance,
  onAddTransaction,
  onOpenExportReport,
  onOpenImportSheet,
  onToast,
}: TransactionExpenseManagerProps) {

  // Navigation / Date state
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'donut' | 'bar'>('donut');
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);

  // Modals state
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryBreakdownItem | null>(null);
  const [hoveredCategoryKey, setHoveredCategoryKey] = useState<string | null>(null);

  // Filters state for transaction list
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardFilter, setSelectedCardFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Add Transaction Form State
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txMerchant, setTxMerchant] = useState('');
  const [txCategory, setTxCategory] = useState<TransactionItem['category']>('dining');
  const [txCardId, setTxCardId] = useState(cards[0]?.id || 'card-1');

  // Month navigation labels
  const monthLabels = ['Tháng này (09/2026)', 'Tháng trước (08/2026)', 'Tháng 07/2026'];
  const currentMonthDisplay = monthLabels[Math.abs(currentMonthIndex) % monthLabels.length];

  // Calculations for Totals & Categories
  const { totalExpense, totalIncome, categoryBreakdown } = useMemo(() => {
    let expense = 0;
    let income = 0;
    const catMap: Record<string, { label: string; shortLabel: string; amount: number; color: string; icon: string; budgetLimit: number; advice: string }> = {
      tech: {
        label: 'Công nghệ & Mua sắm',
        shortLabel: 'Công nghệ',
        amount: 0,
        color: '#38bdf8',
        icon: '💻',
        budgetLimit: 15000000,
        advice: 'Khoản mua Laptop Pro 12.5Tr là khoản chi lớn nhất. Bạn có thể đăng ký trả góp 0% để giảm áp lực ngân sách.',
      },
      dining: {
        label: 'Ăn uống & Cà phê',
        shortLabel: 'Ăn uống',
        amount: 0,
        color: '#f59e0b',
        icon: '🍔',
        budgetLimit: 6000000,
        advice: 'Chi tiêu ẩm thực đang ở mức tốt (70% ngân sách). Dùng thẻ Techcombank VIP cuối tuần để nhận hoàn tiền 5%.',
      },
      transport: {
        label: 'Di chuyển & Xăng xe',
        shortLabel: 'Di chuyển',
        amount: 0,
        color: '#a855f7',
        icon: '🚗',
        budgetLimit: 3000000,
        advice: 'Khoản chi Grab Car và đi lại đều đặn, không có phát sinh bất thường.',
      },
      housing: {
        label: 'Nhà cửa & Hóa đơn',
        shortLabel: 'Nhà cửa',
        amount: 0,
        color: '#10b981',
        icon: '🏠',
        budgetLimit: 5000000,
        advice: 'Nên cài đặt tự động trích nợ qua thẻ mặc định để tránh quên hạn thanh toán hóa đơn điện thoại / internet.',
      },
      other: {
        label: 'Khác & Dự phòng',
        shortLabel: 'Còn lại',
        amount: 0,
        color: '#94a3b8',
        icon: '🫧',
        budgetLimit: 2500000,
        advice: 'Các khoản phí vặt được duy trì dưới 10% tổng ngân sách tháng, rất an toàn.',
      },
    };

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const absVal = Math.abs(tx.amount);
        expense += absVal;
        const catObj = catMap[tx.category];
        if (catObj) {
          catObj.amount += absVal;
        } else if (catMap['other']) {
          catMap['other'].amount += absVal;
        }
      } else {
        income += tx.amount;
      }
    });

    if (expense === 0) expense = 19740000;
    if (income === 0) income = 25500000;

    const breakdown: CategoryBreakdownItem[] = Object.entries(catMap).map(([key, data]) => {
      const pct = expense > 0 ? Math.round((data.amount / expense) * 100) : 0;
      return {
        key,
        label: data.label,
        shortLabel: data.shortLabel,
        amount: data.amount || Math.round(expense * (key === 'tech' ? 0.35 : key === 'dining' ? 0.28 : key === 'transport' ? 0.15 : key === 'housing' ? 0.12 : 0.1)),
        percent: pct || (key === 'tech' ? 35 : key === 'dining' ? 28 : key === 'transport' ? 15 : key === 'housing' ? 12 : 10),
        color: data.color,
        icon: data.icon,
        budgetLimit: data.budgetLimit,
        advice: data.advice,
      };
    });

    return { totalExpense: expense, totalIncome: income, categoryBreakdown: breakdown };
  }, [transactions]);

  // Handle Form Submission for new transaction
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(txAmount.replace(/\D/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      onToast('⚠️ Vui lòng nhập số tiền hợp lệ');
      return;
    }

    const card = cards.find((c) => c.id === txCardId) || cards[0];
    const categoryLabels: Record<string, string> = {
      dining: 'Ăn uống',
      shopping: 'Mua sắm',
      transport: 'Di chuyển',
      tech: 'Công nghệ',
      housing: 'Nhà cửa',
      investment: 'Đầu tư',
      salary: 'Lương',
      refund: 'Hoàn tiền',
      other: 'Khác',
    };

    onAddTransaction({
      cardId: card?.id || 'card-1',
      cardLast4: card?.lastFourDigits || '9921',
      merchant: txMerchant.trim() || (txType === 'expense' ? 'Khoản chi tiêu' : 'Nguồn thu nhập'),
      category: txCategory,
      categoryLabel: categoryLabels[txCategory] || 'Chi tiêu',
      amount: txType === 'expense' ? -parsedAmount : parsedAmount,
      type: txType,
      date: new Date().toISOString().split('T')[0] || '2026-09-23',
      dateDisplay: 'Hôm nay',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    });

    setIsAddTxModalOpen(false);
    setTxAmount('');
    setTxMerchant('');
    onToast(`✅ Đã ghi nhận ${txType === 'expense' ? 'khoản chi' : 'khoản thu'}: ${parsedAmount.toLocaleString('vi-VN')} ₫`);
  };

  // Filtered transactions for the list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.cardLast4.includes(searchQuery);

      const matchCard = selectedCardFilter === 'all' || tx.cardId === selectedCardFilter;
      const matchCat = selectedCategoryFilter === 'all' || tx.category === selectedCategoryFilter;

      return matchSearch && matchCard && matchCat;
    });
  }, [transactions, searchQuery, selectedCardFilter, selectedCategoryFilter]);

  // Transactions belonging to selectedCategoryDetail
  const categoryTransactions = useMemo(() => {
    if (!selectedCategoryDetail) return [];
    return transactions.filter((tx) => tx.category === selectedCategoryDetail.key);
  }, [transactions, selectedCategoryDetail]);

  // SVG Geometry Calculation with Collision Avoidance & Vertical Slot Distribution
  const svgWidth = 640;
  const svgHeight = 420;
  const cx = 320;
  const cy = 210;
  const radius = 80;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius; // ~502.65

  // Calculate slice coordinates & non-overlapping distributed pointer lines
  const computedSlices = useMemo(() => {
    let currentPct = 0;

    // Step 1: Base geometry on the circle
    const rawSlices = categoryBreakdown.map((item) => {
      const startPct = currentPct;
      const endPct = currentPct + item.percent / 100;
      const midPct = (startPct + endPct) / 2;
      currentPct = endPct;

      const strokeLength = (item.percent / 100) * circumference;
      const strokeOffset = -(startPct * circumference);

      // Angle in radians (0% is top -> -90 deg)
      const thetaDeg = midPct * 360 - 90;
      const thetaRad = (thetaDeg * Math.PI) / 180;

      // Arc anchor point on the donut
      const xArc = cx + radius * Math.cos(thetaRad);
      const yArc = cy + radius * Math.sin(thetaRad);

      // Point slightly outside donut rim
      const rOut = radius + 22;
      const xOut = cx + rOut * Math.cos(thetaRad);
      const yOut = cy + rOut * Math.sin(thetaRad);

      const isRight = Math.cos(thetaRad) >= 0;

      return {
        ...item,
        strokeLength,
        strokeOffset,
        thetaRad,
        xArc,
        yArc,
        xOut,
        yOut,
        isRight,
      };
    });

    // Step 2: Separate Left & Right items and sort by vertical position
    const rightItems = rawSlices.filter((i) => i.isRight).sort((a, b) => a.yOut - b.yOut);
    const leftItems = rawSlices.filter((i) => !i.isRight).sort((a, b) => a.yOut - b.yOut);

    const boxWidth = 148;
    const boxHeight = 44;

    // Distribute slots with generous padding so labels never overlap
    const distributeSlots = (items: typeof rawSlices, isRightSide: boolean) => {
      if (items.length === 0) return [];
      const count = items.length;
      const topY = count <= 2 ? 100 : 70;
      const bottomY = count <= 2 ? svgHeight - 100 : svgHeight - 70;

      return items.map((item, index) => {
        let targetY: number;
        if (count === 1) {
          targetY = cy;
        } else {
          targetY = Math.round(topY + (index * (bottomY - topY)) / (count - 1));
        }

        // Elbow & Arm coordinates
        const xElbow = isRightSide ? cx + radius + 46 : cx - radius - 46;
        const xArm = isRightSide ? xElbow + 22 : xElbow - 22;

        // Label box coordinates
        const boxX = isRightSide ? xArm + 8 : xArm - boxWidth - 8;
        const boxY = targetY - boxHeight / 2;

        return {
          ...item,
          targetY,
          xElbow,
          xArm,
          boxX,
          boxY,
          boxWidth,
          boxHeight,
        };
      });
    };

    const finalRight = distributeSlots(rightItems, true);
    const finalLeft = distributeSlots(leftItems, false);

    return [...finalRight, ...finalLeft];
  }, [categoryBreakdown, cx, cy, radius, circumference]);

    return (
    <div className={styles.container}>
      {/* 1. TOP 4 QUICK ACTIONS GRID */}
      <div className={styles.quickActionsGrid}>
        <div className={styles.actionCard} onClick={() => setIsAddTxModalOpen(true)}>
          <div className={styles.actionIconBox} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <FileAddOutlined />
          </div>
          <div className={styles.actionTitle}>Nhập<br />giao dịch</div>
        </div>

        <div
          className={styles.actionCard}
          onClick={() => {
            setViewMode((prev) => (prev === 'donut' ? 'bar' : 'donut'));
            onToast(`📊 Đã chuyển sang biểu đồ: ${viewMode === 'donut' ? 'Cột biến động' : 'Phân bổ tròn'}`);
          }}
        >
          <div className={styles.actionIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <LineChartOutlined />
          </div>
          <div className={styles.actionTitle}>Biến động<br />thu chi</div>
        </div>

        <div
          className={styles.actionCard}
          onClick={() => {
            setShowCategoryDetails((prev) => !prev);
            onToast(showCategoryDetails ? 'Thu gọn danh mục' : 'Mở rộng chi tiết từng danh mục');
          }}
        >
          <div className={styles.actionIconBox} style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
            <TagsOutlined />
          </div>
          <span className={styles.actionBadge}>6</span>
          <div className={styles.actionTitle}>Phân loại<br />giao dịch</div>
        </div>

        {onOpenImportSheet && (
          <div className={styles.actionCard} onClick={onOpenImportSheet}>
            <div className={styles.actionIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <TableOutlined />
            </div>
            <div className={styles.actionTitle}>Nhập từ<br />Google Sheet</div>
          </div>
        )}

        <div className={styles.actionCard} onClick={onOpenExportReport}>
          <div className={styles.actionIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <AppstoreOutlined />
          </div>
          <div className={styles.actionTitle}>Tiện ích<br />& Báo cáo</div>
        </div>
      </div>


      {/* 2. CARD BOX: TÌNH HÌNH THU CHI */}
      <div className={styles.cardBox}>
        {/* Header Row */}
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <h2 className={styles.mainTitle}>Tình hình thu chi</h2>
            <button
              className={styles.eyeBtn}
              onClick={onToggleBalance}
              title={isBalanceHidden ? 'Hiện số tiền' : 'Ẩn số tiền'}
            >
              {isBalanceHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>

          <div className={styles.viewPillGroup}>
            <button
              className={`${styles.viewPillBtn} ${viewMode === 'donut' ? styles.viewPillBtnActive : ''}`}
              onClick={() => setViewMode('donut')}
            >
              <PieChartOutlined /> Phân bổ
            </button>
            <button
              className={`${styles.viewPillBtn} ${viewMode === 'bar' ? styles.viewPillBtnActive : ''}`}
              onClick={() => setViewMode('bar')}
            >
              <BarChartOutlined /> Biểu đồ cột
            </button>
          </div>
        </div>

        {/* Date Navigator */}
        <div className={styles.dateNav}>
          <button
            className={styles.navArrowBtn}
            onClick={() => {
              setCurrentMonthIndex((prev) => prev - 1);
              onToast('Đã chuyển xem kỳ sao kê trước');
            }}
          >
            <LeftOutlined />
          </button>
          <div className={styles.dateNavText}>
            <CalendarOutlined style={{ color: '#38bdf8' }} />
            <span>{currentMonthDisplay}</span>
          </div>
          <button
            className={styles.navArrowBtn}
            onClick={() => {
              setCurrentMonthIndex((prev) => prev + 1);
              onToast('Đã chuyển xem kỳ sao kê kế tiếp');
            }}
          >
            <RightOutlined />
          </button>
        </div>

        {/* 2 Main Cards: Chi Tiêu vs Thu Nhập */}
        <div className={styles.summaryCardsGrid}>
          <div className={styles.summaryCardExpense}>
            <div className={styles.cardTopLabel} style={{ color: '#f472b6' }}>
              <ArrowUpOutlined style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '4px', borderRadius: '50%' }} />
              <span>Chi tiêu</span>
            </div>
            <div className={styles.amountExpense}>
              {isBalanceHidden ? '•••••••• ₫' : `${totalExpense.toLocaleString('vi-VN')} ₫`}
            </div>
          </div>

          <div className={styles.summaryCardIncome}>
            <div className={styles.cardTopLabel} style={{ color: '#34d399' }}>
              <ArrowDownOutlined style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '4px', borderRadius: '50%' }} />
              <span>Thu nhập</span>
            </div>
            <div className={styles.amountIncome}>
              {isBalanceHidden ? '•••••••• ₫' : `${totalIncome.toLocaleString('vi-VN')} ₫`}
            </div>
          </div>
        </div>

        {/* Anomaly Trend Banner */}
        <div className={styles.anomalyBanner} onClick={() => setIsTipsModalOpen(true)}>
          <div className={styles.anomalyContent}>
            <FireOutlined style={{ color: '#f97316', fontSize: '18px' }} />
            <span>
              <strong className={styles.anomalyHighlight}>Tăng bất thường 1.844.706 ₫</strong> so với cùng kỳ tháng trước
            </span>
          </div>
          <span style={{ color: '#f97316', fontWeight: 800 }}>&gt;</span>
        </div>

        {/* 3. INTERACTIVE DONUT CHART WITH POINTER ARROWS & CALLOUT LABELS */}
        {viewMode === 'donut' ? (
          <div className={styles.chartContainer}>
            <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', overflow: 'visible' }}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ width: '100%', height: 'auto', overflow: 'visible' }}
              >
                {/* SVG Marker Arrow Definitions */}
                <defs>
                  {computedSlices.map((item) => (
                    <marker
                      key={`arrow-${item.key}`}
                      id={`arrow-${item.key}`}
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill={item.color} />
                    </marker>
                  ))}
                </defs>

                {/* Donut Slices */}
                {computedSlices.map((item) => {
                  const isHovered = hoveredCategoryKey === item.key;
                  return (
                    <circle
                      key={item.key}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                      strokeDasharray={`${item.strokeLength} ${circumference}`}
                      strokeDashoffset={item.strokeOffset}
                      strokeLinecap="round"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: `${cx}px ${cy}px`,
                      }}
                      className={styles.donutSlice}
                      onMouseEnter={() => setHoveredCategoryKey(item.key)}
                      onMouseLeave={() => setHoveredCategoryKey(null)}
                      onClick={() => setSelectedCategoryDetail(item)}
                    />
                  );
                })}

                {/* Pointer Lines & Arrows */}
                {computedSlices.map((item) => {
                  const isHovered = hoveredCategoryKey === item.key;
                  return (
                    <g key={`pointer-${item.key}`}>
                      {/* Anchor dot on donut arc */}
                      <circle
                        cx={item.xArc}
                        cy={item.yArc}
                        r="3.5"
                        fill="#ffffff"
                        stroke={item.color}
                        strokeWidth="2"
                      />

                      {/* Dotted pointer line with elbow */}
                      <polyline
                        points={`${item.xArc},${item.yArc} ${item.xOut},${item.yOut} ${item.xElbow},${item.targetY} ${item.xArm},${item.targetY}`}
                        stroke={item.color}
                        strokeWidth={isHovered ? 2 : 1.5}
                        strokeDasharray="3 3"
                        fill="none"
                        opacity={isHovered ? 1 : 0.8}
                        markerStart={`url(#arrow-${item.key})`}
                      />

                      {/* Small arrow pointing at elbow end */}
                      <circle
                        cx={item.xArm}
                        cy={item.targetY}
                        r="3"
                        fill={item.color}
                      />
                    </g>
                  );
                })}

                {/* Callout Labels (Clickable Cards with Arrow pointer) */}
                {computedSlices.map((item) => {
                  const isHovered = hoveredCategoryKey === item.key;
                  const shortAmtText = isBalanceHidden
                    ? '••••••'
                    : item.amount >= 1000000
                    ? `${(item.amount / 1000000).toFixed(1)}Tr ₫`
                    : `${Math.round(item.amount / 1000)}k ₫`;

                  return (
                    <g
                      key={`callout-${item.key}`}
                      className={styles.calloutGroup}
                      onMouseEnter={() => setHoveredCategoryKey(item.key)}
                      onMouseLeave={() => setHoveredCategoryKey(null)}
                      onClick={() => setSelectedCategoryDetail(item)}
                    >
                      {/* Background Card */}
                      <rect
                        x={item.boxX}
                        y={item.boxY}
                        width={item.boxWidth}
                        height={item.boxHeight}
                        rx="12"
                        ry="12"
                        fill={isHovered ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.88)'}
                        stroke={item.color}
                        strokeWidth={isHovered ? 2 : 1.2}
                        strokeDasharray={isHovered ? 'none' : 'none'}
                        style={{
                          filter: isHovered
                            ? `drop-shadow(0 0 12px ${item.color}66)`
                            : 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
                        }}
                      />

                      {/* Callout Line 1: Icon + Percent + Name */}
                      <text
                        x={item.boxX + 12}
                        y={item.boxY + 18}
                        fill="#ffffff"
                        fontSize="12"
                        fontWeight="800"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {item.icon} {item.percent}% {item.shortLabel}
                      </text>

                      {/* Callout Line 2: Amount + CTA */}
                      <text
                        x={item.boxX + 12}
                        y={item.boxY + 34}
                        fill={item.color}
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {shortAmtText} • Chi tiết &gt;
                      </text>
                    </g>
                  );
                })}

                {/* Donut Center Text */}
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="700"
                  letterSpacing="1px"
                  style={{ textTransform: 'uppercase' }}
                >
                  TỔNG CHI TIÊU
                </text>
                <text
                  x={cx}
                  y={cy + 18}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="20"
                  fontWeight="900"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {isBalanceHidden ? '••••••••' : `${(totalExpense / 1000000).toFixed(1)}Tr ₫`}
                </text>
              </svg>
            </div>

            <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>
              💡 Bấm vào từng vùng màu hoặc nhãn mũi tên để mở xem chi tiết các hóa đơn trong nhóm
            </div>

            {/* Toggle Detailed Breakdown Button */}
            <button
              className={styles.toggleDetailBtn}
              onClick={() => setShowCategoryDetails((prev) => !prev)}
            >
              <span>Bảng phân bổ ngân sách ({categoryBreakdown.length} danh mục)</span>
              {showCategoryDetails ? <UpOutlined /> : <DownOutlined />}
            </button>

            {/* Expandable Category Progress Rows */}
            {showCategoryDetails && (
              <div className={styles.categoryList} style={{ width: '100%' }}>
                {categoryBreakdown.map((item) => (
                  <div
                    key={item.key}
                    className={styles.categoryRow}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedCategoryDetail(item)}
                  >
                    <div className={styles.categoryRowHeader}>
                      <span style={{ color: '#ffffff', fontWeight: 600 }}>
                        {item.icon} {item.label}
                      </span>
                      <span style={{ color: '#e2e8f0', fontWeight: 700 }}>
                        {isBalanceHidden ? '•••••• ₫' : `${item.amount.toLocaleString('vi-VN')} ₫`}{' '}
                        <small style={{ color: item.color }}>({item.percent}%)</small>
                      </span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${item.percent}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Bar Chart Mode */
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Biểu đồ cột so sánh chi tiêu theo từng tuần:</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '180px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {[
                { label: 'Tuần 1', height: '45%', amount: '4.2Tr ₫', color: '#38bdf8' },
                { label: 'Tuần 2', height: '70%', amount: '6.8Tr ₫', color: '#f472b6' },
                { label: 'Tuần 3', height: '90%', amount: '8.7Tr ₫', color: '#fb923c' },
                { label: 'Tuần 4', height: '25%', amount: '2.1Tr ₫', color: '#34d399' },
              ].map((bar, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700 }}>{bar.amount}</span>
                  <div style={{ width: '38px', height: bar.height, background: bar.color, borderRadius: '8px 8px 0 0', boxShadow: `0 0 15px ${bar.color}44` }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. AI ADVISOR & TIPS ROW */}
        <div className={styles.aiAdvisorRow}>
          <button className={styles.aiPillBtn} onClick={() => setIsAIModalOpen(true)}>
            <RobotOutlined style={{ fontSize: '18px' }} />
            <span>Hỏi Cardflow AI tư vấn chi tiêu &gt;</span>
          </button>

          <button className={styles.tipsPillBtn} onClick={() => setIsTipsModalOpen(true)}>
            <BulbOutlined style={{ fontSize: '18px' }} />
            <span>5 mẹo chi tiêu thông minh cho người trẻ &gt;</span>
          </button>
        </div>
      </div>

      {/* 5. DETAILED TRANSACTIONS LIST SECTION */}
      <div className={styles.cardBox} id="transaction-list-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
              Danh Sách Giao Dịch Chi Tiết ({filteredTransactions.length})
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
          {filteredTransactions.map((tx) => (
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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: XEM CHI TIẾT DANH MỤC KHI CLICK VÀO VÙNG BÁNH HOẶC MŨI TÊN */}
      {/* ========================================================================= */}
      {selectedCategoryDetail && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCategoryDetail(null)}>
          <div className={styles.modalBox} style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            {/* Header with Category Icon & Badge */}
            <div className={styles.categoryModalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  className={styles.categoryModalIconBox}
                  style={{
                    background: `${selectedCategoryDetail.color}22`,
                    color: selectedCategoryDetail.color,
                    border: `1.5px solid ${selectedCategoryDetail.color}55`,
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
                onClick={() => setSelectedCategoryDetail(null)}
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
                onClick={() => {
                  setSelectedCategoryFilter(selectedCategoryDetail.key);
                  setSelectedCategoryDetail(null);
                  onToast(`🔍 Đã lọc danh sách giao dịch theo mục: ${selectedCategoryDetail.label}`);
                  const el = document.getElementById('transaction-list-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <FilterOutlined /> Xem ở danh sách
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setTxCategory(selectedCategoryDetail.key as any);
                  setSelectedCategoryDetail(null);
                  setIsAddTxModalOpen(true);
                }}
              >
                <PlusOutlined /> Thêm Khoản Chi Mục Này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NHẬP GIAO DỊCH MỚI */}
      {/* ========================================================================= */}
      {isAddTxModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddTxModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileAddOutlined style={{ color: '#38bdf8' }} /> Nhập Giao Dịch Mới
              </div>
              <button
                onClick={() => setIsAddTxModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
              >
                <CloseOutlined />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: txType === 'expense' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                    color: txType === 'expense' ? '#f472b6' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  🔴 Khoản Chi Tiêu
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: txType === 'income' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                    color: txType === 'income' ? '#34d399' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  🟢 Khoản Thu Nhập
                </button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số tiền (VNĐ)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 150000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value.replace(/\D/g, ''))}
                  className={styles.inputField}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên điểm bán / Nội dung</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Highlands Coffee Landmark"
                  value={txMerchant}
                  onChange={(e) => setTxMerchant(e.target.value)}
                  className={styles.inputField}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phân loại danh mục</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value as any)}
                  className={styles.inputField}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="dining">🍔 Ăn uống & Cà phê</option>
                  <option value="tech">💻 Công nghệ & Thiết bị</option>
                  <option value="shopping">🛍️ Mua sắm siêu thị</option>
                  <option value="transport">🚗 Di chuyển / Xăng xe</option>
                  <option value="housing">🏠 Nhà cửa & Tiện ích</option>
                  <option value="investment">📈 Đầu tư & Tiết kiệm</option>
                  <option value="other">🫧 Khác</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Thẻ thanh toán sử dụng</label>
                <select
                  value={txCardId}
                  onChange={(e) => setTxCardId(e.target.value)}
                  className={styles.inputField}
                  style={{ cursor: 'pointer' }}
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.bankName} - {c.nickname} (•••• {c.lastFourDigits})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className={styles.ghostBtn} onClick={() => setIsAddTxModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  <CheckCircleFilled /> Ghi Nhận Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TƯ VẤN TÀI CHÍNH TỪ CARDFLOW AI */}
      {/* ========================================================================= */}
      {isAIModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAIModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#f472b6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RobotOutlined /> Trợ Lý Tài Chính Cardflow AI
              </div>
              <button onClick={() => setIsAIModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>
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
              <button className={styles.primaryBtn} onClick={() => setIsAIModalOpen(false)}>
                Đã hiểu, cảm ơn AI!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 5 MẸO CHI TIÊU THÔNG MINH */}
      {/* ========================================================================= */}
      {isTipsModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsTipsModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BulbOutlined /> 5 Mẹo Chi Tiêu Thông Minh
              </div>
              <button onClick={() => setIsTipsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>
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
              <button className={styles.primaryBtn} onClick={() => setIsTipsModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
