import { repeatModeKey } from "../constants/player";
import { SONG_QUALITY } from "../constants/song";
import { QualityWithKey, Song, SongLyric } from "./song";

export interface PlayerState {
  currentSong: Song | null;
  currentIndexInPlaylist: number;
  currentSongMusicDetail: QualityWithKey[];
  currentSongLyrics: SongLyric | null;
  playlist: Song[];
  isPlaying: boolean;
  isLoadingMusic: boolean;
  preferMusicLevel: keyof typeof SONG_QUALITY;
  currentMusicLevel: keyof typeof SONG_QUALITY;
  repeatMode: "order" | "repeat" | "single"; // 顺序、循环、单曲循环
  isShuffle: boolean; // 是否随机
  volume: number;
  progress: number; // 0 ~ 100
  duration: number; // 当前歌曲总时长 s
  currentTime: number; // 当前播放时长 s
}

// 播放列表切片类型定义
export interface PlaylistSlice {
  playlist: Song[];
  currentIndexInPlaylist: number;
  addToPlaylist: (song: Song) => void;
  clearPlaylist: () => void;
  removeFromPlaylist: (song: Song) => void;
  isInPlaylist: (song: Song) => boolean;

  fmPlaylist: Song[];
}

// 播放控制切片类型定义
export interface PlayerControlSlice {
  isPlaying: boolean;
  isLoadingMusic: boolean;
  repeatMode: repeatModeKey;
  isShuffle: boolean;
  volume: number;
  progress: number;
  duration: number;
  currentTime: number;

  playSong: (song: Song, isFm?: boolean) => void;
  playQueue: (songs: Song[]) => void;
  playList: (
    listId: string | number,
    listType: "list" | "album" | "voicelist" | "userfm",
  ) => void;
  playArtist: (artistId: string) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  updateProgress: () => void;
  updateVolume: (volume: number) => void;
  seek: (percentage: number) => void;
  toggleRepeatMode: () => void;
  toggleShuffleMode: () => void;

  isFmMode: boolean; // 是否是漫游模式
  fmRepeatMode: boolean; // true：单曲循环，false：无限下一首
  toggleFmRepeatMode: () => void;
  playFm: () => void;
  fetchFmSongs: () => Promise<void>;
  nextFmSong: () => void;
  trashFmSong: () => Promise<void>; // 将当前播放的歌曲从 FM 加入垃圾桶
}

// 歌曲信息切片类型定义
export interface SongInfoSlice {
  currentSong: Song | null;
  currentSongMusicDetail: QualityWithKey[];
  currentSongLyrics: SongLyric | null;
  preferMusicLevel: keyof typeof SONG_QUALITY;
  currentMusicLevel: keyof typeof SONG_QUALITY;

  setPreferMusicLevel: (level: keyof typeof SONG_QUALITY) => void;
  setCurrentMusicLevel: (level: keyof typeof SONG_QUALITY) => void;
}

export type SharedPlayerState = PlaylistSlice &
  PlayerControlSlice &
  SongInfoSlice;
