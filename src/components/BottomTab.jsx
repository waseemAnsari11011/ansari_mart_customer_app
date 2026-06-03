import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const BottomTab = ({ activeTab, isWholesale = false }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.cart);

  // Prioritize user's actual account type; fallback to prop if not logged in
  const effectiveIsWholesale = user?.type === 'Business' ? true : isWholesale;

  const navItems = [
    {
      name: 'Home',
      icon: 'home',
      label: 'Home',
      route: effectiveIsWholesale ? 'BusinessHome' : 'RetailHome',
    },
    {
      name: 'Categories',
      icon: 'grid-view',
      label: 'Categories',
      route: 'CategoryListing',
    },
    {
      name: 'Cart',
      icon: 'shopping-cart',
      label: 'Cart',
      route: 'Cart',
      isCart: true,
    },
    {
      name: 'Profile',
      icon: 'person-outline',
      label: 'Profile',
      route: 'Profile',
    },
  ];

  // Animation values for each tab
  const animations = useRef(
    navItems.reduce(
      (acc, item) => ({
        ...acc,
        [item.name]: new Animated.Value(1),
      }),
      {},
    ),
  ).current;

  const translateVs = useRef(
    navItems.reduce(
      (acc, item) => ({
        ...acc,
        [item.name]: new Animated.Value(0),
      }),
      {},
    ),
  ).current;

  const animateTab = useCallback(
    name => {
      // Reset others (optional, for "switch" feel)
      Object.keys(animations).forEach(key => {
        if (key !== name) {
          Animated.parallel([
            Animated.spring(animations[key], {
              toValue: 1,
              useNativeDriver: true,
            }),
            Animated.spring(translateVs[key], {
              toValue: 0,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });

      // Pop & Float animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(animations[name], {
            toValue: 1.2,
            duration: 100,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(translateVs[name], {
            toValue: -4,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(animations[name], {
            toValue: 1.1,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.spring(translateVs[name], {
            toValue: -2,
            friction: 4,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    },
    [animations, translateVs],
  );

  useEffect(() => {
    // Subtle entrance animation for active tab if needed
    animateTab(activeTab);
  }, [activeTab, animateTab]);

  const handlePress = item => {
    animateTab(item.name);
    navigation.navigate(item.route, { isWholesale: effectiveIsWholesale });
  };

  return (
    <View
      style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 6) }]}
    >
      {navItems.map(item => {
        const isActive = activeTab === item.name;

        const animatedStyle = {
          transform: [
            { scale: animations[item.name] },
            { translateY: translateVs[item.name] },
          ],
        };

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.iconWrapper,
                isActive && styles.activeIconWrapper,
                animatedStyle,
              ]}
            >
              <Icon
                name={
                  isActive && item.name === 'Profile' ? 'person' : item.icon
                }
                size={isActive ? 24 : 22}
                color={isActive ? '#fff' : '#aaa'}
              />

              {item.isCart && cartItems.length > 0 && (
                <View style={[styles.badge, isActive && styles.activeBadge]}>
                  <Text style={styles.badgeText}>{cartItems.length}</Text>
                </View>
              )}
            </Animated.View>
            <Text style={[styles.navText, isActive && styles.activeText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeIconWrapper: {
    backgroundColor: '#3E9400',
    marginTop: -16,
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#3E9400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  navText: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
    fontWeight: '500',
  },

  activeText: {
    color: '#3E9400',
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  activeBadge: {
    top: 0,
    right: -2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default BottomTab;
