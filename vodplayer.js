'use strict';

class VODPlayer {

    constructor(){

        this.chatLog        = null;

        this.emotes = {
            ffz: null,
            bttv_channel: null,
            bttv_global: null
        };

        this.badges = {
            global: null,
            channel: null
        };

        // this.ffz            = null;
        // this.bttv_channel   = null;
        // this.bttv_global    = null;

        this.timeStart      = null;
        this.chatOffset     = 0;

        this.commentAmount  = null;

        this.elements       = {};

        this.tickDelay      = 300;
        this.timeScale      = 1;

        this.vodLength      = null;
        this.archiveLength  = null;
        this.channelName    = null;

        this.emotesEnabled      = true;
        this.timestampsEnabled  = true;
        this.badgesEnabled      = true;

        this.noVideo        = false;

        this.playing        = false;

        this._chatTop       = 0;
        this._chatBottom    = 100;

        this.twitchBadges   = {};

        this.twitchClientId = '';

    }

    tick(){

        let timeNow = Date.now();

        let timeRelative = ( timeNow - this.timeStart ) / 1000;

        if( ( timeRelative * this.timeScale ) > this.vodLength + 5 ){
            alert('Stopped playback');
            clearInterval( this.interval );
            return;
        }

        for( let i = 0; i < this.commentAmount; i++ ){

            let comment = this.chatLog.comments[i];

            if( comment.displayed ) continue;

            if( timeRelative < ( comment.content_offset_seconds / this.timeScale ) ) continue;

            // if skipped or something
            let commentAge = timeRelative - ( comment.content_offset_seconds / this.timeScale )
            if( commentAge > 60 ){
                // console.log('comment too old', commentAge);
                comment.displayed = true;
                continue;
            }

            let commentDiv = document.createElement('div');
            commentDiv.className = 'comment';

            // timestamp
            if( this.timestampsEnabled ){
                // calc time
                let commentTime = this.timeFormat( comment.content_offset_seconds );
                let timeC = document.createElement('span');
                timeC.className = 'time';
                timeC.innerHTML = '[' + commentTime + ']';
                commentDiv.appendChild(timeC);
            }

            // badges
            if( this.badgesEnabled && comment.message.user_badges && this.badges.global && this.badges.channel){

                for( let b of comment.message.user_badges ){
                    // if( b._id == 'sub-gifter' ) continue;
                    /*
                    let badgeC = document.createElement('span');
                    badgeC.className = 'badge ' + b._id;
                    badgeC.innerHTML = b._id.substr(0, 1).toUpperCase();
                    commentDiv.appendChild(badgeC);
                    */
                    
                    let badgeId = b._id;
                    let badgeVersion = b.version;

                    let imageSrc = null;

                    if( this.badges.global[ badgeId ] && this.badges.global[ badgeId ].versions[ badgeVersion ] )
                        imageSrc = this.badges.global[ badgeId ].versions[ badgeVersion ].image_url_1x;
                    
                    if( this.badges.channel[ badgeId ] && this.badges.channel[ badgeId ].versions[ badgeVersion ] )
                        imageSrc = this.badges.channel[ badgeId ].versions[ badgeVersion ].image_url_1x;
                    
                    if(!imageSrc){
                        console.error('no badge', badgeId, badgeVersion, this.twitchBadges);
                        continue;
                    }

                    let badgeImage = document.createElement('img');
                    badgeImage.className = 'badge ' + b._id;
                    badgeImage.src = imageSrc;
                    commentDiv.appendChild(badgeImage);

                }

            }

            // name
            let nameC = document.createElement('span');
            nameC.className = 'name';
            nameC.innerHTML = comment.commenter.display_name + ':';
            nameC.style.color = comment.message.user_color;
            commentDiv.appendChild(nameC);
        

            let bodyC = document.createElement('span');

            // make message
            for( let f of comment.message.fragments ){

                if( f.emoticon && this.emotesEnabled ){

                    let emoC = document.createElement('img');
                    emoC.className = 'emote twitch';
                    emoC.src = 'https://static-cdn.jtvnw.net/emoticons/v1/' + f.emoticon.emoticon_id + '/1.0';
                    bodyC.appendChild(emoC);

                }else{

                    let fragC = document.createElement('span');

                    let finalText = f.text;

                    if( this.emotesEnabled ){

                        // ffz
                        for( let fSet in this.emotes.ffz.sets ){
                            for( let fEmo of this.emotes.ffz.sets[fSet].emoticons ){
                                finalText = finalText.replaceAll(fEmo.name, '<img class="emote ffz" src="https:' + fEmo.urls[1] + '" />');
                            }
                        }

                        // bttv_channel
                        if( this.emotes.bttv_channel && this.emotes.bttv_channel.emotes ){
                            for( let fEmo of this.emotes.bttv_channel.emotes ){
                                finalText = finalText.replaceAll(fEmo.code, '<img class="emote bttv_channel bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
                            }
                        }

                        // bttv_global
                        for( let fEmo of this.emotes.bttv_global.emotes ){
                            finalText = finalText.replaceAll(fEmo.code, '<img class="emote bttv_global bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
                        }

                    }

                    fragC.innerHTML = finalText;

                    bodyC.appendChild(fragC);

                }

            }
            
            commentDiv.appendChild(bodyC);

            this.elements.comments.appendChild( commentDiv );

            comment.displayed = true;

        }

        // update timeline
        let timelineText = 'C: ' + this.timeFormat( timeRelative * this.timeScale );

        if( this.elements.video.currentTime ){
            timelineText += ' / V: ' + this.timeFormat(this.elements.video.currentTime);
        }

        this.elements.timeline.innerHTML = timelineText;

        if( this.noVideo ){
            this.elements.osd.innerHTML = 'Sync: ' + this.timeFormat( timeRelative * this.timeScale ) + '<br>Scale: ' + this.timeScale + '<br>Offset: ' + this.chatOffset  + '<br>Tick: ' + this.tickDelay;
            if( !this.elements.osd.classList.contains('running') ){
                this.elements.osd.classList.add('running');
            }
        }

        // scroll
        this.elements.comments.scrollTop = this.elements.comments.scrollHeight;

        // remove old comments
        if( this.elements.comments.children.length > 100 ){
            for( let i = this.elements.comments.children.length; i > 100; i-- ){
                this.elements.comments.removeChild( this.elements.comments.firstChild );
            }
        }

        

    }

    play(){

        if( this.playing ){
            alert('Already playing');
            return false;
        }

        console.log('Started playback');

        if(!this.chatLog){
            alert('No chat log added');
            return false;
        }

        this.timeStart = Date.now();

        if( this.elements.video.src ){
            this.elements.video.play();
            this.noVideo = false;
        }else{
            this.elements.osd.style.display = 'block';
            this.noVideo = true;
        }

        console.log('Offset: ' + document.getElementById('optionOffset').value );

        this.apply();

        // offset
        this.timeStart += this.chatOffset;

        this.interval = setInterval( this.tick.bind(this), this.tickDelay / this.timeScale );

        document.getElementById('buttonStart').disabled = true;
        document.getElementById('inputVideo').disabled = true;
        document.getElementById('inputChat').disabled = true;

        this.playing = true;

    }

    reset(){

        this.elements.comments.innerHTML = '';

        for( let i = 0; i < this.commentAmount; i++ ){

            let comment = this.chatLog.comments[i];

            comment.displayed = null;

        }

    }

    apply(){

        console.log('Applying options');

        // timescale 
        this.timeScale = parseInt( document.getElementById('optionTimescale').value );
        console.log('Timescale: ' + this.timeScale);

        // tick delay
        this.tickDelay = parseInt( document.getElementById('optionTickDelay').value );
        console.log('TickDelay: ' + this.tickDelay);

        this.chatOffset = parseInt( document.getElementById('optionOffset').value ) * 1000;

        if( this.interval ){
            clearInterval( this.interval );
            this.interval = setInterval( this.tick.bind(this), this.tickDelay / this.timeScale );
        }

    }

    fullscreen(){

        let element = this.elements.player;

        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }

    }

    load(ev, f){

        let URL = window.URL || window.webkitURL;

        console.log('Load file: ' + f);

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

                console.log('Returned JSON for chat');

                this.chatLog = json;

                this.commentAmount = Object.keys( this.chatLog.comments ).length;
                console.log('Amount: ' + this.commentAmount);

                // get duration, this changed in the new api. if you know of a better parsing solution, please fix this
                let rawDuration = this.chatLog.video.duration;

                let durHours = rawDuration.match(/([0-9]+)h/);
                let durMinutes = rawDuration.match(/([0-9]+)m/);
                let durSeconds = rawDuration.match(/([0-9]+)s/);

                durHours = durHours ? parseInt(durHours[1]) : 0;
                durMinutes = durMinutes ? parseInt(durMinutes[1]) : 0;
                durSeconds = durSeconds ? parseInt(durSeconds[1]) : 0;
                
                console.log(durHours, durMinutes, durSeconds);


                this.vodLength = ( durHours * 60 * 60 ) + ( durMinutes * 60 ) + durSeconds;
                // this.vodLength = this.chatLog.video.length;
                console.log('VOD length: ' + this.vodLength);

                this.archiveLength = this.elements.video.duration;
                console.log('Archive length: ' + this.archiveLength );

                if( this.archiveLength > 0 ){
                    document.getElementById('optionOffset').value = parseInt( this.vodLength ) - parseInt( this.archiveLength );
                }

                this.channelName    = this.chatLog.video.user_name;
                this.channelId      = this.chatLog.video.user_id;

                this.fetchBadges();
                this.fetchEmotes();

                document.getElementById('status-text-comments').innerHTML = 'OK (' + this.channelName + ', ' + this.commentAmount + 'c, ' + this.vodLength + 's)!';
                
                document.getElementById('option-group-chat').classList.add('ok');
                // alert('Chat loaded');

            });

        }

    }

    fetchBadges(){

        if(!this.channelId){
            console.error('No channel id for badges');
            return false;
        }

        /*
        fetch( 'https://api.twitch.tv/kraken/chat/' + this.channelId + '/badges', {
            // mode: 'no-cors',
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': this.twitchClientId
            }
        }).then( function(response){
            console.log('badges response', response);
            return response.json();
        }).then( (json2) => {
            this.twitchBadges = json2;
            console.log('twitch badges', this.twitchBadges);
        });
        */  

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

    fetchEmotes(){

        if(!this.channelName){
            console.error('No channel name for emotes');
            return false;
        }

        // ffz
        console.log('Fetching FFZ');
        fetch( 'https://api.frankerfacez.com/v1/room/' + this.channelName.toLowerCase() ).then( function(response){
            return response.json();
        }).then( (json2) => {
            this.emotes.ffz = json2;
            console.log('ffz', this.emotes.ffz);
            document.getElementById('status-text-ffz').innerHTML = 'OK!';
        });

        // bttv_channel
        console.log('Fetching BTTV_Channel');
        fetch( 'https://api.betterttv.net/2/channels/' + this.channelName ).then( function(response){
            return response.json();
        }).then( (json2) => {
            this.emotes.bttv_channel = json2;
            console.log('bttv_channel', this.emotes.bttv_channel);
            document.getElementById('status-text-bttv_channel').innerHTML = 'OK!';
        });

        // bttv_global
        console.log('Fetching BTTV_Global');
        fetch( 'https://api.betterttv.net/2/emotes' ).then( function(response){
            return response.json();
        }).then( (json2) => {
            this.emotes.bttv_global = json2;
            console.log('bttv_global', this.emotes.bttv_global);
            document.getElementById('status-text-bttv_global').innerHTML = 'OK!';
        });

    }

    hooks(){

        // seeking on video player
        this.elements.video.addEventListener('seeked', (ev) => {

            if( this.chatLog ){

                this.reset();

                // offset chat
                this.timeStart = Date.now() - ( this.elements.video.currentTime * 1000 );

            }else{
                console.error('No chat log loaded');
            }

        });

        // on ready
        this.elements.video.addEventListener('canplay', (ev) => {
            document.getElementById('status-text-video').innerHTML = 'Loaded (' + this.elements.video.duration + 's)';
            document.getElementById('option-group-video').classList.add('ok');
        });

        // space to play
        this.elements.player.addEventListener('keyup', (ev) => {
            if(ev.keyCode == 32){
                ev.preventDefault();
                this.play();
                return false;
            }
        });

    }

    timeFormat( seconds ){

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

    alignChat( dir ){
        this.elements.comments.classList.remove('left', 'right');
        this.elements.comments.classList.add(dir);
    }

    set chatTop( v ){
        this.elements.comments.style.top = v + '%';
        this._chatTop = v;
    }

    set chatBottom( v ){
        this.elements.comments.style.bottom = v + '%';
        this._chatTop = v;
    }

}