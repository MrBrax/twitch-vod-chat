'use strict';

// import { Twitch } from 'twitch-embed';

import Vue from 'vue';
import App from './App.vue'

declare const Twitch: any;

interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
}

// decouple for vue performance
let chatLog : any = {};

let defaultSettings = {
    twitchClientId: '',
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
    chatTextAlign: 'left'
}

export default class VODPlayer {
    
    chatLog: any;
    
    emotes: { ffz: any; bttv_channel: any; bttv_global: any; };
    badges: { global: any; channel: any; };
    elements: { video: any; comments: any; timeline: any; osd: any; player: any };

    /**
     * timestamp of when video started
     */
    timeStart: number; 

    chatOffset: number;
    commentAmount: number;
    tickDelay: number;
    timeScale: number;
    vodLength: number;
    archiveLength: number;
    channelName: string;
    
    noVideo: boolean;
    playing: boolean;

    /*
    emotesEnabled: boolean;
    timestampsEnabled: boolean;
    badgesEnabled: boolean;
    smallEmotes: boolean;
    showVODComments: boolean;
    */
    
    // chatStroke: boolean;

    twitchClientId: string;

    channelId: any;
    videoId: any;

    videoChapters: [];

    interval: any;
        
    embedPlayer: any;
    embedPlayerPog: any;

    videoLoaded: boolean;
    chatLoaded: boolean;
    
    /*
    _chatWidth: number;
    _chatTop: number;
    _chatBottom: number;
    _chatStyle: string;
    _chatBackgroundOpacity: number;
    */
    
    commentQueue: any[];
    commentLimit: number;
    
    niconico: boolean;

    chatlog_version: number;

    fetchChatRunning: boolean;
    onlineOnly: boolean;
    
    settings: {
        twitchClientId: string;
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
    };

    // settings: any;

    constructor(){

        this.chatLog = null;

        this.emotes = {
            ffz: null,
            bttv_channel: null,
            bttv_global: null
        };

        this.badges = {
            global: null,
            channel: null
        };

        // default settings
        /*
        this.settings = {
            twitchClientId: '',
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
            chatTextAlign: 'left'
        };
        */

        this.resetSettings();
        
        this.videoChapters = [];

        // this.ffz            = null;
        // this.bttv_channel   = null;
        // this.bttv_global    = null;

        this.timeStart = null;
        this.chatOffset = 0;

        this.videoLoaded = false;
        this.chatLoaded = false;

        this.commentAmount  = null;

        this.commentQueue = [
            { time: '00:00:00', username: 'braxen', usernameColour: '#ff0000', messageFragments: [ { type: 'text', data: 'welcome to my vod player' } ] },
        ];

        this.elements       = {
            video: null,
            comments: null,
            timeline: null,
            osd: null,
            player: null,
        };

        this.tickDelay      = 50;
        this.timeScale      = 1;
        this.commentLimit   = 50;

        this.vodLength      = null;
        this.archiveLength  = null;
        this.channelName    = null;

        /*
        this.emotesEnabled      = true;
        this.timestampsEnabled  = false;
        this.badgesEnabled      = true;
        this.smallEmotes        = false;
        this.showVODComments    = false;
        */

        this.noVideo        = false;

        this.playing        = false;

        /*
        this._chatTop       = 0;
        this._chatBottom    = 100;
        this._chatStyle     = 'has-gradient';
        */

        this.twitchClientId = '';

        this.interval = null;

        this.niconico = false;

    }

    /**
     * helper function
     * @param target 
     * @param search 
     * @param replacement 
     */
    replaceAll( target : string, search : string, replacement : string ) {
        search = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
        return target.replace(new RegExp(search, 'g'), replacement);
    }

