import React, { useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import OnboardingSlide from '../components/auth/OnboardingSlide';
import OnboardingProgress from '../components/auth/OnboardingProgress';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import { AUTH_COPY } from '../constants/authCopy';
import { AUTH_LAYOUT } from '../components/auth/authTheme';

import OnboardingHero1 from '../../assets/SplashScreenOnbordingLoginPages/afbea499038243 1.svg';
import OnboardingHero2 from '../../assets/SplashScreenOnbordingLoginPages/7f47f9144194941 1.svg';
import OnboardingHero3 from '../../assets/SplashScreenOnbordingLoginPages/252a6624a42c117099537c7a1320256d 1.svg';

const SLIDES = [
  {
    id: '1',
    HeroImage: OnboardingHero1,
    underline: require('../../assets/SplashScreenOnbordingLoginPages/onbording 1.png'),
    ...AUTH_COPY.onboarding[0],
  },
  {
    id: '2',
    HeroImage: OnboardingHero2,
    underline: require('../../assets/SplashScreenOnbordingLoginPages/onbording 2.png'),
    ...AUTH_COPY.onboarding[1],
  },
  {
    id: '3',
    HeroImage: OnboardingHero3,
    underline: require('../../assets/SplashScreenOnbordingLoginPages/onbording 3.png'),
    ...AUTH_COPY.onboarding[2],
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    navigation.replace('Login');
  };

  const skip = () => {
    navigation.replace('Login');
  };

  const ctaLabel = index === SLIDES.length - 1 ? AUTH_COPY.getStarted : AUTH_COPY.next;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Animated.FlatList
        ref={listRef}
        style={styles.list}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={1}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setIndex(nextIndex);
        }}
        getItemLayout={(_, itemIndex) => ({
          length: width,
          offset: width * itemIndex,
          index: itemIndex,
        })}
        renderItem={({ item, index: slideIndex }) => (
          <OnboardingSlide
            slideIndex={slideIndex}
            scrollX={scrollX}
            pageWidth={width}
            HeroImage={item.HeroImage}
            prefix={item.prefix}
            highlight={item.highlight}
            description={item.description}
            underlineSource={item.underline}
            onSkip={skip}
          />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingProgress count={SLIDES.length} scrollX={scrollX} pageWidth={width} />
        <View style={styles.buttonWrap}>
          <AuthPrimaryButton label={ctaLabel} onPress={goNext} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: AUTH_LAYOUT.screenPadding,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  buttonWrap: {
    width: '100%',
  },
});

export default OnboardingScreen;
