import { PermissionsAndroid, Platform } from 'react-native';
import { launchImageLibrary, type Asset, type ImageLibraryOptions } from 'react-native-image-picker';

export interface PickedVideo {
  uri: string;
  fileName: string;
  durationMs: number;
  width?: number;
  height?: number;
  fileSize?: number;
}

const requestAndroidGalleryPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission =
    Platform.Version >= 33
      ? ((PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_VIDEO ?? 'android.permission.READ_MEDIA_VIDEO')
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const granted = await PermissionsAndroid.request(permission, {
    title: 'Gallery access permission',
    message: 'OpenCut يحتاج الوصول لمعرض الفيديو لاستيراد مقاطع الفيديو.',
    buttonPositive: 'سماح',
    buttonNegative: 'رفض',
  });

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const pickVideoFromGallery = async (): Promise<PickedVideo | null> => {
  const hasPermission = await requestAndroidGalleryPermission();

  if (!hasPermission) {
    return null;
  }

  const options: ImageLibraryOptions = {
    mediaType: 'video',
    includeExtra: true,
    selectionLimit: 1,
  };

  const result = await launchImageLibrary(options);
  const asset = result.assets?.[0];

  if (!asset || !asset.uri) {
    return null;
  }

  return {
    uri: asset.uri,
    fileName: asset.fileName ?? asset.uri.split('/').pop() ?? 'video.mp4',
    durationMs: asset.duration != null ? Math.round(asset.duration * 1000) : 0,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
  };
};
