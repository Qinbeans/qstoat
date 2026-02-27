import {
  Accessor,
  JSX,
  Setter,
  batch,
  createContext,
  createSignal,
  useContext,
} from "solid-js";
import { RoomContext } from "solid-livekit-components";

import { Room, Track } from "livekit-client";
import { Channel } from "stoat.js";

import { useState } from "@revolt/state";
import { Voice as VoiceSettings } from "@revolt/state/stores/Voice";
import { VoiceCallCardContext } from "@revolt/ui/components/features/voice/callCard/VoiceCallCard";

import { InRoom } from "./components/InRoom";
import { RoomAudioManager } from "./components/RoomAudioManager";
import { RoomVideoManager } from "./components/RoomVideoManager";

type State =
  | "READY"
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING";

class Voice {
  #settings: VoiceSettings;

  channel: Accessor<Channel | undefined>;
  #setChannel: Setter<Channel | undefined>;

  room: Accessor<Room | undefined>;
  #setRoom: Setter<Room | undefined>;

  state: Accessor<State>;
  #setState: Setter<State>;

  deafen: Accessor<boolean>;
  #setDeafen: Setter<boolean>;

  microphone: Accessor<boolean>;
  #setMicrophone: Setter<boolean>;

  video: Accessor<boolean>;
  #setVideo: Setter<boolean>;

  screenshare: Accessor<boolean>;
  #setScreenshare: Setter<boolean>;

  #onConnected: () => void;
  #onDisconnected: () => void;
  #onReconnecting: () => void;
  #onReconnected: () => void;
  #onLocalTrackUnpublished: (publication: any) => void;

  constructor(voiceSettings: VoiceSettings) {
    this.#settings = voiceSettings;

    const [channel, setChannel] = createSignal<Channel>();
    this.channel = channel;
    this.#setChannel = setChannel;

    const [room, setRoom] = createSignal<Room>();
    this.room = room;
    this.#setRoom = setRoom;

    const [state, setState] = createSignal<State>("READY");
    this.state = state;
    this.#setState = setState;

    const [deafen, setDeafen] = createSignal<boolean>(false);
    this.deafen = deafen;
    this.#setDeafen = setDeafen;

    const [microphone, setMicrophone] = createSignal(false);
    this.microphone = microphone;
    this.#setMicrophone = setMicrophone;

    const [video, setVideo] = createSignal(false);
    this.video = video;
    this.#setVideo = setVideo;

    const [screenshare, setScreenshare] = createSignal(false);
    this.screenshare = screenshare;
    this.#setScreenshare = setScreenshare;

    this.#onConnected = () => {};
    this.#onDisconnected = () => {};
    this.#onReconnecting = () => {};
    this.#onReconnected = () => {};
    this.#onLocalTrackUnpublished = () => {};
  }

