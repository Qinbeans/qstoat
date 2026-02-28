import type { API } from "stoat.js";
type RevoltConfig = API.RevoltConfig;

/**
 * Static server configuration built from Vite environment variables.
 * Passed as the second argument to `new Client(options, config)` so the
 * client uses the correct WS / media / proxy URLs without needing to
 * make an extra GET "/" round-trip at startup.
 *
 * Fields not driven by env vars (vapid, build) are left as empty strings —
 * they are only used for display/informational purposes and are not required
 * for connection or media functionality.
 */
export const serverConfig: RevoltConfig = {
  revolt: "",
  app: "QStoat",
  ws: import.meta.env.VITE_WS_URL,
  vapid: "",
  build: {} as never,
  features: {
    invite_only: false,
    captcha: {} as never,
    email: false,
    autumn: { enabled: true, url: import.meta.env.VITE_MEDIA_URL },
    january: { enabled: true, url: import.meta.env.VITE_PROXY_URL },
    // Disabled by default — the live server config overrides this if livekit is available.
    livekit: { enabled: false, nodes: [] },
  },
};
