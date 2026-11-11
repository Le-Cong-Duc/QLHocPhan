import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [soluong, setSoluong] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Chọn ảnh từ máy (Hoạt động cả trên Mobile & Web) - Yêu cầu 3 (0.5 điểm)
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
      setErrorMsg('Không thể chọn ảnh từ thiết bị: ' + err.message);
    }
  };

  // Nạp ảnh mẫu nhanh để test
  const handleQuickImage = (sampleUrl: string) => {
    setImage(sampleUrl);
    setErrorMsg('');
  };

  // Xử lý Thêm sản phẩm
  const handleSave = async () => {
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

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await apiService.createProduct({
        name: name.trim(),
        price: Number(price),
        soluong: Number(soluong),
        image: image.trim(),
      });

      setLoading(false);

      if (res.success) {
        if (Platform.OS === 'web') {
          alert('Thêm sản phẩm thành công!');
          router.replace('/');
        } else {
          Alert.alert('Thành công', 'Đã thêm sản phẩm mới vào MongoDB!', [
            { text: 'OK', onPress: () => router.replace('/') },
          ]);
        }
      } else {
        setErrorMsg(res.message || 'Thêm sản phẩm thất bại');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Lỗi khi gửi dữ liệu: ' + err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nhập Thông Tin Sản Phẩm</Text>
          <Text style={styles.formSubtitle}>
            Các trường bắt buộc: name, price, soluong, image
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* 1. Tên sản phẩm (name) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tên sản phẩm (name) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Bàn phím cơ Akko 3087"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* 2. Giá sản phẩm (price) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Giá bán (price) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 1250000"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          {/* 3. Số lượng (soluong) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Số lượng trong kho (soluong) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 25"
              value={soluong}
              onChangeText={setSoluong}
              keyboardType="numeric"
            />
          </View>

          {/* 4. Hình ảnh (image) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Hình ảnh sản phẩm (image) <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.imageActionsRow}>
              <TouchableOpacity
                style={styles.pickImageBtn}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="image-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.pickImageBtnText}>Chọn ảnh từ máy (Thiết bị/Web)</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Hoặc dán trực tiếp đường dẫn URL hình ảnh..."
              value={image}
              onChangeText={setImage}
              autoCapitalize="none"
            />

            {/* Ảnh mẫu có sẵn để điền nhanh */}
            <View style={styles.sampleImagesRow}>
              <Text style={styles.sampleLabel}>Ảnh mẫu test:</Text>
              <TouchableOpacity
                style={styles.sampleChip}
                onPress={() =>
                  handleQuickImage(
                    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
                  )
                }
              >
                <Text style={styles.sampleChipText}>Đồng hồ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sampleChip}
                onPress={() =>
                  handleQuickImage(
                    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'
                  )
                }
              >
                <Text style={styles.sampleChipText}>Kính mắt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sampleChip}
                onPress={() =>
                  handleQuickImage(
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'
                  )
                }
              >
                <Text style={styles.sampleChipText}>Vòng tay</Text>
              </TouchableOpacity>
            </View>

            {/* Xem trước hình ảnh */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Xem trước hình ảnh:</Text>
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
                  <Text style={styles.noImageText}>Chưa có hình ảnh được chọn</Text>
                </View>
              )}
            </View>
          </View>

          {/* Nút thao tác: Lưu & Hủy */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.btnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Lưu sản phẩm</Text>
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
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
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
  sampleImagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  sampleLabel: {
    fontSize: 12,
    color: '#6B7280',
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
