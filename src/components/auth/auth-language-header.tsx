import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

export const IDIOMAS_DISPONIBLES = [
  { id: 'es', label: 'ES' },
  { id: 'en', label: 'EN' },
  { id: 'pt', label: 'PT-BR' },
  { id: 'qu', label: 'QU' },
  { id: 'ay', label: 'AY' },
  { id: 'gn', label: 'GN' },
];

export default function AuthLanguageHeader() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'es';

  return (
    <View style={styles.headerWrapper}>
      {/* Insignia Beta y Marca */}
      <View style={styles.brandRow}>
        <Image
          source={require('@/assets/images/logo-inicio.png')}
          style={styles.logoImage}
          contentFit="contain"
        />
        <View style={styles.betaBadge}>
          <Text style={styles.betaBadgeText}>BETA</Text>
        </View>
      </View>

      {/* Selector de idioma horizontal fijo */}
      <View style={styles.languageContainer}>
        {IDIOMAS_DISPONIBLES.map((lang) => {
          const isActive = currentLang.toLowerCase().startsWith(lang.id);
          return (
            <TouchableOpacity
              key={lang.id}
              style={[styles.langChip, isActive && styles.langChipActive]}
              onPress={() => i18n.changeLanguage(lang.id)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Cambiar idioma a ${lang.label}`}
            >
              <Text style={[styles.langChipText, isActive && styles.langChipTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  logoImage: {
    width: 140,
    height: 48,
  },
  betaBadge: {
    backgroundColor: '#FFB400',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  betaBadgeText: {
    color: '#2F2F2F',
    fontSize: 10,
    fontWeight: 'bold',
  },
  languageContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langChipActive: {
    backgroundColor: '#FFB400',
  },
  langChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  langChipTextActive: {
    color: '#2F2F2F',
    fontWeight: 'bold',
  },
});
