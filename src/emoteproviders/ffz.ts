import { fixupUrl } from "@/helpers";
import { TwitchCommentProxy } from "../defs";
import BaseEmoteProvider from "./base";

interface VipBadge {
    1: string;
    2: string;
    4: string;
}

interface ModUrls {
    1: string;
    2: string;
    4: string;
}

/*
interface UserBadges {
}

interface UserBadgeIds {
}
*/

interface Room {
    _id: number;
    twitch_id: number;
    youtube_id?: string;
    id: string;
    is_group: boolean;
    display_name: string;
    set: number;
    moderator_badge: string;
    vip_badge: VipBadge;
    mod_urls: ModUrls;
    // user_badges: UserBadges;
    // user_badge_ids: UserBadgeIds;
    css?: unknown;
}

interface EmoticonOwner {
    _id: number;
    name: string;
    display_name: string;
}

interface EmoticonUrls {
    1: string;
    2: string;
    4: string;
}

interface Emoticon {
    id: number;
    name: string;
    height: number;
    width: number;
    public: boolean;
    hidden: boolean;
    modifier: boolean;
    offset?: unknown;
    margins?: unknown;
    css?: unknown;
    owner: EmoticonOwner;
    urls: EmoticonUrls;
    status: number;
    usage_count: number;
    created_at: Date;
    last_updated: Date;
}

interface EmoticonSet {
    id: number;
    _type: number;
    icon?: unknown;
    title: string;
    css?: unknown;
    emoticons: Emoticon[];
}

interface FFZEmoteData {
    room: Room;
    // [sets: number]: Set;
    // sets: Map<number, Set>;
    sets: Record<number, EmoticonSet>;
}

export default class FFZEmoteProvider extends BaseEmoteProvider {
    declare emotes: FFZEmoteData;

    async fetchEmotes(channelId: string | number): Promise<boolean> {
        console.log("Fetching FFZ");

        const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${channelId}`);
        const json2: FFZEmoteData = await response.json();

        if (!json2.sets) {
            console.error("failed to load ffz", json2);
            this.status = "Failed to load";
            this.disabled = true;
            return false;
        }

        if (response.status > 299) {
            console.error("failed to load ffz", json2);
            this.status = `Error: ${response.status}`;
            this.disabled = true;
            return false;
        }

        this.emotes = json2;

        console.log("ffz", this.emotes);
        const amount = Object.values(this.emotes.sets).reduce((count, row) => count + Object.keys(row.emoticons).length, 0);
        this.status = `OK! (${Object.keys(this.emotes.sets).length} sets, ${amount} emotes)`;

        return true;
    }

    parseComment(word: string, commentObj: TwitchCommentProxy) {
        if (!this.emotes || this.disabled) return false;
        for (const fSet in this.emotes.sets) {
            for (const fEmo of this.emotes.sets[fSet].emoticons) {
                if (fEmo.name == word) {
                    // this.debug(`Insert emote "${word}" from FFZ into comment #${commentObj.gid}`);
                    commentObj.messageFragments.push({
                        type: "emote",
                        data: {
                            network: "ffz",
                            name: word,
                            url: fixupUrl(fEmo.urls[1]), // TODO: check that this https url is standardised
                        },
                    });

                    return true;
                }
            }
        }
        return false;
    }
}
