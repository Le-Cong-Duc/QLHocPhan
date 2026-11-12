import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Lecturer } from './src/types/lecturer';
import LecturerFormModal from './src/components/LecturerFormModal';

const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
const nativeApiHost = Device.isDevice ? metroHost || '192.168.10.156' : '10.0.2.2';
const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  `${Platform.OS === 'web' ? 'http://localhost' : `http://${nativeApiHost}`}:5000/api`;

export default function App() {
  const { width } = useWindowDimensions();
  const isCompactLayout = width < 600;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const apiUrl = DEFAULT_API_URL;

  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'class_asc' | 'class_desc'>('default');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const tableWidth = isCompactLayout
    ? Math.max(width - 20, 280)
    : Math.max(width - 20, 780);

  const showToast = useCallback((text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const fetchLecturers = useCallback(async (keyword?: string) => {
    try {
      setLoading(true);
      const url = keyword !== undefined
        ? `${apiUrl}/lecturers?search=${encodeURIComponent(keyword)}`
        : `${apiUrl}/lecturers`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setLecturers(data.data);
      } else {
        showToast(data.message || 'Không thể tải danh sách giảng viên', 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi không xác định';
      showToast('Lỗi kết nối máy chủ backend: ' + message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, showToast]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchLecturers();
    }
  }, [isLoggedIn, fetchLecturers]);

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }

    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });
      const data = await res.json();
      setLoginLoading(false);

      if (data.success) {
        setIsLoggedIn(true);
        showToast('Đăng nhập quản trị Admin thành công!', 'success');
      } else {
        setLoginError(data.message || 'Tài khoản hoặc mật khẩu không đúng');
      }
    } catch (error) {
      setLoginLoading(false);
      const message = error instanceof Error ? error.message : 'Lỗi không xác định';
      setLoginError('Lỗi kết nối máy chủ: ' + message);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLecturers([]);
    showToast('Đã đăng xuất', 'success');
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedLecturer(null);
    setServerError('');
    setModalVisible(true);
  };

  const openEditModal = (lecturer: Lecturer) => {
    setModalMode('edit');
    setSelectedLecturer(lecturer);
    setServerError('');
    setModalVisible(true);
  };

  const handleSaveLecturer = async (
    payload: Omit<Lecturer, '_id' | 'IDGV'>
  ) => {
    setServerError('');
    setFormSaving(true);

    try {
      let url = `${apiUrl}/lecturers`;
      let method = 'POST';

      if (modalMode === 'edit' && selectedLecturer?.IDGV) {
        url = `${apiUrl}/lecturers/${encodeURIComponent(selectedLecturer.IDGV)}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setFormSaving(false);

      if (data.success) {
        setModalVisible(false);
        showToast(
          modalMode === 'add'
            ? 'Đã thêm giảng viên mới thành công!'
            : 'Đã cập nhật giảng viên!',
          'success'
        );
        fetchLecturers(search);
      } else {
        setServerError(data.message || 'Lưu thất bại');
      }
    } catch (error) {
      setFormSaving(false);
      const message = error instanceof Error ? error.message : 'Lỗi không xác định';
      setServerError('Lỗi kết nối máy chủ backend: ' + message);
    }
  };

  const handleDeleteLecturer = (id?: string, fullname?: string) => {
    if (!id) return;

    const executeDelete = async () => {
      try {
        const res = await fetch(`${apiUrl}/lecturers/${encodeURIComponent(id)}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          showToast(`Đã xóa giảng viên "${fullname}" thành công`, 'success');
          fetchLecturers(search);
        } else {
          showToast(data.message || 'Xóa thất bại', 'error');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Lỗi không xác định';
        showToast('Lỗi khi xóa: ' + message, 'error');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa giảng viên "${fullname}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa "${fullname}"?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  const sortedLecturers = [...lecturers].sort((a, b) => {
      if (sortBy === 'class_asc') return a.SumClass - b.SumClass;
      if (sortBy === 'class_desc') return b.SumClass - a.SumClass;
      return 0;
    });

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.loginScroll}>
            <View style={styles.loginCard}>
              <View style={styles.loginHeader}>
                <View style={styles.shieldCircle}>
                  <Ionicons name="shield-checkmark" size={44} color="#1E40AF" />
                </View>
                <Text style={styles.loginTitle}>ĐĂNG NHẬP</Text>
                <Text style={styles.loginSubtitle}>
                  Vui lòng đăng nhập để quản lý học phần
                </Text>
              </View>

              {loginError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.errorText}>{loginError}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email / tên đăng nhập</Text>
                <View style={styles.inputFieldWrapper}>
                  <Ionicons name="person-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    value={loginUsername}
                    onChangeText={setLoginUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu</Text>
                <View style={styles.inputFieldWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isCompactLayout && styles.compactPrimaryButton,
                  loginLoading && styles.btnDisabled,
                ]}
                onPress={handleLogin}
                disabled={loginLoading}
                activeOpacity={0.8}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>ĐĂNG NHẬP</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // GIAO DIỆN CHÍNH QUẢN LÝ HỌC PHẦN SAU KHI ĐĂNG NHẬP
  // =========================================================================
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={[styles.topHeader, isCompactLayout && styles.compactTopHeader]}>
        <View style={[styles.headerLeft, isCompactLayout && styles.compactHeaderLeft]}>
          <Text style={[styles.headerTitle, isCompactLayout && styles.compactHeaderTitle]}>
            QUẢN LÝ HỌC PHẦN
          </Text>
          <View style={styles.adminBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text
              style={[styles.adminBadgeText, isCompactLayout && styles.compactAdminBadgeText]}
              numberOfLines={1}
            >
              Admin: {loginUsername}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, isCompactLayout && styles.compactLogoutBtn]}
          onPress={handleLogout}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất"
        >
          <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
          {!isCompactLayout && <Text style={styles.logoutBtnText}>Đăng xuất</Text>}
        </TouchableOpacity>
      </View>

      {/* Toast thông báo */}
      {toastMessage && (
        <View
          style={[
            styles.toastBox,
            toastMessage.type === 'success' ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Ionicons
            name={toastMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={toastMessage.type === 'success' ? '#15803D' : '#B91C1C'}
          />
          <Text
            style={[
              styles.toastText,
              { color: toastMessage.type === 'success' ? '#15803D' : '#B91C1C' },
            ]}
          >
            {toastMessage.text}
          </Text>
        </View>
      )}

      {/* Thanh công cụ: Tìm kiếm và thêm giảng viên */}
      <View style={[styles.toolbarRow, isCompactLayout && styles.compactToolbarRow]}>
        <View style={[styles.searchBox, isCompactLayout && styles.compactSearchBox]}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => fetchLecturers(search)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Tìm kiếm giảng viên"
          >
            <Ionicons name="search-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo mã hoặc họ tên giảng viên..."
            value={search}
            returnKeyType="search"
            onSubmitEditing={() => fetchLecturers(search)}
            onChangeText={(text) => {
              setSearch(text);
              fetchLecturers(text);
            }}
          />
          {search ? (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                fetchLecturers('');
              }}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Nút thêm giảng viên */}
        <TouchableOpacity
          style={[styles.addBtn, isCompactLayout && styles.compactAddBtn]}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Thêm giảng viên</Text>
        </TouchableOpacity>
      </View>

      {/* Tổng số giảng viên và sắp xếp */}
      <View style={styles.filterRow}>
        <View style={styles.filterChipGroup}>
          <TouchableOpacity
            style={[styles.chip, sortBy === 'default' && styles.chipActive]}
            onPress={() => setSortBy('default')}
          >
            <Text style={[styles.chipText, sortBy === 'default' && styles.chipTextActive]}>
              Tất cả ({lecturers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, sortBy !== 'default' && styles.chipActive]}
            onPress={() => {
              if (sortBy === 'default') setSortBy('class_asc');
              else if (sortBy === 'class_asc') setSortBy('class_desc');
              else setSortBy('default');
            }}
          >
            <Text style={[styles.chipText, sortBy !== 'default' && styles.chipTextActive]}>
              {sortBy === 'class_asc'
                ? 'Số lớp: Tăng'
                : sortBy === 'class_desc'
                ? 'Số lớp: Giảm'
                : 'Sắp xếp số lớp'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danh sách giảng viên */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingMsg}>Đang tải danh sách giảng viên...</Text>
        </View>
      ) : sortedLecturers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Chưa có giảng viên nào</Text>
          <Text style={styles.emptySubtitle}>
            {search
              ? 'Không tìm thấy giảng viên phù hợp'
              : 'Bấm "Thêm giảng viên" để nhập dữ liệu vào MongoDB'}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          style={styles.tableScroll}
          contentContainerStyle={styles.tableScrollContent}
          showsHorizontalScrollIndicator
        >
          <View style={[styles.table, { width: tableWidth }]}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[
                styles.tableHeaderText,
                styles.idColumn,
                isCompactLayout && styles.compactIdColumn,
                isCompactLayout && styles.compactTableHeaderText,
              ]}>
                {isCompactLayout ? 'Mã GV' : 'Mã giảng viên'}
              </Text>
              <Text style={[
                styles.tableHeaderText,
                styles.nameColumn,
                isCompactLayout && styles.compactNameColumn,
                isCompactLayout && styles.compactTableHeaderText,
              ]}>
                {isCompactLayout ? 'Họ tên' : 'Họ và tên'}
              </Text>
              <Text style={[
                styles.tableHeaderText,
                styles.imageColumn,
                isCompactLayout && styles.compactImageColumn,
                isCompactLayout && styles.compactTableHeaderText,
              ]}>
                {isCompactLayout ? 'Ảnh' : 'Hình ảnh'}
              </Text>
              <Text style={[
                styles.tableHeaderText,
                styles.classColumn,
                isCompactLayout && styles.compactClassColumn,
                isCompactLayout && styles.compactTableHeaderText,
              ]}>
                {isCompactLayout ? 'Số lớp' : 'Tổng số lớp'}
              </Text>
              <Text style={[
                styles.tableHeaderText,
                styles.actionsColumn,
                isCompactLayout && styles.compactActionsColumn,
                isCompactLayout && styles.compactTableHeaderText,
              ]}>
                Thao tác
              </Text>
            </View>

            <FlatList
              data={sortedLecturers}
              keyExtractor={(item) => item.IDGV}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchLecturers(search);
                  }}
                  colors={['#1E40AF']}
                />
              }
              renderItem={({ item, index }) => (
                <View style={[styles.tableRow, index % 2 === 1 && styles.alternateTableRow]}>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.idColumn,
                      isCompactLayout && styles.compactIdColumn,
                      isCompactLayout && styles.compactTableCell,
                    ]}
                    numberOfLines={1}
                  >
                    {item.IDGV}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.nameColumn,
                      isCompactLayout && styles.compactNameColumn,
                      isCompactLayout && styles.compactTableCell,
                    ]}
                    numberOfLines={2}
                  >
                    {item.Fullname}
                  </Text>
                  <View style={[
                    styles.tableCell,
                    styles.imageColumn,
                    isCompactLayout && styles.compactImageColumn,
                    isCompactLayout && styles.compactTableCell,
                  ]}>
                    <Image
                      source={{ uri: item.Image }}
                      style={[styles.tableImage, isCompactLayout && styles.compactTableImage]}
                      resizeMode="cover"
                    />
                  </View>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.classColumn,
                      isCompactLayout && styles.compactClassColumn,
                      isCompactLayout && styles.compactTableCell,
                    ]}
                  >
                    {item.SumClass}
                  </Text>
                  <View style={[
                    styles.actionsColumn,
                    isCompactLayout && styles.compactActionsColumn,
                    styles.tableActions,
                    isCompactLayout && styles.compactTableActions,
                  ]}>
                    <TouchableOpacity
                      style={styles.tableEditButton}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Sửa giảng viên ${item.Fullname}`}
                    >
                      <Ionicons name="create-outline" size={16} color="#1E40AF" />
                      {!isCompactLayout && (
                        <Text style={styles.tableEditText}>Sửa</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.tableDeleteButton}
                      onPress={() => handleDeleteLecturer(item.IDGV, item.Fullname)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa giảng viên ${item.Fullname}`}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      {!isCompactLayout && (
                        <Text style={styles.tableDeleteText}>Xóa</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </ScrollView>
      )}
      {modalVisible ? (
        <LecturerFormModal
          visible={modalVisible}
          mode={modalMode}
          initialData={selectedLecturer}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveLecturer}
          saving={formSaving}
          serverError={serverError}
        />
      ) : null}
    </SafeAreaView>
  );
}

