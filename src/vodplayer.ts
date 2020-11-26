'use strict';

// import { Twitch } from 'twitch-embed';

import EmbedPlayer from './embeds/base';
import EmbedVideoPlayer from './embeds/html5';
import EmbedTwitchPlayer from './embeds/twitch';
import EmbedYouTubePlayer from './embeds/youtube';

declare const Twitch: any;

interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
}

interface TwitchUserBadgeProxy {
    url: string;
    id: string;
}

interface TwitchUserBadge {

}

interface TwitchCommentProxy extends TwitchComment {
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

// decouple for vue performance
let chatLog: TwitchCommentDump;

let defaultSettings = {
    twitchClientId: '',
    twitchSecret: '',
    twitchToken: '',
    emotesEnabled: true,
    timestampsEnabled: false,
    badgesEnabled: true,
    smallEmotes: false,
    showVODComments: false,
    chatTop: 0,
    chatBottom: 0,
    chatWidth: 25,
    chatStroke: true,
    chatStyle: 'has-gradient',
    chatAlign: 'left',
    chatTextAlign: 'left',
    fontSize: 12,
    fontName: 'Open Sans'
}

export default class VODPlayer {

    chatLog: TwitchCommentDump;

    baseTitle: string = "braxen's vod replay";

    emotes: {
        ffz: any;
        bttv_channel: any;
        bttv_global: any;
    };
    
    badges: {
        global: any;
        channel: any;
    };

    elements: {
        video: HTMLElement | null;
        comments: HTMLElement | null;
        osd: HTMLElement | null;
        player: HTMLElement | null;
        playback_text: HTMLElement | null;
    };

    /**
     * timestamp of when video started
     */
    timeStart: number | null;

    chatOffset: number;
    commentAmount: number | null;
    tickDelay: number;
    timeScale: number;
    vodLength: number | null;
    archiveLength: number | null;
    channelName: string;

    noVideo: boolean;
    playing: boolean;

    automated: boolean;

    /*
    emotesEnabled: boolean;
    timestampsEnabled: boolean;
    badgesEnabled: boolean;
    smallEmotes: boolean;
    showVODComments: boolean;
    */

    // chatStroke: boolean;

    twitchClientId: string;

    channelId: string = '';
    videoId: string = '';
    videoTitle: string = '';

    videoChapters: [];

    interval: NodeJS.Timeout; // huh

    embedPlayer: EmbedPlayer | null = null;
    // embedPlayerPog: any;

    videoLoaded: boolean;
    chatLoaded: boolean;

    /*
    _chatWidth: number;
    _chatTop: number;
    _chatBottom: number;
    _chatStyle: string;
    _chatBackgroundOpacity: number;
    */

    commentQueue: TwitchCommentProxy[];
    commentLimit: number;

    niconico: boolean;

    chatlog_version: number | null = null;

    fetchChatRunning: boolean = false;
    // onlineOnly: boolean;

    settings: {
        twitchClientId: string;
        twitchSecret: string;
        twitchToken: string;
        emotesEnabled: boolean;
        timestampsEnabled: boolean;
        badgesEnabled: boolean;
        smallEmotes: boolean;
        showVODComments: boolean;
        chatTop: number;
        chatBottom: number;
        chatWidth: number;
        chatStroke: boolean;
        chatStyle: string;
        chatAlign: string;
        chatTextAlign: string;
        fontSize: number;
        fontName: string;
    };

    lastCommentTime: number | null = null;

    status_video: string = 'Waiting...';
    status_comments: string = 'Waiting...';
    status_ffz: string = 'Waiting...';
    status_bttv_channel: string = 'Waiting...';
    status_bttv_global: string = 'Waiting...';

    chat_source: string = '';
    video_source: string = '';
    allCommentsFetched: boolean = false;

    // settings: any;

    constructor() {

        this.chatLog = null;

        this.automated = false;

        this.emotes = {
            ffz: null,
            bttv_channel: null,
            bttv_global: null
        };

        this.badges = {
            global: null,
            channel: null
        };

        this.embedPlayer = null;

        this.resetSettings();

        this.videoChapters = [];

        // this.ffz            = null;
        // this.bttv_channel   = null;
        // this.bttv_global    = null;

        this.timeStart = null;
        this.chatOffset = 0;

        this.videoLoaded = false;
        this.chatLoaded = false;

        this.commentAmount = null;
        this.chatlog_version = null;

        this.commentQueue = [];

        this.commentQueue.push(<any>{ time: '00:00:00', username: 'braxen', usernameColour: '#ff0000', messageFragments: [{ type: 'text', data: 'welcome to my vod player' }] });

        this.elements = {
            video: null,
            comments: null,
            // timeline: null,
            osd: null,
            player: null,
            playback_text: null
        };

        this.tickDelay = 50;
        this.timeScale = 1;
        this.commentLimit = 50;

        this.vodLength = null;
        this.archiveLength = null;
        this.channelName = '';

        /*
        this.emotesEnabled      = true;
        this.timestampsEnabled  = false;
        this.badgesEnabled      = true;
        this.smallEmotes        = false;
        this.showVODComments    = false;
        */

        this.noVideo = false;

        this.playing = false;

        /*
        this._chatTop       = 0;
        this._chatBottom    = 100;
        this._chatStyle     = 'has-gradient';
        */

        this.twitchClientId = '';

        this.interval = null;

        this.niconico = false;

    }

