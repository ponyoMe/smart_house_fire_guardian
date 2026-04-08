import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  infoValue: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 14,
  },
});