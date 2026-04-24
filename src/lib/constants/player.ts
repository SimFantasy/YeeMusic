import {
  ArrowRepeat120Regular,
  ArrowRepeatAll20Regular,
  ArrowRepeatAllOff20Regular,
  ArrowShuffle20Regular,
  ArrowShuffleOff20Regular,
} from "@fluentui/react-icons";

export const REPEAT_MODE_LIST = [
  {
    type: "order",
    icon: ArrowRepeatAllOff20Regular,
    label: "顺序播放",
    next: "repeat",
    canShuffle: true,
  },
  {
    type: "repeat",
    icon: ArrowRepeatAll20Regular,
    label: "列表循环",
    next: "single",
    canShuffle: true,
  },
  {
    type: "single",
    icon: ArrowRepeat120Regular,
    label: "单曲循环",
    next: "order",
    canShuffle: false,
  },
] as const;

export type RepeatType = (typeof REPEAT_MODE_LIST)[number]["type"];
export type RepeatMode = (typeof REPEAT_MODE_LIST)[number];

export const REPEAT_MODE_BY_TYPE = Object.fromEntries(
  REPEAT_MODE_LIST.map((q) => [q.type, q]),
) as Record<RepeatType, RepeatMode>;

export const SHUFFLE_MODE = [
  { type: "on", icon: ArrowShuffle20Regular, label: "随机" },
  { type: "off", icon: ArrowShuffleOff20Regular, label: "顺序" },
] as const;

export type ShuffleType = (typeof SHUFFLE_MODE)[number]["type"];
export type ShuffleMode = (typeof SHUFFLE_MODE)[number];

export const SHUFFLE_MODE_BY_TYPE = Object.fromEntries(
  SHUFFLE_MODE.map((q) => [q.type, q]),
) as Record<ShuffleType, ShuffleMode>;