    setTitle(text: string) {
        document.title = `${this.baseTitle} - ${text}`;
    }

    /**
     * helper function
     * @param target 
     * @param search 
     * @param replacement 
     */
    replaceAll(target: string, search: string, replacement: string) {
        search = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
        return target.replace(new RegExp(search, 'g'), replacement);
    }

    /**
     * Runs in an interval to add messages to chat
     */
    tick() {

        if (!this.timeStart) {
            throw ('No start time in tick');
            return false;
        }

        if (!this.vodLength) {
            throw ('No vod length in tick');
            return false;
        }

        if (!this.embedPlayer) {
            throw ('No embed player in tick');
            return false;
        }

        let timeNow = Date.now();

        let timeRelative = (timeNow - this.timeStart) / 1000;

        if ((timeRelative * this.timeScale) > this.vodLength + 5) {
            alert('Stopped playback');
            clearInterval(this.interval);
            return;
        }

        // for( let i = 0; i < this.commentAmount; i++ ){

        if (chatLog.comments.length == 0) {
            console.error("No comments to display");
        }

        for (let i = 0; i < chatLog.comments.length; i++) {

            let comment: TwitchComment = chatLog.comments[i];

            if (!comment.content_offset_seconds) {
                console.error("Malformed comment", comment);
                return;
            }

            // skip already displayed comments
            if ((<any>comment).displayed) {
                // console.debug('skip comment, already displayed', i);
                continue;
            }

            if (this.settings.showVODComments && comment.source && comment.source == 'comment') {
                // console.debug('skip comment, vod comment', i);
                continue; // skip vod comments?
            }

            if (timeRelative < (comment.content_offset_seconds / this.timeScale)) {
                // console.debug('skip comment, not displaying yet', i, timeRelative, ( comment.content_offset_seconds / this.timeScale ) );
                continue;
            }

            // if skipped or something
            let commentAge = timeRelative - (comment.content_offset_seconds / this.timeScale)
            if (commentAge > 60) {
                // console.debug('skip comment, too old', i);
                (<any>comment).displayed = true;
                continue;
            }



            let commentObj: any = {};

            commentObj.gid = i;

            // timestamp
            /*
            
            */

            commentObj.time = this.timeFormat(comment.content_offset_seconds);

            commentObj.badges = [];

            // badges
            if (comment.message.user_badges && this.badges.global && this.badges.channel) {

                for (let b of comment.message.user_badges) {

                    

                    // if( b._id == 'sub-gifter' ) continue;
                    /*
                    
                    */

                    let badgeId = b._id;
                    let badgeVersion = b.version;

                    let imageSrc: string | null = null;

                    // global badge
                    if (this.badges.global[badgeId] && this.badges.global[badgeId].versions[badgeVersion])
                        imageSrc = this.badges.global[badgeId].versions[badgeVersion].image_url_1x;

                    // channel badge
                    if (this.badges.channel[badgeId] && this.badges.channel[badgeId].versions[badgeVersion])
                        imageSrc = this.badges.channel[badgeId].versions[badgeVersion].image_url_1x;

                    if (!imageSrc) {
                        console.error('no badge', badgeId, badgeVersion);
                        continue;
                    }

                    let badgeObj: TwitchUserBadgeProxy = {
                        id: b._id,
                        url: imageSrc,
                    };

                    commentObj.badges.unshift(badgeObj); // TODO: insert in what order?

                    /*
                    let badgeImage = document.createElement('img');
                    badgeImage.className = 'badge ' + b._id;
                    badgeImage.src = imageSrc;
                    commentDiv.appendChild(badgeImage);
                    */

                }

            }

            // name
            /*
            let nameC = document.createElement('span');
            nameC.className = 'name';
            nameC.innerHTML = comment.commenter.display_name + ':';
            nameC.style.color = comment.message.user_color;
            commentDiv.appendChild(nameC);
            */

            commentObj.username = comment.commenter.display_name;
            commentObj.usernameColour = comment.message.user_color;

            commentObj.messageFragments = [];

            // let bodyC = document.createElement('span');

            // make message
            for (let f of comment.message.fragments) {

                // official twitch emote
                if (f.emoticon && this.settings.emotesEnabled) {

                    /*
                    let emoC = document.createElement('img');
                    emoC.className = 'emote twitch';
                    emoC.src = 'https://static-cdn.jtvnw.net/emoticons/v1/' + f.emoticon.emoticon_id + '/1.0';
                    bodyC.appendChild(emoC);
                    */

                    commentObj.messageFragments.push({
                        type: 'emote',
                        data: {
                            network: 'twitch',
                            // name: f.emoticon.text, // @todo: fix
                            url: `https://static-cdn.jtvnw.net/emoticons/v1/${f.emoticon.emoticon_id}/1.0`
                        }
                    });

                } else {

                    let fragWords = f.text.split(' ');

                    let paragraph = "";

                    let emotes = 0;

                    for (let word of fragWords) {

                        let found_emote = false;

                        // ffz
                        for (let fSet in this.emotes.ffz.sets) {
                            for (let fEmo of this.emotes.ffz.sets[fSet].emoticons) {
                                if (fEmo.name == word) {

                                    commentObj.messageFragments.push({
                                        type: 'emote',
                                        data: {
                                            network: 'ffz',
                                            name: word,
                                            url: 'https:' + fEmo.urls[1] // TODO: check that this https url is standardised
                                        }
                                    });

                                    emotes++;

                                    found_emote = true;
                                    break;

                                }
                            }
                        }

                        // bttv_channel
                        if (this.emotes.bttv_channel && this.emotes.bttv_channel.sharedEmotes && !found_emote) {

                            for (let fEmo of this.emotes.bttv_channel.sharedEmotes) {
                                if (fEmo.code == word) {

                                    commentObj.messageFragments.push({
                                        type: 'emote',
                                        data: {
                                            network: 'bttv_channel',
                                            class: 'bttv-emo-' + fEmo.id,
                                            name: word,
                                            url: `https://cdn.betterttv.net/emote/${fEmo.id}/2x`
                                        }
                                    });

                                    emotes++;

                                    found_emote = true;
                                    break;
                                }
                                // finalText = this.replaceAll(finalText, fEmo.code, '<img class="emote bttv_channel bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
                            }

                        }

                        if (this.emotes.bttv_channel && this.emotes.bttv_channel.channelEmotes && !found_emote) {

                            for (let fEmo of this.emotes.bttv_channel.channelEmotes) {
                                if (fEmo.code == word) {

                                    commentObj.messageFragments.push({
                                        type: 'emote',
                                        data: {
                                            network: 'bttv_channel',
                                            class: 'bttv-emo-' + fEmo.id,
                                            name: word,
                                            url: `https://cdn.betterttv.net/emote/${fEmo.id}/2x`
                                        }
                                    });

                                    emotes++;

                                    found_emote = true;
                                    break;
                                }
                                // finalText = this.replaceAll(finalText, fEmo.code, '<img class="emote bttv_channel bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
                            }

                        }

                        // bttv_global
                        if (this.emotes.bttv_global && !found_emote) {
                            for (let fEmo of this.emotes.bttv_global) {
                                if (fEmo.code == word) {

                                    commentObj.messageFragments.push({
                                        type: 'emote',
                                        data: {
                                            network: 'bttv_global',
                                            class: 'bttv-emo-' + fEmo.id,
                                            name: word,
                                            url: `https://cdn.betterttv.net/emote/${fEmo.id}/2x`
                                        }
                                    });

                                    emotes++;

                                    found_emote = true;
                                    break;
                                }
                                // finalText = this.replaceAll(finalText, fEmo.code, '<img class="emote bttv_global bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
                            }
                        }

                        /*
                        if(!found_emote){
                            paragraph += word + " ";
                        }else{
                            commentObj.messageFragments.push({
                                type: 'text',
                                data: paragraph
                            });
                            paragraph = "";
                        }
                        */

                        // TODO: optimize this
                        if (!found_emote) {
                            commentObj.messageFragments.push({
                                type: 'text',
                                data: word
                            });
                        }


                    }

                    /*
                    if( emotes == 0 ){
                        commentObj.messageFragments.push({
                            type: 'text',
                            data: f.text
                        });
                    }
                    */

                    /*
                    let fragC = document.createElement('span');

                    let finalText : string = f.text;

                    commentObj.messageFragments.push({ type: 'text', data: f.text });

                    if( this.emotesEnabled ){

                        // ffz
                        for( let fSet in this.emotes.ffz.sets ){
                            for( let fEmo of this.emotes.ffz.sets[fSet].emoticons ){
                                finalText = this.replaceAll(finalText, fEmo.name, '<img class="emote ffz" src="https:' + fEmo.urls[1] + '" />');
                            }
                        }

                        // bttv_channel
                        if( this.emotes.bttv_channel && this.emotes.bttv_channel.emotes ){
                            for( let fEmo of this.emotes.bttv_channel.emotes ){
                                finalText = this.replaceAll(finalText, fEmo.code, '<img class="emote bttv_channel bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
                            }
                        }

                        // bttv_global
                        for( let fEmo of this.emotes.bttv_global.emotes ){
                            finalText = this.replaceAll(finalText, fEmo.code, '<img class="emote bttv_global bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
                        }

                    }

                    fragC.innerHTML = finalText;

                    bodyC.appendChild(fragC);
                    */

                }

            }

            if (this.niconico && this.elements.comments) {

                let c = this.createLegacyCommentElement(commentObj);
                this.elements.comments.appendChild(c);

                c.style.top = (Math.random() * 720).toString();
                c.style.left = (1280).toString();
                let x = 1280;
                let s = (Math.random() * 5) + 3;

                c.style.fontSize = ((Math.random() * 2.5) + 1).toString() + "em";

                let ani = () => {
                    x -= s;
                    c.style.left = x.toString();
                    if (x < -500) {
                        c.parentElement?.removeChild(c);
                        return;
                    }
                    window.requestAnimationFrame(ani);
                }
                window.requestAnimationFrame(ani);

            } else {

                this.commentQueue.push(commentObj);

            }

            // console.debug('display comment', i);

            // console.debug("Add comment", commentObj, this.commentQueue.length);

            // commentDiv.appendChild(bodyC);

            // this.elements.comments.appendChild( commentDiv );

            (<any>comment).displayed = true;

        }

        // update timeline

        let timelineText = 'C: ' + this.timeFormat(timeRelative * this.timeScale);

        if (this.embedPlayer.getCurrentTime()) {
            timelineText += ' / V: ' + this.timeFormat(this.embedPlayer.getCurrentTime());
        }

        if (this.elements.playback_text) this.elements.playback_text.innerHTML = timelineText;


        /*
        if( this.noVideo ){
            this.elements.osd.innerHTML = 'Sync: ' + this.timeFormat( timeRelative * this.timeScale ) + '<br>Scale: ' + this.timeScale + '<br>Offset: ' + this.chatOffset  + '<br>Tick: ' + this.tickDelay;
            if( !this.elements.osd.classList.contains('running') ){
                this.elements.osd.classList.add('running');
            }
        }
        */

        // scroll
        if (!this.niconico && this.elements.comments) {
            this.elements.comments.scrollTop = this.elements.comments.scrollHeight;
        }

        // remove old comments

        /*
        if( this.elements.comments.children.length > 100 ){
            for( let i = this.elements.comments.children.length; i > 100; i-- ){
                this.elements.comments.removeChild( this.elements.comments.firstChild );
            }
        }
        */


        if (this.commentQueue.length >= this.commentLimit) {

            for (let i = this.commentQueue.length; i > this.commentLimit; i--) {
                this.commentQueue.splice(0, 1);
            }

            // this.commentQueue.splice(0, this.commentLimit - this.commentQueue.length );
            // console.debug( 'Comments overflowing, delete', this.commentQueue.length, this.commentQueue.length - this.commentLimit );
        }

        // window.requestAnimationFrame(this.tick.bind(this));

    }

