import { StyleSheet, Text, View } from 'react-native';
import type { TextStyle } from 'react-native';
import { env } from '@cardflow-app/shared';
import { defaultTokens } from 'fe-kit/tokens';

// ⚠ RN KHÔNG dùng `fe-kit/ui` — subpath đó map token sang antd, thứ React
// Native không có. `fe-kit/tokens` là bảng token THUẦN, chạy trên mọi nền tảng.
const t = defaultTokens('light');

export default function Home() {
  return (
    <View style={styles.root}>
      <Text style={styles.title as TextStyle}>Cardflow app</Text>
      <Text style={styles.muted as TextStyle}>Môi trường: {env.current()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.color.background },
  title: { fontSize: 24, fontWeight: '600', color: t.color.text },
  muted: { marginTop: 8, color: t.color.textMuted },
});
