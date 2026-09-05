// Minimal stand-in for react-native.
//
// The real package ships Flow-typed ESM that jest cannot parse without the
// react-native babel preset, so any module importing it (skia-board,
// board-state-context, promotion-dialog) was untestable. Only the handful of
// APIs this library actually touches are implemented.

import React from 'react';

type Style = Record<string, unknown>;

export const StyleSheet = {
  create: <T extends Record<string, Style>>(styles: T): T => styles,
  flatten: (style: unknown): Style => {
    if (!style) return {};
    if (Array.isArray(style)) {
      return style.reduce<Style>(
        (acc, entry) => ({ ...acc, ...StyleSheet.flatten(entry) }),
        {}
      );
    }
    return style as Style;
  },
  absoluteFill: {} as Style,
  hairlineWidth: 1,
};

export const Dimensions = {
  get: () => ({ width: 400, height: 800, scale: 2, fontScale: 1 }),
  addEventListener: () => ({ remove: () => {} }),
};

export const Platform = {
  OS: 'ios' as const,
  select: <T>(specifics: {
    ios?: T;
    android?: T;
    default?: T;
  }): T | undefined => specifics.ios ?? specifics.default,
};

export const useWindowDimensions = () => Dimensions.get();

// Usable both as a component (`<Image />`) and as the static-API namespace.
const ImageComponent = (props: Record<string, unknown>) =>
  React.createElement('Image', props);
export const Image = Object.assign(ImageComponent, {
  resolveAssetSource: (source: unknown) =>
    typeof source === 'number' ? { uri: `asset://${source}` } : source,
});

export const View = 'View';
export const Text = 'Text';
export const Pressable = 'Pressable';
export const TouchableOpacity = 'TouchableOpacity';
export const Modal = 'Modal';