    createLegacyCommentElement(comment: TwitchCommentProxy) {

        console.debug("Create legacy comment", comment);

        // main comment element
        let commentDiv = document.createElement('div');
        commentDiv.className = 'comment';

        if (this.settings.timestampsEnabled) {
            // calc time
            let commentTime = this.timeFormat(comment.content_offset_seconds);
            let timeC = document.createElement('span');
            timeC.className = 'time';
            timeC.innerHTML = `[${commentTime}]`;
            commentDiv.appendChild(timeC);
        }

        /*
        let badgeC = document.createElement('span');
        badgeC.className = 'badge ' + b._id;
        badgeC.innerHTML = b._id.substr(0, 1).toUpperCase();
        commentDiv.appendChild(badgeC);
        */

        let badgeC = document.createElement('span');
        badgeC.className = 'badges';
        for (let b of comment.badges) {
            let badgeImage = document.createElement('img');
            badgeImage.className = 'badge ' + b.id;
            badgeImage.src = b.url;
            badgeC.appendChild(badgeImage);
        }
        commentDiv.appendChild(badgeC);

        let nameC = document.createElement('span');
        nameC.className = 'name';
        nameC.innerHTML = comment.username + ':';
        nameC.style.color = comment.usernameColour;
        commentDiv.appendChild(nameC);

        let bodyC = document.createElement('span');
        bodyC.className = 'body';
        for (let frag of comment.messageFragments) {

            if (frag.type == 'text') {
                let t = document.createElement('span');
                t.className = 'text';
                t.innerHTML = <string>frag.data;
                bodyC.appendChild(t);
            } else if (frag.type == 'emote') {
                let t = document.createElement('img');
                t.className = 'emote';
                t.src = (<any>frag).data.url;
                bodyC.appendChild(t);
            }

        }
        commentDiv.appendChild(bodyC);

        return commentDiv;

    }

