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
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCardflow, MobileCard } from '../../src/context/CardflowContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

const BANK_PRESETS = [
  'Techcombank',
  'Vietcombank',
  'MB Bank',
  'TPBank',
  'VPBank',
  'ACB',
  'VIB',
  'Sacombank',
];

const THEME_OPTIONS: Array<{ label: string; colors: [string, string] }> = [
  { label: 'Cyber Dark', colors: ['#0f172a', '#1e293b'] },
  { label: 'Gold Luxe', colors: ['#7c2d12', '#ea580c'] },
  { label: 'Deep Sapphire', colors: ['#1e1b4b', '#4338ca'] },
  { label: 'Emerald Prestige', colors: ['#064e3b', '#059669'] },
  { label: 'Neon Purple', colors: ['#581c87', '#9333ea'] },
];

export default function CardsScreen() {
  const {
    cards,
    activeCardId,
    setActiveCardId,
    addCard,
    updateCardLimit,
    toggleCardLock,
    toggleCardSetting,
    totalLimit,
    totalSpent,
    totalAvailable,
  } = useCardflow();

  const [showCvvId, setShowCvvId] = useState<string | null>(null);
  const [cvvCountdown, setCvvCountdown] = useState<number>(0);

  // Modal States
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isSetLimitModalOpen, setIsSetLimitModalOpen] = useState(false);

  // Add Card Form State
  const [newBank, setNewBank] = useState('Techcombank');
  const [newNickname, setNewNickname] = useState('');
  const [newLastDigits, setNewLastDigits] = useState('');
  const [newLimit, setNewLastLimit] = useState('20000000');
  const [newStatementDate, setNewStatementDate] = useState('20');
  const [newDueDate, setNewDueDate] = useState('5');
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);

  // Set Limit Form State
  const [limitInput, setLimitInput] = useState('');

  const activeCard = cards.find((c) => c.id === activeCardId) || cards[0];

  // Bộ đếm ngược CVV 90 giây an toàn
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cvvCountdown > 0) {
      timer = setTimeout(() => setCvvCountdown(cvvCountdown - 1), 1000);
    } else if (cvvCountdown === 0 && showCvvId) {
      setShowCvvId(null);
    }
    return () => clearTimeout(timer);
  }, [cvvCountdown, showCvvId]);

  const handleToggleCvv = (card: MobileCard) => {
    if (showCvvId === card.id) {
      setShowCvvId(null);
      setCvvCountdown(0);
    } else {
      setShowCvvId(card.id);
      setCvvCountdown(90);
    }
  };

  const handleOpenSetLimit = () => {
    if (activeCard) {
      setLimitInput(activeCard.dailyLimit.toString());
      setIsSetLimitModalOpen(true);
    }
  };

  const handleSaveNewLimit = () => {
    const num = parseInt(limitInput.replace(/\D/g, ''), 10);
    if (!num || num <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hạn mức hợp lệ.');
      return;
    }
    if (activeCard) {
      updateCardLimit(activeCard.id, num);
      setIsSetLimitModalOpen(false);
      Alert.alert('Thành Công', `Đã cập nhật hạn mức cho ${activeCard.bankName}: ${num.toLocaleString('vi-VN')} VNĐ`);
    }
  };

  const handleSaveNewCard = () => {
    if (!newNickname.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên gợi nhớ cho thẻ.');
      return;
    }
    const digits = newLastDigits.trim() || '8888';
    const limit = parseInt(newLimit.replace(/\D/g, ''), 10) || 20000000;
    const sDate = parseInt(newStatementDate, 10) || 20;
    const dDate = parseInt(newDueDate, 10) || 5;

    const theme = THEME_OPTIONS[selectedThemeIndex] || THEME_OPTIONS[0];

    addCard({
      nickname: newNickname,
      bankName: newBank,
      cardType: 'VISA PLATINUM',
      lastFourDigits: digits.slice(-4),
      cardNumberFormatted: `•••• •••• •••• ${digits.slice(-4)}`,
      holderName: 'LÊ HUỲNH THUẬN',
      expiryDate: '10/31',
      cvv: String(Math.floor(100 + Math.random() * 900)),
      balance: limit,
      dailyLimit: limit,
      statementDate: sDate,
      dueDate: dDate,
      onlinePayment: true,
      internationalPayment: true,
      atmWithdrawal: true,
      themeColors: theme.colors,
      purposeLabel: 'Chi tiêu đa dụng',
      purposeIcon: 'card-outline',
    });

    setIsAddCardModalOpen(false);
    setNewNickname('');
    setNewLastDigits('');
    Alert.alert('Thành Công', `Đã thêm thẻ ${newBank} (${digits.slice(-4)}) vào ví!`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header & Tổng Quan Tài Chính */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.appTitle}>Cardflow Mobile</Text>
              <Text style={styles.appSubtitle}>Hệ Thống Quản Lý Thẻ & Chi Tiêu</Text>
            </View>
            <TouchableOpacity style={styles.addCardBtn} onPress={() => setIsAddCardModalOpen(true)}>
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.addCardBtnText}>Thêm Thẻ</Text>
            </TouchableOpacity>
          </View>

          {/* Hộp Thống Kê Tổng Hạn Mức Toàn Ví */}
          <LinearGradient
            colors={['#0e172a', '#1e293b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>TỔNG HẠN MỨC</Text>
                <Text style={styles.statValue}>{totalLimit.toLocaleString('vi-VN')} ₫</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>ĐÃ CHI TIÊU</Text>
                <Text style={[styles.statValue, { color: '#f43f5e' }]}>
                  {totalSpent.toLocaleString('vi-VN')} ₫
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>KHẢ DỤNG</Text>
                <Text style={[styles.statValue, { color: '#10b981' }]}>
                  {totalAvailable.toLocaleString('vi-VN')} ₫
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Carousel Danh Sách Thẻ */}
        <View style={styles.carouselSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DANH SÁCH THẺ ({cards.length})</Text>
            {activeCard && (
              <TouchableOpacity onPress={handleOpenSetLimit}>
                <Text style={styles.setLimitLink}>⚙️ Chỉnh hạn mức</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardListContainer}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.round(offsetX / (CARD_WIDTH + 16));
              if (cards[idx] && cards[idx].id !== activeCardId) {
                setActiveCardId(cards[idx].id);
              }
            }}
            scrollEventThrottle={16}
          >
            {cards.map((c) => {
              const isLocked = c.isLocked;
              return (
                <View key={c.id} style={styles.cardItemWrapper}>
                  <LinearGradient
                    colors={isLocked ? ['#27272a', '#18181b'] : c.themeColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.cardSurface, isLocked && styles.cardLockedBorder]}
                  >
                    {/* Hàng Đầu: Chip & Ngân hàng */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.emvChip}>
                        <View style={styles.emvChipLine} />
                      </View>
                      <View style={styles.bankBadge}>
                        <Text style={styles.bankBadgeText}>{c.bankName}</Text>
                      </View>
                      {isLocked && (
                        <View style={styles.lockBadge}>
                          <Ionicons name="lock-closed" size={12} color="#f87171" />
                          <Text style={styles.lockBadgeText}>ĐÃ KHÓA</Text>
                        </View>
                      )}
                    </View>

                    {/* Tên Gợi Nhớ & Mục Đích */}
                    <View style={styles.cardPurposeRow}>
                      <Text style={styles.cardNickname} numberOfLines={1}>
                        {c.nickname}
                      </Text>
                      <View style={styles.purposePill}>
                        <Text style={styles.purposePillText}>{c.purposeLabel}</Text>
                      </View>
                    </View>

                    {/* Số thẻ */}
                    <Text style={styles.cardNumberText}>{c.cardNumberFormatted}</Text>

                    {/* Hàng Dưới: Chủ thẻ, Hạn dùng, CVV */}
                    <View style={styles.cardBottomRow}>
                      <View>
                        <Text style={styles.cardSmallLabel}>CHỦ THẺ</Text>
                        <Text style={styles.cardHolderText}>{c.holderName}</Text>
                      </View>

                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.cardSmallLabel}>HẾT HẠN</Text>
                        <Text style={styles.cardMetaText}>{c.expiryDate}</Text>
                      </View>

                      {/* Nút Xem CVV 90s */}
                      <TouchableOpacity
                        style={styles.cvvTouchBox}
                        onPress={() => handleToggleCvv(c)}
                      >
                        <Text style={styles.cardSmallLabel}>CVV</Text>
                        <Text style={styles.cvvText}>
                          {showCvvId === c.id ? c.cvv : '•••'}
                        </Text>
                        {showCvvId === c.id && (
                          <View style={styles.cvvTimerPill}>
                            <Text style={styles.cvvTimerText}>{cvvCountdown}s</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Thanh Cảnh Báo Chu Kỳ Thẻ Đang Chọn */}
        {activeCard && (
          <View style={styles.billingWarningCard}>
            <View style={styles.billingRow}>
              <View style={styles.billingCol}>
                <Text style={styles.billingLabel}>NGÀY SAO KÊ</Text>
                <Text style={styles.billingValue}>Ngày {activeCard.statementDate} hàng tháng</Text>
              </View>
              <View style={styles.billingCol}>
                <Text style={styles.billingLabel}>HẠN THANH TOÁN</Text>
                <Text style={[styles.billingValue, { color: '#fbbf24' }]}>
                  Ngày {activeCard.dueDate} hàng tháng
                </Text>
              </View>
            </View>
            <View style={styles.dueNoteBox}>
              <Ionicons name="information-circle-outline" size={16} color="#38bdf8" />
              <Text style={styles.dueNoteText}>
                Thanh toán toàn bộ dư nợ trước ngày {activeCard.dueDate} để được miễn lãi 45-55 ngày.
              </Text>
            </View>
          </View>
        )}

        {/* Bảng Điều Khiển Tính Năng Thẻ (Quick Controls) */}
        {activeCard && (
          <View style={styles.controlsCard}>
            <View style={styles.controlsHeader}>
              <Text style={styles.controlsTitle}>CÀI ĐẶT BẢO MẬT & TÍNH NĂNG</Text>
              <TouchableOpacity
                style={[styles.lockToggleBtn, activeCard.isLocked && styles.unlockToggleBtn]}
                onPress={() => toggleCardLock(activeCard.id)}
              >
                <Ionicons
                  name={activeCard.isLocked ? 'lock-open' : 'lock-closed'}
                  size={15}
                  color="#ffffff"
                />
                <Text style={styles.lockToggleText}>
                  {activeCard.isLocked ? 'Mở Khóa Thẻ' : 'Khóa Thẻ Này'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Toggle Thanh toán Online */}
            <View style={styles.settingItem}>
              <View style={styles.settingIconBox}>
                <Ionicons name="globe-outline" size={18} color="#38bdf8" />
              </View>
              <View style={styles.settingTextBox}>
                <Text style={styles.settingName}>Thanh toán Trực tuyến (E-commerce)</Text>
                <Text style={styles.settingDesc}>Cho phép mua hàng online Shopee, Grab, Tiki...</Text>
              </View>
              <Switch
                value={activeCard.onlinePayment}
                onValueChange={() => toggleCardSetting(activeCard.id, 'onlinePayment')}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={activeCard.onlinePayment ? '#38bdf8' : '#94a3b8'}
              />
            </View>

            <View style={styles.settingDivider} />

            {/* Toggle Thanh toán Quốc tế */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Ionicons name="airplane-outline" size={18} color="#a855f7" />
              </View>
              <View style={styles.settingTextBox}>
                <Text style={styles.settingName}>Thanh toán Quốc tế (Foreign Currency)</Text>
                <Text style={styles.settingDesc}>Giao dịch POS nước ngoài, Netflix, App Store</Text>
              </View>
              <Switch
                value={activeCard.internationalPayment}
                onValueChange={() => toggleCardSetting(activeCard.id, 'internationalPayment')}
                trackColor={{ false: '#334155', true: '#9333ea' }}
                thumbColor={activeCard.internationalPayment ? '#c084fc' : '#94a3b8'}
              />
            </View>

            <View style={styles.settingDivider} />

            {/* Toggle Rút tiền ATM */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="cash-outline" size={18} color="#10b981" />
              </View>
              <View style={styles.settingTextBox}>
                <Text style={styles.settingName}>Rút tiền mặt tại cây ATM</Text>
                <Text style={styles.settingDesc}>Bật/tắt tính năng rút tiền bằng thẻ vật lý</Text>
              </View>
              <Switch
                value={activeCard.atmWithdrawal}
                onValueChange={() => toggleCardSetting(activeCard.id, 'atmWithdrawal')}
                trackColor={{ false: '#334155', true: '#059669' }}
                thumbColor={activeCard.atmWithdrawal ? '#34d399' : '#94a3b8'}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL: Thêm Thẻ Mới */}
      <Modal visible={isAddCardModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm Thẻ Ngân Hàng Mới</Text>
              <TouchableOpacity onPress={() => setIsAddCardModalOpen(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Chọn Ngân Hàng */}
              <Text style={styles.fieldLabel}>CHỌN NGÂN HÀNG</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetList}>
                {BANK_PRESETS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.bankChip, newBank === b && styles.bankChipActive]}
                    onPress={() => setNewBank(b)}
                  >
                    <Text style={[styles.bankChipText, newBank === b && styles.bankChipTextActive]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tên gợi nhớ */}
              <Text style={styles.fieldLabel}>TÊN GỢI NHỚ THẺ</Text>
              <TextInput
                style={styles.inputField}
                placeholder="VD: Thẻ Chi Tiêu Gia Đình"
                placeholderTextColor="#64748b"
                value={newNickname}
                onChangeText={setNewNickname}
              />

              {/* 4 Số cuối */}
              <Text style={styles.fieldLabel}>4 SỐ CUỐI TRÊN THẺ</Text>
              <TextInput
                style={styles.inputField}
                placeholder="VD: 5566"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                maxLength={4}
                value={newLastDigits}
                onChangeText={setNewLastDigits}
              />

              {/* Hạn Mức Tín Dụng */}
              <Text style={styles.fieldLabel}>HẠN MỨC TÍN DỤNG (VNĐ)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="VD: 20000000"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={newLimit}
                onChangeText={setNewLastLimit}
              />

              {/* Chu kỳ Sao Kê & Hạn Thanh Toán */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>NGÀY SAO KÊ</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="20"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    maxLength={2}
                    value={newStatementDate}
                    onChangeText={setNewStatementDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>HẠN THANH TOÁN</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="5"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    maxLength={2}
                    value={newDueDate}
                    onChangeText={setNewDueDate}
                  />
                </View>
              </View>

              {/* Chọn Màu Sắc Thẻ */}
              <Text style={styles.fieldLabel}>MÀU SẮC GRADIENT THẺ</Text>
              <View style={styles.themeRow}>
                {THEME_OPTIONS.map((theme, i) => (
                  <TouchableOpacity
                    key={theme.label}
                    style={[
                      styles.themeCircle,
                      { backgroundColor: theme.colors[1] },
                      selectedThemeIndex === i && styles.themeCircleActive,
                    ]}
                    onPress={() => setSelectedThemeIndex(i)}
                  />
                ))}
              </View>

              {/* Nút Xác Nhận Thêm */}
              <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleSaveNewCard}>
                <Text style={styles.saveSubmitText}>Lưu Thẻ Vào Ví</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Chỉnh Sửa Hạn Mức */}
      <Modal visible={isSetLimitModalOpen} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardCompact}>
            <Text style={styles.modalTitle}>Điều Chỉnh Hạn Mức Chi Tiêu</Text>
            <Text style={styles.modalSubtitle}>
              Áp dụng cho thẻ {activeCard?.bankName} ({activeCard?.lastFourDigits})
            </Text>

            <TextInput
              style={[styles.inputField, { fontSize: 18, fontWeight: '700', textAlign: 'center' }]}
              keyboardType="numeric"
              value={limitInput}
              onChangeText={setLimitInput}
            />

            {/* Quick Limit Options */}
            <View style={styles.quickLimitRow}>
              {['10000000', '20000000', '50000000', '100000000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickLimitChip}
                  onPress={() => setLimitInput(amt)}
                >
                  <Text style={styles.quickLimitText}>{parseInt(amt, 10) / 1000000} Triệu</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsSetLimitModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveNewLimit}>
                <Text style={styles.confirmBtnText}>Cập Nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addCardBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
    marginTop: 4,
  },
  carouselSection: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  setLimitLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  cardListContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  cardItemWrapper: {
    width: CARD_WIDTH,
  },
  cardSurface: {
    borderRadius: 20,
    padding: 20,
    height: 200,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cardLockedBorder: {
    borderColor: '#f87171',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emvChip: {
    width: 36,
    height: 26,
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
  bankBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bankBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f87171',
  },
  cardPurposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardNickname: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
  },
  purposePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  purposePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
  cardNumberText: {
    fontSize: 19,
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
  cardSmallLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardHolderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardMetaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  cvvTouchBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    position: 'relative',
  },
  cvvText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fbbf24',
  },
  cvvTimerPill: {
    position: 'absolute',
    top: -10,
    right: -6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  cvvTimerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  billingWarningCard: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: '#0b1329',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billingCol: {
    flex: 1,
  },
  billingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  billingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 4,
  },
  dueNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  dueNoteText: {
    fontSize: 11,
    color: '#7dd3fc',
    flex: 1,
    lineHeight: 15,
  },
  controlsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#0b1329',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  controlsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  lockToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  unlockToggleBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  lockToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextBox: {
    flex: 1,
  },
  settingName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  settingDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0d1527',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  modalCardCompact: {
    backgroundColor: '#0d1527',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalBody: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  presetList: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#172554',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bankChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  bankChipText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  bankChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  inputField: {
    backgroundColor: '#111c38',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  themeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCircleActive: {
    borderColor: '#38bdf8',
    transform: [{ scale: 1.15 }],
  },
  saveSubmitBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 30,
  },
  saveSubmitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  quickLimitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickLimitChip: {
    backgroundColor: '#172554',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickLimitText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
