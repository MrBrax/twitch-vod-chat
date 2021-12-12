"use strict";

/*
import Vue from 'vue';
import App from './App.vue'
import EmbedVideoPlayer from './embeds/html5';
import EmbedTwitchPlayer from './embeds/twitch';
import EmbedYouTubePlayer from './embeds/youtube';

import VODPlayer from './vodplayer';

// main hooks
document.addEventListener("DOMContentLoaded", () => {

    const vodplayer = new VODPlayer();

    const app = new Vue({
        render: h => h(App),
        data: function() {
return {
            vp: vodplayer
        };
}
    }).$mount('#app');

    vodplayer.elements.viewer = document.getElementById('viewer');
    vodplayer.elements.player = document.getElementById('player');
    vodplayer.elements.video = document.getElementById('video');
    vodplayer.elements.comments = document.getElementById('comments');
    vodplayer.elements.osd = document.getElementById('osd');
    // vodplayer.elements.timeline = document.getElementById('timeline-text');
    vodplayer.elements.playback_text = document.getElementById('playback_text');

    vodplayer.hooks();

    console.debug("vodplayer", vodplayer);

    const processHash = () => {

        console.debug("Process hash", window.location.hash);

        const query = window.location.hash;
        const query_param = query.split("&");
        const params: any = {};
        for (const param of query_param) {
            params[param.split("=")[0].replace("#", "")] = param.split("=")[1];
        }

        // twitch client id
        if(params.tci){
            vodplayer.settings.twitchClientId = params.tci;
        }

        // twitch secret
        if(params.ts){
            vodplayer.settings.twitchSecret = params.ts;
        }

        // token
        if(params.tk){
            vodplayer.settings.twitchToken = params.tk;
        }

        if(params.offset){
            vodplayer.chatOffset = parseInt(params.offset);
        }

        if(params.chapters){
            vodplayer.videoChapters = [];
            const ch = params.chapters.split(";");
            for( const c of ch ){
                const d = c.split(":");
                const chapter = {
                    time: parseInt(d[0]),
                    label: d[1]
                };
                console.log("add chapter", chapter);
                vodplayer.videoChapters.push(chapter);
            }
            console.log(vodplayer.videoChapters);
        }
        
        // automate it
        if (params.source) {
            
            console.debug("automate playback");
            vodplayer.automated = true;

            // load video
            if (params.source == "youtube") {
                (<any>window).onYouTubeIframeAPIReady = () => {
                    vodplayer.embedPlayer = new EmbedYouTubePlayer(params.youtube_id);
                }
            } else if (params.source == "twitch") {
                vodplayer.embedPlayer = new EmbedTwitchPlayer(params.twitch_id);
            } else if (params.source == "file") {
                vodplayer.embedPlayer = new EmbedVideoPlayer(params.video_path);
            }else{
                alert("No video source set");
                return false;
            }

            // set up embed player
            if (vodplayer.embedPlayer) {
                vodplayer.embedPlayer.vodplayer = vodplayer;
                vodplayer.embedPlayer.setup();
            }

            // load chat
            if (params.chatdump && vodplayer.embedPlayer) {
                vodplayer.loadTwitchChat(params.chatdump).then( status => {
                    console.log("auto chat load 1", status);
                    if (params.offset) vodplayer.seek(params.offset);
                });
            } else if (params.chatfile && vodplayer.embedPlayer) {
                vodplayer.embedPlayer.setCallback('ready', () => {
                    console.debug("player ready, load chat file");
                    vodplayer.loadChatFileFromURL(params.chatfile).then( status => {
                        console.log("auto chat load 2", status);
                        if (params.offset) vodplayer.seek(params.offset);
                    });
                });
            }else{
                alert("No chat source set");
                return false;
            }

            

        }
    }

    window.addEventListener("hashchange", () => processHash);

    processHash();

});
*/
