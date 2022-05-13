onmessage = (event) => {

    const comments = event.data[0];
    const queue = event.data[1];

    let malformed_comments = 0;

    /**
     * Loop through all comments to insert into queue
     */
    for (let i = 0; i < comments.length; i++) {
        const comment: TwitchComment = comments[i];

        /**
         * Skip malformed comments, abort completely if too many found.
         * Usually a case of formats changing.
         */
        if (comment.content_offset_seconds === undefined || comment.content_offset_seconds < 0) {
            console.error("Malformed comment", comment);
            malformed_comments++;
            if (malformed_comments > 100) {
                this.pause();
                alert("Too many malformed comments, something is wrong with the chat log.");
                return false;
            }
            continue;
        }

        /**
         * Skip already displayed comments
         */
        if (comment.displayed) {
            // console.debug(`skip comment, already displayed: ${i}`);
            continue;
        }

        /**
         * Skip VOD (archive) comments
         */
        if (this.store.settings.showVODComments && comment.source && comment.source == "comment") {
            console.debug(`skip comment, vod comment: ${i}`);
            continue; // skip vod comments?
        }

        /**
         * Don't show comment yet, its time has not passed current playback time yet
         * @todo: implement chat offset again (?)
         */
        if (offsetTime < comment.content_offset_seconds) {
            // console.debug('skip comment, not displaying yet', i, timeRelative, ( comment.content_offset_seconds / this.timeScale ) );
            continue;
        }

        /**
         * If comment is older than 60 seconds, mark it as displayed in a last ditch effort.
         */
        const commentAge = offsetTime - comment.content_offset_seconds;
        if (commentAge > 60 && !comment.displayed) {
            // console.debug('skip comment, too old', i);
            comment.displayed = true;
            continue;
        }

        if (comments[i + 1] && comments[i + 1].content_offset_seconds > comment.content_offset_seconds + 600) {
            this.pause();
            alert("Next comment is over 10 minutes in the future, something is probably wrong with the file.");
            return false;
        }

        const commentObj = {} as TwitchCommentProxy;

        if (!comment._id) {
            console.warn(`No id on comment #${i} @ (${comment.content_offset_seconds})`);
        }

        commentObj.gid = comment._id ?? `tmp${i}`;

        // timestamp
        commentObj.time = this.timeFormat(comment.content_offset_seconds);

        commentObj.badges = [];

        /**
         * Process and insert badges
         */
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
                    console.error("no badge", badgeId, badgeVersion);
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

        /**
         * Parse message fragments and add emotes
         */
        commentObj.messageFragments = [];
        for (const f of comment.message.fragments) {
            // official twitch emote
            if (f.emoticon && this.store.settings.emotesEnabled) {
                // console.debug(`Insert emote "${f.text}" from Twitch into comment #${commentObj.gid}`);
                commentObj.messageFragments.push({
                    type: "emote",
                    data: {
                        network: "twitch",
                        name: f.text, // @todo: fix
                        url: `https://static-cdn.jtvnw.net/emoticons/v1/${f.emoticon.emoticon_id}/1.0`,
                    },
                });
            } else {
                const fragWords = f.text.split(" ");

                // let paragraph = "";

                // const emotes = 0;

                for (const word of fragWords) {
                    let found_emote = false;

                    for (const provider in this.emotes) {
                        if (this.emotes[provider].parseComment(word, commentObj)) {
                            found_emote = true;
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

                    /**
                     * If no emote found in word, insert the word as text instead
                     * @todo optimize this, currently makes a span for every word
                     */
                    if (!found_emote) {
                        commentObj.messageFragments.push({
                            type: "text",
                            data: word,
                        });
                    }
                }
            }
        }

        this.commentQueue.push(commentObj);

        comment.displayed = true;
    }

    /**
     * Scroll to bottom of chat window
     * @todo: check why this doesn't work anymore
     */
    const commentsDiv = this.$refs.comments as HTMLElement;
    if (commentsDiv) {
        commentsDiv.scrollTop = commentsDiv.scrollHeight;
    }

    /**
     * Remove old comments from the queue to not waste drawing
     */
    if (this.commentQueue.length >= this.commentLimit) {
        this.commentQueue.splice(0, this.commentQueue.length - this.commentLimit);
        // console.debug( 'Comments overflowing, delete', this.commentQueue.length, this.commentQueue.length - this.commentLimit );
    }

    // console.debug("Tick finished", Date.now() - tickStart, "Previous tick", Date.now() - this.previousTick);

    // this.previousTick = Date.now();

    // window.requestAnimationFrame(this.tick.bind(this));
    return true;

}