  async connect(channel: Channel, auth?: { url: string; token: string }) {
    this.disconnect();

    const room = new Room({
      audioCaptureDefaults: {
        deviceId: this.#settings.preferredAudioInputDevice,
        echoCancellation: this.#settings.echoCancellation,
        noiseSuppression: this.#settings.noiseSupression,
      },
      videoCaptureDefaults: {
        deviceId: this.#settings.preferredVideoInputDevice,
      },
      audioOutput: {
        deviceId: this.#settings.preferredAudioOutputDevice,
      },
      screenShareCaptureDefaults: {
        audio: true,
        selfBrowserSurface: "exclude",
        resolution: {
          width: 1152,
          height: 648,
          frameRate: 15,
        },
      },
      publishDefaults: {
        simulcast: false,
        videoCodec: "vp8",
        screenShareEncoding: {
          maxBitrate: 3_000_000,
          maxFramerate: 15,
        },
      },
    });

    batch(() => {
      this.#setRoom(room);
      this.#setChannel(channel);
      this.#setState("CONNECTING");

      this.#setMicrophone(false);
      this.#setDeafen(false);
      this.#setVideo(false);
      this.#setScreenshare(false);

      if (this.speakingPermission)
        room.localParticipant
          .setMicrophoneEnabled(true)
          .then((track) => this.#setMicrophone(typeof track !== "undefined"));
    });

    this.#onConnected = () => this.#setState("CONNECTED");
    this.#onDisconnected = () => {
      batch(() => {
        this.#setState("DISCONNECTED");
        this.#setMicrophone(false);
        this.#setVideo(false);
        this.#setScreenshare(false);
      });
    };
    this.#onReconnecting = () => {
      this.#setState("RECONNECTING");
    };
    this.#onReconnected = () => {
      // Re-sync track states from the room — livekit republishes automatically
      batch(() => {
        this.#setState("CONNECTED");
        this.#setMicrophone(room.localParticipant.isMicrophoneEnabled);
        this.#setVideo(room.localParticipant.isCameraEnabled);
        this.#setScreenshare(room.localParticipant.isScreenShareEnabled);
      });
    };
    this.#onLocalTrackUnpublished = (publication) => {
      const source = publication.source;
      if (source === Track.Source.Microphone) this.#setMicrophone(false);
      else if (source === Track.Source.Camera) this.#setVideo(false);
      else if (source === Track.Source.ScreenShare) this.#setScreenshare(false);
    };

    room.addListener("connected", this.#onConnected);
    room.addListener("disconnected", this.#onDisconnected);
    room.addListener("reconnecting", this.#onReconnecting);
    room.addListener("reconnected", this.#onReconnected);
    room.addListener("localTrackUnpublished", this.#onLocalTrackUnpublished);

    if (!auth) {
      auth = await channel.joinCall("worldwide");
    }

    await room.connect(auth.url, auth.token, {
      autoSubscribe: false,
    });
  }

  disconnect() {
    const room = this.room();
    if (!room) return;

    room.removeListener("connected", this.#onConnected);
    room.removeListener("disconnected", this.#onDisconnected);
    room.removeListener("reconnecting", this.#onReconnecting);
    room.removeListener("reconnected", this.#onReconnected);
    room.removeListener("localTrackUnpublished", this.#onLocalTrackUnpublished);
    room.disconnect();

    batch(() => {
      this.#setState("READY");
      this.#setRoom(undefined);
      this.#setChannel(undefined);
    });
  }

  async toggleDeafen() {
    this.#setDeafen((s) => !s);
  }

  async toggleMute() {
    const room = this.room();
    if (!room) throw "invalid state";
    await room.localParticipant.setMicrophoneEnabled(
      !room.localParticipant.isMicrophoneEnabled,
    );

    this.#setMicrophone(room.localParticipant.isMicrophoneEnabled);
  }

  async toggleCamera() {
    const room = this.room();
    if (!room) throw "invalid state";
    try {
      if (room.localParticipant.isCameraEnabled) {
        await room.localParticipant.setCameraEnabled(false);
        this.#setVideo(false);
        return;
      }

      // Probe the camera before publishing so we can validate the aspect ratio
      // the server will reject tracks outside its configured bounds.
      const videoDeviceId = this.#settings.preferredVideoInputDevice;
      const probe = await navigator.mediaDevices.getUserMedia({
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
      });
      const videoTrack = probe.getVideoTracks()[0];
      const probeSettings = videoTrack.getSettings();
      const { width = 0, height = 0 } = probeSettings;
      probe.getTracks().forEach((t) => t.stop());

      if (width > 0 && height > 0) {
        const ratio = width / height;
        // Reject extreme or portrait aspect ratios — landscape cameras
        // (roughly 4:3 through 16:9 and a bit wider) are always safe.
        if (ratio < 0.5 || ratio > 3.0) {
          throw new Error(
            `Camera aspect ratio (${ratio.toFixed(2)}) is not supported.`,
          );
        }
      }

      const videoOptions = {
        resolution: {
          width: 640,
          height: 360,
          aspectRatio: 16 / 9,
          frameRate: 30,
        },
      };

      const trackPublication = await room.localParticipant.setCameraEnabled(true, videoOptions);

      // livekit maps resolution to `ideal` constraints, not `max`, so the
      // camera could capture at a higher native resolution. Enforce hard caps.
      if (trackPublication?.track) {
        await trackPublication.track.mediaStreamTrack.applyConstraints({
          width: { max: 640 },
          height: { max: 360 },
          frameRate: { max: 30 },
        });
      }

      this.#setVideo(room.localParticipant.isCameraEnabled);
    } catch (err) {
      console.error("[rtc] camera toggle failed", err);
    }
  }

  async toggleScreenshare() {
    const room = this.room();
    if (!room) throw "invalid state";
    try {
      if (room.localParticipant.isScreenShareEnabled) {
        await room.localParticipant.setScreenShareEnabled(false);
        this.#setScreenshare(false);
        return;
      }

      // Create tracks ourselves so we can apply hard `max` constraints
      // BEFORE publishing. livekit's setScreenShareEnabled only uses `ideal`
      // hints on non-Safari, so the server would see the full native resolution
      // in the SDP offer and reject the connection.
      const tracks = await room.localParticipant.createScreenTracks({
        audio: true,
        selfBrowserSurface: "exclude",
        resolution: {
          width: 1152,
          height: 648,
          frameRate: 15,
        },
      });

      const videoTrack = tracks.find((t) => t.kind === Track.Kind.Video);
      if (videoTrack) {
        await videoTrack.mediaStreamTrack.applyConstraints({
          width: { max: 1152 },
          height: { max: 648 },
          frameRate: { max: 15 },
        });
      }

      for (const track of tracks) {
        await room.localParticipant.publishTrack(track);
      }

      this.#setScreenshare(room.localParticipant.isScreenShareEnabled);
    } catch (err) {
      console.error("[rtc] screen share toggle failed", err);
    }
  }

  getConnectedUser(userId: string) {
    return this.room()?.getParticipantByIdentity(userId);
  }

  get listenPermission() {
    return !!this.channel()?.havePermission("Listen");
  }

  get speakingPermission() {
    return !!this.channel()?.havePermission("Speak");
  }

  get videoPermission() {
    return !!this.channel()?.havePermission("Video");
  }

  get screensharePermission() {
    return !!this.channel()?.havePermission("Video");
  }
}

const voiceContext = createContext<Voice>(null as unknown as Voice);

/**
 * Mount global voice context and room audio manager
 */
export function VoiceContext(props: { children: JSX.Element }) {
  const state = useState();
  const voice = new Voice(state.voice);

  return (
    <voiceContext.Provider value={voice}>
      <RoomContext.Provider value={voice.room}>
        <VoiceCallCardContext>{props.children}</VoiceCallCardContext>
        <InRoom>
          <RoomAudioManager />
          <RoomVideoManager />
        </InRoom>
      </RoomContext.Provider>
    </voiceContext.Provider>
  );
}

export const useVoice = () => useContext(voiceContext);
