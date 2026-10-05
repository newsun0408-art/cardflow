import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface CardItem {
  id: string;
  bankName: string;
  cardName: string;
  cardNumber: string;
  lastFourDigits: string;
  expiry: string;
  cvv: string;
  balance: number;
  currency: string;
  purpose: string;
  purposeLabel: string;
  purposeIcon: string;
  gradientColors: [string, string, ...string[]];
  isLocked: boolean;
}

const INITIAL_CARDS: CardItem[] = [
  {
    id: 'card-1',
    bankName: 'Techcombank',
    cardName: 'Visa Signature Dining',
    cardNumber: '4532 •••• •••• 9921',
    lastFourDigits: '9921',
    expiry: '08/29',
    cvv: '882',
    balance: 85500000,
    currency: 'VNĐ',
    purpose: 'dining',
    purposeLabel: 'Chuyên Ăn uống & Cà phê',
    purposeIcon: 'fast-food',
    gradientColors: ['#0f172a', '#1e293b', '#0f766e'],
    isLocked: false,
  },
  {
    id: 'card-2',
    bankName: 'Vietcombank',
    cardName: 'Mastercard Platinum Cashback',
    cardNumber: '5421 •••• •••• 1281',
    lastFourDigits: '1281',
    expiry: '11/28',
    cvv: '394',
    balance: 142000000,
    currency: 'VNĐ',
    purpose: 'shopping',
    purposeLabel: 'Chuyên Mua sắm & Siêu thị',
    purposeIcon: 'cart',
    gradientColors: ['#1e1b4b', '#312e81', '#4338ca'],
    isLocked: false,
  },
  {
    id: 'card-3',
    bankName: 'MB Bank',
    cardName: 'Visa Travel Infinite',
    cardNumber: '4111 •••• •••• 4402',
    lastFourDigits: '4402',
    expiry: '04/30',
    cvv: '127',
    balance: 38200000,
    currency: 'VNĐ',
    purpose: 'travel',
    purposeLabel: 'Chuyên Di chuyển & Du lịch',
    purposeIcon: 'airplane',
    gradientColors: ['#3b0764', '#581c87', '#7e22ce'],
    isLocked: false,
  },
];

