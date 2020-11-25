'use strict';

import Vue from 'vue';
import App from './App.vue'
import EmbedVideoPlayer from './embeds/html5';
import EmbedYouTubePlayer from './embeds/youtube';

import VODPlayer from './vodplayer';

// main hooks
document.addEventListener("DOMContentLoaded", () => {

    const vodplayer = new VODPlayer();

    const app = new Vue({
        render: h => h(App),
        data: {
            vp: vodplayer
        }
    }).$mount('#app');


    vodplayer.elements.player = document.getElementById('player');
    vodplayer.elements.video = document.getElementById('video');
    vodplayer.elements.comments = document.getElementById('comments');
    vodplayer.elements.osd = document.getElementById('osd');
    // vodplayer.elements.timeline = document.getElementById('timeline-text');
    vodplayer.elements.playback_text = document.getElementById('playback_text');

    vodplayer.hooks();

    console.debug("vodplayer", vodplayer);

    let query = document.location.hash;
    let query_param = query.split("&");
    let params: any = {};
    for (let param of query_param) {
        params[param.split("=")[0].replace("#", "")] = param.split("=")[1];
    }

    // automate it
    if (params.source) {
        // let embedPlayer: EmbedPlayer;
        console.debug("automate playback");
        vodplayer.automated = true;

        if (params.source == "youtube") {
            (<any>window).onYouTubeIframeAPIReady = () => {
                vodplayer.embedPlayer = new EmbedYouTubePlayer(params.youtube_id);
            }
        }

        if (params.source == "file") {
            vodplayer.embedPlayer = new EmbedVideoPlayer(params.video_path);
        }

        if (vodplayer.embedPlayer) {
            vodplayer.embedPlayer.vodplayer = vodplayer;
            vodplayer.embedPlayer.setup();
        }

        if (params.chatfile && vodplayer.embedPlayer) {
            vodplayer.embedPlayer.setCallback('ready', () => {
                console.debug("player ready, load chat file");
                vodplayer.loadChatFileFromURL(params.chatfile);
            });
        }

    }

});