    play() {

        if (this.playing) {
            alert('Already playing');
            return false;
        }

        console.debug('Started playback');


        if (!this.chatLoaded) {
            alert('No chat log added');
            return false;
        }

        if (!this.embedPlayer) {
            throw ('no embed player when playing');
            return false;
        }

        this.commentQueue = [];

        this.timeStart = Date.now();

        if (this.niconico && this.elements.comments) {
            this.elements.comments.classList.add('niconico');
        }

        this.embedPlayer.seek(0);
        this.embedPlayer.play();

        let offsetInput = (<HTMLInputElement>document.getElementById('optionOffset'));
        if (offsetInput) {
            console.debug('Offset: ' + offsetInput.value);
        }

        this.apply();

        // start chat fetching
        if (this.chat_source == 'twitch') {
            // this.fetchChat();
        }

        // offset
        this.timeStart += this.chatOffset;

        this.interval = setInterval(this.tick.bind(this), this.tickDelay / this.timeScale);
        // window.requestAnimationFrame(this.tick.bind(this));

        let button_start = (<HTMLInputElement>document.getElementById('buttonStart'));

        if (button_start) button_start.disabled = true;
        if (!this.automated) {
            // (<HTMLInputElement>document.getElementById('inputVideo')).disabled = true;
            // (<HTMLInputElement>document.getElementById('inputChat')).disabled = true;
        }

        this.playing = true;

    }

