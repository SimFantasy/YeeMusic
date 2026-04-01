import {
  useSettingStore,
  type AppearanceSettings,
} from "@/lib/store/settingStore";
import SettingsExpandar, {
  SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SONG_QUALITY } from "@/lib/constants/song";
import {
  CheckmarkCircle24Filled,
  CheckmarkStarburst24Regular,
  Color24Regular,
  Info24Regular,
  Speaker224Regular,
  TextFont24Regular,
  Water24Regular,
  Window24Regular,
} from "@fluentui/react-icons";
import { IconBrandGithub } from "@tabler/icons-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Update, check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { Input } from "@/components/ui/input";

export default function SettingPage() {
  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">音频</h2>

        <AudioSettingCard />
      </div>

      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">个性化</h2>

        <div className="flex flex-col gap-2">
          <AppearanceSettingCard />
          <MeshGradientSettingCard />
          <FontSettingCard />
        </div>
      </div>

      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">关于</h2>
        <div className="flex flex-col gap-2">
          <SettingsExpandar
            title="Yee Music"
            subtitle="更好用的网易云音乐客户端"
            icon={
              <img
                src={"/icons/logo.png"}
                className="object-cover"
                alt="Yee Music"
              />
            }
          >
            <div className="flex flex-col gap-0">
              <SettingsExpandarDetail desc="作者：isen" />
              <SettingsExpandarDetail
                desc="问题反馈"
                trailing={
                  <IconBrandGithub
                    className="size-4 hover:text-muted-foreground text-foreground cursor-pointer"
                    onClick={async () =>
                      await openUrl("https://github.com/1sen3/YeeMusicTauri")
                    }
                  />
                }
              />
            </div>
          </SettingsExpandar>
          <UpdateSettingCard />
        </div>
      </div>
    </div>
  );
}

