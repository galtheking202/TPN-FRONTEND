import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { getCategoryImage, getCategoryImageSquare } from '../utils/categoryImages';

interface Props {
  uri?: string;
  category?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  square?: boolean;
}

export default function ArticleImage({ uri, category, style, resizeMode = 'cover', square = false }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => { setFailed(false); }, [uri]);

  const fallback = square ? getCategoryImageSquare(category) : getCategoryImage(category);
  const source = (uri && !failed) ? { uri } : fallback;

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}
