import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { DeviceStatus } from '../../types';
import { statusMeta } from '../../utils/deviceUtils';

export default function StatusBadge({ status }: { status: DeviceStatus }) {
  const meta = statusMeta[status] ?? {
  label: 'Unknown',
  color: '#64748B',
  icon: 'help-circle-outline',
};

  return (
    <View style={[styles.badge, { backgroundColor: `${meta.color}15` }]}> 
      <Icon name={meta.icon} size={14} color={meta.color} />
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
});
