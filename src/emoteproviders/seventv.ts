import { fixupUrl } from "@/helpers";
import { TwitchCommentProxy } from "../defs";
import BaseEmoteProvider from "./base";

interface SevenTVUserResponse {
    id: string;
    platform: string;
    username: string;
    display_name: string;
    linked_at: number;
    emote_capacity: number;
    emote_set_id: unknown;
    emote_set: EmoteSet;
    user: User;
}

interface EmoteSet {
    id: string;
    name: string;
    flags: number;
    tags: string[];
    immutable: boolean;
    privileged: boolean;
    emotes: Emoticon[];
    emote_count: number;
    capacity: number;
    owner: Owner;
}

interface Owner {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    style: {
        color: number;
    };
    roles: string[];
}

interface User {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    biography: string;
    style: {
        color: number;
    };
    emote_sets: EmoteSet[];
    editors: Editor[];
    roles: string[];
    connections: Connection[];
}

interface Connection {
    id: string;
    platform: string;
    username: string;
    display_name: string;
    linked_at: number;
    emote_capacity: number;
    emote_set_id: unknown;
    emote_set: EmoteSet;
}

interface Editor {
    id: string;
    permissions: number;
    visible: boolean;
    added_at: number;
}

interface Emoticon {
    id: string;
    name: string;
    flags: number;
    timestamp: number;
    actor_id: unknown;
    data: EmoticonData;
}

interface EmoticonData {
    id: string;
    name: string;
    flags: number;
    tags: string[];
    lifecycle: number;
    state: string[];
    listed: boolean;
    animated: boolean;
    owner: Owner;
    host: {
        url: string;
        files: EmoticonFile[];
    }
}

interface EmoticonFile {
    name: string;
    static_name: string;
    width: number;
    height: number;
    frame_count: number;
    size: number;
    format: string;
}

/*
interface Role {
    id: string;
    name: string;
    position: number;
    color: number;
    allowed: number;
    denied: number;
    default: boolean;
}

interface Owner {
    id: string;
    twitch_id: string;
    login: string;
    display_name: string;
    role: Role;
    profile_picture_id: string;
}

interface Emoticon {
    id: string;
    name: string;
    owner: Owner;
    visibility: number;
    visibility_simple: string[];
    mime: string;
    status: number;
    tags: string[];
    width: number[];
    height: number[];
    urls: string[][];
}
*/

interface SevenTVError {
    // message: string;
    status_code?: number;
    status?: string;
    error: string;
    error_code?: number;
}


export default class SevenTVEmoteProvider extends BaseEmoteProvider {
    declare emotes: Emoticon[];

    async fetchEmotes(channelId: string | number): Promise<boolean> {
        console.log("Fetching seventv");

        const response = await fetch(`https://7tv.io/v3/users/twitch/${channelId}`);
        const response_json: SevenTVUserResponse | SevenTVError = await response.json();

        // server error return message
        if ("error" in response_json) {
            console.error("failed to load seventv", response_json);
            this.status = `Error: ${response_json.error}`;
            this.disabled = true;
            return false;
        }

        if (response.status > 299) {
            console.error("failed to load seventv", response_json);
            this.status = `Error: ${response.status}`;
            this.disabled = true;
            return false;
        }

        /*
        if (response_json.length <= 0) {
            console.error("failed to load seventv, no data", response_json);
            this.status = "No emotes";
            this.disabled = true;
            return false;
        }

        this.emotes = response_json;

        console.log("seventv", this.emotes);
        this.status = `OK! (${this.emotes.length} emotes)`;
        */

        if (!response_json.emote_set || response_json.emote_set.emotes.length <= 0) {
            console.error("failed to load seventv, no data", response_json);
            this.status = "No emotes";
            this.disabled = true;
            return false;
        }

        this.emotes = response_json.emote_set.emotes;
        console.log("seventv", this.emotes);
        this.status = `OK! (${this.emotes.length} emotes)`;

        return true;
    }

    getEmoteURL(emote: Emoticon, size: number): string {

        const emoteFile = emote.data.host.files.find((f) => f.name.startsWith(`${size}x`));

        if (!emoteFile) {
            console.error("no emote file", emote);
            return "";
        }

        return `${emote.data.host.url}/${emoteFile.name}`;
    }

    parseComment(word: string, commentObj: TwitchCommentProxy): boolean {
        if (!this.emotes || !Array.isArray(this.emotes) || this.disabled) return false;
        // let match = 0;
        for (const fEmo of this.emotes) {

            const isMatch = fEmo.name == word; // no other checks right now

            if (!isMatch) continue;

            if (!fEmo.data.host.files || fEmo.data.host.files.length == 0) {
                console.error("no files on seventv emote", fEmo);
                continue;
            }

            commentObj.messageFragments.push({
                type: "emote",
                data: {
                    network: "seventv",
                    name: word,
                    url: fixupUrl(this.getEmoteURL(fEmo, 2)),
                },
            });

            /*
            match++;

            if (match > 1) {
                console.error("multiple matches for", word, "on seventv", this.emotes);
                // break;
            }
            */

            /*
            if (fEmo.name == word) {
                if (!fEmo.urls || fEmo.urls.length == 0) {
                    console.error("no urls on seventv emote", fEmo);
                    continue;
                }

                if (!fEmo.urls[0] || !fEmo.urls[0][1]) {
                    console.error("invalid url on seventv emote", fEmo);
                    continue;
                }

                // this.debug(`Insert emote "${word}" from SevenTV into comment #${commentObj.gid}`);
                commentObj.messageFragments.push({
                    type: "emote",
                    data: {
                        network: "seventv",
                        name: word,
                        url: fEmo.urls[0][1],
                    },
                });

                return true;
            }
            */
            return true;
        }
        return false;
    }
}
