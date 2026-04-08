import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function SettingRow({ label, value, right }: { label: string; value?: string; right?: React.ReactNode }) {
  
  return (
    <View style={styles.settingRow}>
      <View>
        <Text style={styles.settingLabel}>{label}</Text>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [dailyReportsEnabled, setDailyReportsEnabled] = useState(true);
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Profile</Text>
          <SettingRow label="Name" value="User" />
          <SettingRow label="House" value="Smart House" />
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>System</Text>
          <SettingRow label="MQTT connection" value="Connected" />
          <SettingRow label="Backend API" value="Online" />
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Notifications</Text>
          <SettingRow label="Alerts" right={<Switch value={alertsEnabled} onValueChange={setAlertsEnabled} />} />
          <SettingRow label="Daily reports" right={<Switch value={dailyReportsEnabled} onValueChange={setDailyReportsEnabled} />} />
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>About</Text>
          <SettingRow label="Application" value="Smart Home Safety System" />
          <SettingRow label="Version" value="1.0" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  settingLabel: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
});