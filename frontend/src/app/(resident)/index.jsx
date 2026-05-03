import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert, StatusBar, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { residentService } from '../../services/residentService';
import { roomService } from '../../services/roomService';
import { paymentService } from '../../services/paymentService';
import { complaintService } from '../../services/complaintService';
import { Card } from '../../components/common/Card';
import { COLORS } from '../../constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown, Layout, SlideInRight, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ResidentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [resident, setResident] = useState(null);
  const [room, setRoom] = useState(null);
  const [dueAmount, setDueAmount] = useState(0);
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const residentsRes = await residentService.getAll();
      const residentData = residentsRes.data.data.find(r => r.email === user?.email);
      setResident(residentData);
      if (residentData?.roomId) {
        const roomId = residentData.roomId._id || residentData.roomId;
        const roomRes = await roomService.getRoomById(roomId);
        setRoom(roomRes.data.data);
      }
      if (residentData) {
        const paymentsRes = await paymentService.getPaymentsByResident(residentData._id);
        const unpaid = paymentsRes.data.data.filter(p => p.status !== 'paid');
        const due = unpaid.reduce((s, p) => s + p.netAmount, 0);
        setDueAmount(due);
        const complaintsRes = await complaintService.getComplaintsByResident(residentData._id);
        setPendingComplaints(complaintsRes.data.data.filter(c => c.status !== 'resolved').length);
      }
    } catch (error) { console.error(error); }
    setRefreshing(false);
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleLogout = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to log out of HostelHub?');
      if (!confirmed) return;
      await logout();
      router.replace('/(auth)/login');
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to log out of HostelHub?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } }
    ]);
  };

  const StatWidget = ({ title, value, icon, color, delay }) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.statWidget}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View>
        <Text style={styles.statWidgetValue}>{value}</Text>
        <Text style={styles.statWidgetLabel}>{title}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Animated Header */}
        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Hello, {user?.name?.split(' ')[0] || 'Resident'}</Text>
              <Text style={styles.brandText}>HOSTELHUB ELITE</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIconBtn}>
              <MaterialCommunityIcons name="logout" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerStats}>
            <StatWidget title="Pending" value={pendingComplaints} icon="clipboard-text-outline" color={COLORS.error} delay={400} />
            <View style={styles.statDivider} />
            <StatWidget title="Room" value={room?.roomNumber || 'N/A'} icon="door-open" color={COLORS.primary} delay={600} />
          </View>
        </Animated.View>

        <View style={styles.content}>
          {/* Book Now Banner - Only shows if no room assigned */}
          {!resident?.roomId && (
            <Animated.View entering={ZoomIn.delay(200).duration(800)}>
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={() => router.push('/(resident)/rooms')}
                style={styles.bookNowBanner}
              >
                <View style={styles.bookNowContent}>
                  <View style={styles.bookNowIcon}>
                    <MaterialCommunityIcons name="home-plus" size={32} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookNowTitle}>No Room Assigned</Text>
                    <Text style={styles.bookNowSubtitle}>Browse and book your perfect room now!</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Financial Summary with ZoomIn Animation */}
          <Animated.View entering={ZoomIn.delay(300).duration(800)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial Summary</Text>
              <TouchableOpacity onPress={() => router.push('/(resident)/payments')}>
                <Text style={styles.seeAll}>Details ›</Text>
              </TouchableOpacity>
            </View>

            <Card style={styles.glassCard}>
              <View style={styles.paymentInfo}>
                <View>
                  <Text style={styles.glassLabel}>TOTAL BALANCE DUE</Text>
                  <Text style={[styles.glassValue, { color: dueAmount > 0 ? COLORS.warning : COLORS.success }]}>
                    LKR {dueAmount.toLocaleString()}
                  </Text>
                </View>
                <Animated.View entering={ZoomIn.delay(1000)} style={[styles.statusIndicator, { backgroundColor: dueAmount > 0 ? COLORS.error + '15' : COLORS.success + '15' }]}>
                  <MaterialCommunityIcons 
                    name={dueAmount > 0 ? "clock-outline" : "check-decagram"} 
                    size={32} 
                    color={dueAmount > 0 ? COLORS.error : COLORS.success} 
                  />
                </Animated.View>
              </View>
              
              <View style={styles.glassActions}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  style={[styles.glassBtn, { backgroundColor: COLORS.primary }]} 
                  onPress={() => router.push('/(resident)/payments')}
                >
                  <Text style={styles.glassBtnText}>PROCEED TO PAY</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </Animated.View>

          {/* Quick Actions Grid with Staggered Entrance */}
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.actionGrid}>
             {[
               { name: 'Attendance', icon: 'calendar-check', color: '#6366F1', route: '/(resident)/attendance' },
               { name: 'Daily Food', icon: 'silverware-fork-knife', color: '#EC4899', route: '/(resident)/food' },
               { name: 'Cleaning', icon: 'broom', color: '#10B981', route: '/(resident)/cleaning' },
               { name: 'Complaints', icon: 'alert-circle-outline', color: '#F59E0B', route: '/(resident)/complaints' }
             ].map((item, index) => (
               <Animated.View 
                 key={item.name}
                 entering={FadeInDown.delay(500 + (index * 100)).duration(600)}
                 style={styles.actionCardWrapper}
               >
                 <TouchableOpacity style={styles.actionCard} onPress={() => router.push(item.route)}>
                   <View style={[styles.actionIcon, { backgroundColor: item.color + '15' }]}>
                     <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                   </View>
                   <Text style={styles.actionLabel}>{item.name}</Text>
                 </TouchableOpacity>
               </Animated.View>
             ))}
          </View>

          {/* Settings & Logout Section */}
          <Animated.View entering={FadeInUp.delay(1000)} style={styles.footerSection}>
            <TouchableOpacity style={styles.footerItem} onPress={() => router.push('/(resident)/profile')}>
              <MaterialCommunityIcons name="account-cog-outline" size={22} color={COLORS.textLight} />
              <Text style={styles.footerText}>Profile Settings</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity style={styles.footerItem} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout-variant" size={22} color={COLORS.error} />
              <Text style={[styles.footerText, { color: COLORS.error }]}>Sign Out</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  brandText: { fontSize: 10, color: COLORS.primary, letterSpacing: 2, fontWeight: 'bold', marginTop: 4 },
  logoutIconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  
  headerStats: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.background, 
    borderRadius: 20, 
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  statWidget: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statWidgetValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statWidgetLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  statDivider: { width: 1, height: 25, backgroundColor: COLORS.border, marginHorizontal: 15 },

  bookNowBanner: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  bookNowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  bookNowIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookNowTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bookNowSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },

  content: { padding: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  seeAll: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },

  glassCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 28, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    marginBottom: 35,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4
  },
  paymentInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  glassLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: 'bold', letterSpacing: 1 },
  glassValue: { fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  statusIndicator: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  glassActions: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 20 },
  glassBtn: { height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  glassBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 35 },
  actionCardWrapper: { width: (width - 64) / 2 },
  actionCard: { 
    width: '100%', 
    backgroundColor: COLORS.surface, 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  actionIcon: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },

  footerSection: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 8, borderWidth: 1, borderColor: COLORS.border },
  footerItem: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 15 },
  footerText: { flex: 1, fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  itemDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 }
});