import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import OnboardingSlide from '../components/auth/OnboardingSlide';
import { AUTH_COPY } from '../constants/authCopy';

const SLIDES = [
  {
    id: '1',
    hero: require('../../assets/onboarding/hero-1.png'),
    ...AUTH_COPY.onboarding[0],
  },
  {
    id: '2',
    hero: require('../../assets/onboarding/hero-2.png'),
    ...AUTH_COPY.onboarding[1],
  },
  {
    id: '3',
    hero: require('../../assets/onboarding/hero-3.png'),
    ...AUTH_COPY.onboarding[2],
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

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
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
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
            heroSource={item.hero}
            prefix={item.prefix}
            highlight={item.highlight}
            description={item.description}
            slideIndex={slideIndex}
            slideCount={SLIDES.length}
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
