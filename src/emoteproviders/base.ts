import { TwitchCommentProxy } from "../defs";

export default class BaseEmoteProvider {
  channelId: string | undefined;
  emotes: unknown;
  status = "Waiting...";

  fetchEmotes(channelId: string | number) {
    console.debug(channelId);
    throw "Not implemented";
  }

  getEmotes() {
    return this.emotes;
  }

  /**
   * Parses comment and inserts emote object into `commentObj` when found.
   * @param word
   * @param commentObj
   * @returns If emote was found
   */
  parseComment(word: string, commentObj: TwitchCommentProxy): boolean {
    console.debug(word, commentObj);
    throw "Not implemented";
  }
}
