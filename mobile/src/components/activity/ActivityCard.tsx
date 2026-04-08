import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActivityEvent } from '../../types';

const severityColor = {
  red: '#FEE2E2',
  orange: '#FFEDD5',
  blue: '#DBEAFE',
  green: '#DCFCE7',
};

const severityTextColor = {
  red: '#7F1D1D',
  orange: '#9A3412',
  blue: '#1D4ED8',
  green: '#166534',
};

export default function ActivityCard({ event }: { event: ActivityEvent }) {
  return (
    <View style={[styles.card, { backgroundColor: severityColor[event.severity] }]}> 
      <View style={styles.header}>
        <Text style={[styles.title, { color: severityTextColor[event.severity] }]}>{event.title}</Text>
        <Text style={styles.time}>{event.time}</Text>
      </View>
      <Text style={styles.room}>{event.room}</Text>
      {event.description.map((line, index) => (
        <Text key={index} style={styles.description}>• {line}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  time: {
    color: '#475569',
    fontWeight: '600',
  },
  room: {
    marginTop: 6,
    marginBottom: 10,
    color: '#334155',
    fontWeight: '600',
  },
  description: {
    color: '#334155',
    lineHeight: 20,
    marginBottom: 4,
  },
});