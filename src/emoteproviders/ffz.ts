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

interface UserBadges {
}

interface UserBadgeIds {
}

interface Room {
    _id: number;
    twitch_id: number;
    youtube_id?: any;
    id: string;
    is_group: boolean;
    display_name: string;
    set: number;
    moderator_badge: string;
    vip_badge: VipBadge;
    mod_urls: ModUrls;
    user_badges: UserBadges;
    user_badge_ids: UserBadgeIds;
    css?: any;
}

interface Owner {
    _id: number;
    name: string;
    display_name: string;
}

interface Urls {
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
    offset?: any;
    margins?: any;
    css?: any;
    owner: Owner;
    urls: Urls;
    status: number;
    usage_count: number;
    created_at: Date;
    last_updated: Date;
}

interface Set {
    id: number;
    _type: number;
    icon?: any;
    title: string;
    css?: any;
    emoticons: Emoticon[];
}

interface FFZEmoteData {
    room: Room;
    // [sets: number]: Set;
    // sets: Map<number, Set>;
    sets: Record<number, Set>;
}

export default class FFZEmoteProvider extends BaseEmoteProvider {

    emotes: FFZEmoteData;

    async fetchEmotes(channelId: string|number) {

        console.log('Fetching FFZ');
        
        const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${channelId}`);
        const json2: FFZEmoteData = await response.json();
        
        if (!json2.sets) {
            console.error("failed to load ffz", json2);
            this.status = 'Failed to load';
            return;
        }

        this.emotes = json2;

        console.log('ffz', this.emotes);
        let amount = Object.values(this.emotes.sets).reduce((count, row) => count + Object.keys(row.emoticons).length, 0);
        this.status = `OK! (${Object.keys(this.emotes.sets).length} sets, ${amount} emotes)`;

    }

    parseComment(word: string, commentObj: TwitchCommentProxy) {
        for (let fSet in this.emotes.sets) {
            for (let fEmo of this.emotes.sets[fSet].emoticons) {
                if (fEmo.name == word) {

                    // this.debug(`Insert emote "${word}" from FFZ into comment #${commentObj.gid}`);
                    commentObj.messageFragments.push({
                        type: 'emote',
                        data: {
                            network: 'ffz',
                            name: word,
                            url: 'https:' + fEmo.urls[1] // TODO: check that this https url is standardised
                        }
                    });
                    
                    return true;

                }
            }
        }
        return false;
    }

}
