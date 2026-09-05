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
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  } as Style,
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

// Mirrors the real BackHandler contract: listeners run last-registered first,
// and the first one returning `true` stops propagation. `mockPressBack()` lets
// tests simulate the hardware button and reports whether it was consumed.
type BackPressHandler = () => boolean | null | undefined;
const backPressHandlers: BackPressHandler[] = [];
export const BackHandler = {
  addEventListener: (
    _event: 'hardwareBackPress',
    handler: BackPressHandler
  ) => {
    backPressHandlers.push(handler);
    return {
      remove: () => {
        const index = backPressHandlers.indexOf(handler);
        if (index !== -1) backPressHandlers.splice(index, 1);
      },
    };
  },
  exitApp: () => {},
  mockPressBack: (): boolean => {
    for (let i = backPressHandlers.length - 1; i >= 0; i--) {
      if (backPressHandlers[i]() === true) return true;
    }
    return false;
  },
  mockListenerCount: (): number => backPressHandlers.length,
  mockReset: (): void => {
    backPressHandlers.length = 0;
  },
};
