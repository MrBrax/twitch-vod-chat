'use strict';

// import { Twitch } from 'twitch-embed';

import EmbedPlayer from './embeds/base';
import EmbedVideoPlayer from './embeds/html5';
import EmbedTwitchPlayer from './embeds/twitch';
import EmbedYouTubePlayer from './embeds/youtube';

import {
    TwitchComment,
    TwitchCommentDump,
    TwitchCommentProxy,
    TwitchUserBadgeProxy,
} from './defs';
import FFZEmoteProvider from './emoteproviders/ffz';
import BTTVGlobalEmoteProvider from './emoteproviders/bttv_global';
import BTTVChannelEmoteProvider from './emoteproviders/bttv_channel';
import SevenTVEmoteProvider from './emoteproviders/seventv';
import BaseEmoteProvider from './emoteproviders/base';

// decouple for vue performance
let chatLog: TwitchCommentDump;

const defaultSettings = {
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
    chatOverlay: true,
    fontSize: 12,
    fontName: 'Inter',
    ultrawide: false,
}

export default class VODPlayer {

    chatLog: TwitchCommentDump;

    baseTitle = "braxen's vod replay";

    fonts = {
        "Inter":        "Inter (Twitch)",
        "Arial":        "Arial",
        "Helvetica":    "Helvetica",
        "Raleway":      "Raleway",
        "Hack":         "Hack",
        "Open Sans":    "Open Sans",
        "Roboto":       "Roboto",
        "Segoe UI":     "Segoe UI",
        "Verdana":      "Verdana",
                
        "Consolas":         "Consolas",
        "Lucida Console":   "Lucida Console",
        "monospace":        "monospace",
    };

    /*
    emotes: {
        ffz: FFZEmoteProvider;
        bttv_channel: BTTVChannelEmoteProvider;
        bttv_global: BTTVGlobalEmoteProvider;
        seventv: SevenTVEmoteProvider;
    };
    */
    // emotes: {[key: string]: BaseEmoteProvider};
    emotes: Record<string, BaseEmoteProvider>;

    badges: {
        global: any;
        channel: any;
    };

    elements: {
        viewer: HTMLElement | null;
        video: HTMLElement | null;
        comments: HTMLElement | null;
        osd: HTMLElement | null;
        player: HTMLElement | null;
        playback_text: HTMLElement | null;
    };

    /**
     * timestamp of when video started
     * @todo: use seconds offset instead
     * @deprecated
     */
    timeStart: number | null;
    // timeOffset: number = 0;

    chatOffset: number;
    commentAmount: number | null;
    tickDelay: number;
    timeScale: number;
    vodLength: number | null;
    archiveLength: number | null;
    channelName: string;

    noVideo: boolean;

    /**
     * Is video+chat playing?
     * @deprecated
     */
    isPlaying: boolean;
    isReady: boolean;

    automated: boolean;

    twitchClientId: string;

    channelId = '';
    videoId = '';
    videoTitle = '';

    videoChapters: {
        time: number;
        label: string;
    }[];

    interval: number; // huh

    embedPlayer: EmbedPlayer | null = null;
    // embedPlayerPog: any;

    videoLoaded: boolean;
    chatLoaded: boolean;

    commentQueue: TwitchCommentProxy[];
    commentLimit: number;

    niconico: boolean;

    chatlog_version: string | null = null;

