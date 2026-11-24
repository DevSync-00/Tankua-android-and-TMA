import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { parseInline, parseRichText } from '../utils/richText';

const Inline = ({ text }) =>
  parseInline(text).map((run, index) => (
    <Text key={index} style={run.bold ? styles.bold : undefined}>{run.text}</Text>
  ));

/** Renders a formatted description (headings, bullets, bold, paragraphs). See utils/richText.js. */
const FormattedText = ({ text, style }) => {
  const blocks = parseRichText(text);
  return (
    <View>
      {blocks.map((block, index) => {
        const spacing = index > 0 ? styles.gap : undefined;
        if (block.type === 'heading') {
          return (
            <Text key={index} style={[styles.heading, spacing]}>
              <Inline text={block.text} />
            </Text>
          );
        }
        if (block.type === 'list') {
          return (
            <View key={index} style={spacing}>
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.bulletRow}>
                  <Text style={[style, styles.bulletMark]}>{'•'}</Text>
                  <Text style={[style, styles.bulletText]}><Inline text={item} /></Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={index} style={[style, spacing]}>
            {block.lines.map((line, lineIndex) => (
              <Text key={lineIndex}>
                {lineIndex > 0 ? '\n' : ''}
                <Inline text={line} />
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gap: { marginTop: SPACING.sm },
  heading: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  bold: { fontWeight: FONTS.weights.bold },
  bulletRow: { flexDirection: 'row', marginTop: 2 },
  bulletMark: { width: 18 },
  bulletText: { flex: 1 },
});

export default FormattedText;
