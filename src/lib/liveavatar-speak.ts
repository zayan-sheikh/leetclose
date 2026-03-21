import {
  CommandEventsEnum,
  LiveAvatarSession,
  SessionState,
} from "@heygen/liveavatar-web-sdk";
import type { Room } from "livekit-client";

/** Must match SDK `LIVEKIT_COMMAND_CHANNEL_TOPIC` (see @heygen/liveavatar-web-sdk). */
const LIVEKIT_COMMAND_TOPIC = "agent-control";

function getRoom(session: LiveAvatarSession): Room {
  return (session as unknown as { room: Room }).room;
}

export function isLiveAvatarRoomConnected(session: LiveAvatarSession): boolean {
  if (session.state !== SessionState.CONNECTED) return false;
  return getRoom(session).state === "connected";
}

function makeEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sends response text to Live Avatar over the LiveKit data channel.
 *
 * This bypasses SDK WebSocket routing and targets the LiveKit command topic directly,
 * which is more reliable for sandbox/LITE command compatibility.
 */
export function liveSpeakResponse(
  session: LiveAvatarSession,
  text: string,
): void {
  if (!isLiveAvatarRoomConnected(session)) {
    throw new Error("Session needs to be connected to send command event");
  }
  const room = getRoom(session);
  const commandEvent = {
    event_id: makeEventId(),
    event_type: CommandEventsEnum.AVATAR_SPEAK_RESPONSE,
    text,
  };
  const data = new TextEncoder().encode(JSON.stringify(commandEvent));
  room.localParticipant.publishData(data, {
    reliable: true,
    topic: LIVEKIT_COMMAND_TOPIC,
  });
}

/** Sends direct TTS text command over LiveKit data channel. */
export function liveSpeakText(session: LiveAvatarSession, text: string): void {
  if (!isLiveAvatarRoomConnected(session)) {
    throw new Error("Session needs to be connected to send command event");
  }
  const room = getRoom(session);
  const commandEvent = {
    event_id: makeEventId(),
    event_type: CommandEventsEnum.AVATAR_SPEAK_TEXT,
    text,
  };
  const data = new TextEncoder().encode(JSON.stringify(commandEvent));
  room.localParticipant.publishData(data, {
    reliable: true,
    topic: LIVEKIT_COMMAND_TOPIC,
  });
}