function AudioSettingCard() {
  return (
    <div className="flex flex-col gap-1">
      <SettingsExpandar
        title="音频质量"
        subtitle="选择优先播放的音质（待实现）"
        icon={<Speaker224Regular />}
        trailing={
          <Combobox value={"无损"}>
            <ComboboxInput className="w-32 select-none! bg-card" />
            <ComboboxContent className="p-2 ring-0">
              <ComboboxList>
                {Object.keys(SONG_QUALITY).map((k) => (
                  <ComboboxItem
                    key={k}
                    value={SONG_QUALITY[k as keyof typeof SONG_QUALITY].desc}
                  >
                    {SONG_QUALITY[k as keyof typeof SONG_QUALITY].desc}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        }
      ></SettingsExpandar>
    </div>
  );
}

function AppearanceSettingCard() {
  const theme = useSettingStore((s) => s.appearance.theme);
  const setTheme = useSettingStore((s) => s.setTheme);
  const material = useSettingStore((s) => s.appearance.material);
  const setMaterial = useSettingStore((s) => s.setMaterial);

  const themeStr =
    theme === "system" ? "跟随系统" : theme === "light" ? "浅色" : "深色";

  return (
    <div className="flex flex-col gap-2">
      <SettingsExpandar
        title="主题"
        subtitle="选择 Yee Music 的显示主题"
        icon={<Color24Regular />}
        trailing={
          <span className="text-muted-foreground text-sm">{themeStr}</span>
        }
      >
        <div className="flex flex-col gap-0">
          <SettingsExpandarDetail>
            <div className="w-full flex flex-col items-start">
              <RadioGroup
                defaultValue={theme}
                onValueChange={(val) =>
                  setTheme(val as AppearanceSettings["theme"])
                }
              >
                <div className="flex gap-2 items-center">
                  <RadioGroupItem value="light" />
                  <span>浅色</span>
                </div>
                <div className="flex gap-2 items-center">
                  <RadioGroupItem value="dark" />
                  <span>深色</span>
                </div>
                <div className="flex gap-2 items-center">
                  <RadioGroupItem value="system" />
                  <span>跟随系统</span>
                </div>
              </RadioGroup>
            </div>
          </SettingsExpandarDetail>
        </div>
      </SettingsExpandar>

      <SettingsExpandar
        title="材质"
        subtitle="选择 Yee Music 的窗口材质"
        icon={<Window24Regular />}
        trailing={
          <div className="flex justify-end">
            <Combobox
              value={material}
              onValueChange={(val) =>
                setMaterial(val as AppearanceSettings["material"])
              }
            >
              <ComboboxInput className="w-24 select-none! " />
              <ComboboxContent className="p-2 ring-0">
                <ComboboxList>
                  <ComboboxItem key="acrylic" value="acrylic">
                    acrylic
                  </ComboboxItem>
                  <ComboboxItem key="mica" value="mica">
                    mica
                  </ComboboxItem>
                  <ComboboxItem key="none" value="none">
                    none
                  </ComboboxItem>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        }
      ></SettingsExpandar>
    </div>
  );
}

function MeshGradientSettingCard() {
  const updateMeshGradient = useSettingStore((s) => s.updateMeshGradient);
  const meshGradientProps = useSettingStore((s) => s.appearance.meshGradient);

  const [distortion, setDistortion] = useState(meshGradientProps.distortion);
  const [swirl, setSwirl] = useState(meshGradientProps.swirl);
  const [grainMixer, setGrainMixer] = useState(meshGradientProps.grainMixer);
  const [grainOverlay, setGrainOverlay] = useState(
    meshGradientProps.grainOverlay,
  );
  const [speed, setSpeed] = useState(meshGradientProps.speed);

  useEffect(() => {
    setDistortion(meshGradientProps.distortion);
  }, [meshGradientProps.distortion]);

  useEffect(() => {
    setSwirl(meshGradientProps.swirl);
  }, [meshGradientProps.swirl]);

  useEffect(() => {
    setGrainMixer(meshGradientProps.grainMixer);
  }, [meshGradientProps.grainMixer]);

  useEffect(() => {
    setGrainOverlay(meshGradientProps.grainOverlay);
  }, [meshGradientProps.grainOverlay]);

  useEffect(() => {
    setSpeed(meshGradientProps.speed);
  }, [meshGradientProps.speed]);

  return (
    <SettingsExpandar
      icon={<Water24Regular />}
      title="流体渐变"
      subtitle="配置流体渐变效果"
    >
      <div className="flex flex-col gap-0">
        <SettingsExpandarDetail desc="变形强度">
          <Input
            type="number"
            className="w-20 bg-card"
            value={distortion}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setDistortion(Number(e.target.value))}
            onBlur={() => {
              let val = distortion;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setDistortion(val);
              updateMeshGradient({ distortion: val });
            }}
          />
        </SettingsExpandarDetail>
        <SettingsExpandarDetail desc="漩涡强度">
          <Input
            type="number"
            className="w-20 bg-card"
            value={swirl}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setSwirl(Number(e.target.value))}
            onBlur={() => {
              let val = swirl;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setSwirl(val);
              updateMeshGradient({ swirl: val });
            }}
          />
        </SettingsExpandarDetail>
        <SettingsExpandarDetail desc="颗粒混合">
          <Input
            type="number"
            className="w-20 bg-card"
            value={grainMixer}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setGrainMixer(Number(e.target.value))}
            onBlur={() => {
              let val = grainMixer;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setGrainMixer(val);
              updateMeshGradient({ grainMixer: val });
            }}
          />
        </SettingsExpandarDetail>
        <SettingsExpandarDetail desc="颗粒叠加">
          <Input
            type="number"
            className="w-20 bg-card"
            value={grainOverlay}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setGrainOverlay(Number(e.target.value))}
            onBlur={() => {
              let val = grainOverlay;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setGrainOverlay(val);
              updateMeshGradient({ grainOverlay: val });
            }}
          />
        </SettingsExpandarDetail>
        <SettingsExpandarDetail desc="速度">
          <Input
            type="number"
            className="w-20 bg-card"
            value={speed}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setSpeed(Number(e.target.value))}
            onBlur={() => {
              let val = speed;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setSpeed(val);
              updateMeshGradient({ speed: val });
            }}
          />
        </SettingsExpandarDetail>
      </div>
    </SettingsExpandar>
  );
}

function FontSettingCard() {
  const fontSettings = useSettingStore((s) => s.appearance.font);
  const updateFont = useSettingStore((s) => s.updateFont);

  const [interfaceFont, setInterfaceFont] = useState(
    fontSettings.interfaceFontStr,
  );
  const [lyricFont, setLyricFont] = useState(fontSettings.lyricFontStr);

  useEffect(() => {
    setInterfaceFont(fontSettings.interfaceFontStr);
  }, [fontSettings.interfaceFontStr]);

  useEffect(() => {
    setLyricFont(fontSettings.lyricFontStr);
  }, [fontSettings.lyricFontStr]);

  return (
    <SettingsExpandar
      icon={<TextFont24Regular />}
      title="字体"
      subtitle="配置 Yee Music 的字体"
    >
      <SettingsExpandarDetail desc="界面字体">
        <Input
          className="w-60 bg-card"
          value={interfaceFont}
          placeholder={"例如：'PingFang UI', 'Google Sans'"}
          onChange={(e) => setInterfaceFont(e.target.value)}
          onBlur={() => updateFont({ interfaceFontStr: interfaceFont })}
        />
      </SettingsExpandarDetail>
      <SettingsExpandarDetail desc="歌词字体">
        <Input
          className="w-60 bg-card"
          value={lyricFont}
          placeholder={"例如：'PingFang UI', 'Google Sans'"}
          onChange={(e) => setLyricFont(e.target.value)}
          onBlur={() => updateFont({ lyricFontStr: lyricFont })}
        />
      </SettingsExpandarDetail>
    </SettingsExpandar>
  );
}

