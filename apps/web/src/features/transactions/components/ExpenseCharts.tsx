'use client';

import { useMemo } from 'react';
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
  FileExcelOutlined,
} from '@ant-design/icons';
import type { CategoryBreakdownItem } from '../types';
import styles from '@/app/_components/TransactionExpenseManager.module.css';

interface ExpenseChartsProps {
  totalExpense: number;
  totalIncome: number;
  categoryBreakdown: CategoryBreakdownItem[];
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  viewMode: 'donut' | 'bar';
  setViewMode: React.Dispatch<React.SetStateAction<'donut' | 'bar'>>;
  currentMonthIndex: number;
  setCurrentMonthIndex: React.Dispatch<React.SetStateAction<number>>;
  showCategoryDetails: boolean;
  setShowCategoryDetails: React.Dispatch<React.SetStateAction<boolean>>;
  hoveredCategoryKey: string | null;
  setHoveredCategoryKey: (key: string | null) => void;
  setSelectedCategoryDetail: (item: CategoryBreakdownItem | null) => void;
  onOpenAddTxModal: () => void;
  onOpenExportReport: () => void;
  onOpenImportSheet?: () => void;
  onOpenAIModal: () => void;
  onOpenTipsModal: () => void;
  onToast: (msg: string) => void;
}

export function ExpenseCharts({
  totalExpense,
  totalIncome,
  categoryBreakdown,
  isBalanceHidden,
  onToggleBalance,
  viewMode,
  setViewMode,
  currentMonthIndex,
  setCurrentMonthIndex,
  showCategoryDetails,
  setShowCategoryDetails,
  hoveredCategoryKey,
  setHoveredCategoryKey,
  setSelectedCategoryDetail,
  onOpenAddTxModal,
  onOpenExportReport,
  onOpenImportSheet,
  onOpenAIModal,
  onOpenTipsModal,
  onToast,
}: ExpenseChartsProps) {
  const monthLabels = ['Tháng này (09/2026)', 'Tháng trước (08/2026)', 'Tháng 07/2026'];
  const currentMonthDisplay = monthLabels[Math.abs(currentMonthIndex) % monthLabels.length];

  // SVG Geometry for Donut
  const svgWidth = 600;
  const svgHeight = 360;
  const cx = 300;
  const cy = 180;
  const radius = 95;
  const strokeWidth = 32;
  const circumference = 2 * Math.PI * radius;

  // Donut slices geometry
  const computedSlices = useMemo(() => {
    let accumulatedAngle = 0;
    const rawSlices = categoryBreakdown.map((item) => {
      const sliceAngle = (item.percent / 100) * 360;
      const midAngle = accumulatedAngle + sliceAngle / 2;
      const strokeLength = (item.percent / 100) * circumference;
      const strokeOffset = -((accumulatedAngle / 360) * circumference);
      accumulatedAngle += sliceAngle;

      const thetaRad = ((midAngle - 90) * Math.PI) / 180;
      const xArc = Math.round(cx + radius * Math.cos(thetaRad));
      const yArc = Math.round(cy + radius * Math.sin(thetaRad));
      const rOut = radius + 20;
      const xOut = Math.round(cx + rOut * Math.cos(thetaRad));
      const yOut = Math.round(cy + rOut * Math.sin(thetaRad));
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

    const rightItems = rawSlices.filter((i) => i.isRight).sort((a, b) => a.yOut - b.yOut);
    const leftItems = rawSlices.filter((i) => !i.isRight).sort((a, b) => a.yOut - b.yOut);
    const boxWidth = 148;
    const boxHeight = 44;

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

        const xElbow = isRightSide ? cx + radius + 46 : cx - radius - 46;
        const xArm = isRightSide ? xElbow + 22 : xElbow - 22;
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
    <>
      {/* 1. TOP 4 QUICK ACTIONS GRID */}
      <div className={styles.quickActionsGrid}>
        <div className={styles.actionCard} onClick={onOpenAddTxModal}>
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

        <div className={styles.actionCard} onClick={onOpenExportReport}>
          <div className={styles.actionIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <AppstoreOutlined />
          </div>
          <div className={styles.actionTitle}>Tiện ích<br />& Báo cáo</div>
        </div>

        {onOpenImportSheet && (
          <div className={styles.actionCard} onClick={onOpenImportSheet}>
            <div className={styles.actionIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <FileExcelOutlined />
            </div>
            <div className={styles.actionTitle}>Nhập từ<br />Google Sheet</div>
          </div>
        )}
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
        <div className={styles.anomalyBanner} onClick={onOpenTipsModal}>
          <div className={styles.anomalyContent}>
            <FireOutlined style={{ color: '#f97316', fontSize: '18px' }} />
            <span>
              <strong className={styles.anomalyHighlight}>Tăng bất thường 1.844.706 ₫</strong> so với cùng kỳ tháng trước
            </span>
          </div>
          <span style={{ color: '#f97316', fontWeight: 800 }}>&gt;</span>
        </div>

        {/* Donut vs Bar View */}
        {viewMode === 'donut' ? (
          <div className={styles.chartContainer}>
            <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', overflow: 'visible' }}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ width: '100%', height: 'auto', overflow: 'visible' }}
              >
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

                {/* Slices */}
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
                      <circle
                        cx={item.xArc}
                        cy={item.yArc}
                        r="3.5"
                        fill="#ffffff"
                        stroke={item.color}
                        strokeWidth="2"
                      />
                      <polyline
                        points={`${item.xArc},${item.yArc} ${item.xOut},${item.yOut} ${item.xElbow},${item.targetY} ${item.xArm},${item.targetY}`}
                        stroke={item.color}
                        strokeWidth={isHovered ? 2 : 1.5}
                        strokeDasharray="3 3"
                        fill="none"
                        opacity={isHovered ? 1 : 0.8}
                        markerStart={`url(#arrow-${item.key})`}
                      />
                      <circle
                        cx={item.xArm}
                        cy={item.targetY}
                        r="3"
                        fill={item.color}
                      />
                    </g>
                  );
                })}

                {/* Callout Labels */}
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
                        style={{
                          filter: isHovered
                            ? `drop-shadow(0 0 12px ${item.color}66)`
                            : 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
                        }}
                      />
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

                {/* Donut Center */}
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

            <button
              className={styles.toggleDetailBtn}
              onClick={() => setShowCategoryDetails((prev) => !prev)}
            >
              <span>Bảng phân bổ ngân sách ({categoryBreakdown.length} danh mục)</span>
              {showCategoryDetails ? <UpOutlined /> : <DownOutlined />}
            </button>

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

        {/* AI Advisor & Tips Buttons */}
        <div className={styles.aiAdvisorRow}>
          <button className={styles.aiPillBtn} onClick={onOpenAIModal}>
            <RobotOutlined style={{ fontSize: '18px' }} />
            <span>Hỏi Cardflow AI tư vấn chi tiêu &gt;</span>
          </button>

          <button className={styles.tipsPillBtn} onClick={onOpenTipsModal}>
            <BulbOutlined style={{ fontSize: '18px' }} />
            <span>5 mẹo chi tiêu thông minh cho người trẻ &gt;</span>
          </button>
        </div>
      </div>
    </>
  );
}