// =========================================================================
// STYLESHEET
// =========================================================================
const styles = StyleSheet.create({
  // Màn hình Đăng nhập
  loginContainer: {
    flex: 1,
    backgroundColor: '#EEF2F6',
  },
  keyboardView: {
    flex: 1,
  },
  loginScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  shieldCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  loginSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  primaryButton: {
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  compactPrimaryButton: {
    width: '72%',
    minWidth: 180,
    maxWidth: 260,
    alignSelf: 'center',
    height: 44,
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Màn hình chính
  mainContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  compactTopHeader: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactHeaderLeft: {
    justifyContent: 'space-between',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  compactHeaderTitle: {
    flexShrink: 1,
    fontSize: 15,
    letterSpacing: 0,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  compactAdminBadgeText: {
    flexShrink: 1,
    fontSize: 11,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  compactLogoutBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Toast
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  toastSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  toastError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  toastText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },

  // Toolbar
  toolbarRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 10,
  },
  compactToolbarRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  compactSearchBox: {
    flex: 0,
    width: '100%',
  },
  searchButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#1F2937',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  compactAddBtn: {
    alignSelf: 'flex-end',
    height: 42,
    paddingHorizontal: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Bộ lọc
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterChipGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#1E40AF',
  },
  chipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Bảng giảng viên
  tableScroll: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  tableScrollContent: {
    flexGrow: 1,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeader: {
    minHeight: 48,
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  alternateTableRow: {
    backgroundColor: '#F9FAFB',
  },
  tableHeaderText: {
    paddingHorizontal: 12,
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '700',
  },
  compactTableHeaderText: {
    paddingHorizontal: 4,
    fontSize: 11,
    textAlign: 'center',
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#374151',
  },
  compactTableCell: {
    paddingHorizontal: 4,
    fontSize: 11,
  },
  idColumn: {
    width: '16%',
  },
  nameColumn: {
    width: '25%',
  },
  imageColumn: {
    width: '16%',
    justifyContent: 'center',
  },
  classColumn: {
    width: '16%',
    textAlign: 'center',
  },
  actionsColumn: {
    width: '27%',
  },
  compactIdColumn: {
    width: '18%',
  },
  compactNameColumn: {
    width: '26%',
  },
  compactImageColumn: {
    width: '14%',
  },
  compactClassColumn: {
    width: '13%',
  },
  compactActionsColumn: {
    width: '29%',
  },
  tableImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  compactTableImage: {
    width: 36,
    height: 36,
  },
  tableActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  compactTableActions: {
    gap: 4,
    paddingHorizontal: 2,
  },
  tableEditButton: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    gap: 4,
  },
  tableEditText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '600',
  },
  tableDeleteButton: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    gap: 4,
  },
  tableDeleteText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingMsg: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
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
});
