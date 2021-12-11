import { TwitchCommentProxy } from "../defs";
import BaseEmoteProvider from "./base";

interface Emoticon {
    id: string;
    code: string;
    imageType: string;
    userId: string;
}

interface BTTVGlobalEmoteData {

}

export default class BTTVGlobalEmoteProvider extends BaseEmoteProvider {

    declare emotes: Emoticon[];

    async fetchEmotes(channelId: string | number) {

        console.log('Fetching BTTV Global');

        const response = await fetch(`https://api.betterttv.net/3/cached/emotes/global`);
        const json2: Emoticon[] = await response.json();

        if (!json2 || json2.length == 0) {
            console.error("failed to load bttvglobal", json2);
            this.status = 'Failed to load';
            return;
        }

        this.emotes = json2;

        console.log('bttvglobal', this.emotes);
        this.status = `OK! (${this.emotes.length} emotes)`;

    }


    parseComment(word: string, commentObj: TwitchCommentProxy) {
        for (const fEmo of this.emotes) {
            if (fEmo.code == word) {

                // this.debug(`Insert emote "${word}" from BTTV Global into comment #${commentObj.gid}`);
                commentObj.messageFragments.push({
                    type: 'emote',
                    data: {
                        network: 'bttv_global',
                        class: 'bttv-emo-' + fEmo.id,
                        name: word,
                        url: `https://cdn.betterttv.net/emote/${fEmo.id}/2x`
                    }
                });

                return true;
            }

        }
        return false;
    }


}
