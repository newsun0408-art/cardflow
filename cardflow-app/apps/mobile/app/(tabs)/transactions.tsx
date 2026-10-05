import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TransactionItem {
  id: string;
  merchant: string;
  category: string;
  categoryLabel: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  time: string;
  cardName: string;
  icon: string;
  color: string;
}

const SAMPLE_TXS: TransactionItem[] = [
  {
    id: 'tx-1',
    merchant: 'Tiệm Trà Xinh',
    category: 'dining',
    categoryLabel: 'Ăn uống',
    amount: 100000,
    type: 'expense',
    date: 'Hôm nay',
    time: '15:32',
    cardName: 'Techcombank (9921)',
    icon: 'cafe',
    color: '#f59e0b',
  },
  {
    id: 'tx-2',
    merchant: 'Siêu thị WinMart Thảo Điền',
    category: 'shopping',
    categoryLabel: 'Mua sắm',
    amount: 485000,
    type: 'expense',
    date: 'Hôm nay',
    time: '11:15',
    cardName: 'Vietcombank (1281)',
    icon: 'cart',
    color: '#ec4899',
  },
  {
    id: 'tx-3',
    merchant: 'Petrolimex Cây Xăng Số 01',
    category: 'transport',
    categoryLabel: 'Di chuyển',
    amount: 500000,
    type: 'expense',
    date: 'Hôm qua',
    time: '08:20',
    cardName: 'MB Bank (4402)',
    icon: 'car',
    color: '#38bdf8',
  },
  {
    id: 'tx-4',
    merchant: 'Chuyển Khoản Lương Tháng',
    category: 'salary',
    categoryLabel: 'Thu nhập',
    amount: 35000000,
    type: 'income',
    date: '01/10/2026',
    time: '10:00',
    cardName: 'Techcombank (9921)',
    icon: 'trending-up',
    color: '#10b981',
  },
];

export default function TransactionsScreen() {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  const filtered = SAMPLE_TXS.filter((tx) => {
    if (filterType === 'expense') return tx.type === 'expense';
    if (filterType === 'income') return tx.type === 'income';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Sử Giao Dịch</Text>
        <Text style={styles.headerSubtitle}>Quản lý và đối soát chi tiêu theo thời gian thực</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'expense' && styles.filterChipActive]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}>
            Khoản chi tiêu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'income' && styles.filterChipActive]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>
            Khoản thu nhập
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.map((tx) => (
          <View key={tx.id} style={styles.txCard}>
            <View style={[styles.iconBox, { backgroundColor: `${tx.color}20` }]}>
              <Ionicons name={tx.icon as any} size={20} color={tx.color} />
            </View>

            <View style={styles.txInfoCol}>
              <Text style={styles.merchantName} numberOfLines={1}>
                {tx.merchant}
              </Text>
              <Text style={styles.metaInfo}>
                {tx.date} • {tx.time} • {tx.cardName}
              </Text>
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
          </View>
        ))}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
});
