// components/PartToggleRow.js
import React from 'react';
import { Image, StyleSheet, Switch, Text, View } from 'react-native';

export default function PartToggleRow({ icon, title, subtitle, value, onToggle }) {
  return (
    <View style={styles.row}>
      {/* Left: icon + text */}
      <View style={styles.left}>
        <View style={styles.iconWrapper}>
          <Image source={icon} style={styles.icon} />
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Right: toggle */}
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#3f4147', true: '#2564ff' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111219',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#050608',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    resizeMode: 'cover',
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8d919a',
    fontSize: 13,
    marginTop: 2,
  },
});
