/**
 * Svelte context keys used with setContext/getContext throughout the app.
 * Using Symbols ensures uniqueness and avoids key collisions.
 */

export const STOAT_CTX = Symbol("stoat");
export const CLIENT_CTX = Symbol("client");
export const RTC_CTX = Symbol("rtc");
