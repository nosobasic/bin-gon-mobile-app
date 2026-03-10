import React from 'react';
import {
  View,
  Image,
  StyleSheet,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

interface DecorativeElementProps {
  source: any;
  size?: number;
  position?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft' | 'center';
  style?: any;
}

const DecorativeElement: React.FC<DecorativeElementProps> = ({
  source,
  size = wp(31),
  position = 'topRight',
  style,
}) => {
  const getPositionStyle = () => {
    switch (position) {
      case 'topRight':
        return styles.topRight;
      case 'topLeft':
        return styles.topLeft;
      case 'bottomRight':
        return styles.bottomRight;
      case 'bottomLeft':
        return styles.bottomLeft;
      case 'center':
        return styles.center;
      default:
        return styles.topRight;
    }
  };

  return (
    <View style={[styles.container, getPositionStyle(), style]}>
      <Image 
        source={source} 
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  center: {
    top: '50%',
    left: '50%',
    transform: [{ translateX: -wp(15.5) }, { translateY: -wp(15.5) }],
  },
  image: {
    width: wp(31),
    height: wp(31),
  },
});

export default DecorativeElement; 