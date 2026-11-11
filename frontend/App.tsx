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
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Kiểu dữ liệu đúng quy định đề bài: chỉ gồm name, price, soluong, image
export interface Product {
  _id?: string;
  name: string;
  price: number;
  soluong: number;
  image: string;
}

// Cấu hình URL backend: trên web dùng localhost:5000, mobile dùng IP máy tính
const DEFAULT_API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : 'http://192.168.10.156:5000/api';

export default function App() {
  const { width } = useWindowDimensions();

  // 1. Trạng thái Đăng nhập (Yêu cầu: bắt buộc đăng nhập khi mở app)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showConfig, setShowConfig] = useState(false);

  // 2. Dữ liệu sản phẩm & danh sách
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 3. Trạng thái Khung cửa sổ (Modal) Thêm / Sửa sản phẩm
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSoluong, setFormSoluong] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Responsive: Số cột hiển thị tùy theo độ rộng màn hình
  const numColumns = width > 1024 ? 3 : width > 640 ? 2 : 1;

  // Hiển thị thông báo Toast
  const showToast = useCallback((text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Lấy danh sách sản phẩm từ backend MongoDB
  const fetchProducts = useCallback(async (keyword?: string) => {
    try {
      setLoading(true);
      const url = keyword !== undefined
        ? `${apiUrl}/products?search=${encodeURIComponent(keyword)}`
        : `${apiUrl}/products`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data);
      } else {
        showToast(data.message || 'Không thể tải sản phẩm', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ backend: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, showToast]);

  // Tự động tải sản phẩm sau khi đăng nhập thành công
  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
    }
  }, [isLoggedIn, fetchProducts]);

  // Xử lý Đăng nhập
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
    } catch (err: any) {
      setLoginLoading(false);
      setLoginError('Lỗi kết nối máy chủ: ' + err.message);
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    setIsLoggedIn(false);
    setProducts([]);
    showToast('Đã đăng xuất', 'success');
  };

  // Mở khung cửa sổ THÊM sản phẩm
  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormName('');
    setFormPrice('');
    setFormSoluong('');
    setFormImage('');
    setFormError('');
    setModalVisible(true);
  };

  // Mở khung cửa sổ SỬA sản phẩm (điền sẵn dữ liệu cũ)
  const openEditModal = (product: Product) => {
    setModalMode('edit');
    setEditingId(product._id || null);
    setFormName(product.name);
    setFormPrice(String(product.price));
    setFormSoluong(String(product.soluong));
    setFormImage(product.image);
    setFormError('');
    setModalVisible(true);
  };

  // Đóng khung cửa sổ
  const closeModal = () => {
    if (!formSaving) {
      setModalVisible(false);
    }
  };

  // Chọn ảnh từ máy (Hoạt động cả trên Mobile và Web) - Yêu cầu 3
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setFormImage(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setFormImage(asset.uri);
        }
        setFormError('');
      }
    } catch (err: any) {
      setFormError('Không thể chọn ảnh từ thiết bị: ' + err.message);
    }
  };

  // Lưu Thêm hoặc Sửa sản phẩm
  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!formPrice.trim() || isNaN(Number(formPrice)) || Number(formPrice) < 0) {
      setFormError('Giá sản phẩm phải là số hợp lệ >= 0');
      return;
    }
    if (!formSoluong.trim() || isNaN(Number(formSoluong)) || Number(formSoluong) < 0) {
      setFormError('Số lượng phải là số hợp lệ >= 0');
      return;
    }
    if (!formImage.trim()) {
      setFormError('Vui lòng chọn hình ảnh hoặc nhập đường dẫn ảnh');
      return;
    }

    setFormError('');
    setFormSaving(true);

    try {
      const payload = {
        name: formName.trim(),
        price: Number(formPrice),
        soluong: Number(formSoluong),
        image: formImage.trim(),
      };

      let url = `${apiUrl}/products`;
      let method = 'POST';

      if (modalMode === 'edit' && editingId) {
        url = `${apiUrl}/products/${editingId}`;
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
            ? 'Đã thêm sản phẩm mới thành công!'
            : 'Đã lưu chỉnh sửa sản phẩm!',
          'success'
        );
        fetchProducts(search);
      } else {
        setFormError(data.message || 'Lưu thất bại');
      }
    } catch (err: any) {
      setFormSaving(false);
      setFormError('Lỗi gửi dữ liệu: ' + err.message);
    }
  };

  // Xử lý Xóa sản phẩm
  const handleDeleteProduct = (id?: string, name?: string) => {
    if (!id) return;

    const executeDelete = async () => {
      try {
        const res = await fetch(`${apiUrl}/products/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          showToast(`Đã xóa sản phẩm "${name}" thành công`, 'success');
          fetchProducts(search);
        } else {
          showToast(data.message || 'Xóa thất bại', 'error');
        }
      } catch (err: any) {
        showToast('Lỗi khi xóa: ' + err.message, 'error');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa "${name}"?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  // Nạp lại dữ liệu mẫu vào MongoDB
  const handleSeedData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/products/seed`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Đã nạp lại dữ liệu mẫu thành công!', 'success');
        fetchProducts();
      } else {
        showToast(data.message || 'Lỗi nạp dữ liệu', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Định dạng giá VNĐ
  const formatVND = (price: number) => {
    return Number(price || 0).toLocaleString('vi-VN') + ' ₫';
  };

  // Lọc và sắp xếp danh sách
  const filteredProducts = products
    .filter((p) => {
      if (filterStock === 'in_stock') return p.soluong > 0;
      if (filterStock === 'low_stock') return p.soluong <= 5;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0;
    });

  // =========================================================================
  // GIAO DIỆN 1: BẮT BUỘC ĐĂNG NHẬP KHI MỞ ỨNG DỤNG
  // =========================================================================
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
                <Text style={styles.loginTitle}>QUẢN TRỊ ADMIN</Text>
                <Text style={styles.loginSubtitle}>
                  Vui lòng đăng nhập để quản lý sản phẩm
                </Text>
              </View>

              {loginError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.errorText}>{loginError}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên đăng nhập</Text>
                <View style={styles.inputFieldWrapper}>
                  <Ionicons name="person-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập tên đăng nhập (admin)"
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
                    placeholder="Nhập mật khẩu (admin)"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.quickFillButton}
                onPress={() => {
                  setLoginUsername('admin');
                  setLoginPassword('admin');
                  setLoginError('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="flash-outline" size={15} color="#2563EB" />
                <Text style={styles.quickFillText}>Điền tài khoản mẫu (admin / admin)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, loginLoading && styles.btnDisabled]}
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

              {/* Tùy chỉnh URL API Backend */}
              <View style={styles.apiConfigToggleRow}>
                <TouchableOpacity
                  onPress={() => setShowConfig(!showConfig)}
                  style={styles.configToggleBtn}
                >
                  <Ionicons name="settings-outline" size={14} color="#6B7280" />
                  <Text style={styles.configToggleBtnText}>
                    {showConfig ? 'Ẩn cấu hình API URL' : 'Tùy chỉnh API URL Backend'}
                  </Text>
                </TouchableOpacity>

                {showConfig && (
                  <View style={styles.apiConfigBox}>
                    <Text style={styles.configLabel}>Địa chỉ API Backend:</Text>
                    <TextInput
                      style={styles.configInput}
                      value={apiUrl}
                      onChangeText={setApiUrl}
                      autoCapitalize="none"
                      placeholder="http://localhost:5000/api"
                    />
                    <Text style={styles.configNote}>
                      * Web: http://localhost:5000/api{'\n'}
                      * Điện thoại thật: Thay localhost bằng IP máy tính
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // GIAO DIỆN 2: MÀN HÌNH CHÍNH QUẢN TRỊ SẢN PHẨM (SAU KHI ĐĂNG NHẬP)
  // =========================================================================
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>QUẢN LÝ SẢN PHẨM</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.adminBadgeText}>Admin: {loginUsername}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
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

      {/* Thanh công cụ: Tìm kiếm & Thêm sản phẩm */}
      <View style={styles.toolbarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#6B7280" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên sản phẩm..."
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              fetchProducts(text);
            }}
          />
          {search ? (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                fetchProducts('');
              }}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Nút Thêm sản phẩm: MỞ KHUNG CỬA SỔ POPUP NGAY TẠI TRANG CHỦ */}
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Thêm sản phẩm</Text>
        </TouchableOpacity>
      </View>

      {/* Bộ lọc & Sắp xếp */}
      <View style={styles.filterRow}>
        <View style={styles.filterChipGroup}>
          <TouchableOpacity
            style={[styles.chip, filterStock === 'all' && styles.chipActive]}
            onPress={() => setFilterStock('all')}
          >
            <Text style={[styles.chipText, filterStock === 'all' && styles.chipTextActive]}>
              Tất cả ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStock === 'low_stock' && styles.chipActive]}
            onPress={() => setFilterStock('low_stock')}
          >
            <Text style={[styles.chipText, filterStock === 'low_stock' && styles.chipTextActive]}>
              Sắp hết (≤ 5)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, sortBy !== 'default' && styles.chipActive]}
            onPress={() => {
              if (sortBy === 'default') setSortBy('price_asc');
              else if (sortBy === 'price_asc') setSortBy('price_desc');
              else setSortBy('default');
            }}
          >
            <Text style={[styles.chipText, sortBy !== 'default' && styles.chipTextActive]}>
              {sortBy === 'price_asc'
                ? 'Giá: Tăng'
                : sortBy === 'price_desc'
                ? 'Giá: Giảm'
                : 'Sắp xếp giá'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.seedBtn} onPress={handleSeedData} activeOpacity={0.7}>
          <Ionicons name="refresh" size={14} color="#4B5563" />
          <Text style={styles.seedBtnText}>Nạp mẫu</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách sản phẩm */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingMsg}>Đang kết nối MongoDB...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Chưa có sản phẩm nào</Text>
          <Text style={styles.emptySubtitle}>
            {search ? 'Không tìm thấy sản phẩm phù hợp' : 'Danh mục trong MongoDB hiện đang trống'}
          </Text>
          <TouchableOpacity style={styles.seedActionBtn} onPress={handleSeedData}>
            <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.seedActionBtnText}>Nạp dữ liệu mẫu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={filteredProducts}
          keyExtractor={(item) => item._id || Math.random().toString()}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchProducts(search);
              }}
              colors={['#1E40AF']}
            />
          }
          renderItem={({ item }) => (
            <View style={[styles.productCard, { flex: 1 / numColumns }]}>
              <View style={styles.cardImageContainer}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.stockBadge,
                    item.soluong <= 5 ? styles.stockBadgeLow : styles.stockBadgeOk,
                  ]}
                >
                  <Text style={styles.stockBadgeText}>
                    {item.soluong > 0 ? `Kho: ${item.soluong}` : 'Hết hàng'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.cardPrice}>{formatVND(item.price)}</Text>
                <Text style={styles.cardQuantity}>
                  Số lượng: <Text style={{ fontWeight: 'bold' }}>{item.soluong}</Text>
                </Text>

                {/* Các nút Sửa & Xóa: Sửa sẽ mở ngay khung cửa sổ Popup */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionEditBtn}
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={16} color="#1E40AF" />
                    <Text style={styles.actionEditBtnText}>Sửa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionDeleteBtn}
                    onPress={() => handleDeleteProduct(item._id, item.name)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    <Text style={styles.actionDeleteBtnText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. KHUNG CỬA SỔ (MODAL DIALOG) THÊM & SỬA SẢN PHẨM TRỰC TIẾP TẠI TRANG CHỦ */}
      {/* ========================================================================= */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardContainer}
          >
            <View style={styles.modalWindow}>
              {/* Header của khung cửa sổ */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={modalMode === 'add' ? 'add-circle' : 'create'}
                    size={22}
                    color="#1E40AF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.modalTitle}>
                    {modalMode === 'add' ? 'Thêm Sản Phẩm Mới' : 'Chỉnh Sửa Sản Phẩm'}
                  </Text>
                </View>
                <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {formError ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color="#DC2626" />
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                {/* 1. Tên sản phẩm */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Tên sản phẩm (name) <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ví dụ: Tai nghe Sony WH-1000XM4"
                    value={formName}
                    onChangeText={setFormName}
                  />
                </View>

                {/* 2. Giá sản phẩm */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Giá sản phẩm (price - VNĐ) <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ví dụ: 5490000"
                    value={formPrice}
                    onChangeText={setFormPrice}
                    keyboardType="numeric"
                  />
                </View>

                {/* 3. Số lượng sản phẩm */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Số lượng trong kho (soluong) <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ví dụ: 10"
                    value={formSoluong}
                    onChangeText={setFormSoluong}
                    keyboardType="numeric"
                  />
                </View>

                {/* 4. Hình ảnh */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Hình ảnh sản phẩm (image) <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>

                  {/* Nút chọn ảnh từ thiết bị/web */}
                  <TouchableOpacity
                    style={styles.pickImageBtn}
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="image-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.pickImageBtnText}>
                      Chọn ảnh từ máy (Thiết bị/Web)
                    </Text>
                  </TouchableOpacity>

                  {/* Hoặc nhập URL */}
                  <TextInput
                    style={[styles.formInput, { marginTop: 8 }]}
                    placeholder="Hoặc dán link URL hình ảnh..."
                    value={formImage}
                    onChangeText={setFormImage}
                    autoCapitalize="none"
                  />

                  {/* Ảnh mẫu test nhanh */}
                  <View style={styles.sampleChipRow}>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>Mẫu test:</Text>
                    <TouchableOpacity
                      style={styles.sampleChip}
                      onPress={() =>
                        setFormImage(
                          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
                        )
                      }
                    >
                      <Text style={styles.sampleChipText}>Đồng hồ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sampleChip}
                      onPress={() =>
                        setFormImage(
                          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'
                        )
                      }
                    >
                      <Text style={styles.sampleChipText}>Kính mắt</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Preview ảnh */}
                  <View style={styles.imagePreviewBox}>
                    {formImage ? (
                      <View style={styles.previewImageWrapper}>
                        <Image
                          source={{ uri: formImage }}
                          style={styles.previewImage}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={styles.removeImageBtn}
                          onPress={() => setFormImage('')}
                        >
                          <Ionicons name="close-circle" size={24} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.noImagePlaceholder}>
                        <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                        <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>
                          Chưa có hình ảnh
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>

              {/* Nút hành động Lưu & Hủy */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={closeModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy bỏ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, formSaving && styles.btnDisabled]}
                  onPress={handleSaveProduct}
                  disabled={formSaving}
                  activeOpacity={0.8}
                >
                  {formSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalSaveBtnText}>
                        {modalMode === 'add' ? 'Lưu sản phẩm' : 'Lưu cập nhật'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 16,
  },
  quickFillText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginLeft: 4,
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
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  apiConfigToggleRow: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  configToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configToggleBtnText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  apiConfigBox: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
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
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  seedBtnText: {
    fontSize: 12,
    color: '#4B5563',
  },

  // Danh sách
  listContent: {
    padding: 10,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  stockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeOk: {
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
  },
  stockBadgeLow: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
  },
  stockBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardInfo: {
    padding: 14,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
    height: 42,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  cardQuantity: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  actionEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionEditBtnText: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionDeleteBtnText: {
    color: '#DC2626',
    fontSize: 13,
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
  seedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  seedActionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // =========================================================================
  // KHUNG CỬA SỔ (MODAL) THÊM / SỬA SẢN PHẨM
  // =========================================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalKeyboardContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
  },
  modalWindow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 480,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    height: 42,
    borderRadius: 8,
  },
  pickImageBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sampleChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  sampleChip: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sampleChipText: {
    fontSize: 12,
    color: '#3730A3',
    fontWeight: '500',
  },
  imagePreviewBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  previewImageWrapper: {
    position: 'relative',
    height: 160,
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  noImagePlaceholder: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1E40AF',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
