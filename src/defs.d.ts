declare const Twitch: any;

export interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
}

interface TwitchUserBadgeProxy {
    url: string;
    id: string;
}

interface TwitchUserBadge {

}

export interface TwitchCommentProxy extends TwitchComment {
    time: string;
    gid: number;
    messageFragments: {
        type: string;
        data: {
            network?: string;
            url?: string;
            name?: string;
            class?: string;
        } | string;
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
        }
        /** @deprecated */
        _id: string;
    }
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
            }
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