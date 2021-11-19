import { TwitchCommentProxy } from "../defs";
import BaseEmoteProvider from "./base";

interface ChannelEmote {
    id: string;
    code: string;
    imageType: string;
    userId: string;
}

interface User {
    id: string;
    name: string;
    displayName: string;
    providerId: string;
}

interface SharedEmote {
    id: string;
    code: string;
    imageType: string;
    user: User;
}

interface BTTVChannelEmoteData {
    id: string;
    bots: string[];
    avatar: string;
    channelEmotes: ChannelEmote[];
    sharedEmotes: SharedEmote[];
}

export default class BTTVChannelEmoteProvider extends BaseEmoteProvider {

    emotes: BTTVChannelEmoteData;

    async fetchEmotes(channelId: string | number) {

        console.log('Fetching BTTV Channel');

        const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`);
        const json2: BTTVChannelEmoteData = await response.json();

        if (!json2 || json2.channelEmotes.length == 0) {
            console.error("failed to load bttvchannel", json2);
            this.status = 'Failed to load';
            return;
        }

        this.emotes = json2;

        console.log('bttvchannel', this.emotes);
        this.status = `OK! (${this.emotes.channelEmotes.length} channel, ${this.emotes.sharedEmotes.length} shared)`;

    }


    parseComment(word: string, commentObj: TwitchCommentProxy) {
        
        if (this.emotes.sharedEmotes) {

            for (let fEmo of this.emotes.sharedEmotes) {
                if (fEmo.code == word) {

                    // this.debug(`Insert emote "${word}" from BTTV Shared into comment #${commentObj.gid}`);
                    commentObj.messageFragments.push({
                        type: 'emote',
                        data: {
                            network: 'bttv_channel',
                            class: 'bttv-emo-' + fEmo.id,
                            name: word,
                            url: `https://cdn.betterttv.net/emote/${fEmo.id}/2x`
                        }
                    });

                    return true;
                }

            }

        }
        
        // bttv channel emotes
        if (this.emotes.channelEmotes) {

            for (let fEmo of this.emotes.channelEmotes) {
                if (fEmo.code == word) {

                    // this.debug(`Insert emote "${word}" from BTTV Channel into comment #${commentObj.gid}`);
                    commentObj.messageFragments.push({
                        type: 'emote',
                        data: {
                            network: 'bttv_channel',
                            class: 'bttv-emo-' + fEmo.id,
                            name: word,
                            url: `https://cdn.betterttv.net/emote/${fEmo.id}/2x`
                        }
                    });

                    return true;
                }

            }

        }

        return false;

    }


}
