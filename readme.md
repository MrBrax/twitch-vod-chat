# Setting up

Download a vod chat:

Needs https://github.com/PetterKraabol/Twitch-Chat-Downloader

`python app.py -v {id} --format json`

Download the VOD file with youtube-dl

Open the player.html page, load the video file (optional) and chat dump (can take a while).

Set settings as wanted, then press Start. Pressing apply while playing will apply modified settings.

Right clicking the video and showing controls makes it so you can seek the video.

# Recording

Make the browser window fullscreen (F11). It's optimized for a 1920x1080 screen at the minimum.

Do a screen/window capture and crop to 1280x720 top left.

Record at a high bitrate.

---

One idea i had when making this, is the time scale slider. If you put it on 5 and record at max fps, you can then slow down the footage in your editing software, making the required realtime record time 5 times less. I have however not tested this to make sure the sync is working.

Turning down the tick ms is required too.