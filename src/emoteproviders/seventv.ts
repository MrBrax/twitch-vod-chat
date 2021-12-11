import { TwitchCommentProxy } from "../defs";
import BaseEmoteProvider from "./base";

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

interface SevenTVError {
    message: string;
}

export default class SevenTVEmoteProvider extends BaseEmoteProvider {

    declare emotes: Emoticon[];

    async fetchEmotes(channelId: string|number) {

        console.log('Fetching seventv');
        
        const response = await fetch(`https://api.7tv.app/v2/users/${channelId}/emotes`);
        const json2: Emoticon[] | SevenTVError = await response.json();
        
        if('message' in json2){
            console.error("failed to load seventv", json2);
            this.status = `Error: ${json2.message}`;
            return false;
        }

        if (json2.length <= 0) {
            console.error("failed to load seventv", json2);
            this.status = 'Failed to load';
            return false;
        }

        this.emotes = json2;

        console.log('seventv', this.emotes);
        this.status = `OK! (${this.emotes.length} emotes)`;

        return true;

    }

    parseComment(word: string, commentObj: TwitchCommentProxy) {
        if(!this.emotes) return false;
        for (const fEmo of this.emotes) {
            if (fEmo.name == word) {

                if(!fEmo.urls || fEmo.urls.length == 0){
                    console.error("no urls on seventv emote", fEmo);
                    continue;
                }

                if(!fEmo.urls[0] || !fEmo.urls[0][1]){
                    console.error("invalid url on seventv emote", fEmo);
                    continue;
                }

                // this.debug(`Insert emote "${word}" from SevenTV into comment #${commentObj.gid}`);
                commentObj.messageFragments.push({
                    type: 'emote',
                    data: {
                        network: 'seventv',
                        name: word,
                        url: fEmo.urls[0][1]
                    }
                });

                return true;

            }
        }
        return false;
    }

}
