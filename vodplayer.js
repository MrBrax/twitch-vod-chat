'use strict';
class VODPlayer {
    constructor() {
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
        this.timeStart = null;
        this.chatOffset = 0;
        this.videoLoaded = false;
        this.chatLoaded = false;
        this.commentAmount = null;
        this.elements = {
            video: null,
            comments: null,
            timeline: null,
            osd: null,
            player: null,
        };
        this.tickDelay = 300;
        this.timeScale = 1;
        this.vodLength = null;
        this.archiveLength = null;
        this.channelName = null;
        this.emotesEnabled = true;
        this.timestampsEnabled = true;
        this.badgesEnabled = true;
        this.noVideo = false;
        this.playing = false;
        this._chatTop = 0;
        this._chatBottom = 100;
        this.twitchBadges = {};
        this.twitchClientId = '';
        this.interval = null;
    }
    tick() {
        let timeNow = Date.now();
        let timeRelative = (timeNow - this.timeStart) / 1000;
        if ((timeRelative * this.timeScale) > this.vodLength + 5) {
            alert('Stopped playback');
            clearInterval(this.interval);
            return;
        }
        for (let i = 0; i < this.commentAmount; i++) {
            let comment = this.chatLog.comments[i];
            if (comment.displayed)
                continue;
            if (timeRelative < (comment.content_offset_seconds / this.timeScale))
                continue;
            let commentAge = timeRelative - (comment.content_offset_seconds / this.timeScale);
            if (commentAge > 60) {
                comment.displayed = true;
                continue;
            }
            let commentDiv = document.createElement('div');
            commentDiv.className = 'comment';
            if (this.timestampsEnabled) {
                let commentTime = this.timeFormat(comment.content_offset_seconds);
                let timeC = document.createElement('span');
                timeC.className = 'time';
                timeC.innerHTML = '[' + commentTime + ']';
                commentDiv.appendChild(timeC);
            }
            if (this.badgesEnabled && comment.message.user_badges && this.badges.global && this.badges.channel) {
                for (let b of comment.message.user_badges) {
                    let badgeId = b._id;
                    let badgeVersion = b.version;
                    let imageSrc = null;
                    if (this.badges.global[badgeId] && this.badges.global[badgeId].versions[badgeVersion])
                        imageSrc = this.badges.global[badgeId].versions[badgeVersion].image_url_1x;
                    if (this.badges.channel[badgeId] && this.badges.channel[badgeId].versions[badgeVersion])
                        imageSrc = this.badges.channel[badgeId].versions[badgeVersion].image_url_1x;
                    if (!imageSrc) {
                        console.error('no badge', badgeId, badgeVersion, this.twitchBadges);
                        continue;
                    }
                    let badgeImage = document.createElement('img');
                    badgeImage.className = 'badge ' + b._id;
                    badgeImage.src = imageSrc;
                    commentDiv.appendChild(badgeImage);
                }
            }
            let nameC = document.createElement('span');
            nameC.className = 'name';
            nameC.innerHTML = comment.commenter.display_name + ':';
            nameC.style.color = comment.message.user_color;
            commentDiv.appendChild(nameC);
            let bodyC = document.createElement('span');
            for (let f of comment.message.fragments) {
                if (f.emoticon && this.emotesEnabled) {
                    let emoC = document.createElement('img');
                    emoC.className = 'emote twitch';
                    emoC.src = 'https://static-cdn.jtvnw.net/emoticons/v1/' + f.emoticon.emoticon_id + '/1.0';
                    bodyC.appendChild(emoC);
                }
                else {
                    let fragC = document.createElement('span');
                    let finalText = f.text;
                    if (this.emotesEnabled) {
                        for (let fSet in this.emotes.ffz.sets) {
                            for (let fEmo of this.emotes.ffz.sets[fSet].emoticons) {
                                finalText = finalText.replaceAll(fEmo.name, '<img class="emote ffz" src="https:' + fEmo.urls[1] + '" />');
                            }
                        }
                        if (this.emotes.bttv_channel && this.emotes.bttv_channel.emotes) {
                            for (let fEmo of this.emotes.bttv_channel.emotes) {
                                finalText = finalText.replaceAll(fEmo.code, '<img class="emote bttv_channel bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
                            }
                        }
                        for (let fEmo of this.emotes.bttv_global.emotes) {
                            finalText = finalText.replaceAll(fEmo.code, '<img class="emote bttv_global bttv-emo-' + fEmo.id + '" src="https://cdn.betterttv.net/emote/' + fEmo.id + '/2x" />');
                        }
                    }
                    fragC.innerHTML = finalText;
                    bodyC.appendChild(fragC);
                }
            }
            commentDiv.appendChild(bodyC);
            this.elements.comments.appendChild(commentDiv);
            comment.displayed = true;
        }
        let timelineText = 'C: ' + this.timeFormat(timeRelative * this.timeScale);
        if (this.elements.video.currentTime) {
            timelineText += ' / V: ' + this.timeFormat(this.elements.video.currentTime);
        }
        this.elements.timeline.innerHTML = timelineText;
        if (this.noVideo) {
            this.elements.osd.innerHTML = 'Sync: ' + this.timeFormat(timeRelative * this.timeScale) + '<br>Scale: ' + this.timeScale + '<br>Offset: ' + this.chatOffset + '<br>Tick: ' + this.tickDelay;
            if (!this.elements.osd.classList.contains('running')) {
                this.elements.osd.classList.add('running');
            }
        }
        this.elements.comments.scrollTop = this.elements.comments.scrollHeight;
        if (this.elements.comments.children.length > 100) {
            for (let i = this.elements.comments.children.length; i > 100; i--) {
                this.elements.comments.removeChild(this.elements.comments.firstChild);
            }
        }
    }
    play() {
        if (this.playing) {
            alert('Already playing');
            return false;
        }
        console.log('Started playback');
        if (!this.chatLog) {
            alert('No chat log added');
            return false;
        }
        this.timeStart = Date.now();
        if (this.videoLoaded) {
            console.log("Video loaded, playing");
            this.elements.video.play();
            this.noVideo = false;
        }
        else if (this.embedPlayer) {
            console.log("Embed loaded, playing");
            this.embedPlayer.seek(0);
            this.embedPlayer.setMuted(false);
            this.embedPlayer.setVolume(1.0);
            this.embedPlayer.play();
        }
        else {
            console.log("No video loaded");
            this.elements.osd.style.display = 'block';
            this.noVideo = true;
        }
        console.log('Offset: ' + document.getElementById('optionOffset').value);
        this.apply();
        this.timeStart += this.chatOffset;
        this.interval = setInterval(this.tick.bind(this), this.tickDelay / this.timeScale);
        document.getElementById('buttonStart').disabled = true;
        document.getElementById('inputVideo').disabled = true;
        document.getElementById('inputChat').disabled = true;
        this.playing = true;
    }
    reset() {
        this.elements.comments.innerHTML = '';
        for (let i = 0; i < this.commentAmount; i++) {
            let comment = this.chatLog.comments[i];
            comment.displayed = null;
        }
    }
    apply() {
        console.log('Applying options');
        this.timeScale = parseInt(document.getElementById('optionTimescale').value);
        console.log('Timescale: ' + this.timeScale);
        this.tickDelay = parseInt(document.getElementById('optionTickDelay').value);
        console.log('TickDelay: ' + this.tickDelay);
        this.chatOffset = parseInt(document.getElementById('optionOffset').value) * 1000;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = setInterval(this.tick.bind(this), this.tickDelay / this.timeScale);
        }
    }
    fullscreen() {
        let element = this.elements.player;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        }
        else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        }
        else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(element.ALLOW_KEYBOARD_INPUT);
        }
        else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
    load(ev, f) {
        let URL = window.URL || window.webkitURL;
        console.log('Load file: ' + f);
        ev.preventDefault();
        let file = ev.target.files[0];
        let type = file.type;
        let fileURL = URL.createObjectURL(file);
        if (f == 'video') {
            this.elements.video.src = fileURL;
            document.getElementById('status-text-video').innerHTML = 'Loading...';
        }
        else {
            document.getElementById('status-text-comments').innerHTML = 'Parsing...';
            fetch(fileURL).then(function (response) {
                return response.json();
            }).then((json) => {
                console.log('Returned JSON for chat');
                this.chatLog = json;
                this.commentAmount = Object.keys(this.chatLog.comments).length;
                console.log('Amount: ' + this.commentAmount);
                let rawDuration = this.chatLog.video.duration;
                let durHours = rawDuration.match(/([0-9]+)h/);
                let durMinutes = rawDuration.match(/([0-9]+)m/);
                let durSeconds = rawDuration.match(/([0-9]+)s/);
                durHours = durHours ? parseInt(durHours[1]) : 0;
                durMinutes = durMinutes ? parseInt(durMinutes[1]) : 0;
                durSeconds = durSeconds ? parseInt(durSeconds[1]) : 0;
                console.log(durHours, durMinutes, durSeconds);
                this.vodLength = (durHours * 60 * 60) + (durMinutes * 60) + durSeconds;
                console.log('VOD length: ' + this.vodLength);
                this.archiveLength = this.elements.video.duration;
                console.log('Archive length: ' + this.archiveLength);
                if (this.archiveLength > 0) {
                    document.getElementById('optionOffset').value = (parseInt(this.vodLength) - parseInt(this.archiveLength)).toString();
                }
                this.channelName = this.chatLog.video.user_name;
                this.channelId = this.chatLog.video.user_id;
                this.videoId = this.chatLog.video.id;
                this.fetchBadges();
                this.fetchEmotes();
                document.getElementById('status-text-comments').innerHTML = 'OK (' + this.channelName + ', ' + this.commentAmount + 'c, ' + this.vodLength + 's)!';
                document.getElementById('option-group-chat').classList.add('ok');
                this.chatLoaded = true;
                if (!this.videoLoaded) {
                    this.setupEmbedPlayer();
                }
            });
        }
    }
    setupEmbedPlayer() {
        console.log("Setup embed player");
        let embedPlayerElement = document.createElement('twitch-embed-player');
        this.elements.player.appendChild(embedPlayerElement);
        this.embedPlayer = new Twitch.Player(embedPlayerElement, {
            width: '100%',
            height: '100%',
            video: this.videoId,
            autoplay: false
        });
        console.log("Embed player created", this.embedPlayer);
        console.log("Add event listeners");
        this.embedPlayer.addEventListener(Twitch.Player.READY, () => {
            console.log("embed player ready");
            this.embedPlayer.seek(0);
            this.embedPlayer.pause();
            this.embedPlayer.setMuted(false);
        });
        this.elements.video.style.display = 'none';
    }
    fetchBadges() {
        if (!this.channelId) {
            console.error('No channel id for badges');
            return false;
        }
        fetch('https://badges.twitch.tv/v1/badges/global/display').then(function (response) {
            return response.json();
        }).then((json2) => {
            if (json2.badge_sets) {
                this.badges.global = json2.badge_sets;
                console.log('twitch badges channel', this.badges.global);
            }
        });
        fetch('https://badges.twitch.tv/v1/badges/channels/' + this.channelId + '/display').then(function (response) {
            return response.json();
        }).then((json2) => {
            if (json2.badge_sets) {
                this.badges.channel = json2.badge_sets;
                console.log('twitch badges global', this.badges.channel);
            }
        });
    }
    fetchEmotes() {
        if (!this.channelName) {
            console.error('No channel name for emotes');
            return false;
        }
        console.log('Fetching FFZ');
        document.getElementById('status-text-ffz').innerHTML = 'Fetching...';
        fetch('https://api.frankerfacez.com/v1/room/' + this.channelName.toLowerCase()).then(function (response) {
            return response.json();
        }).then((json2) => {
            this.emotes.ffz = json2;
            console.log('ffz', this.emotes.ffz);
            document.getElementById('status-text-ffz').innerHTML = 'OK!';
        });
        console.log('Fetching BTTV_Channel');
        document.getElementById('status-text-bttv_channel').innerHTML = 'Fetching...';
        fetch('https://api.betterttv.net/2/channels/' + this.channelName.toLowerCase()).then(function (response) {
            return response.json();
        }).then((json2) => {
            this.emotes.bttv_channel = json2;
            console.log('bttv_channel', this.emotes.bttv_channel);
            document.getElementById('status-text-bttv_channel').innerHTML = 'OK! (' + Object.keys(this.emotes.bttv_channel.emotes).length + ' emotes)';
        });
        console.log('Fetching BTTV_Global');
        document.getElementById('status-text-bttv_global').innerHTML = 'Fetching...';
        fetch('https://api.betterttv.net/2/emotes').then(function (response) {
            return response.json();
        }).then((json2) => {
            this.emotes.bttv_global = json2;
            console.log('bttv_global', this.emotes.bttv_global);
            document.getElementById('status-text-bttv_global').innerHTML = 'OK! (' + Object.keys(this.emotes.bttv_global.emotes).length + ' emotes)';
        });
    }
    hooks() {
        this.elements.video.addEventListener('seeked', (ev) => {
            if (this.chatLog) {
                this.reset();
                this.timeStart = Date.now() - (this.elements.video.currentTime * 1000);
            }
            else {
                console.error('No chat log loaded');
            }
        });
        this.elements.video.addEventListener('canplay', (ev) => {
            document.getElementById('status-text-video').innerHTML = 'Loaded (' + this.elements.video.duration + 's)';
            document.getElementById('option-group-video').classList.add('ok');
        });
        this.elements.player.addEventListener('keyup', (ev) => {
            if (ev.keyCode == 32) {
                ev.preventDefault();
                this.play();
                return false;
            }
        });
    }
    timeFormat(seconds) {
        let date = new Date(null);
        date.setSeconds(seconds);
        return date.toISOString().substr(11, 8);
    }
    alignChat(dir) {
        this.elements.comments.classList.remove('left', 'right');
        this.elements.comments.classList.add(dir);
    }
    alignText(dir) {
        this.elements.comments.classList.remove('text-left', 'text-right');
        this.elements.comments.classList.add('text-' + dir);
    }
    set chatTop(v) {
        this.elements.comments.style.top = v + '%';
        this._chatTop = v;
    }
    set chatBottom(v) {
        this.elements.comments.style.bottom = v + '%';
        this._chatTop = v;
    }
    set chatWidth(v) {
        this.elements.comments.style.width = v + '%';
        this._chatWidth = v;
    }
}
//# sourceMappingURL=vodplayer.js.map