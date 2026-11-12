import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Lecturer } from '../types/lecturer';

interface LecturerFormModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  initialData?: Lecturer | null;
  onClose: () => void;
  onSave: (payload: Omit<Lecturer, '_id' | 'IDGV'>) => Promise<void>;
  saving: boolean;
  serverError?: string;
}

export default function LecturerFormModal({
  visible,
  mode,
  initialData,
  onClose,
  onSave,
  saving,
  serverError,
}: LecturerFormModalProps) {
  const idgv =
    mode === 'edit' && initialData ? initialData.IDGV || '' : ''
  const [fullname, setFullname] = useState(
    mode === 'edit' && initialData ? initialData.Fullname || '' : ''
  );
  const [sumClass, setSumClass] = useState(
    mode === 'edit' && initialData ? String(initialData.SumClass ?? '') : ''
  );
  const [image, setImage] = useState(
    mode === 'edit' && initialData ? initialData.Image || '' : ''
  );
  const [localError, setLocalError] = useState('');

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
        setLocalError('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi không xác định';
      setLocalError('Không thể chọn ảnh: ' + message);
    }
  };

  const handleSave = () => {
    if (!fullname.trim()) {
      setLocalError('Vui lòng nhập họ và tên giảng viên');
      return;
    }
    if (
      !sumClass.trim() ||
      !Number.isInteger(Number(sumClass)) ||
      Number(sumClass) < 0
    ) {
      setLocalError('Tổng số lớp phải là số nguyên >= 0');
      return;
    }
    if (!image.trim()) {
      setLocalError('Vui lòng chọn hình ảnh hoặc dán link ảnh');
      return;
    }

    setLocalError('');
    onSave({
      Fullname: fullname.trim(),
      SumClass: Number(sumClass),
      Image: image.trim(),
    });
  };

  const errorMessage = localError || serverError;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalWindow}>
            {/* Header khung cửa sổ */}
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleRow}>
                <Ionicons
                  name={mode === 'add' ? 'add-circle' : 'create'}
                  size={22}
                  color="#1E40AF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.modalTitle}>
                  {mode === 'add' ? 'Thêm Giảng Viên' : 'Chỉnh Sửa Giảng Viên'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                disabled={saving}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Fullname */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Họ và tên (Fullname) <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập họ và tên giảng viên..."
                  value={fullname}
                  onChangeText={setFullname}
                />
              </View>

              {/* SumClass */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Tổng số lớp (SumClass) <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập tổng số lớp..."
                  value={sumClass}
                  onChangeText={setSumClass}
                  keyboardType="numeric"
                />
              </View>

              {/* Image */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Hình ảnh (Image) <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>

                <TouchableOpacity
                  style={styles.pickImageBtn}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.pickImageBtnText}>Chọn ảnh từ máy</Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.formInput, { marginTop: 8 }]}
                  placeholder="Hoặc dán trực tiếp đường dẫn URL hình ảnh..."
                  value={image}
                  onChangeText={setImage}
                  autoCapitalize="none"
                />

                {/* Khung xem trước ảnh */}
                <View style={styles.imagePreviewBox}>
                  {image ? (
                    <View style={styles.previewImageWrapper}>
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
                      <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                      <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>
                        Chưa có hình ảnh được chọn
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Footer hành động */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>
                      {mode === 'add' ? 'Lưu giảng viên' : 'Lưu cập nhật'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 560,
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 460,
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
  formGroup: {
    marginBottom: 16,
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
  readOnlyInput: {
    justifyContent: 'center',
  },
  readOnlyText: {
    color: '#6B7280',
    fontSize: 14,
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
  cancelBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1E40AF',
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
