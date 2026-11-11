import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, apiUrl, updateApiUrl } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(apiUrl);
  const [showConfig, setShowConfig] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      // Cập nhật lại server URL nếu có chỉnh sửa
      if (serverUrl.trim() !== apiUrl) {
        updateApiUrl(serverUrl.trim());
      }

      const res = await login(username.trim(), password.trim());
      setLoading(false);

      if (res.success) {
        if (Platform.OS === 'web') {
          router.replace('/');
        } else {
          Alert.alert('Thành công', 'Đăng nhập quyền Admin thành công!', [
            { text: 'OK', onPress: () => router.replace('/') },
          ]);
        }
      } else {
        setErrorMsg(res.message || 'Đăng nhập không thành công');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Lỗi kết nối máy chủ: ' + err.message);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin');
    setErrorMsg('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={40} color="#1E40AF" />
            </View>
            <Text style={styles.title}>HỆ THỐNG ADMIN</Text>
            <Text style={styles.subtitle}>Đăng nhập quản trị sản phẩm</Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập username (admin)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập password (admin)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.quickFillBtn}
            onPress={handleQuickFill}
            activeOpacity={0.7}
          >
            <Ionicons name="flash-outline" size={16} color="#2563EB" />
            <Text style={styles.quickFillText}>Điền tài khoản mẫu (admin / admin)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Về trang danh sách (Chế độ xem)</Text>
          </TouchableOpacity>

          {/* Cấu hình kết nối API */}
          <View style={styles.configSection}>
            <TouchableOpacity
              onPress={() => setShowConfig(!showConfig)}
              style={styles.configToggle}
            >
              <Ionicons name="settings-outline" size={16} color="#6B7280" />
              <Text style={styles.configToggleText}>
                {showConfig ? 'Ẩn cấu hình API URL' : 'Tùy chỉnh API URL Backend'}
              </Text>
            </TouchableOpacity>

            {showConfig && (
              <View style={styles.configBox}>
                <Text style={styles.configLabel}>URL API Backend:</Text>
                <TextInput
                  style={styles.configInput}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="http://localhost:5000/api"
                  autoCapitalize="none"
                />
                <Text style={styles.configNote}>
                  * Trên web: http://localhost:5000/api{'\n'}
                  * Trên máy thật: Thay localhost bằng IP máy tính (vd: 192.168.x.x:5000/api)
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#1F2937',
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 16,
  },
  quickFillText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
  loginBtn: {
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipBtnText: {
    color: '#6B7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  configSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configToggleText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  configBox: {
    marginTop: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  configInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  configNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
});
