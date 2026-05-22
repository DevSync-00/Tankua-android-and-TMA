import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { getGoogleIconUrl } from '../../utils/googlePlaceMapper';
import PlaceTypeIcon from './PlaceTypeIcon';

const DEFAULT_BG = '#7B9EB0';

/**
 * Renders Google's official place icon (mask + background) when available.
 */
const GooglePlaceIcon = ({
  destination,
  size = 32,
  selected = false,
}) => {
  const iconUrl = useMemo(
    () => getGoogleIconUrl(destination?.iconMaskBaseUri, selected ? 2 : 1),
    [destination?.iconMaskBaseUri, selected]
  );

  const backgroundColor = destination?.iconBackgroundColor || DEFAULT_BG;
  const innerSize = Math.round(size * 0.52);

  if (iconUrl) {
    return (
      <View
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
          },
        ]}
      >
        <Image
          source={{ uri: iconUrl }}
          style={{ width: innerSize, height: innerSize }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <PlaceTypeIcon destination={destination} size={innerSize} color="#FFFFFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default React.memo(GooglePlaceIcon);
