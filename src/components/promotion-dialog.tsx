import React, { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  View,
  BackHandler,
} from 'react-native';
import type { PieceSymbol } from 'chess.js';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { BoardConfig } from '../state';
import { PIECE_SOURCES } from '../assets/piece-images';

const PROMOTION_PIECES: PieceSymbol[] = ['q', 'r', 'b', 'n'];

interface PromotionDialogProps {
  color: 'w' | 'b';
  onSelect: (piece: PieceSymbol) => void;
  onCancel: () => void;
  config: BoardConfig;
}

// The dialog is rendered inside the board's own container rather than in a
// native `Modal`. That keeps it centred over the board regardless of how the
// host app lays out its screens (native stacks, edge-to-edge insets, nested
// modals), and makes it behave identically on iOS, Android and web.
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export const PromotionDialog: React.FC<PromotionDialogProps> = React.memo(
  ({ color, onSelect, onCancel, config }) => {
    const { colors, pieceSize } = config;

    // Without a native Modal the hardware back button would otherwise pop the
    // host screen while a promotion is still pending. Cancel it instead.
    useEffect(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          onCancel();
          return true;
        }
      );
      return () => subscription.remove();
    }, [onCancel]);

    // Scale with the board so the four buttons always fit inside it.
    const sizes = useMemo(
      () => ({
        container: {
          padding: pieceSize * 0.15,
          borderRadius: pieceSize * 0.2,
        },
        button: {
          padding: pieceSize * 0.15,
          marginHorizontal: pieceSize * 0.08,
          borderRadius: pieceSize * 0.1,
        },
        image: { width: pieceSize, height: pieceSize },
      }),
      [pieceSize]
    );

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
        testID="promotion-overlay"
      >
        <Pressable
          style={styles.backdrop}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel promotion"
        >
          <View style={[styles.container, sizes.container]}>
            {PROMOTION_PIECES.map((piece) => {
              const pieceCode =
                `${color}${piece}` as keyof typeof PIECE_SOURCES;
              const source = PIECE_SOURCES[pieceCode];

              return (
                <TouchableOpacity
                  key={piece}
                  testID={`promotion-${piece}`}
                  style={[
                    sizes.button,
                    { backgroundColor: colors.promotionPieceButton },
                  ]}
                  onPress={() => onSelect(piece)}
                  activeOpacity={0.7}
                >
                  <Image source={source} style={sizes.image} />
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

PromotionDialog.displayName = 'PromotionDialog';
