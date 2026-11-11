import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../../services/api';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [soluong, setSoluong] = useState('');
  const [image, setImage] = useState('');
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tải chi tiết sản phẩm cần sửa
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      try {
        setFetching(true);
        const res = await apiService.getProduct(id);
        if (res.success && res.data) {
          setName(res.data.name || '');
          setPrice(String(res.data.price ?? ''));
          setSoluong(String(res.data.soluong ?? ''));
          setImage(res.data.image || '');
        } else {
          setErrorMsg(res.message || 'Không tìm thấy thông tin sản phẩm');
        }
      } catch (err: any) {
        setErrorMsg('Lỗi khi tải sản phẩm: ' + err.message);
      } finally {
        setFetching(false);
      }
    };

    loadProduct();
  }, [id]);

  // Chọn ảnh mới từ thiết bị
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
          setImage(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setImage(asset.uri);
        }
        setErrorMsg('');
      }
    } catch (err: any) {
      setErrorMsg('Không thể chọn ảnh: ' + err.message);
    }
  };

  // Cập nhật sản phẩm
  const handleUpdate = async () => {
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) < 0) {
      setErrorMsg('Giá sản phẩm phải là một số hợp lệ >= 0');
      return;
    }

    if (!soluong.trim() || isNaN(Number(soluong)) || Number(soluong) < 0) {
      setErrorMsg('Số lượng phải là một số nguyên hợp lệ >= 0');
      return;
    }

    if (!image.trim()) {
      setErrorMsg('Vui lòng chọn hình ảnh hoặc nhập link hình ảnh');
      return;
    }

    if (!id) {
      setErrorMsg('Không xác định được ID sản phẩm');
      return;
    }

    setErrorMsg('');
    setSaving(true);

    try {
      const res = await apiService.updateProduct(id, {
        name: name.trim(),
        price: Number(price),
        soluong: Number(soluong),
        image: image.trim(),
      });

      setSaving(false);

      if (res.success) {
        if (Platform.OS === 'web') {
          alert('Cập nhật sản phẩm thành công!');
          router.replace('/');
        } else {
          Alert.alert('Thành công', 'Đã lưu thay đổi vào MongoDB!', [
            { text: 'OK', onPress: () => router.replace('/') },
          ]);
        }
      } else {
        setErrorMsg(res.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      setSaving(false);
      setErrorMsg('Lỗi khi lưu dữ liệu: ' + err.message);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Đang tải thông tin sản phẩm...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Chỉnh Sửa Sản Phẩm</Text>
          <Text style={styles.formSubtitle}>ID: {id}</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* 1. Tên sản phẩm */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tên sản phẩm (name) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên sản phẩm"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* 2. Giá sản phẩm */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Giá bán (price) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập giá"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          {/* 3. Số lượng */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Số lượng trong kho (soluong) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số lượng"
              value={soluong}
              onChangeText={setSoluong}
              keyboardType="numeric"
            />
          </View>

          {/* 4. Hình ảnh */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Hình ảnh (image) <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.imageActionsRow}>
              <TouchableOpacity
                style={styles.pickImageBtn}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="image-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.pickImageBtnText}>Đổi ảnh khác từ máy</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Hoặc dán URL ảnh mới..."
              value={image}
              onChangeText={setImage}
              autoCapitalize="none"
            />

            {/* Xem trước ảnh */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Ảnh hiện tại:</Text>
              {image ? (
                <View style={styles.previewWrapper}>
                  <Image
                    source={{ uri: image }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setImage('')}
                  >
                    <Ionicons name="close-circle" size={24} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.noImageText}>Chưa có ảnh</Text>
                </View>
              )}
            </View>
          </View>

          {/* Nút hành động */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Quay lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleUpdate}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Lưu cập nhật</Text>
                </>
              )}
            </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 600,
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    marginBottom: 16,
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
  required: {
    color: '#DC2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  imageActionsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  pickImageBtn: {
    flex: 1,
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
  previewContainer: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  previewWrapper: {
    position: 'relative',
    height: 180,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
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
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  noImageText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1E40AF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
