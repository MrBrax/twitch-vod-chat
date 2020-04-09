# Demo

http://vod.dongers.net/player.html

This link might not be up to date at all times, download the files in the dist folder to be sure.

Some other stuff exists on root as well.

# Setting up

## With downloaded VOD (recommended)

Install [youtube-dl](https://youtube-dl.org)

`youtube-dl https://www.twitch.tv/videos/<ID>`

Install [twitch-chat-downloader](https://github.com/PetterKraabol/Twitch-Chat-Downloader)

`pip install tcd`

`tcd --video <id> --format json`

## With twitch embed (experimental, might buffer)

Just download chat, but don't input a video at all.

## Playing back

Open the player.html page, load the video file (for better stability) and chat dump (can take a while).

Set settings as wanted, then press Start. Pressing apply while playing will apply modified settings.

Right clicking the video and showing controls makes it so you can seek the video.

Press space when player is focused to play, useful if you've toggled fullscreen.

# Recording

Make the browser window fullscreen (F11). It's optimized for a 1920x1080 screen at the minimum.

Do a screen/window capture and crop to 1280x720 top left.

Record at a high bitrate.

---

One idea i had when making this, is the time scale slider. If you put it on 5 and record at max fps, you can then slow down the footage in your editing software, making the required realtime record time 5 times less.

It seems to sync fine, but the gif emotes won't have the same speed.

Turning down the tick ms is required too.