    fetchChatRunning = false;
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
        chatOverlay: boolean;
        fontSize: number;
        fontName: string;
        ultrawide: boolean;
    };

    lastCommentTime: number | null = null;
    lastCommentOffset: number | null = null;

    status_video = 'Waiting...';
    status_comments = 'Waiting...';
    status_ffz = 'Waiting...';
    status_bttv_channel = 'Waiting...';
    status_bttv_global = 'Waiting...';
    status_seventv = 'Waiting...';

    chat_source = '';
    video_source = '';
    allCommentsFetched = false;

    malformed_comments: number;

    // settings: any;

    constructor() {

        this.chatLog = null;

        this.automated = false;

        this.emotes = {
            ffz: new FFZEmoteProvider(),
            bttv_channel: new BTTVChannelEmoteProvider(),
            bttv_global: new BTTVGlobalEmoteProvider(),
            seventv: new SevenTVEmoteProvider(),
        };

        this.badges = {
            global: null,
            channel: null
        };

        this.embedPlayer = null;

        this.resetSettings();

        this.videoChapters = [];

        this.timeStart = null;
        this.chatOffset = 0;

        this.videoLoaded = false;
        this.chatLoaded = false;

        this.commentAmount = null;
        this.chatlog_version = null;

        this.commentQueue = [];

        this.commentQueue.push(<any>{ time: '00:00:00', username: 'braxen', usernameColour: '#ff0000', messageFragments: [{ type: 'text', data: 'welcome to my vod player' }] });

        this.elements = {
            viewer: null,
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

        this.isPlaying = false;

        /*
        this._chatTop       = 0;
        this._chatBottom    = 100;
        this._chatStyle     = 'has-gradient';
        */

        this.twitchClientId = '';

        this.interval = null;

        this.niconico = false;

        this.malformed_comments = 0;

    }

    /**
     * Set document title (why again?)
     * @deprecated
     * @param text Title
     */
    setTitle(text: string) {
        document.title = `${this.baseTitle} - ${text}`;
    }

    /**
     * Runs in an interval to add messages to chat
     */
    tick() {

        /*
        if (!this.timeStart) {
            throw ('No start time in tick');
            return false;
        }
        */

        if (!this.vodLength) {
            throw ('No vod length in tick');
            return false;
        }

        if (!this.embedPlayer) {
            throw ('No embed player in tick');
            return false;
        }

        // let timeNow = Date.now();

        // let timeRelative = (timeNow - this.timeStart) / 1000;
        
        // deprecated
        /*
        if ((timeRelative * this.timeScale) > this.vodLength + 5) {
            alert('Stopped playback');
            clearInterval(this.interval);
            return;
        }
        */

        
        if( this.embedPlayer.getCurrentTime() >= this.vodLength ){
            this.pause();
            return false;
        }

        if (chatLog.comments.length == 0) {
            console.error("No comments to display");
        }

        const videoTime = this.embedPlayer.getCurrentTime();

        // console.log("tick test", timeRelative, this.embedPlayer.getCurrentTime());

        for (let i = 0; i < chatLog.comments.length; i++) {

            const comment: TwitchComment = chatLog.comments[i];

            if (comment.content_offset_seconds === undefined || comment.content_offset_seconds < 0) {
                console.error("Malformed comment", comment);
                this.malformed_comments++;
                if(this.malformed_comments > 100){
                    alert("Too many malformed comments, something is wrong with the chat log.");
                    this.pause();
                }
                continue;
            }

            // skip already displayed comments
            if (comment.displayed) {
                // this.debug(`skip comment, already displayed: ${i}`);
                continue;
            }

            if (this.settings.showVODComments && comment.source && comment.source == 'comment') {
                this.debug(`skip comment, vod comment: ${i}`);
                continue; // skip vod comments?
            }

            // deprecated
            if (videoTime < (comment.content_offset_seconds / this.timeScale)) {
                // this.debug('skip comment, not displaying yet', i, timeRelative, ( comment.content_offset_seconds / this.timeScale ) );
                continue;
            }

            /*
            if(this.timeOffset < (comment.content_offset_seconds / this.timeScale)){
                continue;
            }
            */

            // if skipped or something
            const commentAge = videoTime - (comment.content_offset_seconds / this.timeScale)
            if (commentAge > 60) {
                // this.debug('skip comment, too old', i);
                (<any>comment).displayed = true;
                continue;
            }



            const commentObj: any = {};

            commentObj.gid = comment._id;

            // timestamp
            commentObj.time = this.timeFormat(comment.content_offset_seconds);

            commentObj.badges = [];

            // badges
            if (comment.message.user_badges && this.badges.global && this.badges.channel) {

                for (const b of comment.message.user_badges) {

                    const badgeId = b._id;
                    const badgeVersion = b.version;

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

                    const badgeObj: TwitchUserBadgeProxy = {
                        id: b._id,
                        url: imageSrc,
                    };

                    commentObj.badges.unshift(badgeObj); // TODO: insert in what order?

                }

            }

            // name
            commentObj.username = comment.commenter.display_name;
            commentObj.usernameColour = comment.message.user_color;

            commentObj.messageFragments = [];

            // make message
            for (const f of comment.message.fragments) {

                // official twitch emote
                if (f.emoticon && this.settings.emotesEnabled) {

                    this.debug(`Insert emote "${f.text}" from Twitch into comment #${commentObj.gid}`);
                    commentObj.messageFragments.push({
                        type: 'emote',
                        data: {
                            network: 'twitch',
                            // name: f.emoticon.text, // @todo: fix
                            url: `https://static-cdn.jtvnw.net/emoticons/v1/${f.emoticon.emoticon_id}/1.0`
                        }
                    });

                } else {

                    const fragWords = f.text.split(' ');

                    const paragraph = "";

                    const emotes = 0;

                    for (const word of fragWords) {

                        let found_emote = false;

                        for(const provider in this.emotes){
                            if( this.emotes[provider].parseComment(word, commentObj) ){
                                found_emote = true;
                            }
                        }

                        // ffz
                        // this.emotes.forEach(() => {});
                        // this.emotes.ffz.parseComment(word, commentObj);
                        /*
                        if(this.emotes.ffz.getEmotes()){
                            for (let fSet in this.emotes.ffz.getEmotes().sets) {
                                for (let fEmo of this.emotes.ffz.getEmotes().sets[fSet].emoticons) {
                                    if (fEmo.name == word) {

                                        this.debug(`Insert emote "${word}" from FFZ into comment #${commentObj.gid}`);
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
                        }
                        */

                        /*
                        // bttv shared emotes
                        if (this.emotes.bttv_channel && this.emotes.bttv_channel.sharedEmotes && !found_emote) {

                            for (let fEmo of this.emotes.bttv_channel.sharedEmotes) {
                                if (fEmo.code == word) {

                                    this.debug(`Insert emote "${word}" from BTTV Shared into comment #${commentObj.gid}`);
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

                            }

                        }
                        
                        // bttv channel emotes
                        if (this.emotes.bttv_channel && this.emotes.bttv_channel.channelEmotes && !found_emote) {

                            for (let fEmo of this.emotes.bttv_channel.channelEmotes) {
                                if (fEmo.code == word) {

                                    this.debug(`Insert emote "${word}" from BTTV Channel into comment #${commentObj.gid}`);
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

                            }

                        }
                        */
                        // this.emotes.bttv_channel.parseComment(word, commentObj);

                        // bttv_global
                        // this.emotes.bttv_global.parseComment(word, commentObj);
                        /*
                        if (this.emotes.bttv_global && !found_emote) {
                            for (let fEmo of this.emotes.bttv_global) {
                                if (fEmo.code == word) {

                                    this.debug(`Insert emote "${word}" from BTTV Global into comment #${commentObj.gid}`);
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

                            }
                        }

                        // seventv
                        if( this.emotes.seventv !== null && this.emotes.seventv.length > 0 && !found_emote ){
                            for (let fEmo of this.emotes.seventv) {
                                if (fEmo.name == word) {

                                    if(!fEmo.urls || fEmo.urls.length == 0){
                                        console.error("no urls on seventv emote", fEmo);
                                        continue;
                                    }

                                    if(!fEmo.urls[0] || !fEmo.urls[0][1]){
                                        console.error("invalid url on seventv emote", fEmo);
                                        continue;
                                    }

                                    this.debug(`Insert emote "${word}" from SevenTV into comment #${commentObj.gid}`);
                                    commentObj.messageFragments.push({
                                        type: 'emote',
                                        data: {
                                            network: 'seventv',
                                            name: word,
                                            url: fEmo.urls[0][1]
                                        }
                                    });

                                    emotes++;

                                    found_emote = true;
                                    break;

                                }
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

                }

            }

            if (this.niconico && this.elements.comments) {

                const c = this.createLegacyCommentElement(commentObj);
                this.elements.comments.appendChild(c);

                c.style.top = (Math.random() * 720).toString();
                c.style.left = (1280).toString();
                let x = 1280;
                const s = (Math.random() * 5) + 3;

                c.style.fontSize = ((Math.random() * 2.5) + 1).toString() + "em";

                const ani = () => {
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

            (<any>comment).displayed = true;

        }

        // update timeline

        let timelineText = 'C: ' + this.timeFormat(videoTime * this.timeScale);

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

        // remove old comments from queue to not waste drawing
        if (this.commentQueue.length >= this.commentLimit) {
            this.commentQueue.splice(0, this.commentQueue.length - this.commentLimit);
            // console.debug( 'Comments overflowing, delete', this.commentQueue.length, this.commentQueue.length - this.commentLimit );
        }

        // window.requestAnimationFrame(this.tick.bind(this));

    }

    createLegacyCommentElement(comment: TwitchCommentProxy) {

        console.debug("Create legacy comment", comment);

        // main comment element
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';

        if (this.settings.timestampsEnabled) {
            // calc time
            const commentTime = this.timeFormat(comment.content_offset_seconds);
            const timeC = document.createElement('span');
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

        const badgeC = document.createElement('span');
        badgeC.className = 'badges';
        for (const b of comment.badges) {
            const badgeImage = document.createElement('img');
            badgeImage.className = 'badge ' + b.id;
            badgeImage.src = b.url;
            badgeC.appendChild(badgeImage);
        }
        commentDiv.appendChild(badgeC);

        const nameC = document.createElement('span');
        nameC.className = 'name';
        nameC.innerHTML = comment.username + ':';
        nameC.style.color = comment.usernameColour;
        commentDiv.appendChild(nameC);

        const bodyC = document.createElement('span');
        bodyC.className = 'body';
        for (const frag of comment.messageFragments) {

            if (frag.type == 'text') {
                const t = document.createElement('span');
                t.className = 'text';
                t.innerHTML = <string>frag.data;
                bodyC.appendChild(t);
            } else if (frag.type == 'emote') {
                const t = document.createElement('img');
                t.className = 'emote';
                t.src = (<any>frag).data.url;
                bodyC.appendChild(t);
            }

        }
        commentDiv.appendChild(bodyC);

        return commentDiv;

    }

    /**
     * Start playing the video and chat. Can't run twice.
     * @returns {boolean} If started
     */
    startPlayback(): boolean {

        if (this.isPlaying) {
            alert('Already playing');
            return false;
        }

        console.debug('Started playback');

        if (!this.chatLoaded) {
            alert('No chat log added');
            return false;
        }

        if (!this.embedPlayer) {
            alert("No embed player has been created, can't play.");
            return false;
        }

        
        this.embedPlayer.addEventListener("play", () => {
            console.log("custom event play");
        });

        this.embedPlayer.addEventListener("pause", () => {
            console.log("custom event pause");
        });

        this.embedPlayer.addEventListener("seeked", (seconds: number) => {
            console.log(`custom event seeked: ${seconds}`);
        });
        

        // clear comment queue, this will be populated and cleaned over time
        this.commentQueue = [];

        this.timeStart = Date.now();

        if (this.niconico && this.elements.comments) {
            this.elements.comments.classList.add('niconico');
        }

        // this.embedPlayer.seek(0);
        this.embedPlayer.play();

        const offsetInput = (<HTMLInputElement>document.getElementById('optionOffset'));
        if (offsetInput) {
            console.debug(`Offset: ${offsetInput.value}`);
        }

        this.applyTimings();

        // start chat fetching
        if (this.chat_source == 'twitch') {
            // this.fetchChat();
        }

        // offset
        this.timeStart += this.chatOffset;

        // this.interval = setInterval(this.tick.bind(this), this.tickDelay / this.timeScale);
        // window.requestAnimationFrame(this.tick.bind(this));

        this.play();

        const button_start = (<HTMLInputElement>document.getElementById('buttonStart'));

        if (button_start) button_start.disabled = true;
        if (!this.automated) {
            // (<HTMLInputElement>document.getElementById('inputVideo')).disabled = true;
            // (<HTMLInputElement>document.getElementById('inputChat')).disabled = true;
        }

        this.isPlaying = true;
        
        this.isReady = true;

        return true;

    }

    play(){
        console.log("Play executed");
        this.interval = setInterval(this.tick.bind(this), this.tickDelay / this.timeScale);
        this.embedPlayer.play();
    }

    pause(){
        console.log("Pause executed");
        clearInterval(this.interval);
        this.embedPlayer.pause();
        this.malformed_comments = 0;
    }

    togglePause(){
        if( this.embedPlayer.isPaused ){
            this.play();
        }else{
            this.pause();
        }
    }

    /**
     * Seek in the video
     * @param seconds
     */
    seek(seconds: number) {

        if (!this.vodLength) {
            throw ('no vod length when seeking');
            return false;
        }

        if (this.embedPlayer) {

            // let seekedToSeconds = Math.floor(this.vodLength * percent);

            // console.debug("Call seek", percent, seekedToSeconds, this.timeFormat(seekedToSeconds), this.videoCurrentTime);

            // console.debug("Pre seek", this.videoCurrentTime, this.timeStart);

            /*
            if (this.embedPlayer) this.embedPlayer.seek(seekedToSeconds);

            if (this.elements.video.src) this.elements.video.currentTime = seekedToSeconds;
            */
            this.embedPlayer.seek( seconds );

            // offset chat
            // this.timeStart = (Date.now() - (seconds * 1000)) + this.chatOffset;
            // this.timeOffset = seconds;

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
    reset(): void {

        console.debug("Reset chat");

        if (this.elements.comments) this.elements.comments.innerHTML = '';

        console.debug(`Resetting queue, still ${this.commentQueue.length} comments.`);
        this.commentQueue = [];

        if (this.commentAmount) {
            console.debug(`Reset ${this.commentAmount} comments`);
            for (let i = 0; i < this.commentAmount; i++) {
                const comment = chatLog.comments[i];
                (<any>comment).displayed = null;
            }
        }else{
            console.debug(`No comment queue`);
        }

    }

    /**
     * Update timing settings
     */
    applyTimings(): void {

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

    /**
     * Parse the format twitch uses for duration (1h1m1s)
     * @param input 1h1m1s
     * @returns {number} Seconds
     */
    parseDuration(input: string): number {

        if (!input) return null;

        const matchHours = input.match(/([0-9]+)h/);
        const matchMinutes = input.match(/([0-9]+)m/);
        const matchSeconds = input.match(/([0-9]+)s/);

        const durHours = matchHours ? parseInt(matchHours[1]) : 0;
        const durMinutes = matchMinutes ? parseInt(matchMinutes[1]) : 0;
        const durSeconds = matchSeconds ? parseInt(matchSeconds[1]) : 0;

        return (durHours * 60 * 60) + (durMinutes * 60) + durSeconds;

    }

    /**
     * Request fullscreen in modern browsers
     */
    fullscreen() {

        const element = this.elements.viewer;

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

    /**
     * Load video from input
     * @param {string} source file_http, twitch, youtube
     * @param {HTMLInputElement} input Input element
     * @returns Success
     */
    loadVideo(source: string, input: HTMLInputElement): boolean {

        console.debug("video input", input, input.value, input.files);

        if (!input.value && !input.files) {
            alert("No video selected");
            return false;
        }

        this.video_source = source;

        if (input.files) {

            const file = input.files[0];

            if (!file) {
                alert("No video selected");
                return false;
            }

            const fileURL = URL.createObjectURL(file);

            this.embedPlayer = new EmbedVideoPlayer(fileURL);
            this.embedPlayer.vodplayer = this;
            this.embedPlayer.setup();

            return true;

        } else if (source == 'file_http') {
            this.loadChatFileFromURL(input.value);
            return true;
        } else if (source == 'twitch') {
            const twitch_id = input.value.match(/\/videos\/([0-9]+)/);
            if (!twitch_id) {
                alert('invalid twitch vod link');
                return false;
            }
            this.embedPlayer = new EmbedTwitchPlayer(twitch_id[1]);
            this.embedPlayer.vodplayer = this;
            this.embedPlayer.setup();
            return true;
        } else if (source == 'youtube') {

            const regex_1 = input.value.match(/v=([A-Za-z0-9]+)/);
            const regex_2 = input.value.match(/\.be\/([A-Za-z0-9]+)/);
            let youtube_id;
            if (regex_1) youtube_id = regex_1[1];
            if (regex_2) youtube_id = regex_2[1];

            if (!youtube_id) {
                alert('invalid youtube link');
                return false;
            }

            this.embedPlayer = new EmbedYouTubePlayer(youtube_id);
            if( this.embedPlayer ){
                this.embedPlayer.vodplayer = this;
                this.embedPlayer.setup();
                return true;
            }else{
                return false;
            }
            
        }

        console.error("unhandled video input");

    }

    /**
     * Load chat from input
     * @param {string} source file_http, twitch
     * @param {HTMLInputElement} input Input element
     * @returns Success
     */
    loadChat(source: string, input: HTMLInputElement): boolean {

        console.debug("chat input", input, input.value, input.files);

        if (!input.value && !input.files) {
            alert("No chat selected");
            return false;
        }

        this.chat_source = source;

        if (input.files) {
            const file = input.files[0];
            const fileURL = URL.createObjectURL(file);
            this.loadChatFileFromURL(fileURL);
            return true;
        } else if (source == 'file_http') {
            this.loadChatFileFromURL(input.value);
            return true;
        } else if (source == 'twitch') {
            const twitch_id = input.value.match(/\/videos\/([0-9]+)/);
            if (!twitch_id) {
                alert('invalid twitch vod link');
                return false;
            }
            this.loadTwitchChat(twitch_id[1]);
            return true;
        }

        console.error("unhandled chat input");

        return false;

    }

    /**
     * Load chat file from URL, either locally or remote
     * @todo return success
     * @param url 
     */
    async loadChatFileFromURL(url: string): Promise<boolean> {

        this.status_comments = `Loading...`;

        const response = await fetch(url);
        let json;
        
        try {
            json = await response.json();
        } catch (error) {
            console.error("loadChatFileFromURL json error", error);
            return false;
        }

        console.debug('Returned JSON for chat');

        if(!(json as any).comments){
            console.error("loadChatFileFromURL json has no comments", json);
            return false;
        }

        (chatLog as any) = json;

        console.debug('Saved');

        this.commentAmount = Object.values(chatLog.comments).length; // speed?
        console.debug(`Amount: ${this.commentAmount}`);

        // get duration, this changed in the new api. if you know of a better parsing solution, please fix this
        const rawDuration = chatLog.video.duration;

        if (!rawDuration) {
            /*
            alert("Chat log unsupported, it might be too old.");
            console.error("Chat log unsupported, it might be too old.");
            return false;
            */

            if (chatLog.video.length) {

                this.vodLength = parseInt(chatLog.video.length);

                this.chatlog_version = "twitch_v1";
            
            }else if(chatLog.video.end){

                this.vodLength = chatLog.video.end;

                this.chatlog_version = "td_v1";

            } else {

                alert("Chat log unsupported, it might be too old.");
                console.error("Chat log unsupported, it might be too old.");
                this.status_comments = `Error`;
                return false;

            }

        } else {

            this.chatlog_version = "twitch_v2";

            const rawHours = rawDuration.match(/([0-9]+)h/);
            const rawMinutes = rawDuration.match(/([0-9]+)m/);
            const rawSeconds = rawDuration.match(/([0-9]+)s/);

            const durHours = rawHours ? parseInt(rawHours[1]) : 0;
            const durMinutes = rawMinutes ? parseInt(rawMinutes[1]) : 0;
            const durSeconds = rawSeconds ? parseInt(rawSeconds[1]) : 0;

            console.debug("v2 date parse", durHours, durMinutes, durSeconds);

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

        if(this.chatlog_version == "td_v1"){ // weird format

            this.channelName = (chatLog as any).streamer.name;
            this.channelId = (chatLog as any).streamer.id;
            this.videoId = chatLog.comments[0].content_id;

        }else if (this.chatlog_version == "twitch_v2") {

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

        this.lastCommentOffset = Math.round(chatLog.comments[this.commentAmount - 1].content_offset_seconds);

        this.status_comments = `OK (${this.chatlog_version}, ${this.channelName}, ${this.commentAmount}c, ${this.lastCommentOffset}o, ${this.vodLength}s)!`;

        if( this.vodLength && this.vodLength > this.lastCommentOffset + 90 ){
            this.status_comments += " (end of comments don't sync up)";
        }

        this.chatLoaded = true;

        return true;       

    }

    /**
     * Load twitch vod info and start dumping chat
     * @param videoId Twitch VOD id
     */
    async loadTwitchChat(videoId: string) {

        console.debug('load twitch chat', this);

        this.videoId = videoId;

        return this.fetchVideoInfo().then((json) => {

            if (json.error) {
                alert("VOD loading error: " + json.message);
                return false;
            }

            if (!json.data) {
                alert("VOD loading error, probably deleted");
                throw 'VOD loading error, probably deleted';
                return false;
            }

            const data = json.data[0];

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

            return true;

        });

    }

    /**
     * Fetch global and channel badges from twitch
     */
    async fetchBadges(): Promise<boolean> {

        if (!this.channelId) {
            console.error('No channel id for badges');
            return false;
        }

        // global badges
        await fetch('https://badges.twitch.tv/v1/badges/global/display').then(function (response) {
            return response.json();
        }).then((json2) => {

            if (json2.badge_sets) {
                this.badges.global = json2.badge_sets;
                console.debug('twitch badges global', this.badges.global);
            }

        });

        // channel badges
        await fetch(`https://badges.twitch.tv/v1/badges/channels/${this.channelId}/display`).then(function (response) {
            return response.json();
        }).then((json2) => {

            if (json2.badge_sets) {
                this.badges.channel = json2.badge_sets;
                console.debug('twitch badges channel', this.badges.channel);
            }

        });

        return true;

    }

    /**
     * Fetch emotes from multiple sources
     */
    fetchEmotes() {

        if (!this.channelName) {
            console.error('No channel name for emotes');
            return false;
        }

        for(const provider in this.emotes){
            this.emotes[provider].fetchEmotes(this.channelId);
        }

        // ffz
        /*
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
            this.status_ffz = `OK! (${Object.keys(this.emotes.ffz.sets).length} sets)`;
        });
        */
        // this.emotes.ffz.fetchEmotes(this.channelId);

        // bttv_channel v3
        /*
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
        */
        // this.emotes.bttv_channel.fetchEmotes(this.channelId);

        // bttv_global v3
        /*
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
        */
        // this.emotes.bttv_global.fetchEmotes(this.channelId);
        
        // seventv
        /*
        console.log('Fetching seventv');
        this.status_seventv = 'Fetching...';
        fetch(`https://api.7tv.app/v2/users/${this.channelId}/emotes`).then(function (response) {
            return response.json();
        }).then((json2) => {

            if(json2.message){
                console.error("failed to load seventv", json2);
                this.status_seventv = `Error: ${json2.message}`;
                return;
            }

            if (json2.length <= 0) {
                console.error("failed to load seventv", json2);
                this.status_seventv = 'Failed to load';
                return;
            }

            this.emotes.seventv = json2;
            console.log('seventv', this.emotes.seventv);
            this.status_seventv = `OK! (${this.emotes.seventv.length} emotes)`;
        });
        */
        // this.emotes.seventv.fetchEmotes(this.channelId);

    }

    /**
     * Continually fetch chat
     */
    async fetchChat() {

        chatLog.comments = [];

        const fragment = await this.fetchChatFragment(0);

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

            const f = await this.fetchChatFragment(null, cursor);

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

            this.lastCommentOffset = Math.round(chatLog.comments[this.commentAmount - 1].content_offset_seconds);

            this.status_comments = `OK (dump, ${this.channelName}, ${this.commentAmount}c, ${this.lastCommentOffset}o, ${this.vodLength}s)!`;

            if( this.vodLength && this.vodLength > this.lastCommentOffset + 90 ){
                this.status_comments += " (end of comments don't sync up)";
            }

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

        if (cursor) url += `?cursor=${cursor}`;

        if (this.videoCurrentTime > 0) {
            url += (cursor ? '&' : '?') + `content_offset_seconds=${this.videoCurrentTime}`;
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

    /**
     * Video helper for twitch helix api
     * @returns {Object} Video JSON
     */
    async fetchVideoInfo() {

        return fetch(`https://api.twitch.tv/helix/videos?id=${this.videoId}`, {
            headers: {
                "Client-ID": this.settings.twitchClientId,
                "Authorization": "Bearer " + this.settings.twitchToken
            }
        }).then((resp) => {
            return resp.json();
        });

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

    /**
     * Video helper for twitch helix api
     */
    async fetchTwitchToken(): Promise<Object|boolean> {

        if (!this.settings.twitchClientId || !this.settings.twitchSecret) {
            alert("Missing either Twitch client id or secret");
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

    /**
     * @deprecated
     */
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
        document.body.addEventListener('keyup', (ev: KeyboardEvent) => {
            console.log("keyup", ev.key);
            if(this.isReady && this.embedPlayer != null){
                if (ev.key == " ") {
                    console.log("Try to pause video from space");
                    this.togglePause();
                    ev.preventDefault();
                    return false;
                }else if(ev.key == "ArrowLeft" && this.vodLength && this.embedPlayer.getCurrentTime() !== undefined){
                    this.seek(Math.min(Math.max(this.embedPlayer.getCurrentTime() - 10, 0), this.vodLength));
                    ev.preventDefault();
                    return false;
                }else if(ev.key == "ArrowRight" && this.vodLength && this.embedPlayer.getCurrentTime()){
                    this.seek(Math.min(Math.max(this.embedPlayer.getCurrentTime() + 10, 0), this.vodLength));
                    ev.preventDefault();
                    return false;
                }
            }
        });
        

        console.debug('Added hooks');

        this.loadSettings();

        // this.videoId = '586683584'
        // this.fetchChat();

    }

    /**
     * Format seconds to HH:MM:SS
     * @param seconds 
     * @returns {string} HH:MM:SS
     */
    timeFormat(seconds: number) {

        /*
        let minutes = Math.floor( timeRelative / 60 );
        let hours = Math.floor( minutes / 60 );
        let seconds = Math.floor( timeRelative - minutes * 60 );
        
        return hours + ':' + minutes + ':' + seconds;
        */

        const date = new Date();
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
        const v = localStorage.getItem('settings');
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

    debug( ...text: any[] ): void {
        if( process.env.NODE_ENV !== "development" ) return;
        console.debug(...text);
    }

    get videoPosition(): number {

        if (!this.embedPlayer || this.embedPlayer.getCurrentTime() == undefined || this.embedPlayer.getDuration() == undefined) return 0;

        return this.embedPlayer.getCurrentTime() / this.embedPlayer.getDuration();

        // if (!this.timeStart || !this.vodLength) return 0;
        /*
        if( this.embedPlayer ){
            return this.embedPlayer.getCurrentTime() / this.vodLength;
        }else if( this.elements.video && this.elements.video.src ){
            return this.elements.video.currentTime / this.vodLength;
        }else{
            return 0;
        }

        */

        // return ((Date.now() - this.timeStart) / 1000) / this.vodLength;

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