import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../constants/colors';

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (!confirmed) return;
      await logout();
      router.replace('/(auth)/login');
      return;
    }

    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        } 
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Admin Profile</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || 'Admin User'}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || 'N/A'}</Text>

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{user?.role ? user.role.toUpperCase() : 'ADMIN'}</Text>
        </Card>

        <Button title="Logout" onPress={handleLogout} variant="danger" style={styles.logoutBtn} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: { padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  content: { padding: 16 },
  card: { padding: 20 },
  label: { fontSize: 14, color: COLORS.textLight, marginBottom: 4, fontWeight: 'bold' },
  value: { fontSize: 18, color: COLORS.text, marginBottom: 16 },
  logoutBtn: { marginTop: 24 },
});
