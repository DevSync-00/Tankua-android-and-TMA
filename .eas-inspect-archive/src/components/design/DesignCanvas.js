import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 812;

export const useDesignLayout = () => {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  const contentWidth = DESIGN_WIDTH * scale;
  const contentHeight = DESIGN_HEIGHT * scale;
  const offsetX = (width - contentWidth) / 2;
  const offsetY = (height - contentHeight) / 2;

  const box = (left, top, boxWidth, boxHeight) => ({
    position: 'absolute',
    left: left * scale,
    top: top * scale,
    width: boxWidth * scale,
    height: boxHeight * scale,
  });

  return { scale, offsetX, offsetY, contentWidth, contentHeight, box };
};

const DesignCanvas = ({ children, style }) => {
  const { contentWidth, contentHeight, offsetX, offsetY } = useDesignLayout();

  return (
    <View style={[styles.root, style]}>
      <View
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          width: contentWidth,
          height: contentHeight,
        }}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default DesignCanvas;
