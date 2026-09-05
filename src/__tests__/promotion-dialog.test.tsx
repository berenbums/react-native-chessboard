import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { BackHandler } from 'react-native';
import { PromotionDialog } from '../components/promotion-dialog';
import { PIECE_SOURCES } from '../assets/piece-images';
import {
  MOVE_SPRING,
  SCALE_SPRING,
  SNAP_BACK_SPRING,
} from '../config/animations';
import type { BoardConfig } from '../state/types';
import { findAllByType, renderToTree } from './render-utils';

// The jest mock exposes test-only helpers on top of the real BackHandler API.
const backHandlerMock = BackHandler as typeof BackHandler & {
  mockPressBack: () => boolean;
  mockListenerCount: () => number;
  mockReset: () => void;
};

// Dialogs rendered with renderToTree() are never unmounted, so drop their
// back-press listeners before each test to keep the counts meaningful.
beforeEach(() => backHandlerMock.mockReset());

const baseConfig = (overrides: Partial<BoardConfig> = {}): BoardConfig => ({
  boardSize: 400,
  pieceSize: 50,
  gestureEnabled: true,
  flipped: false,
  withLetters: true,
  withNumbers: true,
  colors: {
    white: '#fff',
    black: '#000',
    lastMoveHighlight: 'rgba(255,255,0,0.5)',
    checkmateHighlight: '#E84855',
    promotionPieceButton: '#FF9B71',
  },
  animations: {
    move: MOVE_SPRING,
    scale: SCALE_SPRING,
    snapBack: SNAP_BACK_SPRING,
  },
  fontSource: null,
  ...overrides,
});

const renderDialog = (
  props: Partial<React.ComponentProps<typeof PromotionDialog>> = {}
) => {
  const onSelect = jest.fn();
  const onCancel = jest.fn();
  const element = (
    <PromotionDialog
      color="w"
      onSelect={onSelect}
      onCancel={onCancel}
      config={baseConfig()}
      {...props}
    />
  );
  return { element, onSelect, onCancel };
};

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? style.reduce<Record<string, unknown>>(
        (acc, entry) => ({ ...acc, ...flattenStyle(entry) }),
        {}
      )
    : ((style ?? {}) as Record<string, unknown>);

describe('PromotionDialog', () => {
  it('renders as an absolutely positioned overlay inside the board, not a Modal', () => {
    const tree = renderToTree(renderDialog().element);

    expect(tree.type).toBe('Animated.View');
    expect(findAllByType(tree, 'Modal')).toHaveLength(0);
    expect(flattenStyle(tree.props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
    });
  });

  it('fades in and out with layout animations', () => {
    const tree = renderToTree(renderDialog().element);
    expect(tree.props.entering).toBeDefined();
    expect(tree.props.exiting).toBeDefined();
  });

  it('offers queen, rook, bishop and knight of the moving colour, in that order', () => {
    const white = findAllByType(
      renderToTree(renderDialog({ color: 'w' }).element),
      'Image'
    ).map((n) => n.props.source);
    expect(white).toEqual([
      PIECE_SOURCES.wq,
      PIECE_SOURCES.wr,
      PIECE_SOURCES.wb,
      PIECE_SOURCES.wn,
    ]);

    const black = findAllByType(
      renderToTree(renderDialog({ color: 'b' }).element),
      'Image'
    ).map((n) => n.props.source);
    expect(black).toEqual([
      PIECE_SOURCES.bq,
      PIECE_SOURCES.br,
      PIECE_SOURCES.bb,
      PIECE_SOURCES.bn,
    ]);
  });

  it('scales piece buttons with the board so they always fit inside it', () => {
    const small = findAllByType(
      renderToTree(
        renderDialog({ config: baseConfig({ boardSize: 160, pieceSize: 20 }) })
          .element
      ),
      'Image'
    );
    expect(small).toHaveLength(4);
    for (const image of small) {
      expect(flattenStyle(image.props.style)).toMatchObject({
        width: 20,
        height: 20,
      });
    }
  });

  it('applies the configured promotion button colour', () => {
    const config = baseConfig();
    config.colors = { ...config.colors, promotionPieceButton: '#123456' };
    const buttons = findAllByType(
      renderToTree(renderDialog({ config }).element),
      'TouchableOpacity'
    );
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(flattenStyle(button.props.style).backgroundColor).toBe('#123456');
    }
  });

  it('reports the tapped piece via onSelect', () => {
    const { element, onSelect, onCancel } = renderDialog();
    const buttons = findAllByType(renderToTree(element), 'TouchableOpacity');

    (buttons[2].props as { onPress: () => void }).onPress();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels when the dimmed backdrop is tapped', () => {
    const { element, onSelect, onCancel } = renderDialog();
    const [backdrop] = findAllByType(renderToTree(element), 'Pressable');

    (backdrop.props as { onPress: () => void }).onPress();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('consumes the hardware back button to cancel instead of leaving the screen', () => {
    const { element, onCancel } = renderDialog();
    const before = backHandlerMock.mockListenerCount();

    let renderer: ReactTestRenderer | null = null;
    act(() => {
      renderer = create(element);
    });
    expect(backHandlerMock.mockListenerCount()).toBe(before + 1);

    expect(backHandlerMock.mockPressBack()).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);

    act(() => {
      (renderer as ReactTestRenderer | null)?.unmount();
    });
    expect(backHandlerMock.mockListenerCount()).toBe(before);
    expect(backHandlerMock.mockPressBack()).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
