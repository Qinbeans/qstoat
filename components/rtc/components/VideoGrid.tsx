import { Show } from "solid-js";
import {
  TrackLoop,
  TrackReference,
  VideoTrack,
  isTrackReference,
  useEnsureParticipant,
  useTrackRefContext,
  useTracks,
} from "solid-livekit-components";

import { Track } from "livekit-client";
import { css } from "styled-system/css";

import { OverflowingText } from "@revolt/ui";

export function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div
      class={css({
        display: "grid",
        gap: "0.8em",
        padding: "1.6em",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gridAutoRows: "1fr",
        minHeight: 0,
        overflowY: "auto",
      })}
    >
      <TrackLoop tracks={tracks}>{() => <VideoTile />}</TrackLoop>
    </div>
  );
}

function VideoTile() {
  const track = useTrackRefContext();
  const participant = useEnsureParticipant();

  const isScreenShare = () => track.source === Track.Source.ScreenShare;

  return (
    <div
      class={css({
        position: "relative",
        display: "grid",
        borderRadius: "var(--borderRadius-lg)",
        background: "black",
        overflow: "hidden",
      })}
      style={{
        "grid-column": isScreenShare() ? "span 2" : "span 1",
        "aspect-ratio": isScreenShare() ? "16/9" : "4/3",
      }}
    >
      <Show
        when={isTrackReference(track)}
        fallback={
          <div
            class={css({
              gridArea: "1/1",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontSize: "0.9em",
            })}
          >
            <span>{participant.identity}</span>
          </div>
        }
      >
        <VideoTrack
          style={{ "grid-area": "1/1" }}
          trackRef={track as TrackReference}
          manageSubscription={false}
        />
      </Show>

      {/* Participant label overlay */}
      <div
        class={css({
          minWidth: 0,
          gridArea: "1/1",
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "end",
          padding: "2",
          fontSize: "0.8em",
          color: "white",
          textShadow: "1px 1px 4px black",
        })}
      >
        <span class={css({ minWidth: 0 })}>
          <OverflowingText>{participant.identity}</OverflowingText>
        </span>
      </div>
    </div>
  );
}
