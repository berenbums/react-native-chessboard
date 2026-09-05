import React from 'react';
import { Dimensions } from 'react-native';
import { PromotionDialog } from '../components/promotion-dialog';
import { PIECE_SOURCES } from '../assets/piece-images';
import {
  MOVE_SPRING,
  SCALE_SPRING,
  SNAP_BACK_SPRING,
} from '../config/animations';
import type { BoardConfig } from '../state/types';
import { findAllByType, renderToTree } from './render-utils';

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
  it('presents in a transparent Modal whose back-request cancels', () => {
    const { element, onCancel } = renderDialog();
    const tree = renderToTree(element);

    expect(tree.type).toBe('Modal');
    expect(tree.props.transparent).toBe(true);
    expect(tree.props.visible).toBe(true);
    expect(tree.props.onRequestClose).toBe(onCancel);
  });

  it('sizes the overlay to explicit window dimensions instead of absoluteFill', () => {
    // Regression for the Fabric Modal sizing bug: the host view can collapse to
    // its content, so a percentage/absolute fill leaves nothing to centre in.
    const { width, height } = Dimensions.get('window');
    const [overlay] = findAllByType(
      renderToTree(renderDialog().element),
      'Pressable'
    );
    const style = flattenStyle(overlay.props.style);

    expect(style).toMatchObject({
      width,
      height,
      justifyContent: 'center',
      alignItems: 'center',
    });
    expect(style.position).toBeUndefined();
    expect(style.top).toBeUndefined();
    expect(style.bottom).toBeUndefined();
  });

  it('offers queen, rook, bishop and knight of the moving colour, in that order', () => {
    const sourcesFor = (color: 'w' | 'b') =>
      findAllByType(renderToTree(renderDialog({ color }).element), 'Image').map(
        (n) => n.props.source
      );

    expect(sourcesFor('w')).toEqual([
      PIECE_SOURCES.wq,
      PIECE_SOURCES.wr,
      PIECE_SOURCES.wb,
      PIECE_SOURCES.wn,
    ]);
    expect(sourcesFor('b')).toEqual([
      PIECE_SOURCES.bq,
      PIECE_SOURCES.br,
      PIECE_SOURCES.bb,
      PIECE_SOURCES.bn,
    ]);
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
});