    /**
     * 
     * @param percent percentage of video to seek to, todo fix this
     */
    seek(percent: number) {

        if (!this.vodLength) {
            throw ('no vod length when seeking');
            return false;
        }

        if (this.embedPlayer) {

            let seekedToSeconds = Math.floor(this.vodLength * percent);

            console.debug("Call seek", percent, seekedToSeconds, this.timeFormat(seekedToSeconds), this.videoCurrentTime);

            console.debug("Pre seek", this.videoCurrentTime, this.timeStart);

            /*
            if (this.embedPlayer) this.embedPlayer.seek(seekedToSeconds);

            if (this.elements.video.src) this.elements.video.currentTime = seekedToSeconds;
            */
            this.embedPlayer.seek(seekedToSeconds);

            // offset chat
            this.timeStart = (Date.now() - (seekedToSeconds * 1000)) + this.chatOffset;

            console.debug("Post seek", this.videoCurrentTime, this.timeStart);

            this.reset();

            // restart chat stream
            /*
            if (this.onlineOnly) {
                console.debug("Restart chat fetching");
                this.fetchChatRunning = false;
                this.fetchChat();
            }
            */

            if (this.interval) {
                console.debug("Restart interval");
                clearInterval(this.interval);
                this.interval = setInterval(this.tick.bind(this), this.tickDelay / this.timeScale);
            }

            console.log(`New time start: ${this.timeStart}`)


        } else {

            alert("nothing to seek yet");

        }

    }

    /**
     * Reset chat
     */
    reset() {

        console.debug("Reset chat");

        if (this.elements.comments) this.elements.comments.innerHTML = '';

        this.commentQueue = [];

        if (this.commentAmount) {
            for (let i = 0; i < this.commentAmount; i++) {

                let comment = chatLog.comments[i];

                (<any>comment).displayed = null;

            }
        }

    }

    /**
     * Update timing settings
     */
    apply() {

        console.debug('Applying options');

        // timescale 
        // this.timeScale = parseInt( (<HTMLInputElement>document.getElementById('optionTimescale')).value );
        this.timeScale = 1;
        console.log(`Timescale: ${this.timeScale}`);

        // tick delay
        // this.tickDelay = parseInt((<HTMLInputElement>document.getElementById('optionTickDelay')).value);
        console.log(`TickDelay: ${this.tickDelay}`);

        // let offsetInput = (<HTMLInputElement>document.getElementById('optionOffset'));
        // this.chatOffset = parseInt((<HTMLInputElement>document.getElementById('optionOffset')).value) * 1000;

        if (this.interval) {
            console.debug('clear interval');
            clearInterval(this.interval);
            this.interval = setInterval(this.tick.bind(this), this.tickDelay / this.timeScale);
        }

    }

    parseDuration(input: string) {

        if (!input) return null;

        let matchHours = input.match(/([0-9]+)h/);
        let matchMinutes = input.match(/([0-9]+)m/);
        let matchSeconds = input.match(/([0-9]+)s/);

        let durHours = matchHours ? parseInt(matchHours[1]) : 0;
        let durMinutes = matchMinutes ? parseInt(matchMinutes[1]) : 0;
        let durSeconds = matchSeconds ? parseInt(matchSeconds[1]) : 0;

        return (durHours * 60 * 60) + (durMinutes * 60) + durSeconds;

    }

    /**
     * Request fullscreen in modern browsers
     */
    fullscreen() {

        let element = this.elements.player;

        if (!element) return false;

        if (element.requestFullscreen) {
            element.requestFullscreen();
        } /*else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(element.ALLOW_KEYBOARD_INPUT);
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }*/

    }

    loadVideo(source: string, input: HTMLInputElement) {

        console.debug("video input", input, input.value, input.files);

        if (!input.value && !input.files) {
            alert("No video selected");
            return false;
        }

        this.video_source = source;

        if (input.files) {

            let file = input.files[0];

            if (!file) {
                alert("No video selected");
                return false;
            }

            let fileURL = URL.createObjectURL(file);

            this.embedPlayer = new EmbedVideoPlayer(fileURL);
            this.embedPlayer.vodplayer = this;
            this.embedPlayer.setup();

            return true;

        } else if (source == 'file_http') {
            this.loadChatFileFromURL(input.value);
            return true;
        } else if (source == 'twitch') {
            let twitch_id = input.value.match(/\/videos\/([0-9]+)/);
            if (!twitch_id) {
                alert('invalid twitch vod link');
                return false;
            }
            this.embedPlayer = new EmbedTwitchPlayer(twitch_id[1]);
            this.embedPlayer.vodplayer = this;
            this.embedPlayer.setup();
            return true;
        } else if (source == 'youtube') {

            let regex_1 = input.value.match(/v=([A-Za-z0-9]+)/);
            let regex_2 = input.value.match(/\.be\/([A-Za-z0-9]+)/);
            let youtube_id;
            if (regex_1) youtube_id = regex_1[1];
            if (regex_2) youtube_id = regex_2[1];

            if (!youtube_id) {
                alert('invalid youtube link');
                return false;
            }

            this.embedPlayer = new EmbedYouTubePlayer(youtube_id);
            this.embedPlayer.vodplayer = this;
            this.embedPlayer.setup();
            return true;
        }

        console.error("unhandled video input");

    }

    loadChat(source: string, input: HTMLInputElement) {

        console.debug("chat input", input, input.value, input.files);

        if (!input.value && !input.files) {
            alert("No chat selected");
            return false;
        }

        this.chat_source = source;

        if (input.files) {
            let file = input.files[0];
            let fileURL = URL.createObjectURL(file);
            this.loadChatFileFromURL(fileURL);
            return true;
        } else if (source == 'file_http') {
            this.loadChatFileFromURL(input.value);
            return true;
        } else if (source == 'twitch') {
            let twitch_id = input.value.match(/\/videos\/([0-9]+)/);
            if (!twitch_id) {
                alert('invalid twitch vod link');
                return false;
            }
            this.loadTwitchChat(twitch_id[1]);
            return true;
        }

        console.error("unhandled chat input");

    }

