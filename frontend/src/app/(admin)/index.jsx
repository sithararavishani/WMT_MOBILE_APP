import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert, StatusBar, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { roomService } from '../../services/roomService';
import { residentService } from '../../services/residentService';
import { paymentService } from '../../services/paymentService';
import { visitorService } from '../../services/visitorService';
import { Card } from '../../components/common/Card';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown, ZoomIn, ZoomInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stats, setStats] = useState({ 
    totalRooms: 0, 
    availableRooms: 0, 
    occupiedRooms: 0, 
    totalResidents: 0, 
    pendingVisitors: 0, 
    monthlyRevenue: 0, 
    pendingAmount: 0, 
    overdueAmount: 0 
  });
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) return;
      await logout();
      router.replace('/(auth)/login');
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } }
    ]);
  };

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [roomsRes, residentsRes, visitorsRes, paymentsRes] = await Promise.all([
        roomService.getStatistics(), residentService.getAll(), visitorService.getStatistics(), paymentService.getStatistics()
      ]);
      setStats({
        totalRooms: roomsRes.data.data?.totalRooms || 0,
        availableRooms: roomsRes.data.data?.availableRooms || 0,
        occupiedRooms: roomsRes.data.data?.occupiedRooms || 0,
        totalResidents: residentsRes.data?.count || 0,
        pendingVisitors: visitorsRes.data.data?.totalRequests || 0,
        monthlyRevenue: paymentsRes.data.data?.totalCollected || 0,
        pendingAmount: paymentsRes.data.data?.pendingAmount || 0,
        overdueAmount: paymentsRes.data.data?.overdueAmount || 0,
      });
    } catch (error) { console.error(error); }
    setRefreshing(false);
  };

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  const AdminStatCard = ({ title, value, icon, color, delay }) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.statBox}>
      <View style={[styles.statIconCircle, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View>
        <Text style={styles.statValueText}>{value}</Text>
        <Text style={styles.statLabelText}>{title}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>HostelHub</Text>
              <Text style={styles.headerSubtitle}>ADMIN COMMAND CENTER</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIconBtn}>
               <MaterialCommunityIcons name="power" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
          
          <Animated.View entering={ZoomIn.delay(400).duration(800)}>
            <Card style={styles.revenueCard}>
               <Text style={styles.revLabel}>TOTAL REVENUE COLLECTED</Text>
               <Text style={styles.revValue}>LKR {stats.monthlyRevenue.toLocaleString()}</Text>
               <View style={styles.revDivider} />
               <View style={styles.revFooter}>
                  <View><Text style={styles.revFootLabel}>PENDING</Text><Text style={[styles.revFootVal, { color: COLORS.warning }]}>LKR {stats.pendingAmount.toLocaleString()}</Text></View>
                  <View><Text style={styles.revFootLabel}>OVERDUE</Text><Text style={[styles.revFootVal, { color: COLORS.error }]}>LKR {stats.overdueAmount.toLocaleString()}</Text></View>
               </View>
            </Card>
          </Animated.View>
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Key Statistics</Text>
          <View style={styles.statsGrid}>
             <AdminStatCard title="Total Rooms" value={stats.totalRooms} icon="office-building" color={COLORS.primary} delay={600} />
             <AdminStatCard title="Residents" value={stats.totalResidents} icon="account-group" color={COLORS.info} delay={700} />
             <AdminStatCard title="Available" value={stats.availableRooms} icon="check-circle-outline" color={COLORS.success} delay={800} />
             <AdminStatCard title="Visitors" value={stats.pendingVisitors} icon="human-greeting" color={COLORS.warning} delay={900} />
          </View>

          <Text style={styles.sectionTitle}>Management Modules</Text>
          <View style={styles.menuGrid}>
             {[
               { name: 'Rooms', icon: 'door-open', color: '#6366F1', route: '/(admin)/rooms' },
               { name: 'Residents', icon: 'account-multiple', color: '#10B981', route: '/(admin)/residents' },
               { name: 'Payments', icon: 'cash-multiple', color: '#F59E0B', route: '/(admin)/payments' },
               { name: 'Complaints', icon: 'clipboard-alert', color: '#EC4899', route: '/(admin)/complaints' },
               { name: 'Attendance', icon: 'calendar-check', color: '#8B5CF6', route: '/(admin)/attendance' },
               { name: 'Cleaning', icon: 'broom', color: '#06B6D4', route: '/(admin)/cleaning' },
               { name: 'Visitors', icon: 'account-clock', color: '#F43F5E', route: '/(admin)/visitors' },
               { name: 'Food', icon: 'silverware-fork-knife', color: '#3B82F6', route: '/(admin)/food' }
             ].map((item, index) => (
               <Animated.View 
                 key={item.name}
                 entering={FadeInDown.delay(800 + (index * 80)).duration(500)}
                 style={styles.menuItemWrapper}
               >
                 <TouchableOpacity style={styles.menuItem} onPress={() => router.push(item.route)}>
                   <View style={[styles.menuIconBox, { backgroundColor: item.color + '15' }]}><MaterialCommunityIcons name={item.icon} size={28} color={item.color} /></View>
                   <Text style={styles.menuLabel}>{item.name}</Text>
                 </TouchableOpacity>
               </Animated.View>
             ))}
          </View>

          <Animated.View entering={FadeInUp.delay(1500)}>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/(admin)/profile')}>
              <MaterialCommunityIcons name="cog-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.settingsText}>Administrative Settings</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    paddingBottom: 30, 
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 10, color: COLORS.primary, letterSpacing: 3, fontWeight: 'bold' },
  logoutIconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  
  revenueCard: { 
    backgroundColor: COLORS.background, 
    borderRadius: 28, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4
  },
  revLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: 'bold', letterSpacing: 1 },
  revValue: { fontSize: 30, fontWeight: 'bold', color: COLORS.text, marginTop: 10 },
  revDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  revFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  revFootLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: 'bold' },
  revFootVal: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },

  content: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, marginTop: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  statBox: { width: (width - 60) / 2, backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border },
  statIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValueText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statLabelText: { fontSize: 11, color: COLORS.textLight },

  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 30 },
  menuItemWrapper: { width: (width - 64) / 2 },
  menuItem: { 
    width: '100%', 
    backgroundColor: COLORS.surface, 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  menuIconBox: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },

  settingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  settingsText: { color: COLORS.textLight, fontSize: 14, fontWeight: 'bold' },
});
