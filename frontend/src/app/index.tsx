import React, { useState, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { Product } from '../types/product';
import { useAuth } from '../context/AuthContext';

export default function ProductListScreen() {
  const { width } = useWindowDimensions();
  const { isLoggedIn, user, logout } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Responsive: Trên màn hình lớn (web) hiển thị 3 cột, máy tính bảng 2 cột, điện thoại 1 cột
  const numColumns = width > 1024 ? 3 : width > 640 ? 2 : 1;

  const showFeedback = useCallback((text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  }, []);

  // Tải danh sách sản phẩm từ backend
  const fetchProducts = useCallback(async (keyword?: string) => {
    try {
      setLoading(true);
      const res = await apiService.getProducts(keyword !== undefined ? keyword : search);
      if (res.success && res.data) {
        setProducts(res.data);
      } else {
        showFeedback(res.message || 'Không thể lấy dữ liệu sản phẩm', 'error');
      }
    } catch (err: any) {
      showFeedback('Lỗi kết nối máy chủ: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, showFeedback]);

  // Reload mỗi khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Xử lý Xóa sản phẩm (Yêu cầu 2: 1.5 điểm)
  const handleDelete = (id?: string, name?: string) => {
    if (!id) return;

    const confirmDelete = async () => {
      try {
        const res = await apiService.deleteProduct(id);
        if (res.success) {
          showFeedback(`Đã xóa sản phẩm "${name || ''}" thành công`, 'success');
          fetchProducts();
        } else {
          showFeedback(res.message || 'Xóa sản phẩm thất bại', 'error');
        }
      } catch (err: any) {
        showFeedback('Lỗi khi xóa: ' + err.message, 'error');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xóa', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  // Khôi phục lại dữ liệu mẫu
  const handleSeedData = async () => {
    try {
      setLoading(true);
      const res = await apiService.seedProducts();
      if (res.success) {
        showFeedback('Đã nạp lại dữ liệu mẫu thành công!', 'success');
        fetchProducts();
      } else {
        showFeedback(res.message || 'Lỗi khi nạp dữ liệu mẫu', 'error');
      }
    } catch (err: any) {
      showFeedback('Lỗi: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Định dạng giá tiền VND
  const formatVND = (price: number) => {
    return Number(price || 0).toLocaleString('vi-VN') + ' ₫';
  };

  // Lọc và sắp xếp sản phẩm
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

  // Render từng Card sản phẩm
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={[styles.card, { flex: 1 / numColumns }]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View
          style={[
            styles.stockBadge,
            item.soluong <= 5 ? styles.stockBadgeLow : styles.stockBadgeNormal,
          ]}
        >
          <Text style={styles.stockBadgeText}>
            {item.soluong > 0 ? `Kho: ${item.soluong}` : 'Hết hàng'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>{formatVND(item.price)}</Text>
        <Text style={styles.productQuantity}>
          Số lượng tồn: <Text style={{ fontWeight: 'bold' }}>{item.soluong}</Text>
        </Text>

        {/* Nút Sửa & Xóa (Yêu cầu đề bài) */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push({ pathname: '/edit/[id]', params: { id: item._id } })}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color="#1E40AF" />
            <Text style={styles.editBtnText}>Sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item._id, item.name)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Banner Thông tin đăng nhập */}
      <View style={styles.topBar}>
        <View style={styles.userInfo}>
          <Ionicons
            name={isLoggedIn ? 'person-circle' : 'person-circle-outline'}
            size={24}
            color={isLoggedIn ? '#16A34A' : '#6B7280'}
          />
          <Text style={styles.userText}>
            {isLoggedIn ? `Admin: ${user?.username || 'admin'}` : 'Chưa đăng nhập'}
          </Text>
        </View>
        {isLoggedIn ? (
          <TouchableOpacity style={styles.authBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={16} color="#DC2626" />
            <Text style={styles.authBtnTextLogout}>Đăng xuất</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/login')}>
            <Ionicons name="log-in-outline" size={16} color="#1E40AF" />
            <Text style={styles.authBtnTextLogin}>Đăng nhập</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Thông báo Feedback */}
      {statusMessage && (
        <View
          style={[
            styles.feedbackBox,
            statusMessage.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
          ]}
        >
          <Ionicons
            name={statusMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={statusMessage.type === 'success' ? '#16A34A' : '#DC2626'}
          />
          <Text
            style={[
              styles.feedbackText,
              { color: statusMessage.type === 'success' ? '#15803D' : '#B91C1C' },
            ]}
          >
            {statusMessage.text}
          </Text>
        </View>
      )}

      {/* Thanh công cụ: Tìm kiếm & Thêm sản phẩm */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
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

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Thêm sản phẩm</Text>
        </TouchableOpacity>
      </View>

      {/* Bộ lọc nâng cao & Thống kê */}
      <View style={styles.filterBar}>
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={[styles.filterChip, filterStock === 'all' && styles.filterChipActive]}
            onPress={() => setFilterStock('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterStock === 'all' && styles.filterChipTextActive,
              ]}
            >
              Tất cả ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterStock === 'low_stock' && styles.filterChipActive]}
            onPress={() => setFilterStock('low_stock')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterStock === 'low_stock' && styles.filterChipTextActive,
              ]}
            >
              Sắp hết (≤ 5)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, sortBy !== 'default' && styles.filterChipActive]}
            onPress={() => {
              if (sortBy === 'default') setSortBy('price_asc');
              else if (sortBy === 'price_asc') setSortBy('price_desc');
              else setSortBy('default');
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                sortBy !== 'default' && styles.filterChipTextActive,
              ]}
            >
              {sortBy === 'price_asc'
                ? 'Giá: Tăng'
                : sortBy === 'price_desc'
                ? 'Giá: Giảm'
                : 'Sắp xếp giá'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sortGroup}>
          <TouchableOpacity
            style={styles.seedBtn}
            onPress={handleSeedData}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={14} color="#4B5563" />
            <Text style={styles.seedBtnText}>Nạp mẫu</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danh sách sản phẩm */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Đang tải dữ liệu từ MongoDB...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Chưa có sản phẩm nào</Text>
          <Text style={styles.emptySubtitle}>
            {search ? 'Không tìm thấy sản phẩm phù hợp với từ khóa' : 'Kho hàng của bạn hiện đang trống'}
          </Text>
          <TouchableOpacity style={styles.seedActionBtn} onPress={handleSeedData}>
            <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.seedActionBtnText}>Nạp dữ liệu mẫu vào MongoDB</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={numColumns} // Thay đổi key khi số cột đổi để force re-render
          data={filteredProducts}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderProductItem}
          numColumns={numColumns}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E40AF']} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 6,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  authBtnTextLogin: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
    marginLeft: 4,
  },
  authBtnTextLogout: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 4,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  feedbackError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  feedbackText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 10,
  },
  searchWrapper: {
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
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#1E40AF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sortGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
  listContainer: {
    padding: 10,
  },
  card: {
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
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  productImage: {
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
  stockBadgeNormal: {
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
  cardContent: {
    padding: 14,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
    height: 42,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  editBtn: {
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
  editBtnText: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
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
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
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
});
