const roomImages = {
  study: require('../../assets/room-study.png'),
  lab: require('../../assets/room-lab.png'),
  library: require('../../assets/room-library.png'),
} as const;

export type RoomImageKey = keyof typeof roomImages;

export function roomImage(key: string): number {
  return roomImages[key as RoomImageKey] ?? roomImages.study;
}
