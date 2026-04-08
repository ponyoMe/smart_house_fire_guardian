import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function HeaderBar({ title }: { title: string }) {
  return (
    <View style={styles.headerBar}>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="notifications-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="settings-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginLeft: 8,
  },
});