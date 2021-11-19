import { TwitchCommentProxy } from "../defs";

export default class BaseEmoteProvider {

    channelId: string;
    emotes: any;
    status: string = "Waiting...";

    fetchEmotes(channelId: string|number){
        throw('Not implemented');
    }

    getEmotes() {
        return this.emotes;
    }

    parseComment(word: string, commentObj: TwitchCommentProxy){
        throw('Not implemented');
    }

}