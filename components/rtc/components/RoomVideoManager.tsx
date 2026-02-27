import { createEffect } from "solid-js";
import { useTracks } from "solid-livekit-components";

import { isLocal } from "@livekit/components-core";
import { RemoteTrackPublication, Track } from "livekit-client";

/**
 * Automatically subscribes to all visible video tracks.
 * A future IntersectionObserver-aware version can pass a set of
 * visible participant IDs from the grid component.
 */
export function RoomVideoManager(props: { visibleIds?: Set<string> }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false, updateOnlyOn: [] },
  );

  createEffect(() => {
    for (const track of tracks()) {
      if (isLocal(track.participant)) continue;
      if (track.publication.kind !== Track.Kind.Video) continue;

      const pub = track.publication as RemoteTrackPublication;
      const shouldSubscribe =
        !props.visibleIds || props.visibleIds.has(track.participant.identity);

      if (pub.isSubscribed !== shouldSubscribe) {
        pub.setSubscribed(shouldSubscribe);
      }
    }
  });

  return null;
}
