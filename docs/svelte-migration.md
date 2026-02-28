# SolidJS → Svelte 5 Migration Guide

> High-level architecture migration plan for the Stoat chat client.
> Current stack: SolidJS + `stoat.js` (SolidJS-reactive) + Tauri + PandaCSS.
> Target stack: Svelte 5 + `stoat.js` (event-driven adapter) + Tauri + PandaCSS.

---

## 1. Current Architecture

```mermaid
graph TD
    subgraph Tauri["Tauri (WKWebView / macOS)"]
        subgraph App["SolidJS App (src/)"]
            IDX["index.tsx\nrender() entry"]
            STATE["StateContext\n(SolidJS store + localforage)"]
            ROUTER["@solidjs/router\nRouter + Routes"]
            MOUNT["MountContext\n(providers)"]
        end

        subgraph Providers["Context Providers"]
            CC["ClientContext\n(stoat.js Client)"]
            KC["KeybindContext"]
            MC["ModalContext"]
            VC["VoiceContext\n(LiveKit RTC)"]
            QC["QueryClientProvider\n(TanStack Query)"]
            I18N["I18nProvider\n(Lingui)"]
        end

        subgraph Components["components/ (SolidJS)"]
            APP["app/\nMessages, DraftMessages, Menus"]
            UI["ui/\nDesign system, Layout, Voice UI"]
            RTCC["rtc/\nVoice state, LiveKit wrappers"]
            STATEC["state/\nStore classes, SyncWorker"]
            MD["markdown/\nMessage renderer"]
            MODAL["modal/\nModal system"]
        end

        subgraph Stoatjs["stoat.js (lib/)"]
            CLIENT["Client class\nAPI + WebSocket"]
            COLLS["Collections\n@solid-primitives/map|set"]
            CLASSES["Channel, Server, User…\nSolidJS signals internally"]
        end
    end

    IDX --> STATE
    IDX --> ROUTER
    ROUTER --> MOUNT
    MOUNT --> Providers
    Providers --> CC
    CC --> Stoatjs
    Stoatjs --> COLLS
    Components --> Stoatjs
```

---

## 2. Core Problem: SolidJS-Coupled Reactivity in `stoat.js`

The fundamental blocker is that `stoat.js` uses SolidJS primitives internally for reactivity.
Svelte cannot observe changes in SolidJS signals directly.

```mermaid
graph LR
    subgraph stoatjs["stoat.js internals"]
        SM["@solid-primitives/map\nReactiveMap"]
        SS["@solid-primitives/set\nReactiveSet"]
        SIG["createSignal()\nper-field reactivity"]
        STORE["createStore()\nObjectStorage"]
    end

    subgraph problem["Problem in Svelte"]
        DEAD["Svelte $state\ncannot observe\nSolidJS signals"]
    end

    SM --> DEAD
    SS --> DEAD
    SIG --> DEAD
    STORE --> DEAD
```

**Solution:** Wrap `stoat.js` with an **event-driven Svelte adapter** that subscribes to `client.on(...)` events and writes into Svelte `$state` runes.

---

## 3. Target Architecture

```mermaid
graph TD
    subgraph Tauri["Tauri (WKWebView / macOS)"]
        subgraph App["Svelte 5 App (src/)"]
            ENTRY["main.ts\nmount() entry"]
            SROUTER["svelte-routing or\nTanStack Router"]
        end

        subgraph Providers["Svelte Context (setContext/getContext)"]
            SCLIENT["clientContext\nstoat.js Client"]
            SSTATE["appState\nSvelte $state runes"]
            SQUERY["TanStack Query\n(framework-agnostic)"]
            SRTC["rtcContext\nLiveKit room"]
            SI18N["i18n\nLingui core (no framework)"]
        end

        subgraph Adapter["stoat.js Svelte Adapter (new)"]
            EVT["client.on('serverCreate')\nclient.on('messageCreate')\netc."]
            RUNE["$state collections\nMap<id, Server>\nMap<id, Channel>\netc."]
            EVT --> RUNE
        end

        subgraph SvelteComponents["components/ (Svelte 5)"]
            SAPP["Messages, DraftMessages"]
            SUI["Design system (.svelte)"]
            SRTCC["RTC / Voice"]
            SMD["Markdown renderer"]
            SMODAL["Modal system"]
        end
    end

    ENTRY --> SROUTER
    SROUTER --> Providers
    Providers --> SCLIENT
    SCLIENT --> Adapter
    Adapter --> SvelteComponents
```

---

## 4. Migration Phases

