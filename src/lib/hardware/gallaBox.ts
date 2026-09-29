"use client";

import { useSyncExternalStore } from "react";

/**
 * Galla Box — the GALLA counter device (ESP32 + OLED + speaker + push-to-talk button).
 * The browser talks to it over USB with the Web Serial API using newline-delimited JSON
 * (firmware: hardware/galla-box). Without a device, a built-in simulator mirrors the same protocol.
 */

export type Led = "off" | "green" | "amber" | "red";

/** App → device. */
export type BoxCommand =
  | { cmd: "ping" }
  | { cmd: "display"; l1: string; l2: string }
  | { cmd: "led"; color: Led }
  | { cmd: "announce"; amount: number; from?: string };

/** Device → app. */
export type BoxEvent = { evt: "hello"; fw: string; id: string } | { evt: "ptt"; state: "down" | "up" } | { evt: "ack"; cmd: string } | { evt: "error"; msg: string };

export interface BoxState {
  status: "disconnected" | "connecting" | "usb" | "sim";
  device?: string;
  display: [string, string];
  led: Led;
  lastAnnouncement?: string;
  /** Timestamp of the last push-to-talk press — screens react to changes. */
  pttAt: number;
  error?: string;
}

// Minimal Web Serial types (not in TypeScript's DOM lib yet).
interface SerialPortLike {
  open(o: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}
interface SerialLike {
  requestPort(o?: { filters?: { usbVendorId: number }[] }): Promise<SerialPortLike>;
}

/** USB-UART bridges used on ESP32 dev boards: Silicon Labs CP210x, WCH CH340, Espressif native USB. */
const USB_VENDORS = [0x10c4, 0x1a86, 0x303a];
export const BAUD = 115200;

const serial = (): SerialLike | undefined => (typeof navigator !== "undefined" ? (navigator as Navigator & { serial?: SerialLike }).serial : undefined);
export const webSerialSupported = () => !!serial();

let state: BoxState = { status: "disconnected", display: ["GALLA", "Not connected"], led: "off", pttAt: 0 };
const subs = new Set<() => void>();
/** What the firmware draws on boot (hardware/galla-box/galla-box.ino). */
const BOOT_SCREEN: [string, string] = ["GALLA  ready", "Press button to speak"];
const set = (patch: Partial<BoxState>) => {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
};

let port: SerialPortLike | null = null;
let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
let reader: ReadableStreamDefaultReader<string> | null = null;

function onEvent(e: BoxEvent) {
  if (e.evt === "hello") set({ device: `${e.fw} · ${e.id}` });
  else if (e.evt === "ptt" && e.state === "down") set({ pttAt: Date.now() });
  else if (e.evt === "error") set({ error: e.msg });
}

async function readLoop(r: ReadableStreamDefaultReader<string>) {
  let buf = "";
  try {
    for (;;) {
      const { value, done } = await r.read();
      if (done) break;
      buf += value;
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("{")) continue; // firmware boot logs
        try {
          onEvent(JSON.parse(line) as BoxEvent);
        } catch {
          // Ignore a garbled line.
        }
      }
    }
  } catch {
    // Cable unplugged.
  }
  if (state.status === "usb") set({ status: "disconnected", device: undefined, error: "Galla Box disconnected" });
}

const say = (text: string) => {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    window.speechSynthesis.speak(u);
  } catch {
    // Speech is optional in the simulator.
  }
};

export async function send(c: BoxCommand) {
  if (state.status !== "usb" && state.status !== "sim") return;
  // Mirror what the device shows so the on-screen panel matches the hardware.
  if (c.cmd === "display") set({ display: [c.l1.slice(0, 21), c.l2.slice(0, 21)] });
  if (c.cmd === "led") set({ led: c.color });
  if (c.cmd === "announce") {
    const text = `Received ${c.amount} rupees${c.from ? ` from ${c.from}` : ""}`;
    set({ lastAnnouncement: text });
    if (state.status === "sim") say(text);
  }
  if (state.status === "usb" && writer) await writer.write(new TextEncoder().encode(JSON.stringify(c) + "\n")).catch(() => set({ error: "Write failed" }));
}

export async function connectUsb() {
  const s = serial();
  if (!s) return set({ error: "Web Serial needs Chrome or Edge on desktop" });
  set({ status: "connecting", error: undefined });
  try {
    port = await s.requestPort({ filters: USB_VENDORS.map((usbVendorId) => ({ usbVendorId })) });
    await port.open({ baudRate: BAUD });
    writer = port.writable!.getWriter();
    reader = port.readable!.pipeThrough(new TextDecoderStream() as unknown as ReadableWritablePair<string, Uint8Array>).getReader();
    set({ status: "usb", device: "ESP32 · handshaking…", display: BOOT_SCREEN, led: "off" });
    void readLoop(reader);
    await send({ cmd: "ping" });
  } catch (e) {
    port = null;
    set({ status: "disconnected", error: (e as Error).name === "NotFoundError" ? "No device selected" : "Couldn't open the Galla Box port" });
  }
}

export function startSimulator() {
  set({ status: "sim", device: "Simulator · galla-box/1.0.0", error: undefined, display: BOOT_SCREEN, led: "off" });
}

export async function disconnect() {
  const was = state.status;
  set({ status: "disconnected", device: undefined, display: ["GALLA", "Not connected"], led: "off" });
  if (was !== "usb") return;
  await reader?.cancel().catch(() => {});
  writer?.releaseLock();
  await port?.close().catch(() => {});
  port = null;
  writer = null;
  reader = null;
}

/** The simulator's on-screen push-to-talk button. */
export const pressPtt = () => set({ pttAt: Date.now() });

export function useGallaBox(): BoxState {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
    () => state,
  );
}
