import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCardflow } from '../../src/context/CardflowContext';

const CATEGORIES = [
  { id: 'dining', label: 'Ăn uống', icon: 'restaurant-outline', color: '#f59e0b' },
  { id: 'shopping', label: 'Mua sắm', icon: 'cart-outline', color: '#ec4899' },
  { id: 'transport', label: 'Di chuyển', icon: 'car-outline', color: '#38bdf8' },
  { id: 'bills', label: 'Hóa đơn', icon: 'receipt-outline', color: '#8b5cf6' },
  { id: 'tech', label: 'Công nghệ', icon: 'laptop-outline', color: '#06b6d4' },
  { id: 'salary', label: 'Thu nhập', icon: 'trending-up-outline', color: '#10b981' },
];

export default function TransactionsScreen() {
  const { transactions, cards, addTransaction, deleteTransaction } = useCardflow();
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id || '');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0] || { id: 'dining', label: 'Ăn uống', icon: 'restaurant-outline', color: '#f59e0b' });
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [note, setNote] = useState('');

  const filtered = transactions.filter((tx) => {
    if (filterType === 'expense') return tx.type === 'expense';
    if (filterType === 'income') return tx.type === 'income';
    return true;
  });

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleSaveTransaction = () => {
    if (!merchant.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên điểm bán hoặc nội dung.');
      return;
    }
    const parsedAmount = parseInt(amount.replace(/\D/g, ''), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    const card = cards.find((c) => c.id === selectedCardId) || cards[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = 'Hôm nay';

    addTransaction({
      cardId: card?.id || '',
      cardName: card ? `${card.bankName} (${card.lastFourDigits})` : 'Tiền mặt',
      merchant: merchant.trim(),
      category: selectedCategory.id,
      categoryLabel: selectedCategory.label,
      amount: parsedAmount,
      type: txType,
      date: dateStr,
      time: timeStr,
      note: note.trim() || undefined,
      icon: selectedCategory.icon,
      color: selectedCategory.color,
    });

    setIsAddModalOpen(false);
    setMerchant('');
    setAmount('');
    setNote('');
    Alert.alert('Thành công', `Đã ghi nhận giao dịch: ${merchant} (${parsedAmount.toLocaleString('vi-VN')} VNĐ)`);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Xóa Giao Dịch', `Bạn có chắc chắn muốn xóa giao dịch "${name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Lịch Sử Giao Dịch</Text>
            <Text style={styles.headerSubtitle}>
              Tổng chi tiêu: <Text style={styles.totalExpenseHighlight}>{totalExpense.toLocaleString('vi-VN')} ₫</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.addTxBtn} onPress={() => setIsAddModalOpen(true)}>
            <Ionicons name="add-circle" size={18} color="#ffffff" />
            <Text style={styles.addTxBtnText}>Thêm Chi Tiêu</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            Tất cả ({transactions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'expense' && styles.filterChipActive]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}>
            Chi tiêu (-)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'income' && styles.filterChipActive]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>
            Thu nhập (+)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={48} color="#475569" />
            <Text style={styles.emptyTitle}>Chưa có giao dịch nào</Text>
            <Text style={styles.emptySubtitle}>Bấm "+ Thêm Chi Tiêu" hoặc Quét AI để ghi nhận giao dịch mới.</Text>
          </View>
        ) : (
          filtered.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txCard}
              onLongPress={() => handleDelete(tx.id, tx.merchant)}
            >
              <View style={[styles.iconBox, { backgroundColor: `${tx.color}25` }]}>
                <Ionicons name={tx.icon as any} size={20} color={tx.color} />
              </View>

              <View style={styles.txInfoCol}>
                <Text style={styles.merchantName} numberOfLines={1}>
                  {tx.merchant}
                </Text>
                <Text style={styles.metaInfo}>
                  {tx.date} • {tx.time} • {tx.cardName}
                </Text>
                {tx.note ? (
                  <Text style={styles.txNote} numberOfLines={1}>
                    💬 {tx.note}
                  </Text>
                ) : null}
              </View>

              <View style={styles.amountCol}>
                <Text
                  style={[
                    styles.amountText,
                    tx.type === 'income' ? styles.incomeText : styles.expenseText,
                  ]}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {tx.amount.toLocaleString('vi-VN')} ₫
                </Text>
                <Text style={styles.categoryLabel}>{tx.categoryLabel}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* MODAL: Thêm Chi Tiêu Thủ Công */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm Giao Dịch Mới</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Loại giao dịch: Chi tiêu / Thu nhập */}
              <View style={styles.typeToggleRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, txType === 'expense' && styles.typeBtnExpense]}
                  onPress={() => setTxType('expense')}
                >
                  <Text style={[styles.typeBtnText, txType === 'expense' && styles.typeBtnTextActive]}>
                    Khoản Chi Tiêu (-)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, txType === 'income' && styles.typeBtnIncome]}
                  onPress={() => setTxType('income')}
                >
                  <Text style={[styles.typeBtnText, txType === 'income' && styles.typeBtnTextActive]}>
                    Khoản Thu Nhập (+)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Chọn Thẻ Trả */}
              <Text style={styles.fieldLabel}>CHỌN THẺ THANH TOÁN</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardSelectScroll}>
                {cards.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.cardChip,
                      selectedCardId === c.id && styles.cardChipActive,
                    ]}
                    onPress={() => setSelectedCardId(c.id)}
                  >
                    <Text
                      style={[
                        styles.cardChipText,
                        selectedCardId === c.id && styles.cardChipTextActive,
                      ]}
                    >
                      {c.bankName} ({c.lastFourDigits})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tên Điểm Bán */}
              <Text style={styles.fieldLabel}>TÊN ĐIỂM BÁN / CỬA HÀNG</Text>
              <TextInput
                style={styles.inputField}
                placeholder="VD: Cửa hàng tiện lợi Circle K, Grab..."
                placeholderTextColor="#64748b"
                value={merchant}
                onChangeText={setMerchant}
              />

              {/* Số Tiền */}
              <Text style={styles.fieldLabel}>SỐ TIỀN GIAO DỊCH (VNĐ)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="VD: 150000"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              {/* Danh mục */}
              <Text style={styles.fieldLabel}>DANH MỤC CHI TIÊU</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catCard,
                      selectedCategory.id === cat.id && styles.catCardActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={selectedCategory.id === cat.id ? '#38bdf8' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.catLabel,
                        selectedCategory.id === cat.id && styles.catLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ghi chú */}
              <Text style={styles.fieldLabel}>GHI CHÚ (TÙY CHỌN)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="VD: Mua đồ ăn trưa cùng đồng nghiệp"
                placeholderTextColor="#64748b"
                value={note}
                onChangeText={setNote}
              />

              {/* Nút Submit */}
              <TouchableOpacity style={styles.submitTxBtn} onPress={handleSaveTransaction}>
                <Text style={styles.submitTxText}>Ghi Nhận Giao Dịch</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060a17',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  totalExpenseHighlight: {
    color: '#f43f5e',
    fontWeight: '800',
  },
  addTxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addTxBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38bdf8',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c1429',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfoCol: {
    flex: 1,
    gap: 4,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  metaInfo: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  txNote: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  expenseText: {
    color: '#f43f5e',
  },
  incomeText: {
    color: '#10b981',
  },
  categoryLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
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
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
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
  modalBody: {
    gap: 10,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#172554',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeBtnExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: '#f43f5e',
  },
  typeBtnIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  typeBtnText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  cardSelectScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  cardChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#111c38',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  cardChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  cardChipTextActive: {
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: '#111c38',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  catCardActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  catLabelActive: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  submitTxBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 30,
  },
  submitTxText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
