import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ICON_FAMILIES } from '../../constants/placeMarkerConfig';
import { resolvePlaceMarker } from '../../utils/placeTypeResolver';

const getIconComponent = (family) =>
  family === ICON_FAMILIES.MATERIAL ? MaterialCommunityIcons : Ionicons;

/**
 * Renders the correct vector icon for a destination's category / religious place type.
 */
const PlaceTypeIcon = ({
  destination,
  size = 18,
  color = '#FFFFFF',
  markerConfig: configProp = null,
}) => {
  const config = configProp || resolvePlaceMarker(destination);
  const IconComponent = getIconComponent(config.iconFamily);

  return (
    <IconComponent
      name={config.icon}
      size={size}
      color={color}
      style={{ lineHeight: size }}
    />
  );
};

export default React.memo(PlaceTypeIcon);
