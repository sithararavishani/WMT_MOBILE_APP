import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, StatusBar, Platform } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { TextInput, ActivityIndicator } from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
import { residentService } from "../../services/residentService";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { COLORS } from "../../constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    course: "",
    year: "1",
    nic: "",
    guardianName: "",
    guardianPhone: "",
    permanentAddress: "",
  });

  useFocusEffect(
    useCallback(() => {
      fetchResident();
    }, [user]),
  );

  const fetchResident = async () => {
    if (!user) return;
    try {
      const res = await residentService.getAll();
      const residentData = res.data.data.find((r) => r.email === user.email);
      setResident(residentData);

      if (residentData) {
        setFormData({
          name: residentData.name || "",
          phone: residentData.phone || "",
          course: residentData.course || "",
          year: residentData.year ? residentData.year.toString() : "1",
          nic: residentData.nic || "",
          guardianName: residentData.guardianName || "",
          guardianPhone: residentData.guardianPhone || "",
          permanentAddress: residentData.permanentAddress || "",
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  async function handleSave() {
    if (!formData.name || !formData.phone || !formData.nic || !formData.course || !formData.guardianName || !formData.guardianPhone) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone) || !phoneRegex.test(formData.guardianPhone)) {
      Alert.alert("Validation Error", "Both phone numbers must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData, year: parseInt(formData.year) || 1 };
      await residentService.updateMyProfile(payload);
      Alert.alert("Success", "Profile updated!");
      setEditing(false);
      fetchResident();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (!confirmed) return;
      await logout();
      router.replace('/(auth)/login');
      return;
    }

    Alert.alert("Confirm Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Profile</Text>
        <TouchableOpacity
          onPress={() => {
            if (editing) fetchResident();
            setEditing(!editing);
          }}
          style={[styles.editBtn, editing && { backgroundColor: COLORS.error + "20" }]}
        >
          <Text style={[styles.editBtnText, editing && { color: COLORS.error }]}>{editing ? "Cancel" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(600)} style={styles.profileTop}>
          <View style={styles.avatarWrapper}>
            <Animated.View entering={ZoomIn.delay(300)} style={styles.avatarInner}>
              <Text style={styles.avatarText}>{(user?.name || "R").charAt(0)}</Text>
            </Animated.View>
            <TouchableOpacity style={styles.cameraIcon}>
              <MaterialCommunityIcons name="camera" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{formData.name || user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </Animated.View>

        {editing ? (
          <Animated.View entering={FadeInDown} style={styles.formSection}>
            <Text style={styles.sectionTitle}>EDIT INFORMATION</Text>

            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: COLORS.primary, outline: COLORS.border } }}
              textColor={COLORS.text}
            />
            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              theme={{ colors: { primary: COLORS.primary, outline: COLORS.border } }}
              textColor={COLORS.text}
            />
            <TextInput
              label="NIC Number"
              value={formData.nic}
              onChangeText={(t) => setFormData({ ...formData, nic: t })}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: COLORS.primary, outline: COLORS.border } }}
              textColor={COLORS.text}
            />

            <Text style={styles.subHeader}>ACADEMIC & RESIDENCY</Text>
            <TextInput
              label="Course of Study"
              value={formData.course}
              onChangeText={(t) => setFormData({ ...formData, course: t })}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: COLORS.primary, outline: COLORS.border } }}
              textColor={COLORS.text}
            />
            <TextInput
              label="Year (1-5)"
              value={formData.year}
              onChangeText={(t) => setFormData({ ...formData, year: t })}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              theme={{ colors: { primary: COLORS.primary, outline: COLORS.border } }}
              textColor={COLORS.text}
            />
            <TextInput
              label="Permanent Address"
              value={formData.permanentAddress}
              onChangeText={(t) => setFormData({ ...formData, permanentAddress: t })}
              mode="outlined"
              style={[styles.input, { height: 100 }]}
              multiline
              theme={{ colors: { primary: COLORS.primary, outline: COLORS.border } }}
              textColor={COLORS.text}
            />

            <Text style={styles.subHeader}>EMERGENCY CONTACT</Text>
            <TextInput
              label="Guardian Name"
              value={formData.guardianName}
              onChangeText={(t) => setFormData({ ...formData, guardianName: t })}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: COLORS.primary, outline: COLORS.border } }}
              textColor={COLORS.text}
            />
            <TextInput
              label="Guardian Phone"
              value={formData.guardianPhone}
              onChangeText={(t) => setFormData({ ...formData, guardianPhone: t })}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              theme={{ colors: { primary: COLORS.primary, outline: COLORS.border } }}
              textColor={COLORS.text}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.textDark} /> : <Text style={styles.saveBtnText}>SAVE PROFILE</Text>}
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.infoSection}>
            <Animated.View entering={FadeInDown.delay(200)}>
              <Card style={styles.infoCard}>
                <Text style={styles.cardTitle}>Academic Records</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Course</Text>
                  <Text style={styles.infoValue}>{resident?.course || "N/A"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Level</Text>
                  <Text style={styles.infoValue}>Year {resident?.year || "1"}</Text>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)}>
              <Card style={styles.infoCard}>
                <Text style={styles.cardTitle}>Room Placement</Text>
                {resident?.roomId ? (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Room ID</Text>
                      <Text style={[styles.infoValue, { color: COLORS.primary }]}>{resident.roomId.roomNumber}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Wing/Type</Text>
                      <Text style={styles.infoValue}>{resident.roomId.roomType}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.noDataText}>No room assigned yet.</Text>
                )}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600)}>
              <Card style={styles.infoCard}>
                <Text style={styles.cardTitle}>Emergency Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Guardian</Text>
                  <Text style={styles.infoValue}>{resident?.guardianName || "N/A"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contact</Text>
                  <Text style={styles.infoValue}>{resident?.guardianPhone || "N/A"}</Text>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(800)}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
                <Text style={styles.logoutBtnText}>Sign Out from HostelHub</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text },
  backBtn: { padding: 4 },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editBtnText: { color: COLORS.primary, fontWeight: "bold", fontSize: 13 },

  scrollContent: { paddingBottom: 120 },
  profileTop: { alignItems: "center", marginTop: 20, marginBottom: 30 },
  avatarWrapper: { position: "relative", marginBottom: 20 },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  avatarText: { fontSize: 40, fontWeight: "bold", color: COLORS.textDark },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.white,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  userName: { fontSize: 24, fontWeight: "bold", color: COLORS.text },
  userEmail: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  badge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: { color: COLORS.primary, fontWeight: "bold", fontSize: 10, letterSpacing: 1 },

  infoSection: { paddingHorizontal: 20, gap: 20 },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.text, marginBottom: 15, letterSpacing: 0.5 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  infoLabel: { fontSize: 13, color: COLORS.textLight },
  infoValue: { fontSize: 13, color: COLORS.text, fontWeight: "bold" },
  noDataText: { fontSize: 12, color: COLORS.textLight, fontStyle: "italic" },

  logoutBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 20, padding: 20 },
  logoutBtnText: { color: COLORS.error, fontWeight: "bold", fontSize: 14 },

  formSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: COLORS.textLight, marginBottom: 20, letterSpacing: 2 },
  subHeader: { fontSize: 12, fontWeight: "bold", color: COLORS.textLight, marginTop: 25, marginBottom: 15, letterSpacing: 1 },
  input: { marginBottom: 15, backgroundColor: COLORS.surface },
  saveBtn: { backgroundColor: COLORS.primary, height: 60, borderRadius: 18, justifyContent: "center", alignItems: "center", marginTop: 30 },
  saveBtnText: { color: "#000", fontWeight: "bold", fontSize: 16, letterSpacing: 1 },
});
