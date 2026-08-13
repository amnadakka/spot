import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePermissionStatuses } from '../../hooks/usePermissionStatuses';
import { useI18n } from '../../i18n/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { makeStyles } from '../../theme/makeStyles';
import { spacing } from '../../theme/spacing';
import InfoBottomSheet from './InfoBottomSheet';
import PermissionAccessRows from './PermissionAccessRows';
import SettingsRow from './SettingsRow';
import SettingsSection from './SettingsSection';

const CONTACT_PHONE_TEL = 'tel:+491738663474';

type SheetKind = 'signUp' | 'howItWorks' | 'privacy' | 'battery' | 'language' | 'theme' | null;

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const styles = useStyles();
  const permissions = usePermissionStatuses();
  const [sheet, setSheet] = useState<SheetKind>(null);

  const languageLabel =
    language === 'de' ? t.languageGerman : language === 'ar' ? t.languageArabic : t.languageEnglish;
  const themeLabel =
    theme === 'ducky' ? t.themeDucky : theme === 'night' ? t.themeNight : t.themeDefault;

  const handleContactUs = () => {
    void Linking.openURL(CONTACT_PHONE_TEL).catch((error) => {
      console.warn('[Settings] Failed to open phone dialer:', error);
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title={t.sectionProfile}>
          <SettingsRow
            icon="person-add"
            iconColor="#EC4899"
            iconBackground="#FCE7F3"
            label={t.signUp}
            onPress={() => setSheet('signUp')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t.sectionApplication}>
          <PermissionAccessRows
            notifications={permissions.notifications}
            location={permissions.location}
            fullScreenIntent={permissions.fullScreenIntent}
            onChanged={permissions.refresh}
            locationIsLast={false}
          />
          <SettingsRow
            icon="language"
            iconColor="#D97706"
            iconBackground="#FEF3C7"
            label={t.language}
            value={languageLabel}
            onPress={() => setSheet('language')}
          />
          <SettingsRow
            icon="color-palette"
            iconColor="#F05A28"
            iconBackground="#FEF9E7"
            label={t.theme}
            value={themeLabel}
            onPress={() => setSheet('theme')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t.sectionSupport}>
          <SettingsRow
            icon="book"
            iconColor="#8B5CF6"
            iconBackground="#EDE9FE"
            label={t.howItWorks}
            onPress={() => setSheet('howItWorks')}
          />
          <SettingsRow
            icon="call"
            iconColor="#0EA5E9"
            iconBackground="#E0F2FE"
            label={t.contactUs}
            value={t.contactUsPhone}
            onPress={handleContactUs}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t.sectionDataPrivacy}>
          <SettingsRow
            icon="lock-closed"
            iconColor="#3B82F6"
            iconBackground="#DBEAFE"
            label={t.privacy}
            onPress={() => setSheet('privacy')}
          />
          <SettingsRow
            icon="battery-charging"
            iconColor="#10B981"
            iconBackground="#D1FAE5"
            label={t.batteryUsage}
            onPress={() => setSheet('battery')}
            isLast
          />
        </SettingsSection>
      </ScrollView>

      <InfoBottomSheet
        visible={sheet === 'signUp'}
        onClose={() => setSheet(null)}
        icon="person-add"
        iconColor="#EC4899"
        iconBackground="#FCE7F3"
        title={t.signUpTitle}
        body={t.signUpBody}
        primaryLabel={t.contactUs}
        onPrimaryPress={() => {
          setSheet(null);
          handleContactUs();
        }}
        secondaryLabel={t.close}
        onSecondaryPress={() => setSheet(null)}
      />

      <InfoBottomSheet
        visible={sheet === 'howItWorks'}
        onClose={() => setSheet(null)}
        icon="book"
        iconColor="#8B5CF6"
        iconBackground="#EDE9FE"
        title={t.howItWorksTitle}
        primaryLabel={t.gotIt}
        onPrimaryPress={() => setSheet(null)}
      >
        <View style={styles.steps}>
          <HowItWorksStep title={t.howItWorksStep1Title} body={t.howItWorksStep1Body} />
          <HowItWorksStep title={t.howItWorksStep2Title} body={t.howItWorksStep2Body} />
          <HowItWorksStep title={t.howItWorksStep3Title} body={t.howItWorksStep3Body} />
        </View>
      </InfoBottomSheet>

      <InfoBottomSheet
        visible={sheet === 'privacy'}
        onClose={() => setSheet(null)}
        icon="lock-closed"
        iconColor="#3B82F6"
        iconBackground="#DBEAFE"
        title={t.privacyTitle}
        body={t.privacyBody}
        primaryLabel={t.gotIt}
        onPrimaryPress={() => setSheet(null)}
      />

      <InfoBottomSheet
        visible={sheet === 'battery'}
        onClose={() => setSheet(null)}
        icon="battery-charging"
        iconColor="#10B981"
        iconBackground="#D1FAE5"
        title={t.batteryTitle}
        body={t.batteryBody}
        primaryLabel={t.gotIt}
        onPrimaryPress={() => setSheet(null)}
      />

      <InfoBottomSheet
        visible={sheet === 'language'}
        onClose={() => setSheet(null)}
        icon="language"
        iconColor="#D97706"
        iconBackground="#FEF3C7"
        title={t.chooseLanguage}
        secondaryLabel={t.close}
        onSecondaryPress={() => setSheet(null)}
      >
        <View style={styles.languageList}>
          <ThemeOrLanguageOption
            label={t.languageEnglish}
            selected={language === 'en'}
            onPress={() => {
              setLanguage('en');
              setSheet(null);
            }}
          />
          <ThemeOrLanguageOption
            label={t.languageGerman}
            selected={language === 'de'}
            onPress={() => {
              setLanguage('de');
              setSheet(null);
            }}
          />
          <ThemeOrLanguageOption
            label={t.languageArabic}
            selected={language === 'ar'}
            onPress={() => {
              setLanguage('ar');
              setSheet(null);
            }}
          />
        </View>
      </InfoBottomSheet>

      <InfoBottomSheet
        visible={sheet === 'theme'}
        onClose={() => setSheet(null)}
        icon="color-palette"
        iconColor="#F05A28"
        iconBackground="#FEF9E7"
        title={t.chooseTheme}
        secondaryLabel={t.close}
        onSecondaryPress={() => setSheet(null)}
      >
        <View style={styles.languageList}>
          <ThemeOrLanguageOption
            label={t.themeDefault}
            selected={theme === 'default'}
            swatch="#3B82F6"
            onPress={() => {
              setTheme('default');
              setSheet(null);
            }}
          />
          <ThemeOrLanguageOption
            label={t.themeDucky}
            selected={theme === 'ducky'}
            swatch="#F8DD58"
            onPress={() => {
              setTheme('ducky');
              setSheet(null);
            }}
          />
          <ThemeOrLanguageOption
            label={t.themeNight}
            selected={theme === 'night'}
            swatch="#0B1220"
            onPress={() => {
              setTheme('night');
              setSheet(null);
            }}
          />
        </View>
      </InfoBottomSheet>
    </View>
  );
}

function HowItWorksStep({ title, body }: { title: string; body: string }) {
  const styles = useStyles();
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepBody}>{body}</Text>
    </View>
  );
}

function ThemeOrLanguageOption({
  label,
  selected,
  onPress,
  swatch,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  swatch?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      style={({ pressed }) => [styles.languageOption, pressed && styles.languageOptionPressed]}
      onPress={onPress}
    >
      <View style={styles.optionLeading}>
        {swatch ? <View style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
        <Text style={[styles.languageLabel, selected && styles.languageLabelSelected]}>
          {label}
        </Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  steps: {
    width: '100%',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  step: {
    gap: spacing.xs,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
    textAlign: 'center',
  },
  stepBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.slate500,
    textAlign: 'center',
  },
  languageList: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.slate50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  languageOptionPressed: {
    backgroundColor: colors.slate100,
  },
  optionLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.slate800,
  },
  languageLabelSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
}));
