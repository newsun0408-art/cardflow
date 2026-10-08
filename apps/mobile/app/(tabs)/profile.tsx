import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleEmergencyLock = () => {
    Alert.alert(
      'Khóa Thẻ Khẩn Cấp',
      'Bạn có chắc chắn muốn khóa toàn bộ thẻ trong ví ngay lập tức?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khóa Toàn Bộ',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Thành công', 'Đã kích hoạt khóa an toàn cho tất cả thẻ!');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Xuất Dữ Liệu',
      'Đã chuẩn bị báo cáo sao kê tháng gần nhất. Bạn muốn gửi báo cáo qua email?',
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Gửi Email',
          onPress: () => Alert.alert('Đã gửi', 'Báo cáo PDF đã được gửi đến email của bạn.'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={['#38bdf8', '#818cf8', '#c084fc']}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={36} color="#ffffff" />
            </LinearGradient>
            <View style={styles.badgePro}>
              <Text style={styles.badgeProText}>PRO</Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>Lê Huỳnh Thuận</Text>
            <Text style={styles.userEmail}>huynhthuan@cardflow.app</Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Xác thực sinh trắc học đã bật</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Security Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BẢO MẬT & XÁC THỰC</Text>

          <View style={styles.cardGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Ionicons name="scan-outline" size={20} color="#38bdf8" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Face ID / Touch ID</Text>
                <Text style={styles.settingDesc}>Đăng nhập nhanh không cần mã PIN</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={biometricsEnabled ? '#38bdf8' : '#94a3b8'}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Alert.alert('Thời Gian CVV', 'Thời gian hiển thị CVV cố định: 90 giây theo chuẩn bảo mật an toàn PCI-DSS.')}
            >
              <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Ionicons name="timer-outline" size={20} color="#eab308" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Thời gian tự ẩn CVV</Text>
                <Text style={styles.settingDesc}>90 giây (Khuyến nghị)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Alert.alert('Đổi mã PIN', 'Nhập mã PIN hiện tại để tiếp tục đổi mã mới.')}
            >
              <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Ionicons name="key-outline" size={20} color="#a855f7" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Đổi mã PIN bảo vệ</Text>
                <Text style={styles.settingDesc}>6 chữ số mã hóa phần cứng</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cloud & Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ĐỒNG BỘ & DỮ LIỆU</Text>

          <View style={styles.cardGroup}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="cloud-done-outline" size={20} color="#10b981" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Đồng bộ Google Drive</Text>
                <Text style={styles.settingDesc}>Sao lưu thẻ mã hóa AES-256</Text>
              </View>
              <Switch
                value={cloudSyncEnabled}
                onValueChange={setCloudSyncEnabled}
                trackColor={{ false: '#334155', true: '#059669' }}
                thumbColor={cloudSyncEnabled ? '#34d399' : '#94a3b8'}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow} onPress={handleExportData}>
              <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="document-text-outline" size={20} color="#38bdf8" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Xuất báo cáo chi tiêu</Text>
                <Text style={styles.settingDesc}>Bản PDF / CSV định dạng chuẩn</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                <Ionicons name="notifications-outline" size={20} color="#f43f5e" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Thông báo đến hạn thẻ</Text>
                <Text style={styles.settingDesc}>Nhắc nhở ngày thanh toán & sao kê</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#334155', true: '#e11d48' }}
                thumbColor={notificationsEnabled ? '#fb7185' : '#94a3b8'}
              />
            </View>
          </View>
        </View>

        {/* Emergency Lock Action */}
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyLock}>
          <Ionicons name="shield-half-outline" size={20} color="#f87171" />
          <Text style={styles.emergencyButtonText}>Khóa Khẩn Cấp Toàn Bộ Thẻ</Text>
        </TouchableOpacity>

        {/* Version info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Cardflow Mobile for iOS • v1.2.0 (Build 42)</Text>
          <Text style={styles.footerSubText}>Bảo mật tiêu chuẩn PCI-DSS & AES-256 GCM</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePro: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#38bdf8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  badgeProText: {
    color: '#030712',
    fontSize: 9,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#0b1329',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 66,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
    marginBottom: 28,
  },
  emergencyButtonText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  footerSubText: {
    color: '#334155',
    fontSize: 11,
    marginTop: 4,
  },
});
