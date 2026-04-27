import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ActivityCard from '../components/activity/ActivityCard';
import { useSmartHouse } from '../context/SmartHouseContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

type ActivityFilter = 'All' | 'Alerts' | 'System' | 'Devices';

export default function ActivityScreen() {
  const [filter, setFilter] = useState<ActivityFilter>('All');
  const [refreshing, setRefreshing] = useState(false);
  const { events, refreshNotifications } = useSmartHouse();

  const filteredEvents = useMemo(() => {
    if (filter === 'All') return events;
    if (filter === 'Alerts') return events.filter(e => e.type === 'alert');
    if (filter === 'System') return events.filter(e => e.type === 'system');
    return events.filter(e => e.type === 'device');
  }, [events, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications]);

  useFocusEffect(
    useCallback(() => {
      refreshNotifications().catch(error => {
        console.error('Failed to refresh notifications on Activity focus', error);
      });
    }, [refreshNotifications]),
  );

  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <Text style={styles.title}>Activity</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="settings-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        {(['All', 'Alerts', 'System', 'Devices'] as ActivityFilter[]).map(item => (
          <TouchableOpacity
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ActivityCard event={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  filterChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 10,
    marginTop: 6,
  },
  filterChipActive: { backgroundColor: '#0F172A' },
  filterChipText: { color: '#334155', fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 28 },
});