function UpdateSettingCard() {
  const [version, setVersion] = useState("");
  const [checking, setChecking] = useState(false);
  const [isNewest, setIsNewest] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateObj, setUpdateObj] = useState<Update | null>(null);
  const [progress, setProgress] = useState<{
    downloaded: number;
    contentLength: number;
  } | null>(null);

  async function checkForUpdates() {
    const update = await check();
    if (update) {
      console.log(`found update ${update.version}`);
      setUpdateObj(update);
      setIsNewest(false);
      toast.success(`发现新版本 v${update.version}！`, { duration: 3000 });
    } else {
      setUpdateObj(null);
      setIsNewest(true);
    }
  }

  async function handleUpdate() {
    if (!updateObj) return;

    setIsUpdating(true);

    let downloaded = 0;
    let contentLength = 0;

    try {
      await updateObj.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || 0;
            console.log(`started downloading ${contentLength} bytes`);
            setProgress({ downloaded, contentLength });
            break;
          case "Progress":
            downloaded += event.data.chunkLength || 0;
            console.log(`downloaded ${downloaded} from ${contentLength}`);
            setProgress({ downloaded, contentLength });
            break;
          case "Finished":
            console.log("download finished");
            break;
        }
      });

      console.log("update installed");
      toast.success("更新下载完成，即将重启并挂载更新...", { duration: 3000 });
      setTimeout(async () => {
        await relaunch();
      }, 3000);
    } catch (e) {
      console.log(`failed to install update: ${e}`);
      toast.error("更新失败，请稍后重试...");
    } finally {
      setIsUpdating(false);
      setProgress(null);
    }
  }

  async function handleCheck() {
    setChecking(true);
    setIsNewest(null);
    try {
      await checkForUpdates();
    } catch (e) {
      console.log(`failed to check update: ${e}`);
      toast.error("检查更新失败，请重试...");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    async function loadVersion() {
      const v = await getVersion();
      setVersion(v);
    }

    loadVersion();
  }, []);

  return (
    <div className="flex flex-col gap-0">
      <SettingsExpandar
        className={cn(isNewest !== null && "rounded-b-none")}
        title={`Beta ${version}`}
        icon={<CheckmarkStarburst24Regular />}
        trailing={
          <div className="flex justify-end">
            <Button
              className={cn(
                "bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2",
                checking && "bg-muted",
              )}
              onClick={handleCheck}
              disabled={checking || isUpdating}
            >
              <div className="flex gap-2 transition-[width] duration-300 ease-in-out">
                <Spinner
                  className={cn(
                    "transition-all duration-300 -mx-2.5",
                    checking
                      ? "opacity-100 scale-100 mx-0"
                      : "opacity-0 scale-75",
                  )}
                />
                <span>{checking ? "检查中..." : "检查更新"}</span>
              </div>
            </Button>
          </div>
        }
      ></SettingsExpandar>
      {isNewest === true && (
        <div className="bg-green-400/25 rounded-b-md border-t-0 border border-border p-4 flex items-center gap-2 text-sm">
          <CheckmarkCircle24Filled className="text-green-600" />
          已更新到最新版本
        </div>
      )}
      {isNewest === false && updateObj && (
        <div className="bg-card/60 rounded-b-md border-t-0 border border-border p-4 flex flex-col gap-4 text-sm">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-4">
              <Info24Regular className="text-foreground" />
              检测到新版本 v{updateObj.version}，是否立即更新？
            </div>

            <div className="flex items-center gap-4">
              <Button
                className={cn(
                  "bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2",
                )}
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <Spinner />
                    <span>
                      {progress && progress.contentLength > 0
                        ? `正在下载 (${((progress.downloaded / progress.contentLength) * 100).toFixed(0)}%)`
                        : "正在更新..."}
                    </span>
                  </div>
                ) : (
                  "立即更新"
                )}
              </Button>
            </div>
          </div>
          {isUpdating && progress && progress.contentLength > 0 && (
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{
                  width: `${(progress.downloaded / progress.contentLength) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
