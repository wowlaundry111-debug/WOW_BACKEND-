import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ImageBackground, Platform } from 'react-native';
import { WowLogo } from '../../components/WowLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Step 1: Fade in + scale up logo
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      // Step 2: Gentle pulse animation x2
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.06,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        { iterations: 2 }
      ).start(() => {
        // Step 3: Fade out whole screen
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          onFinish();
        });
      });
    });
  }, []);

  const AnimatedView: any = Animated.View;

  return (
    <AnimatedView style={[styles.root, { opacity: screenOpacity }]}>
      <ImageBackground
        source={require('../../../assets/bg.png')}
        style={styles.bgImage}
        resizeMode="stretch"
      />
      {/* Centered logo with scale + fade animation */}
      <AnimatedView
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <AnimatedView style={{ transform: [{ scale: pulseScale }] }}>
          <WowLogo width={280} height={186} />
        </AnimatedView>
      </AnimatedView>

      {/* Subtle loading dots at the bottom */}
      <AnimatedView style={[styles.dotsRow, { opacity: logoOpacity }]}>
        <LoadingDot delay={0} />
        <LoadingDot delay={200} />
        <LoadingDot delay={400} />
      </AnimatedView>
    </AnimatedView>
  );
};

const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const AnimatedView: any = Animated.View;

  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
        ])
      ).start();
    }, delay);
  }, []);

  return (
    <AnimatedView
      style={[styles.dot, { opacity, backgroundColor: '#008CE5' }]}
    />
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF6FF',
    zIndex: 9999,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
