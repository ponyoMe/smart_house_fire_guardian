import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function RoomChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.roomChip, active && styles.roomChipActive]}>
      <Text style={[styles.roomChipText, active && styles.roomChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  roomChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginRight: 10,
  },
  roomChipActive: {
    backgroundColor: '#2563EB',
  },
  roomChipText: {
    color: '#334155',
    fontWeight: '600',
  },
  roomChipTextActive: {
    color: '#FFFFFF',
  },
});