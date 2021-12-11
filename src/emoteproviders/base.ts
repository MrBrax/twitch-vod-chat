import { TwitchCommentProxy } from "../defs";

export default class BaseEmoteProvider {

    channelId: string;
    emotes: any;
    status = "Waiting...";

    fetchEmotes(channelId: string|number){
        throw('Not implemented');
    }

    getEmotes() {
        return this.emotes;
    }

    /**
     * 
     * @param word 
     * @param commentObj 
     * @returns If emote was found
     */
    parseComment(word: string, commentObj: TwitchCommentProxy): boolean {
        throw('Not implemented');
    }

}