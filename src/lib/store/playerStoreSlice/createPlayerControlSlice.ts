import { StateCreator } from "zustand";
import { PlayerControlSlice, SharedPlayerState } from "@/lib/types/player";
import {
  checkMusic,
  getSongLyric,
  getSongMusicDetail,
  getSongUrl,
  unblockMusic,
} from "@/lib/services/song";
import {
  getQualityKeyByLevel,
  needsDowngrade,
  QualityKey,
  SONG_QUALITY,
} from "@/lib/constants/song";
import { corePlayer } from "@/lib/player/corePlayer";
import { getPlaylistAllTrack } from "@/lib/services/playlist";
import { getAlbum } from "@/lib/services/album";
import { getArtistAllSongs } from "@/lib/services/artist";
import { REPEAT_MODE_CONFIG } from "@/lib/constants/player";
import { useUserStore } from "../userStore";

let currentPlayAbortController: AbortController | null = null;

export const createPlayerControlSlice: StateCreator<
  SharedPlayerState,
  [],
  [],
  PlayerControlSlice
> = (set, get) => ({
  isPlaying: false,
  isLoadingMusic: false,
  repeatMode: "order",
  isShuffle: false,
  volume: 0.7,
  progress: 0,
  duration: 0,
  currentTime: 0,

  playSong: async (song) => {
    if (currentPlayAbortController) currentPlayAbortController.abort();
    currentPlayAbortController = new AbortController();

    const { signal } = currentPlayAbortController;

    try {
      const { playlist, preferMusicLevel } = get();

      const existingIndex = playlist.findIndex((s) => s.id === song.id);
      let targetIndex: number;

      if (existingIndex !== -1) targetIndex = existingIndex;
      else {
        targetIndex = playlist.length;
        set({ playlist: [...playlist, song] });
      }

      set({ currentSong: song, currentIndexInPlaylist: targetIndex });

      set({ isLoadingMusic: true, currentTime: 0, progress: 0 });

      // 先检查歌曲是否可用
      let url;
      const canPlay =
        song.privilege && song.privilege.st >= 0 && song.privilege.pl > 0;

      if (!canPlay) {
        // 尝试解锁灰色歌曲
        url = (await unblockMusic(song.id, signal)).data;
        set({ currentMusicLevel: "unlock" });
      } else {
        const maxQualityKey = getQualityKeyByLevel(song.privilege?.maxBrLevel);

        let targetQuality: QualityKey = preferMusicLevel;
        if (needsDowngrade(targetQuality, maxQualityKey)) {
          targetQuality = maxQualityKey;
        }

        const res = await getSongUrl(
          [song.id.toString()],
          SONG_QUALITY[targetQuality].level,
          false,
          signal,
        );
        url = res[0].url;

        set({ currentMusicLevel: targetQuality });
      }

      const musicDetail = await getSongMusicDetail(song.id, signal);

      // 获取歌词信息
      const musicLyric = await getSongLyric(song.id, signal);
      set({ currentSongLyrics: musicLyric });

      if (url && musicDetail) {
        corePlayer.play(
          url,
          () => {
            get().next();
          },
          (duration) => {
            set({ isPlaying: true, duration });
          },
          (currentTime) => {
            const { duration } = get();
            const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
            set({ currentTime, progress });
          },
        );
        set({
          isLoadingMusic: false,
          currentSongMusicDetail: musicDetail,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("播放被中断");
        return;
      }
    }
  },

  playList: async (listId, listType) => {
    set({ isLoadingMusic: true });

    try {
      let songs;

      switch (listType) {
        case "list": {
          const res = await getPlaylistAllTrack(listId);
          songs = res;
          break;
        }
        case "album": {
          const res = await getAlbum(listId);
          songs = res?.songs;
          break;
        }
      }

      if (!songs || !songs.length) {
        set({ isLoadingMusic: false });
        return;
      }

      set({ playlist: songs });

      await get().playSong(songs[0]);
    } catch (error) {
      console.error("播放歌单失败", error);
      set({ isPlaying: false, isLoadingMusic: false });
    }
  },

  playArtist: async (artistId) => {
    set({ isLoadingMusic: true });
    try {
      const music = await getArtistAllSongs({ id: artistId });
      const songs = music.songDetails;

      if (!songs || !songs.length) {
        set({ isLoadingMusic: false });
        return;
      }

      set({ playlist: songs });
      await get().playSong(songs[0]);
    } catch (err) {
      console.error("从歌手详情播放失败", err);
      set({ isPlaying: false, isLoadingMusic: false });
    }
  },

  togglePlay: () => {
    const { isPlaying, currentSong, playSong } = get();
    if (!currentSong) return;

    if (!corePlayer.isReady()) {
      playSong(currentSong);
      return;
    }

    if (isPlaying) corePlayer.pause();
    else corePlayer.resume();

    set({ isPlaying: !isPlaying });
  },

  next: () => {
    const {
      togglePlay,
      currentIndexInPlaylist,
      playlist,
      currentSong,
      repeatMode,
      isShuffle,
    } = get();
    if (!currentSong || playlist.length === 0) return;

    // 单曲循环
    if (repeatMode === "single") {
      corePlayer.seek(0);
      corePlayer.resume();
      set({ isPlaying: true });
      return;
    }

    let nextIdx: number;
    // 随机播放
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * playlist.length);
      if (playlist.length > 1 && nextIdx === currentIndexInPlaylist) {
        nextIdx = (nextIdx + 1) % playlist.length;
      }
    }
    // 顺序或循环
    else {
      nextIdx = currentIndexInPlaylist + 1;
      // 顺序播放时，最后一首播完就暂停
      if (nextIdx >= playlist.length) {
        nextIdx = 0;
        if (repeatMode === "order") {
          set({ currentIndexInPlaylist: 0 });
          togglePlay();
          return;
        }
      }
    }

    set({ currentIndexInPlaylist: nextIdx });
    get().playSong(playlist[nextIdx]);
  },

  prev: () => {
    const {
      currentIndexInPlaylist,
      playlist,
      currentSong,
      repeatMode,
      isShuffle,
    } = get();
    if (!currentSong || playlist.length === 0) return;

    // 单曲循环
    if (repeatMode === "single") {
      corePlayer.seek(0);
      corePlayer.resume();
      set({ isPlaying: true });
      return;
    }

    let prevIdx: number;
    // 随机播放
    if (isShuffle) {
      prevIdx = Math.floor(Math.random() * playlist.length);
      if (playlist.length > 1 && prevIdx === currentIndexInPlaylist) {
        prevIdx = (prevIdx - 1 + playlist.length) % playlist.length;
      }
    }
    // 顺序或循环
    else {
      prevIdx = currentIndexInPlaylist - 1;
      if (prevIdx < 0) {
        prevIdx = playlist.length - 1;
        if (repeatMode === "order") {
          prevIdx = 0;
        }
      }
    }

    set({ currentIndexInPlaylist: prevIdx });
    get().playSong(playlist[prevIdx]);
  },

  updateProgress: () => {
    const currentTime = corePlayer.getPosition();
    const { duration } = get();
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    set({ currentTime, progress });
  },

  updateVolume: (volume: number) => {
    corePlayer.setVolume(volume);
    set({ volume });
  },

  seek: (percentage: number) => {
    corePlayer.seek(percentage / 100);
    get().updateProgress();
  },

  toggleRepeatMode: () => {
    const { repeatMode, isShuffle } = get();

    const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
    const nextRepetMode = repeatModeConfig.next;
    if (!REPEAT_MODE_CONFIG[nextRepetMode].canShuffle && isShuffle) {
      set({ isShuffle: false });
    }
    set({ repeatMode: nextRepetMode });
  },

  toggleShuffleMode: () => {
    const { isShuffle } = get();
    set({ isShuffle: !isShuffle });
  },
});