    /**
     * Load chat file from URL, either locally or remote
     * @param url 
     */
    loadChatFileFromURL(url: string) {

        fetch(url).then(function (response) {

            return response.json();

        }).then((json) => {

            console.debug('Returned JSON for chat');

            chatLog = json;

            console.debug('Saved');

            this.commentAmount = Object.values(chatLog.comments).length; // speed?
            console.debug(`Amount: ${this.commentAmount}`);

            // get duration, this changed in the new api. if you know of a better parsing solution, please fix this
            let rawDuration = chatLog.video.duration;

            if (!rawDuration) {
                /*
                alert("Chat log unsupported, it might be too old.");
                console.error("Chat log unsupported, it might be too old.");
                return false;
                */

                if (chatLog.video.length) {

                    this.vodLength = parseInt(chatLog.video.length);

                    this.chatlog_version = 1;

                } else {

                    alert("Chat log unsupported, it might be too old.");
                    console.error("Chat log unsupported, it might be too old.");
                    return false;

                }

            } else {

                this.chatlog_version = 2;

                let rawHours = rawDuration.match(/([0-9]+)h/);
                let rawMinutes = rawDuration.match(/([0-9]+)m/);
                let rawSeconds = rawDuration.match(/([0-9]+)s/);

                let durHours = rawHours ? parseInt(rawHours[1]) : 0;
                let durMinutes = rawMinutes ? parseInt(rawMinutes[1]) : 0;
                let durSeconds = rawSeconds ? parseInt(rawSeconds[1]) : 0;

                console.debug(durHours, durMinutes, durSeconds);


                this.vodLength = (durHours * 60 * 60) + (durMinutes * 60) + durSeconds;

            }

            // this.vodLength = this.chatLog.video.length;
            console.debug(`VOD length: ${this.vodLength}`);

            if (this.embedPlayer) {
                this.archiveLength = this.embedPlayer.getDuration();
                console.debug(`Archive length: ${this.archiveLength}`);
            } else {
                console.error("No embed player to set archive length from");
            }


            if (this.archiveLength && this.archiveLength > 0 && this.vodLength) {
                /*
                let offsetInput = (<HTMLInputElement>document.getElementById('optionOffset'));
                if (offsetInput) {
                    offsetInput.value = (this.vodLength - this.archiveLength).toString();
                }
                */
                this.chatOffset = (this.vodLength - this.archiveLength);
            }


            if (this.chatlog_version == 2) {

                this.channelName = chatLog.video.user_name;
                this.channelId = chatLog.video.user_id;
                this.videoId = chatLog.video.id;
                this.videoTitle = chatLog.video.title;

                this.setTitle(`${this.channelName}: ${this.videoTitle}`);

            } else {

                this.channelName = chatLog.video.channel.display_name;
                this.channelId = chatLog.video.channel._id;
                this.videoId = chatLog.video._id;

            }

            this.fetchBadges();
            this.fetchEmotes();


            if (this.settings.twitchClientId) {
                /*
                this.fetchMarkerInfo().then( (json) => {
                    console.log("marker info", json);
                    // let data = json.data[0];
                    // if(!data) return;
                    // console.log("Marker info from chat log", data);
                });
                */
                // this.fetchMarkerInfo();
            }

            this.status_comments = `OK (v${this.chatlog_version}, ${this.channelName}, ${this.commentAmount}c, ${this.vodLength}s)!`;

            this.chatLoaded = true;

        });

    }

    /**
     * Load twitch vod info and start dumping chat
     * @param videoId Twitch VOD id
     */
    loadTwitchChat(videoId: string) {

        console.debug('load twitch chat', this);

        this.videoId = videoId;

        this.fetchVideoInfo().then((json) => {

            if (json.error) {
                alert("VOD loading error: " + json.message);
                return false;
            }

            if (!json.data) {
                alert("VOD loading error, probably deleted");
                throw 'VOD loading error, probably deleted';
                return false;
            }

            let data = json.data[0];

            console.log('loadOnline', data);

            this.vodLength = this.parseDuration(data.duration);
            this.channelName = data.user_name;
            this.channelId = data.user_id;

            console.log("LoadOnline length", this.vodLength);
            console.log("LoadOnline channel name", this.channelName);
            console.log("LoadOnline channel id", this.channelId);

            this.fetchBadges();
            this.fetchEmotes();

            this.fetchChat();

            this.chatLoaded = true;

            // this.fetchMarkerInfo();

            // this.setupEmbedPlayer();

        });

    }

    /**
     * Fetch user badges from twitch
     */
    fetchBadges() {

        if (!this.channelId) {
            console.error('No channel id for badges');
            return false;
        }

        // global badges
        fetch('https://badges.twitch.tv/v1/badges/global/display').then(function (response) {
            return response.json();
        }).then((json2) => {

            if (json2.badge_sets) {
                this.badges.global = json2.badge_sets;
                console.debug('twitch badges channel', this.badges.global);
            }

        });

        // global badges
        fetch(`https://badges.twitch.tv/v1/badges/channels/${this.channelId}/display`).then(function (response) {
            return response.json();
        }).then((json2) => {

            if (json2.badge_sets) {
                this.badges.channel = json2.badge_sets;
                console.debug('twitch badges global', this.badges.channel);
            }

        });

    }

