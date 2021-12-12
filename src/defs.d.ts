/*declare const Twitch: {
    Player(el: string, opt: any): TwitchPlayer;
};
*/

import {
  YouTubePlayer,
  Options as YouTubePlayerOptions,
} from "youtube-player/dist/types";

declare global {
  interface Window {
    Twitch: {
      Player: {
        new (element: HTMLDivElement, opt: TwitchPlayerOptions): TwitchPlayer;
        PLAY: "1"; // dunno
        PAUSE: "2"; // dunno
        READY: "3"; // dunno
      };
    };
    YT: {
      Player: {
        new (element: HTMLDivElement, opt: YouTubePlayerOptions): YouTubePlayer;
      };
    };
    onYouTubeIframeAPIReady();
  }
}

interface TwitchPlayer {
  pause(): void;
  play(): void;
  seek(timestamp: number): void;
  setMuted(muted: boolean): void;
  getDuration(): number;
  getCurrentTime(): number;
  isPaused(): boolean;
  addEventListener(event: string, callback: () => void): void;
}

interface TwitchPlayerOptions {
  width?: string;
  height?: string;
  video?: string;
  autoplay?: boolean;
  controls?: boolean;
}

export interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

interface TwitchUserBadgeProxy {
  url: string;
  id: string;
}

interface TwitchUserBadge {
  versions: TwitchUserBadgeEntry[];
  url: string;
  id: string;
}

interface TwitchUserBadgeEntry {
  image_url_1x: string;
  image_url_2x: string;
  image_url_3x: string;
  description: string;
  title: string;
  click_action: string;
  click_url: string;
  // last_updated: string;
}

/*
interface TwitchUserBadge {

}
*/

export interface TwitchCommentProxy extends TwitchComment {
  time: string;
  gid: string | number;
  messageFragments: {
    type: string;
    data:
      | {
          network?: string;
          url?: string;
          name?: string;
          class?: string;
        }
      | string;
  }[];
  usernameColour: string;
  username: string;
  badges: TwitchUserBadgeProxy[];
  displayed: boolean;
}

interface TwitchCommentDump {
  comments: TwitchComment[];
  video: {
    created_at: string;
    description: string;
    duration: string;
    id: string;
    language: string;
    published_at: string;
    thumbnail_url: string;
    title: string;
    type: string;
    url: string;
    user_id: string;
    user_name: string;
    view_count: number;
    viewable: string;

    /** TwitchDownloader */
    start: number;
    /** TwitchDownloader */
    end: number;

    /** @deprecated */
    length: string;
    /** @deprecated */
    channel: {
      _id: string;
      display_name: string;
    };
    /** @deprecated */
    _id: string;
  };

  /** @deprecated */
  streamer: {
    name: string;
    id: string; // ?
  };
}

interface TwitchComment {
  // internal
  displayed: boolean;

  _id: string;
  channel_id: string;
  // commenter: Array;
  content_id: string;
  content_offset_seconds: number;
  content_type: string;
  commenter: {
    _id: string;
    bio: string;
    created_at: string;
    display_name: string;
    logo: string;
    name: string;
    type: string;
    updated_at: string;
  };
  message: {
    body: string;
    // emoticons: {}

    fragments: {
      text: string;
      emoticon: {
        emoticon_id: string;
        emoticon_set_id: string;
      };
    }[];
    user_badges: {
      _id: string;
      version: number;
    }[];
    user_color: string;
  };
  created_at: string;
  // message: Array;
  source: string;
  state: string;
  updated_at: string;
}

export interface ChatEmote {
  network: string;
  name: string;
  url: string;
  class?: string;
}

export interface VODPlayerSettings {
  twitchClientId: string;
  twitchSecret: string;
  twitchToken: string;
  emotesEnabled: boolean;
  timestampsEnabled: boolean;
  badgesEnabled: boolean;
  smallEmotes: boolean;
  showVODComments: boolean;
  chatTop: number;
  chatBottom: number;
  chatWidth: number;
  chatStroke: boolean;
  chatStyle: string;
  chatAlign: string;
  chatTextAlign: string;
  chatOverlay: boolean;
  fontSize: number;
  fontName: string;
  ultrawide: boolean;
}
