import React, { useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import OnboardingSlide from '../components/auth/OnboardingSlide';
import { AUTH_COPY } from '../constants/authCopy';

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
      const next = index + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
      return;
    }
    navigation.replace('Login');
  };

  const skip = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
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
            HeroImage={item.HeroImage}
            prefix={item.prefix}
            highlight={item.highlight}
            description={item.description}
            underlineSource={item.underline}
            slideCount={SLIDES.length}
            scrollX={scrollX}
            pageWidth={width}
            ctaLabel={slideIndex === SLIDES.length - 1 ? AUTH_COPY.getStarted : AUTH_COPY.next}
            onContinue={goNext}
            onSkip={skip}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default OnboardingScreen;