    /**
     * Fetch emotes from multiple sources
     */
    fetchEmotes() {

        if (!this.channelName) {
            console.error('No channel name for emotes');
            return false;
        }

        // let status_ffz = document.getElementById('status-text-ffz');
        // let status_bttv_channel = document.getElementById('status-text-bttv_channel');
        // let status_bttv_global = document.getElementById('status-text-bttv_global');

        // ffz
        console.log('Fetching FFZ');
        this.status_ffz = 'Fetching...';
        fetch(`https://api.frankerfacez.com/v1/room/id/${this.channelId}`).then(function (response) {
            return response.json();
        }).then((json2) => {

            if (!json2.sets) {
                console.error("failed to load ffz", json2);
                this.status_ffz = 'Failed to load';
                return;
            }

            this.emotes.ffz = json2;
            console.log('ffz', this.emotes.ffz);
            this.status_ffz = 'OK!';
        });

        // bttv_channel v3
        console.log('Fetching BTTV_Channel');
        this.status_bttv_channel = 'Fetching...';
        fetch(`https://api.betterttv.net/3/cached/users/twitch/${this.channelId}`).then(function (response) {
            return response.json();
        }).then((json2) => {

            if (!json2.sharedEmotes) {
                console.error("failed to load bttv_channel", json2);
                this.status_bttv_channel = 'Failed to load';
                return;
            }

            this.emotes.bttv_channel = json2;
            console.log('bttv_channel', this.emotes.bttv_channel);
            let emoteNum = Object.keys(this.emotes.bttv_channel.channelEmotes).length + Object.keys(this.emotes.bttv_channel.sharedEmotes).length;
            this.status_bttv_channel = `OK! (${emoteNum} emotes)`;
        });

        // bttv_global v3
        console.log('Fetching BTTV_Global');
        this.status_bttv_global = 'Fetching...';
        fetch('https://api.betterttv.net/3/cached/emotes/global').then(function (response) {
            return response.json();
        }).then((json2) => {

            if (!json2 || json2.length == 0) {
                console.error("failed to load bttv_global", json2);
                this.status_bttv_global = 'Failed to load';
                return;
            }

            this.emotes.bttv_global = json2;
            console.log('bttv_global', this.emotes.bttv_global);
            this.status_bttv_global = `OK! (${Object.keys(this.emotes.bttv_global).length} emotes)`;
        });

    }

    /**
     * Continually fetch chat
     */
    async fetchChat() {

        chatLog.comments = [];

        let fragment = await this.fetchChatFragment(0);

        if (!fragment.comments) {
            console.error("could not fetch comments");
            return false;
        }

        let cursor = fragment._next;

        console.log('first fragment', fragment);
        chatLog.comments = chatLog.comments.concat(fragment.comments);

        this.fetchChatRunning = true;

        // for( let i = 0; i < 5; i++ ){
        while (cursor && this.fetchChatRunning) {

            let f = await this.fetchChatFragment(null, cursor);

            cursor = f._next;

            if (!f.comments) {
                console.error("no comments with cursor");
                continue;
            }

            chatLog.comments = chatLog.comments.concat(f.comments);

            console.log("Add messages to chat log", chatLog.comments.length, f.comments.length);

            console.log("Message info", f.comments[0].content_offset_seconds, f.comments[0].commenter.display_name);

            // TODO: don't spam server, throttle with this somehow
            if (f.comments[f.comments.length - 1]) {
                this.lastCommentTime = f.comments[f.comments.length - 1].content_offset_seconds;
            } else {
                console.error("no comment available");
            }

            this.commentAmount = chatLog.comments.length;

            let lastCommentTime = Math.round(chatLog.comments[this.commentAmount - 1].content_offset_seconds);

            this.status_comments = `OK (dump, ${this.channelName}, ${this.commentAmount}c, ${lastCommentTime}o, ${this.vodLength}s)!`;


            // debug stop
            /*
            if( chatLog.comments.length > 500 ){
                console.info("stop downloading comments due to spam test")
                break;
            }
            */

            // console.log('loop fragment', f);

        }

        this.allCommentsFetched = true;

        this.status_comments = `OK (dump, ${this.channelName}, ${this.commentAmount}c (complete), ${this.vodLength}s)!`;

        console.log("Chat fetching stopped");

    }

    async fetchChatFragment(start: any, cursor: string | null = null) {

        // unsupported by twitch
        let url = `https://api.twitch.tv/kraken/videos/${this.videoId}/comments`;

        // if(start) url += '?content_offset_seconds=' + start;

        if (cursor) url += '?cursor=' + cursor;

        if (this.videoCurrentTime > 0) {
            url += (cursor ? '&' : '?') + 'content_offset_seconds=' + this.videoCurrentTime;
        }

        return fetch(url, {
            headers: {
                "Client-ID": this.settings.twitchClientId,
                "Accept": "application/vnd.twitchtv.v5+json"
            }
        }).then((resp) => {
            return resp.json();
        });
        /*.then( (json) => {
            
            console.log("chat", json);

            let cursor = json._next;

        });
        */

    }

