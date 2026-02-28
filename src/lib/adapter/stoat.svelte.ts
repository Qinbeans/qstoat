/**
 * stoat.js → Svelte 5 event-driven adapter.
 *
 * stoat.js uses SolidJS signals internally. This adapter bridges its
 * AsyncEventEmitter interface to Svelte $state runes so components
 * can reactively observe the data.
 */

import { SvelteMap, SvelteSet } from "svelte/reactivity";
import type {
  Channel,
  Client,
  Emoji,
  Message,
  Server,
  ServerMember,
  User,
  UserProfile,
} from "stoat.js";

// Minimal shapes for the "old state" objects passed to delete/leave events.
// These are internal hydration types not exported by stoat.js.
type WithId = { id: string };
type WithChannelId = { id: string; channelId: string };
type WithMemberId = { id: { server: string; user: string } };

export type StoatStore = ReturnType<typeof createStoatStore>;

export function createStoatStore() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  let client = $state<Client | null>(null);
  let selfProfile = $state<UserProfile | null>(null);

  // ── Collections ───────────────────────────────────────────────────────────
  // Classes use camelCase hydrated field names: id, channelId, serverId, etc.
  const servers = new SvelteMap<string, Server>();
  const channels = new SvelteMap<string, Channel>();
  const users = new SvelteMap<string, User>();
  // members[serverId][userId] = ServerMember
  const members = new SvelteMap<string, SvelteMap<string, ServerMember>>();
  // messages[channelId] = ordered Message array
  const messages = new SvelteMap<string, Message[]>();
  const emojis = new SvelteMap<string, Emoji>();
  const unreads = new SvelteSet<string>();

  // ── Helpers ───────────────────────────────────────────────────────────────
  function ensureMembers(serverId: string): SvelteMap<string, ServerMember> {
    if (!members.has(serverId)) members.set(serverId, new SvelteMap());
    return members.get(serverId)!;
  }

  function ensureMessages(channelId: string): Message[] {
    if (!messages.has(channelId)) messages.set(channelId, []);
    return messages.get(channelId)!;
  }

  // ── Connect ───────────────────────────────────────────────────────────────
  function connect(newClient: Client) {
    client = newClient;

    // connect() is always called from inside Login's "ready" handler, so the
    // client is already fully hydrated here. Seed state immediately.
    for (const server of newClient.servers.values()) servers.set(server.id, server);
    for (const channel of newClient.channels.values()) channels.set(channel.id, channel);
    for (const user of newClient.users.values()) users.set(user.id, user);
    for (const emoji of newClient.emojis.values()) emojis.set(emoji.id, emoji);

    // Fetch self profile (banner + bio) once and store in context.
    newClient.user?.fetchProfile()
      .then((p) => { selfProfile = p; })
      .catch((e) => { console.error("[stoat] fetchProfile failed:", e); });

    // Servers
    newClient.on("serverCreate", (server: Server) => servers.set(server.id, server));
    newClient.on("serverUpdate", (server: Server) => servers.set(server.id, server));
    newClient.on("serverDelete", (server: WithId) => servers.delete(server.id));
    newClient.on("serverLeave", (server: WithId) => servers.delete(server.id));

    // Channels
    newClient.on("channelCreate", (channel: Channel) => channels.set(channel.id, channel));
    newClient.on("channelUpdate", (channel: Channel) => channels.set(channel.id, channel));
    newClient.on("channelDelete", (channel: WithId) => channels.delete(channel.id));

    // Messages
    newClient.on("messageCreate", (message: Message) => {
      const list = ensureMessages(message.channelId);
      messages.set(message.channelId, [...list, message]);
    });
    newClient.on("messageUpdate", (message: Message) => {
      const list = ensureMessages(message.channelId);
      messages.set(
        message.channelId,
        list.map((m) => (m.id === message.id ? message : m)),
      );
    });
    newClient.on("messageDelete", (old: WithChannelId) => {
      const list = ensureMessages(old.channelId);
      messages.set(old.channelId, list.filter((m) => m.id !== old.id));
    });

    // Users
    newClient.on("userUpdate", (user: User) => users.set(user.id, user));

    // Server members
    newClient.on("serverMemberJoin", (member: ServerMember) => {
      ensureMembers(member.id.server).set(member.id.user, member);
    });
    newClient.on("serverMemberLeave", (old: WithMemberId) => {
      members.get(old.id.server)?.delete(old.id.user);
    });
    newClient.on("serverMemberUpdate", (member: ServerMember) => {
      ensureMembers(member.id.server).set(member.id.user, member);
    });

    // Emojis
    newClient.on("emojiCreate", (emoji: Emoji) => emojis.set(emoji.id, emoji));
    newClient.on("emojiDelete", (old: WithId) => emojis.delete(old.id));
  }

  // ── Disconnect ────────────────────────────────────────────────────────────
  function disconnect() {
    if (client) {
      client.removeAllListeners?.();
      client = null;
    }
    servers.clear();
    channels.clear();
    users.clear();
    members.clear();
    messages.clear();
    emojis.clear();
    unreads.clear();
    selfProfile = null;
  }

  return {
    get client() { return client; },
    /** The currently authenticated user (populated after "ready") */
    get self() { return client?.user ?? null; },
    /** The self user's profile (banner + bio), fetched once on ready */
    get selfProfile() { return selfProfile; },
    servers,
    channels,
    users,
    members,
    messages,
    emojis,
    unreads,
    connect,
    disconnect,
  };
}