export default function CardsScreen() {
  const [cards, setCards] = useState<CardItem[]>(INITIAL_CARDS);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showCvvId, setShowCvvId] = useState<string | null>(null);
  const [cvvCountdown, setCvvCountdown] = useState<number>(0);

  // Bộ đếm ngược CVV 90 giây theo đúng quy định bảo mật
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cvvCountdown > 0) {
      timer = setTimeout(() => setCvvCountdown(cvvCountdown - 1), 1000);
    } else if (cvvCountdown === 0 && showCvvId) {
      setShowCvvId(null);
    }
    return () => clearTimeout(timer);
  }, [cvvCountdown, showCvvId]);

  const handleToggleCvv = (card: CardItem) => {
    if (showCvvId === card.id) {
      setShowCvvId(null);
      setCvvCountdown(0);
    } else {
      setShowCvvId(card.id);
      setCvvCountdown(90); // 90 giây
    }
  };

  const handleToggleLockCard = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const newStatus = !c.isLocked;
          Alert.alert(
            newStatus ? 'Đã Khóa Thẻ' : 'Đã Mở Khóa Thẻ',
            `Thẻ ${c.bankName} (${c.lastFourDigits}) hiện tại ${newStatus ? 'đã được khóa an toàn' : 'đã sẵn sàng thanh toán'}.`
          );
          return { ...c, isLocked: newStatus };
        }
        return c;
      })
    );
  };

  const activeCard = cards[activeCardIndex] || cards[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Xin chào,</Text>
          <Text style={styles.userNameText}>LÊ HUỲNH THUẬN</Text>
        </View>

        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={20} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Carousel Thẻ 3D Swipe ngang */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ví Thẻ Thông Minh</Text>
            <Text style={styles.cardCounter}>
              {activeCardIndex + 1}/{cards.length}
            </Text>
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 40}
            decelerationRate="fast"
            contentContainerStyle={styles.cardsScroll}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
              setActiveCardIndex(index);
            }}
          >
            {cards.map((c) => (
              <LinearGradient
                key={c.id}
                colors={c.isLocked ? ['#1e293b', '#0f172a', '#020617'] : c.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.cardContainer, c.isLocked && styles.lockedCardContainer]}
              >
                {/* Chip EMV & Logo Ngân Hàng */}
                <View style={styles.cardTopRow}>
                  <View style={styles.emvChip}>
                    <View style={styles.emvChipLine} />
                  </View>
                  <View style={styles.bankNameBadge}>
                    <Text style={styles.bankNameText}>{c.bankName}</Text>
                  </View>
                </View>

                {/* Huy hiệu mục đích chuyên biệt */}
                <View style={styles.purposeBadge}>
                  <Ionicons name={c.purposeIcon as any} size={12} color="#38bdf8" />
                  <Text style={styles.purposeText}>{c.purposeLabel}</Text>
                </View>

                {/* Số thẻ */}
                <Text style={styles.cardNumberText}>{c.cardNumber}</Text>

                {/* Chân thẻ: Tên chủ thẻ, Hết hạn & CVV đếm ngược */}
                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.cardHolderLabel}>CHỦ THẺ</Text>
                    <Text style={styles.cardHolderName}>LE HUYNH THUAN</Text>
                  </View>

                  <View style={styles.expiryCol}>
                    <Text style={styles.cardHolderLabel}>HẾT HẠN</Text>
                    <Text style={styles.cardMetaValue}>{c.expiry}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.cvvBox}
                    onPress={() => handleToggleCvv(c)}
                  >
                    <Text style={styles.cardHolderLabel}>CVV</Text>
                    <Text style={styles.cvvValue}>
                      {showCvvId === c.id ? c.cvv : '•••'}
                    </Text>
                    {showCvvId === c.id && (
                      <Text style={styles.countdownBadge}>{cvvCountdown}s</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>

        {/* Thanh Tác Vụ Thẻ Nhanh */}
        {activeCard && (
          <View style={styles.quickActionCard}>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>HẠN MỨC KHẢ DỤNG</Text>
                <Text style={styles.balanceValue}>
                  {activeCard.balance.toLocaleString('vi-VN')} {activeCard.currency}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.lockButton,
                  activeCard.isLocked && styles.unlockButton,
                ]}
                onPress={() => handleToggleLockCard(activeCard.id)}
              >
                <Ionicons
                  name={activeCard.isLocked ? 'lock-open' : 'lock-closed'}
                  size={16}
                  color={activeCard.isLocked ? '#10b981' : '#f43f5e'}
                />
                <Text
                  style={[
                    styles.lockButtonText,
                    activeCard.isLocked && styles.unlockButtonText,
                  ]}
                >
                  {activeCard.isLocked ? 'Mở Khóa' : 'Khóa Thẻ'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Xem CVV 90s Nổi Bật */}
            <TouchableOpacity
              style={styles.securityActionButton}
              onPress={() => handleToggleCvv(activeCard)}
            >
              <Ionicons name="shield-checkmark" size={18} color="#38bdf8" />
              <Text style={styles.securityActionText}>
                {showCvvId === activeCard.id
                  ? `Mã CVV đang hiển thị (Tự ẩn sau ${cvvCountdown}s)`
                  : 'Xem mã CVV bảo mật (Hiển thị 90 giây)'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060a17',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  welcomeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 20,
  },
  cardSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  cardsScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  cardContainer: {
    width: width - 40,
    height: 220,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  lockedCardContainer: {
    borderColor: '#f43f5e',
    opacity: 0.85,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emvChip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fbbf24',
    borderWidth: 1,
    borderColor: '#d97706',
    justifyContent: 'center',
  },
  emvChipLine: {
    height: 1,
    backgroundColor: '#b45309',
  },
  bankNameBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bankNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  purposeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  purposeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  cardNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardHolderLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardHolderName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  expiryCol: {
    alignItems: 'center',
  },
  cardMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  cvvBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    position: 'relative',
  },
  cvvValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fbbf24',
  },
  countdownBadge: {
    position: 'absolute',
    top: -10,
    right: -6,
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 999,
  },
  quickActionCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    backgroundColor: '#0c1429',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 18,
    gap: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38bdf8',
    marginTop: 4,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  unlockButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  lockButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f43f5e',
  },
  unlockButtonText: {
    color: '#10b981',
  },
  securityActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  securityActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    flex: 1,
  },
});