    async fetchVideoInfo() {

        return fetch(`https://api.twitch.tv/helix/videos?id=${this.videoId}`, {
            headers: {
                "Client-ID": this.settings.twitchClientId,
                "Authorization": "Bearer " + this.settings.twitchToken
            }
        }).then((resp) => {
            return resp.json();
        });
        /*.then( (json) => {

            console.log( 'fetchVideoInfo', this.videoId, json.data[0] );

            return json;

        });
        */

    }

    /*
    fetchMarkerInfo() {
        return fetch(`https://api.twitch.tv/kraken/videos/${this.videoId}/markers?api_version=5&client_id=${this.settings.twitchClientId}`, {
            headers: {
                "Client-ID": this.settings.twitchClientId
            }
        }).then((resp) => {
            return resp.json();
        }).then((json) => {

            if (json.markers.game_changes) {

                /*
                for( let marker of json.markers.game_changes ){
                    console.log(marker);
                    this.videoChapters.push(marker);
                }
                *

                this.videoChapters = json.markers.game_changes;

            }

            console.log("markers", json, this.videoChapters);

        });
    }
    */

    async fetchTwitchToken() {

        if (!this.settings.twitchClientId || !this.settings.twitchSecret) {
            alert("missing either twitch client id or secret");
            return false;
        }

        return fetch(`https://id.twitch.tv/oauth2/token?client_id=${this.settings.twitchClientId}&client_secret=${this.settings.twitchSecret}&grant_type=client_credentials`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
            }
        }).then((resp) => {
            return resp.json();
        }).then((json) => {

            if (json.message) {
                alert(json.message);
            }

            if (json.access_token) {
                this.settings.twitchToken = json.access_token;
                this.saveSettings();
                return json.access_token;
            }

        }).catch((reason) => {
            console.error("tac error", reason);
            return false;
        });

    }


    hooks() {

        // seeking on video player
        /*
        this.fetchChatRunning
        this.elements.video.addEventListener('seeked', ( ev : HTMLInputEvent ) => {

            if( chatLog ){

                this.reset();

                // offset chat
                this.timeStart = Date.now() - ( this.elements.video.currentTime * 1000 );

            }else{
                console.error('No chat log loaded');
            }

        });
        */

        // on ready
        /*
        this.elements.video.addEventListener('canplay', (ev: HTMLInputEvent) => {
            this.videoLoaded = true;
            document.getElementById('status-text-video').innerHTML = `Loaded (${this.elements.video.duration}s)`;
            // document.getElementById('option-group-video').classList.add('ok');
        });
        */

        // space to play
        /*
        this.elements.player.addEventListener('keyup', (ev: KeyboardEvent) => {
            if (ev.keyCode == 32) {
                ev.preventDefault();
                this.play();
                return false;
            }
        });
        */

        console.debug('Added hooks');

        this.loadSettings();

        // this.videoId = '586683584'
        // this.fetchChat();

    }

    timeFormat(seconds: number) {

        /*
        let minutes = Math.floor( timeRelative / 60 );
        let hours = Math.floor( minutes / 60 );
        let seconds = Math.floor( timeRelative - minutes * 60 );
        
        return hours + ':' + minutes + ':' + seconds;
        */

        let date = new Date();
        date.setSeconds(seconds); // specify value for SECONDS here
        return date.toISOString().substr(11, 8);

    }

    alignChat(dir: string) {
        if (!this.elements.comments) return;
        this.elements.comments.classList.remove('left', 'right');
        this.elements.comments.classList.add(dir);
    }

    alignText(dir: string) {
        if (!this.elements.comments) return;
        this.elements.comments.classList.remove('text-left', 'text-right');
        this.elements.comments.classList.add('text-' + dir);
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
        console.debug("Saved settings");
        alert("Saved settings");
    }

    loadSettings() {
        let v = localStorage.getItem('settings');
        if (v) {
            this.settings = JSON.parse(v);
            console.debug("Loaded settings");
        } else {
            console.debug("No settings to load");
        }
        console.debug("Load settings", this.settings);
    }

    resetSettings() {
        this.settings = { ...defaultSettings };
    }

    get videoPosition() {

        if (!this.timeStart || !this.vodLength) return 0;
        /*
        if( this.embedPlayer ){
            return this.embedPlayer.getCurrentTime() / this.vodLength;
        }else if( this.elements.video && this.elements.video.src ){
            return this.elements.video.currentTime / this.vodLength;
        }else{
            return 0;
        }

        */

        return ((Date.now() - this.timeStart) / 1000) / this.vodLength;

    }

    get videoCurrentTime() {

        if (!this.timeStart) return 0;
        /*
        if( this.embedPlayer ){
            return this.embedPlayer.getCurrentTime();
        }else if( this.elements.video && this.elements.video.src ){
            return this.elements.video.currentTime;
        }else{
            return 0;
        }
        */

        return ((Date.now() - this.timeStart) / 1000);

    }

    /*
    set chatBackgroundOpacity( s : number ){
        this.elements.comments.classList.remove('has-gradient', 'has-fill');
        if( s ) this.elements.comments.classList.add( s );
        
        this._chatBackgroundOpacity = s;
    }

    get chatBackgroundOpacity(){
        return this._chatBackgroundOpacity;
    }
    */

}

// window.VODPlayer = VODPlayer;