```mermaid
gantt
    title Migration Phases
    dateFormat  YYYY-MM-DD
    section Phase 1 — Scaffold
        New Svelte 5 + Tauri project       :p1a, 2026-03-01, 3d
        Port PandaCSS / styled-system      :p1b, after p1a, 2d
        Port Tauri capabilities / icons    :p1c, after p1a, 1d

    section Phase 2 — stoat.js Adapter
        Event-driven Svelte adapter        :p2a, after p1b, 5d
        $state collections (servers, channels, users) :p2b, after p2a, 3d
        Auth flow (login, session)         :p2c, after p2a, 2d

    section Phase 3 — Core UI
        Layout, Sidebar, Navigation        :p3a, after p2b, 4d
        Channel page + Message list        :p3b, after p3a, 5d
        Message composition + drafts       :p3c, after p3b, 3d

    section Phase 4 — Features
        Markdown renderer                  :p4a, after p3c, 3d
        Modals                             :p4b, after p3c, 2d
        Voice / RTC (LiveKit)              :p4c, after p4b, 5d
        Settings                           :p4d, after p4b, 4d

    section Phase 5 — Polish
        i18n (Lingui core)                 :p5a, after p4d, 2d
        Keybinds                           :p5b, after p4d, 2d
        PWA + service worker               :p5c, after p5b, 2d
        Tauri-specific (menus, titlebar)   :p5d, after p5c, 2d
```

---

## 5. Component-by-Component Mapping

```mermaid
graph LR
    subgraph Solid["SolidJS (current)"]
        S1["&lt;Show when={x}&gt;"]
        S2["&lt;For each={list}&gt;"]
        S3["&lt;Switch&gt; / &lt;Match&gt;"]
        S4["createSignal()"]
        S5["createMemo()"]
        S6["createEffect()"]
        S7["createStore()"]
        S8["useContext()"]
        S9["onCleanup()"]
        S10["&lt;Router root={X}&gt;"]
    end

    subgraph Svelte["Svelte 5 (target)"]
        V1["{#if x}"]
        V2["{#each list}"]
        V3["{#if} / {:else if}"]
        V4["let x = $state()"]
        V5["let x = $derived()"]
        V6["$effect()"]
        V7["let x = $state(obj)"]
        V8["getContext()"]
        V9["onDestroy()"]
        V10["&lt;Router&gt; or file-based"]
    end

    S1 --> V1
    S2 --> V2
    S3 --> V3
    S4 --> V4
    S5 --> V5
    S6 --> V6
    S7 --> V7
    S8 --> V8
    S9 --> V9
    S10 --> V10
```

---

## 6. `stoat.js` Adapter Strategy

Rather than forking `stoat.js`, create a thin adapter that bridges its event emitter to Svelte `$state`:

```mermaid
sequenceDiagram
    participant API as Stoat WS / REST
    participant Client as stoat.js Client
    participant Adapter as Svelte Adapter
    participant Component as Svelte Component

    API->>Client: WebSocket event (e.g. messageCreate)
    Client->>Client: Updates internal SolidJS collection
    Client->>Adapter: client.on("messageCreate", msg)
    Adapter->>Adapter: messages.set(msg.id, msg)  [$state Map]
    Adapter->>Component: Svelte reactivity propagates
    Component->>Component: Re-renders affected DOM
```

Key adapter responsibilities:
- Subscribe to all `client.on(...)` events on init
- Maintain `$state` Maps for `servers`, `channels`, `users`, `members`, `messages`
- Expose typed `getContext()` accessors throughout the app
- Handle `unsubscribe` / cleanup in `onDestroy`

---

## 7. What Transfers Directly (No Rewrite)

| Asset | Status |
|---|---|
| `stoat.js` API client (HTTP + WS) | ✅ Keep as-is |
| Tauri `src-tauri/` (Rust, capabilities, icons) | ✅ Keep as-is |
| PandaCSS config + `styled-system/` output | ✅ Keep as-is |
| `lingui.config.ts` + translation catalogs | ✅ Keep, use Lingui core |
| `playwright.config.ts` + E2E tests | ✅ Keep |
| PWA manifest + service worker logic | ✅ Port (minimal changes) |
| LiveKit RTC logic (`components/rtc/`) | ⚠️ Port (swap SolidJS signals for `$state`) |
| Markdown renderer logic | ⚠️ Port (swap JSX for Svelte snippets) |
| All SolidJS `.tsx` components | ❌ Rewrite as `.svelte` |
| `@solid-primitives/*` collections | ❌ Replace with `$state` Maps |
| `@solidjs/router` | ❌ Replace with TanStack Router or svelte-routing |
| `vite-plugin-solid` | ❌ Replace with `@sveltejs/vite-plugin-svelte` |
