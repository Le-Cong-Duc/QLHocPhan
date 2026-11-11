import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1E40AF', // Blue 800
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: '#F3F4F6',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Quản Lý Sản Phẩm (Admin)',
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              title: 'Đăng Nhập Quản Trị',
            }}
          />
          <Stack.Screen
            name="add"
            options={{
              title: 'Thêm Sản Phẩm Mới',
            }}
          />
          <Stack.Screen
            name="edit/[id]"
            options={{
              title: 'Chỉnh Sửa Sản Phẩm',
            }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