    /**
     * Runs in an interval to add messages to chat
     */
    tick(){

        let timeNow = Date.now();

        let timeRelative = ( timeNow - this.timeStart ) / 1000;

        if( ( timeRelative * this.timeScale ) > this.vodLength + 5 ){
            alert('Stopped playback');
            clearInterval( this.interval );
            return;
        }

        // for( let i = 0; i < this.commentAmount; i++ ){
        for( let i = 0; i < chatLog.comments.length; i++ ){

            let comment = chatLog.comments[i];

            if( !comment.content_offset_seconds ){
                console.error("Malformed comment", comment);
                return;
            }

            // skip already displayed comments
            if( comment.displayed ){
                //console.debug('skip comment, already displayed', i);
                continue;
            }

            if( this.settings.showVODComments && comment.source && comment.source == 'comment' ){
                //console.debug('skip comment, vod comment', i);
                continue; // skip vod comments?
            }

            if( timeRelative < ( comment.content_offset_seconds / this.timeScale ) ){
                //console.debug('skip comment, not displaying yet', i, timeRelative, ( comment.content_offset_seconds / this.timeScale ) );
                continue;
            }

            // if skipped or something
            let commentAge = timeRelative - ( comment.content_offset_seconds / this.timeScale )
            if( commentAge > 60 ){
                //console.debug('skip comment, too old', i);
                comment.displayed = true;
                continue;
            }

            

            let commentObj : any = {};

            // timestamp
            /*
            
            */

            commentObj.time = this.timeFormat( comment.content_offset_seconds ); 

            commentObj.badges = [];

            // badges
            if( comment.message.user_badges && this.badges.global && this.badges.channel){

                for( let b of comment.message.user_badges ){

                    let badgeObj : any = {};

                    // if( b._id == 'sub-gifter' ) continue;
                    /*
                    
                    */
                    
                    let badgeId = b._id;
                    let badgeVersion = b.version;

                    let imageSrc = null;

                    // global badge
                    if( this.badges.global[ badgeId ] && this.badges.global[ badgeId ].versions[ badgeVersion ] )
                        imageSrc = this.badges.global[ badgeId ].versions[ badgeVersion ].image_url_1x;
                    
                    // channel badge
                    if( this.badges.channel[ badgeId ] && this.badges.channel[ badgeId ].versions[ badgeVersion ] )
                        imageSrc = this.badges.channel[ badgeId ].versions[ badgeVersion ].image_url_1x;
                    
                    if(!imageSrc){
                        console.error('no badge', badgeId, badgeVersion);
                        continue;
                    }

                    badgeObj.id = b._id;
                    badgeObj.url = imageSrc;

                    commentObj.badges.unshift( badgeObj ); // TODO: insert in what order?

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
            for( let f of comment.message.fragments ){

                // official twitch emote
                if( f.emoticon && this.settings.emotesEnabled ){

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
                            name: f.emoticon.text,
                            url: 'https://static-cdn.jtvnw.net/emoticons/v1/' + f.emoticon.emoticon_id + '/1.0'
                        }
                    });

                }else{

                    let fragWords = f.text.split(' ');

                    let paragraph = "";

                    let emotes = 0;

                    for( let word of fragWords ){

                        let found_emote = false;

                        // ffz
                        for( let fSet in this.emotes.ffz.sets ){
                            for( let fEmo of this.emotes.ffz.sets[fSet].emoticons ){
                                if( fEmo.name == word ){
                                    
                                    commentObj.messageFragments.push({
                                        type: 'emote',
                                        data: {
                                            network: 'ffz',
                                            name: word,
                                            url: fEmo.urls[1]
                                        }
                                    });

                                    emotes++;

                                    found_emote = true;
                                    break;

                                }
                            }
                        }

                        // bttv_channel
                        if( this.emotes.bttv_channel && this.emotes.bttv_channel.emotes ){
                            for( let fEmo of this.emotes.bttv_channel.emotes ){
                                if( fEmo.code == word ){

                                    commentObj.messageFragments.push({
                                        type: 'emote',
                                        data: {
                                            network: 'bttv_channel',
                                            class: 'bttv-emo-' + fEmo.id,
                                            name: word,
                                            url: 'https://cdn.betterttv.net/emote/' + fEmo.id + '/2x'
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
                        for( let fEmo of this.emotes.bttv_global.emotes ){
                            if( fEmo.code == word ){

                                commentObj.messageFragments.push({
                                    type: 'emote',
                                    data: {
                                        network: 'bttv_global',
                                        class: 'bttv-emo-' + fEmo.id,
                                        name: word,
                                        url: 'https://cdn.betterttv.net/emote/' + fEmo.id + '/2x'
                                    }
                                });

                                emotes++;

                                found_emote = true;
                                break;
                            }
                            // finalText = this.replaceAll(finalText, fEmo.code, '<img class="emote bttv_global bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
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
                        if(!found_emote){
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

            if( this.niconico ){

                let c = this.createLegacyCommentElement( commentObj );
                this.elements.comments.appendChild( c );

                c.style.top = ( Math.random() * 720 ).toString();
                c.style.left = (1280).toString();
                let x = 1280;
                let s = ( Math.random() * 5 ) + 3;

                c.style.fontSize = ( ( Math.random() * 2.5 ) + 1 ).toString() + "em";

                let ani = () => {
                    x -= s;
                    c.style.left = x.toString();
                    if( x < -500 ){
                        c.parentElement.removeChild(c);
                        return;
                    }
                    window.requestAnimationFrame(ani);
                }
                window.requestAnimationFrame(ani);

            }else{

                this.commentQueue.push( commentObj );

            }

            // console.debug('display comment', i);

            // console.debug("Add comment", commentObj, this.commentQueue.length);
            
            // commentDiv.appendChild(bodyC);

            // this.elements.comments.appendChild( commentDiv );

            comment.displayed = true;

        }

        // update timeline
        
        let timelineText = 'C: ' + this.timeFormat( timeRelative * this.timeScale );

        if( this.elements.video.currentTime ){
            timelineText += ' / V: ' + this.timeFormat(this.elements.video.currentTime);
        }

        this.elements.timeline.innerHTML = timelineText;
        

        /*
        if( this.noVideo ){
            this.elements.osd.innerHTML = 'Sync: ' + this.timeFormat( timeRelative * this.timeScale ) + '<br>Scale: ' + this.timeScale + '<br>Offset: ' + this.chatOffset  + '<br>Tick: ' + this.tickDelay;
            if( !this.elements.osd.classList.contains('running') ){
                this.elements.osd.classList.add('running');
            }
        }
        */

        // scroll
        if(!this.niconico){
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

        
        if( this.commentQueue.length >= this.commentLimit ){
            
            for( let i = this.commentQueue.length; i > this.commentLimit; i-- ){
                this.commentQueue.splice(0, 1);
            }
            
            // this.commentQueue.splice(0, this.commentLimit - this.commentQueue.length );
            // console.debug( 'Comments overflowing, delete', this.commentQueue.length, this.commentQueue.length - this.commentLimit );
        }

        // window.requestAnimationFrame(this.tick.bind(this));

    }

    createLegacyCommentElement( comment : any ){

        console.debug("Create legacy comment", comment);

        // main comment element
        let commentDiv = document.createElement('div');
        commentDiv.className = 'comment';

        if( this.settings.timestampsEnabled ){
            // calc time
            let commentTime = this.timeFormat( comment.content_offset_seconds );
            let timeC = document.createElement('span');
            timeC.className = 'time';
            timeC.innerHTML = '[' + commentTime + ']';
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
        for( let b of comment.badges ){
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
        for( let frag of comment.messageFragments ){

            if( frag.type == 'text' ){
                let t = document.createElement('span');
                t.className = 'text';
                t.innerHTML = frag.data;
                bodyC.appendChild(t);
            }else if( frag.type == 'emote'){
                let t = document.createElement('img');
                t.className = 'emote';
                t.src = frag.data.url;
                bodyC.appendChild(t);
            }

        }
        commentDiv.appendChild(bodyC);

        return commentDiv;

    }

    play(){

        if( this.playing ){
            alert('Already playing');
            return false;
        }

        console.debug('Started playback');

        if( !chatLog && !this.videoId && !this.onlineOnly ){
            alert('No chat log added');
            return false;
        }

        this.commentQueue = [];

        this.timeStart = Date.now();

        if( this.niconico ){
            this.elements.comments.classList.add('niconico');
        }

        if( this.videoLoaded ){

            console.debug("Video loaded, playing");

            this.elements.video.play();
            this.noVideo = false;

        }else if( this.embedPlayer ){

            console.debug("Embed loaded, playing");

            this.embedPlayer.seek( 0 );
            this.embedPlayer.setMuted(false);
            this.embedPlayer.setVolume(1.0);
            this.embedPlayer.play();

        }else {

            console.debug("No video loaded");

            this.elements.osd.style.display = 'block';
            this.noVideo = true;

        }

        console.debug('Offset: ' + (<HTMLInputElement>document.getElementById('optionOffset')).value );

        this.apply();

        if( this.onlineOnly ){
            this.fetchChat();
        }

        // offset
        this.timeStart += this.chatOffset;

        this.interval = setInterval( this.tick.bind(this), this.tickDelay / this.timeScale );
        // window.requestAnimationFrame(this.tick.bind(this));

        (<HTMLInputElement>document.getElementById('buttonStart')).disabled = true;
        (<HTMLInputElement>document.getElementById('inputVideo')).disabled = true;
        (<HTMLInputElement>document.getElementById('inputChat')).disabled = true;

        this.playing = true;

    }

    /**
     * 
     * @param percent percentage of video to seek to, todo fix this
     */
    seek( percent : number ){

        if( this.embedPlayer || this.elements.video.src ){

            let seekedToSeconds = Math.floor(this.vodLength * percent);

            console.debug( "Call seek", percent, seekedToSeconds, this.timeFormat( seekedToSeconds ), this.videoCurrentTime );

            if( this.embedPlayer ) this.embedPlayer.seek( seekedToSeconds );

            if( this.elements.video.src ) this.elements.video.currentTime = seekedToSeconds;

            // console.debug( "Seeked", this.videoCurrentTime );

            // offset chat
            this.timeStart = ( Date.now() - ( seekedToSeconds * 1000 ) ) + this.chatOffset;

            this.reset();

            // restart chat stream
            if( this.onlineOnly ){
                console.debug("Restart chat fetching");
                this.fetchChatRunning = false;
                this.fetchChat();
            }

            if( this.interval ){
                console.debug("Restart interval");
                clearInterval( this.interval );
                this.interval = setInterval( this.tick.bind(this), this.tickDelay / this.timeScale );
            }

            console.log( "New time start: " + this.timeStart )


        }else{

            alert("nothing to seek yet");

        }

    }

    /**
     * Reset chat
     */
    reset(){

        console.debug("Reset chat");

        this.elements.comments.innerHTML = '';

        this.commentQueue = [];

        for( let i = 0; i < this.commentAmount; i++ ){

            let comment = chatLog.comments[i];

            comment.displayed = null;

        }

    }
    
    /**
     * Update timing settings
     */
    apply(){

        console.debug('Applying options');

        // timescale 
        // this.timeScale = parseInt( (<HTMLInputElement>document.getElementById('optionTimescale')).value );
        this.timeScale = 1;
        console.log('Timescale: ' + this.timeScale);

        // tick delay
        this.tickDelay = parseInt( (<HTMLInputElement>document.getElementById('optionTickDelay')).value );
        console.log('TickDelay: ' + this.tickDelay);

        this.chatOffset = parseInt( (<HTMLInputElement>document.getElementById('optionOffset')).value ) * 1000;

        
        if( this.interval ){
            console.debug('clear interval');
            clearInterval( this.interval );
            this.interval = setInterval( this.tick.bind(this), this.tickDelay / this.timeScale );
        }

    }

    parseDuration( input: string ){

        if( !input ) return null;

        let matchHours = input.match(/([0-9]+)h/);
        let matchMinutes = input.match(/([0-9]+)m/);
        let matchSeconds = input.match(/([0-9]+)s/);

        let durHours = matchHours ? parseInt(matchHours[1]) : 0;
        let durMinutes = matchMinutes ? parseInt(matchMinutes[1]) : 0;
        let durSeconds = matchSeconds ? parseInt(matchSeconds[1]) : 0;

        return ( durHours * 60 * 60 ) + ( durMinutes * 60 ) + durSeconds;

    }

    /**
     * Request fullscreen in modern browsers
     */
    fullscreen(){

        let element = this.elements.player;

        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(element.ALLOW_KEYBOARD_INPUT);
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }

    }

    /**
     * Load chat & video, stupid solution
     * @param ev Event
     * @param f Type
     */
    load( ev : HTMLInputEvent , f: string ){

        let URL = window.URL || window.webkitURL;

        console.debug('Load file: ' + f);

        ev.preventDefault();

        let file = ev.target.files[0];
        let type = file.type;

        let fileURL = URL.createObjectURL(file);

        if( f == 'video' ){

            this.elements.video.src = fileURL;

            document.getElementById('status-text-video').innerHTML = 'Loading...';

        }else{

            document.getElementById('status-text-comments').innerHTML = 'Parsing...';

            fetch( fileURL ).then( function(response){

                return response.json();

            }).then( (json) => {

                console.debug('Returned JSON for chat');

                chatLog = json;

                console.debug('Saved');

                this.commentAmount = Object.values( chatLog.comments ).length; // speed?
                console.debug('Amount: ' + this.commentAmount);

                // get duration, this changed in the new api. if you know of a better parsing solution, please fix this
                let rawDuration = chatLog.video.duration;

                if(!rawDuration){
                    /*
                    alert("Chat log unsupported, it might be too old.");
                    console.error("Chat log unsupported, it might be too old.");
                    return false;
                    */

                    if( chatLog.video.length ){

                        this.vodLength = chatLog.video.length;

                        this.chatlog_version = 1;

                    }else{

                        alert("Chat log unsupported, it might be too old.");
                        console.error("Chat log unsupported, it might be too old.");
                        return false;

                    }

                }else{

                    this.chatlog_version = 2;

                    let durHours = rawDuration.match(/([0-9]+)h/);
                    let durMinutes = rawDuration.match(/([0-9]+)m/);
                    let durSeconds = rawDuration.match(/([0-9]+)s/);

                    durHours = durHours ? parseInt(durHours[1]) : 0;
                    durMinutes = durMinutes ? parseInt(durMinutes[1]) : 0;
                    durSeconds = durSeconds ? parseInt(durSeconds[1]) : 0;
                    
                    console.debug(durHours, durMinutes, durSeconds);


                    this.vodLength = ( durHours * 60 * 60 ) + ( durMinutes * 60 ) + durSeconds;

                }

                // this.vodLength = this.chatLog.video.length;
                console.debug('VOD length: ' + this.vodLength);

                this.archiveLength = this.elements.video.duration;
                console.debug('Archive length: ' + this.archiveLength );

                if( this.archiveLength > 0 ){
                    (<HTMLInputElement>document.getElementById('optionOffset')).value = ( this.vodLength - this.archiveLength ).toString();
                }

                if( this.chatlog_version == 2 ){

                    this.channelName    = chatLog.video.user_name;
                    this.channelId      = chatLog.video.user_id;
                    this.videoId        = chatLog.video.id;

                }else{

                    this.channelName    = chatLog.video.channel.display_name;
                    this.channelId      = chatLog.video.channel._id;
                    this.videoId        = chatLog.video._id;

                }

                this.fetchBadges();
                this.fetchEmotes();

                
                if( this.settings.twitchClientId ){
                    /*
                    this.fetchMarkerInfo().then( (json) => {
                        console.log("marker info", json);
                        // let data = json.data[0];
                        // if(!data) return;
                        // console.log("Marker info from chat log", data);
                    });
                    */
                    this.fetchMarkerInfo();
                }
                

                document.getElementById('status-text-comments').innerHTML = 'OK (v' + this.chatlog_version + ', ' + this.channelName + ', ' + this.commentAmount + 'c, ' + this.vodLength + 's)!';
                
                // document.getElementById('option-group-chat').classList.add('ok');

                this.chatLoaded = true;
                
                if( !this.videoLoaded ){

                    // alert("You have loaded the chat before the video.\nThe embed player will be used.\nIf the video buffers, chat will not be synced.\nIt is recommended that you download the VOD.");

                    this.setupEmbedPlayer();

                }

            });

        }

    }

    loadOnline( videoId: number ){

        console.log('load online', this);

        this.onlineOnly = true;

        this.videoId = videoId;

        this.fetchVideoInfo().then( (json) => {

            let data = json.data[0];

            console.log( 'loadOnline', data );

            this.vodLength = this.parseDuration( data.duration );
            this.channelName = data.user_name;
            this.channelId = data.user_id;

            this.fetchBadges();
            this.fetchEmotes();

            this.fetchMarkerInfo();

            this.setupEmbedPlayer();

        });

    }

    setupEmbedPlayer(){

        console.log("Setup embed player");

        let embedPlayerElement = document.createElement('twitch-embed-player');
        this.elements.player.appendChild(embedPlayerElement);
        
        /*
        this.embedPlayerPog = new Twitch.Embed(embedPlayerElement, {
            width: '100%',
            height: '100%',
            video: this.videoId
        });
        
        this.embedPlayerPog.addEventListener(Twitch.Embed.VIDEO_READY, () => {
            
            this.embedPlayer = this.embedPlayerPog.getPlayer();
            this.embedPlayer.seek(0);
            this.embedPlayer.pause();

            setTimeout(() => {
                this.embedPlayer.pause();
            }, 500);


            console.log("init pause video");

        });
        */

        this.embedPlayer = new Twitch.Player(embedPlayerElement, {
            width: '100%',
            height: '100%',
            video: this.videoId,
            autoplay: false,
            controls: false
        });

        console.log("Embed player created", this.embedPlayer);

        // console.log("Embed player test", this.embedPlayer.getPlayer() );

        //this.embedPlayer.seek(0);
        // this.embedPlayer.pause();

        console.log("Add event listeners");

        this.embedPlayer.addEventListener(Twitch.Player.READY, () => {
            
            console.log("embed player ready");
            
            this.embedPlayer.seek(0);
            this.embedPlayer.pause();
            this.embedPlayer.setMuted(false);
           
            setTimeout(() => {
                this.embedPlayer.seek(0);
                this.embedPlayer.pause();
            }, 500);

        });
        
        /*
        this.embedPlayer.addEventListener("play", () => {
            
            console.log("seek in embed player");

            this.reset();

            // offset chat
            this.timeStart = Date.now() - ( this.embedPlayer.getCurrentTime() * 1000 );

        });

        this.embedPlayer.addEventListener("pause", () => {
            
            console.log("pause in embed player");

        });

        this.embedPlayer.addEventListener("playing", () => {
            
            console.log("seek2 in embed player");

            this.reset();

            // offset chat
            this.timeStart = Date.now() - ( this.embedPlayer.getCurrentTime() * 1000 );

        });
        */

        this.elements.video.style.display = 'none';

    }

    fetchBadges(){

        if(!this.channelId){
            console.error('No channel id for badges');
            return false;
        }

        // global badges
        fetch( 'https://badges.twitch.tv/v1/badges/global/display').then( function(response){
            return response.json();
        }).then( (json2) => {

            if( json2.badge_sets ){
                this.badges.global = json2.badge_sets;
                console.log('twitch badges channel', this.badges.global);
            }

        });

        // global badges
        fetch( 'https://badges.twitch.tv/v1/badges/channels/' + this.channelId + '/display').then( function(response){
            return response.json();
        }).then( (json2) => {

            if( json2.badge_sets ){
                this.badges.channel = json2.badge_sets;
                console.log('twitch badges global', this.badges.channel);
            }

        });

    }

    /**
     * Fetch emotes from multiple sources
     */
    fetchEmotes(){

        if(!this.channelName){
            console.error('No channel name for emotes');
            return false;
        }

        // ffz
        console.log('Fetching FFZ');
        document.getElementById('status-text-ffz').innerHTML = 'Fetching...';
        fetch( 'https://api.frankerfacez.com/v1/room/' + this.channelName.toLowerCase() ).then( function(response){
            return response.json();
        }).then( (json2) => {
            this.emotes.ffz = json2;
            console.log('ffz', this.emotes.ffz);
            document.getElementById('status-text-ffz').innerHTML = 'OK!';
        });

        // bttv_channel
        console.log('Fetching BTTV_Channel');
        document.getElementById('status-text-bttv_channel').innerHTML = 'Fetching...';
        fetch( 'https://api.betterttv.net/2/channels/' + this.channelName.toLowerCase() ).then( function(response){
            return response.json();
        }).then( (json2) => {
            this.emotes.bttv_channel = json2;
            console.log('bttv_channel', this.emotes.bttv_channel);
            document.getElementById('status-text-bttv_channel').innerHTML = 'OK! (' + Object.keys(this.emotes.bttv_channel.emotes).length + ' emotes)';
        });

        // bttv_global
        console.log('Fetching BTTV_Global');
        document.getElementById('status-text-bttv_global').innerHTML = 'Fetching...';
        fetch( 'https://api.betterttv.net/2/emotes' ).then( function(response){
            return response.json();
        }).then( (json2) => {
            this.emotes.bttv_global = json2;
            console.log('bttv_global', this.emotes.bttv_global);
            document.getElementById('status-text-bttv_global').innerHTML = 'OK! (' + Object.keys(this.emotes.bttv_global.emotes).length + ' emotes)';
        });

    }

    
    async fetchChat(){

        chatLog.comments = [];

        let fragment = await this.fetchChatFragment(0);

        let cursor = fragment._next;

        console.log( 'first fragment', fragment );

        this.fetchChatRunning = true;

        // for( let i = 0; i < 5; i++ ){
        while( cursor && this.fetchChatRunning ){
            
            let f = await this.fetchChatFragment(null, cursor);
            
            cursor = f._next;

            chatLog.comments = chatLog.comments.concat( f.comments );
            
            console.log( "Add messages to chat log", chatLog.comments.length );

            // console.log('loop fragment', f);
            
        }

        console.log("Chat fetching stopped");
        

    }

    fetchChatFragment( start : any, cursor: any = null ){


        let url = 'https://api.twitch.tv/kraken/videos/' + this.videoId + '/comments';
        
        // if(start) url += '?content_offset_seconds=' + start;
        
        if(cursor) url += '?cursor=' + cursor;

        if( this.videoCurrentTime > 0 ){
            url += ( cursor ? '&' : '?' ) + 'content_offset_seconds=' + this.videoCurrentTime;
        }

        return fetch(url, {
            headers: {
                "Client-ID": this.settings.twitchClientId,
                "Accept": "application/vnd.twitchtv.v5+json"
            }
        }).then( (resp) => {
            return resp.json();
        });
        /*.then( (json) => {
            
            console.log("chat", json);

            let cursor = json._next;

        });
        */

    }
    
    fetchVideoInfo(){

        return fetch('https://api.twitch.tv/helix/videos?id=' + this.videoId, {
            headers: {
                "Client-ID": this.settings.twitchClientId
            }
        }).then( (resp) => {
            return resp.json();
        });
        /*.then( (json) => {

            console.log( 'fetchVideoInfo', this.videoId, json.data[0] );

            return json;

        });
        */

    }

    fetchMarkerInfo(){
        return fetch('https://api.twitch.tv/kraken/videos/' + this.videoId + '/markers?api_version=5&client_id=' + this.settings.twitchClientId, {
            headers: {
                "Client-ID": this.settings.twitchClientId
            }
        }).then( (resp) => {
            return resp.json();
        }).then( (json) => {

            if( json.markers.game_changes ){
                
                /*
                for( let marker of json.markers.game_changes ){
                    console.log(marker);
                    this.videoChapters.push(marker);
                }
                */

                this.videoChapters = json.markers.game_changes;

            }

            console.log( "markers", json, this.videoChapters );

        });
    }
    

    hooks(){

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
        this.elements.video.addEventListener('canplay', ( ev : HTMLInputEvent ) => {
            this.videoLoaded = true;
            document.getElementById('status-text-video').innerHTML = 'Loaded (' + this.elements.video.duration + 's)';
            // document.getElementById('option-group-video').classList.add('ok');
        });

        // space to play
        this.elements.player.addEventListener('keyup', ( ev : KeyboardEvent ) => {
            if(ev.keyCode == 32){
                ev.preventDefault();
                this.play();
                return false;
            }
        });
        
        console.debug('Added hooks');

        this.loadSettings();

        // this.videoId = '586683584'
        // this.fetchChat();

    }

    timeFormat( seconds: number ){

        /*
        let minutes = Math.floor( timeRelative / 60 );
        let hours = Math.floor( minutes / 60 );
        let seconds = Math.floor( timeRelative - minutes * 60 );
        
        return hours + ':' + minutes + ':' + seconds;
        */
    
        let date = new Date(null);
        date.setSeconds( seconds ); // specify value for SECONDS here
        return date.toISOString().substr(11, 8);

    }

    alignChat( dir: string ){
        this.elements.comments.classList.remove('left', 'right');
        this.elements.comments.classList.add(dir);
    }

    alignText( dir: string ){
        this.elements.comments.classList.remove('text-left', 'text-right');
        this.elements.comments.classList.add('text-' + dir);
    }

    /*
    set chatTop( v: number ){
        this.elements.comments.style.top = v + '%';
        this._chatTop = v;
    }

    get chatTop(){
        return this._chatTop;
    }

    set chatBottom( v: number ){
        this.elements.comments.style.bottom = v + '%';
        this._chatBottom = v;
    }

    get chatBottom(){
        return this._chatBottom;
    }

    set chatWidth( v: number ){
        this.elements.comments.style.width = v + '%';
        this._chatWidth = v;
    }

    get chatWidth(){
        return this._chatWidth;
    }

    set chatStroke( enabled : boolean ){
        this.elements.comments.classList.toggle('has-stroke', enabled);
    }
    

    set chatStyle( s : string ){
        this.elements.comments.classList.remove('has-gradient', 'has-fill40', 'has-fill80');
        if( s ) this.elements.comments.classList.add( s );
        this._chatStyle = s;
    }

    get chatStyle(){
        return this._chatStyle;
    }
    */

    saveSettings(){
        localStorage.setItem('settings', JSON.stringify(this.settings));
        console.log("Saved settings");
        alert("Saved settings");
    }

    loadSettings(){
        let v = localStorage.getItem('settings');
        if(v){
            this.settings = JSON.parse(v);
            console.log("Loaded settings");
        }else{
            console.log("No settings to load");
        }
        console.log("Settings", this.settings);
    }

    resetSettings(){
        this.settings = { ...defaultSettings };
    }

    get videoPosition(){

        if( this.embedPlayer ){
            return this.embedPlayer.getCurrentTime() / this.vodLength;
        }else if( this.elements.video ){
            return this.elements.video.currentTime / this.vodLength;
        }else{
            return 0;
        }

    }

    get videoCurrentTime(){
        if( this.embedPlayer ){
            return this.embedPlayer.getCurrentTime();
        }else if( this.elements.video ){
            return this.elements.video.currentTime;
        }else{
            return 0;
        }
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

document.addEventListener("DOMContentLoaded", () => {
    
    const vodplayer = new VODPlayer();

    const app = new Vue({
        render: h => h(App),
        data: {
            vp: vodplayer
        }
    }).$mount('#app');


    vodplayer.elements.player 	= document.getElementById('player');
    vodplayer.elements.video 	= document.getElementById('video');
    vodplayer.elements.comments = document.getElementById('comments');
    vodplayer.elements.osd 		= document.getElementById('osd');
    vodplayer.elements.timeline = document.getElementById('timeline-text');

    vodplayer.hooks();

    console.log(vodplayer);

    // chat style
    /*
    document.getElementById('optionChatStyle').addEventListener('change', function( ev : HTMLInputEvent ){
        console.log('Set chat style');
        vodplayer.elements.comments.classList.remove('has-gradient', 'has-fill');
        if( ev.target.value ) vodplayer.elements.comments.classList.add( ev.target.value );
    });
    */

    /*
    document.getElementById('optionChatStroke').addEventListener('change', function( ev : HTMLInputEvent ){
        console.log('Set chat stroke');
        // vodplayer.elements.comments.classList.toggle('has-stroke', ev.target.checked);
        vodplayer.chatStroke = ev.target.checked;
    });

    document.getElementById('optionChatEmotes').addEventListener('change', function( ev : HTMLInputEvent ){
        console.log('Set chat emotes');
        vodplayer.emotesEnabled = ev.target.checked;
    });

    document.getElementById('optionChatTimestamps').addEventListener('change', function( ev : HTMLInputEvent ){
        console.log('Set chat timestamps');
        vodplayer.timestampsEnabled = ev.target.checked;
    });

    document.getElementById('optionChatBadges').addEventListener('change', function( ev : HTMLInputEvent ){
        console.log('Set chat badges');
        vodplayer.badgesEnabled = ev.target.checked;
    });

    document.getElementById('optionChatTop').addEventListener('change', function( ev : HTMLInputEvent ){
        console.log('Set chat top');
        vodplayer.chatTop = parseInt(ev.target.value);
    });

    document.getElementById('optionChatBottom').addEventListener('change', function( ev : HTMLInputEvent ){
        console.log('Set chat bottom');
        vodplayer.chatBottom = parseInt(ev.target.value);
    });

    document.getElementById('optionChatWidth').addEventListener('change', function( ev : HTMLInputEvent ){
        console.log('Set chat width');
        vodplayer.chatWidth = parseInt(ev.target.value);
    });
    */

    // vodplayer.reset();

});

// window.VODPlayer = VODPlayer;