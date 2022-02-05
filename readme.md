# Demo

http://vod.dongers.net/player.html

I'll try to keep it up to date, but i would recommend cloning and serving the project locally for an up to date version.
If I figure out how to automatically make zip files of releases I'll do that.

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

## Automated

`/#source=file&video_path=PATH&chatfile=CHATFILE.json`

`/#source=youtube&youtube_id=VIDEO_ID&chatfile=CHATFILE.json`

`/#source=twitch&twitch_id=VIDEO_ID&chatfile=CHATFILE.json`

`/#source=twitch&twitch_id=VIDEO_ID&chatdump=VIDEO_ID`

## Playing back

Open the player.html page, load the video file (for better stability) and chat dump (can take a while).

Set settings as wanted, then press Start Playback. Pressing apply while playing will apply modified settings.

Press space when player is focused to play, useful if you've toggled fullscreen. Arrow keys to seek.

# Recording

Make the browser window fullscreen (F11). It's optimized for a 1920x1080 screen at the minimum.

Do a screen/window capture and crop to 1280x720 top left.

Record at a high bitrate.