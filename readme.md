Needs https://github.com/PetterKraabol/Twitch-Chat-Downloader

Download a vod chat:

`python app.py -v {id} --format json`

Open the player.html page, load the video file (optional) and chat dump.

Set settings as wanted, then press Start. Pressing apply while playing will apply modified settings.

Right clicking the video and showing controls makes it so you can seek the video.

One idea i had when making this, is the time scale slider. If you put it on 5 and record at max fps, you can then slow down the footage in your editing software, making the required realtime record time 5 times less. I have however not tested this to make sure the sync is working.
