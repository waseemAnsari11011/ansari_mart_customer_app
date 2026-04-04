import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GREEN = '#449204';
const ORANGE = '#F38120';

const RoleSelectionScreen = ({ navigation }) => {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const s = makeStyles(isDark, insets);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        contentContainerStyle={s.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo */}
        <View style={s.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </View>

        {/* Heading */}
        <View style={s.headingContainer}>
          <Text style={s.heading}>Continue As</Text>
          <Text style={s.subheading}>Choose how you want to shop today</Text>
        </View>

        {/* Cards */}
        <View style={s.cardsContainer}>

          {/* Retail Customer Card */}
          <TouchableOpacity
            style={[s.card, s.cardGreen]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CustomerLogin')}
          >
            {/* Icon Box */}
            <View style={[s.iconBox, s.iconBoxGreen]}>
              <Icon name="shopping-bag" size={34} color={GREEN} />
            </View>

            {/* Text */}
            <View style={s.cardTextBox}>
              <Text style={s.cardTitle}>Buy For Home</Text>
              <Text style={s.cardDesc}>
                Shop for your home and personal needs with ease.
              </Text>
            </View>

            {/* Chevron */}
            <Icon name="chevron-right" size={26} color="#C3D9AE" />

            {/* Watermark */}
            <View style={s.watermarkWrap} pointerEvents="none">
              <Icon name="shopping-bag" size={90} color={GREEN} style={{ opacity: 0.06 }} />
            </View>
          </TouchableOpacity>

          {/* Business Buyer Card */}
          <TouchableOpacity
            style={[s.card, s.cardOrange]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BusinessLogin')}
          >
            {/* Icon Box */}
            <View style={[s.iconBox, s.iconBoxOrange]}>
              <Icon name="inventory-2" size={34} color={ORANGE} />
            </View>

            {/* Text */}
            <View style={s.cardTextBox}>
              <Text style={s.cardTitle}>Buy For Shop</Text>
              <Text style={s.cardDesc}>
                Get bulk wholesale prices for your business inventory.
              </Text>
            </View>

            {/* Chevron */}
            <Icon name="chevron-right" size={26} color="#F5C99E" />

            {/* Watermark */}
            <View style={s.watermarkWrap} pointerEvents="none">
              <Icon name="inventory-2" size={90} color={ORANGE} style={{ opacity: 0.06 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            You can switch accounts anytime in settings.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('HelpSupport')}>
            <Text style={s.helpText}>Need help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (isDark, insets) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#0F1711' : '#FFFFFF',
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: Math.max(insets.top, 32),
      paddingBottom: Math.max(insets.bottom, 24) + 16,
    },
    logoContainer: {
      marginTop: 40,
      alignItems: 'center',
    },
    logo: {
      width: 128,
      height: 128,
    },
    headingContainer: {
      alignItems: 'center',
      marginTop: 10,
    },
    heading: {
      fontSize: 32,
      fontWeight: 'bold',
      color: GREEN,
      marginBottom: 6,
    },
    subheading: {
      fontSize: 15,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    cardsContainer: {
      width: '100%',
      marginTop: 32,
      gap: 16,
    },
    card: {
      width: '100%',
      borderRadius: 24,
      padding: 22,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 2,
    },
    cardGreen: {
      backgroundColor: isDark ? '#1A251C' : '#F0F9EB',
      borderColor: isDark ? 'rgba(68,146,4,0.25)' : 'rgba(68,146,4,0.12)',
    },
    cardOrange: {
      backgroundColor: isDark ? '#251E1A' : '#FFF4EB',
      borderColor: isDark ? 'rgba(243,129,32,0.25)' : 'rgba(243,129,32,0.12)',
    },
    iconBox: {
      width: 64,
      height: 64,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    iconBoxGreen: {
      backgroundColor: isDark
        ? 'rgba(68,146,4,0.22)'
        : 'rgba(68,146,4,0.12)',
    },
    iconBoxOrange: {
      backgroundColor: isDark
        ? 'rgba(243,129,32,0.22)'
        : 'rgba(243,129,32,0.12)',
    },
    cardTextBox: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 19,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#111827',
      marginBottom: 4,
    },
    cardDesc: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
      lineHeight: 19,
    },
    watermarkWrap: {
      position: 'absolute',
      right: -12,
      bottom: -14,
    },
    footer: {
      alignItems: 'center',
      marginTop: 'auto',
      paddingTop: 16,
    },
    footerText: {
      fontSize: 13,
      color: isDark ? '#4B5563' : '#9CA3AF',
      textAlign: 'center',
      marginBottom: 8,
    },
    helpText: {
      fontSize: 14,
      fontWeight: '700',
      color: GREEN,
    },
  });

export default RoleSelectionScreen;
