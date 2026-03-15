import { getSongDetail } from "@/lib/services/song";
import { likeSong } from "@/lib/services/user";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useUserStore } from "@/lib/store/userStore";
import { Resource, Song } from "@/lib/types";
import {
  Album24Regular,
  Heart24Filled,
  Heart24Regular,
  List24Regular,
  Person24Regular,
  Play24Filled,
  TextBulletListAdd24Regular,
} from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function GlobalContextMenu() {
  const navigate = useNavigate();
  const { isOpen, x, y, type, data, closeMenu } = useContextMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const { playSong, addToPlaylist, currentSong, isInPlaylist } =
    usePlayerStore();
  const { likeListSet, toggleLikeMusic } = useUserStore();

  const isLiked =
    type === "song" && data
      ? likeListSet.has(Number((data as Song).id))
      : type === "resource" && data
        ? likeListSet.has(Number((data as Resource).resourceId))
        : false;

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();

    if ((type !== "song" && type !== "resource") || !data) return;

    const songId =
      Number((data as Song).id) || Number((data as Resource).resourceId);
    const targetState = !isLiked;

    toggleLikeMusic(songId, targetState);

    try {
      const res = await likeSong(songId, targetState);

      if (!res) {
        toggleLikeMusic(Number((data as Song).id), isLiked);
        toast.error("操作失败，请重试", { position: "top-center" });
      }
    } catch (err) {
      toggleLikeMusic(Number((data as Song).id), isLiked);
      toast.error("操作失败，请重试", { position: "top-center" });
      console.log("切换歌曲喜欢状态失败", err);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const left = x + menuWidth > windowWidth ? x - menuWidth : x;
      const top = y + menuHeight > windowHeight ? y - menuHeight : y;

      setPosition({ left, top });
    }
  }, [isOpen, x, y]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      id="global-context-menu"
      className="fixed w-48 z-9999 pointer-events-auto bg-card backdrop-blur-md border border-border rounded-lg shadow-lg flex flex-col p-2"
      style={{
        top: position.top,
        left: position.left,
        visibility: position.top === 0 ? "hidden" : "visible",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {type === "artist" && (
        <ContextMenuButton
          icon={<Person24Regular className="size-4" />}
          content="查看歌手"
          onClick={() => {
            closeMenu();
          }}
        />
      )}

      {(type === "album" ||
        (type === "resource" &&
          (data as Resource).resourceType === "album")) && (
        <ContextMenuButton
          icon={<Album24Regular className="size-4" />}
          content="查看专辑"
          onClick={() => {
            const targetId = (data as any).id || (data as any).resourceId;
            navigate(`/detail/album?id=${targetId}`);

            closeMenu();
          }}
        />
      )}

      {(type === "playlist" ||
        (type === "resource" &&
          (data as Resource).resourceType === "list")) && (
        <ContextMenuButton
          icon={<List24Regular className="size-4" />}
          content="查看歌单"
          onClick={() => {
            const targetId = (data as any).id || (data as any).resourceId;
            navigate(`/detail/playlist?id=${targetId}`);

            closeMenu();
          }}
        />
      )}

      {(type === "song" ||
        (type === "resource" &&
          (data as Resource).resourceType === "song")) && (
        <>
          {(!currentSong || currentSong?.id !== (data as Song).id) && (
            <ContextMenuButton
              icon={<Play24Filled className="size-4" />}
              content="播放"
              onClick={async () => {
                closeMenu();
                let targetSong = data as Song;
                const resourceId = (data as any).id || (data as any).resourceId;

                if (!(data as Song).al && resourceId) {
                  const res = await getSongDetail([resourceId]);
                  if (res && res.length > 0) {
                    targetSong = res[0];
                  }
                }
                if (targetSong) {
                  playSong(targetSong);
                }
              }}
            />
          )}

          {!isInPlaylist({
            id: (data as any).id || (data as any).resourceId,
          } as Song) && (
            <>
              <ContextMenuButton
                icon={<TextBulletListAdd24Regular className="size-4" />}
                content="加入播放列表"
                onClick={async () => {
                  closeMenu();
                  let targetSong = data as Song;
                  const resourceId =
                    (data as any).id || (data as any).resourceId;

                  if (!(data as Song).al && resourceId) {
                    const res = await getSongDetail([resourceId]);
                    if (res && res.length > 0) {
                      targetSong = res[0];
                    }
                  }
                  if (targetSong) {
                    addToPlaylist(targetSong);
                  }
                }}
              />
              <ContextMenuSeperator />
            </>
          )}

          <ContextMenuButton
            icon={
              isLiked ? (
                <Heart24Filled className="size-4 text-red-500" />
              ) : (
                <Heart24Regular className="size-4" />
              )
            }
            content={isLiked ? "取消喜欢" : "喜欢"}
            onClick={(e) => {
              handleLike(e);
              closeMenu();
            }}
          />
        </>
      )}
      {type === "song" && (
        <>
          <ContextMenuButton
            icon={<Person24Regular className="size-4" />}
            content={`歌手：${(data as Song).ar?.[0]?.name}`}
            onClick={() => {
              navigate(`/detail/artist?id=${(data as Song).ar?.[0]?.id}`);
              closeMenu();
            }}
          />

          <ContextMenuButton
            icon={<Album24Regular className="size-4" />}
            content={`专辑：${(data as Song).al?.name}`}
            onClick={() => {
              navigate(`/detail/album?id=${(data as Song).al?.id}`);
              closeMenu();
            }}
          />

          {/* <ContextMenuButton
            icon={<Star24Regular className="size-4" />}
            content="收藏到歌单"
            onClick={() => {
              closeMenu();
            }}
          />

          <ContextMenuButton
            icon={<ArrowDownload24Regular className="size-4" />}
            content="下载"
            onClick={() => {
              closeMenu();
            }}
          /> */}

          {/* <ContextMenuSeperator />

          <ContextMenuButton
            icon={<Delete24Regular className="size-4" />}
            content="从歌单中移除"
            onClick={() => {
              closeMenu();
            }}
          />

          <ContextMenuButton
            icon={<Prohibited24Regular className="size-4" />}
            content="减少推荐"
            onClick={() => {
              closeMenu();
            }}
          /> */}
        </>
      )}
    </div>
  );
}

interface ContextMenuButtonProps {
  content?: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export function ContextMenuSeperator() {
  return <div className="h-px bg-border my-2" />;
}

export function ContextMenuButton({
  content,
  icon,
  onClick,
}: ContextMenuButtonProps) {
  return (
    <div
      className="flex gap-2 p-2 items-center text-sm hover:bg-foreground/5 rounded-md cursor-pointer"
      onClick={onClick}
    >
      <div className="size flex items-center justify-center">{icon}</div>
      <span className="line-clamp-1">{content}</span>
    </div>
  );
}
