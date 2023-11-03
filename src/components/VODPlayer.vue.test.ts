import { shallowMount, mount } from '@vue/test-utils';
import VODPlayer from '@/components/VODPlayer.vue';
import ChatMessage from './ChatMessage.vue';
import ChatEmote from './ChatEmote.vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TwitchCommentProxy, TwitchComment, TwitchCommentTD } from '@/defs';

describe('VODPlayer', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should add and render comment', async () => {

        vi.setSystemTime(new Date(2023, 10, 1, 9, 34, 36, 921).getTime());

        const wrapper = mount(VODPlayer);

        const comments: TwitchCommentTD[] = [
            {
                "_id": "1234",
                "created_at": "2023-10-26T04:02:38.051Z",
                "channel_id": "1234",
                "content_type": "video",
                "content_id": "1234",
                "content_offset_seconds": 0,
                "commenter": {
                    "display_name": "Asdf",
                    "_id": "1234",
                    "name": "Asdf",
                    "bio": null,
                    "created_at": "2021-06-13T03:05:37.986101Z",
                    "updated_at": "2023-11-03T00:37:18.515003Z",
                    "logo": "asdf"
                },
                "message": {
                    "body": "not cdawg LUL",
                    "bits_spent": 0,
                    "fragments": [
                        {
                            "text": "not cdawg ",
                            "emoticon": null
                        },
                        {
                            "text": "LUL",
                            "emoticon": {
                                "emoticon_id": "425618"
                            }
                        }
                    ],
                    "user_badges": [
                        {
                            "_id": "subscriber",
                            "version": "6"
                        }
                    ],
                    "user_color": "#00FF7F",
                    "emoticons": [
                        {
                            "_id": "425618",
                            "begin": 10,
                            "end": 14
                        }
                    ]
                }
            },
        ];

        // mock getChatLog
        const spy = vi.spyOn(wrapper.vm, 'getChatLog');
        spy.mockReturnValueOnce({
            video: {
                created_at: "2021-01-01T00:00:00Z",
                description: "test",
                // duration: "1h",
                id: "test",
                // language: "en",
                // published_at: "2021-01-01T00:00:00Z",
                // thumbnail_url: "test",
                title: "test",
                // type: "test",
                // url: "test",
                // user_id: "test",
                // user_name: "test",
                viewCount: 0,
                // viewable: "test",
                start: 0,
                end: 10,
                length: "test",
                game: "test",
                chapters: [],
            },
            streamer: {
                name: "test",
                id: 1234,
            },
            comments,
            embeddedData: null,
        });

        expect(wrapper.vm.commentQueue.length).toBe(3); // default test comments

        wrapper.vm.commentQueue = [];


        const offsetTime = 2;

        const result = await wrapper.vm.handleComment(0, offsetTime);

        expect(result).toBe(true);

        expect(wrapper.vm.commentQueue.length).toBe(1);

        const commentRender = wrapper.findComponent(ChatMessage);

        expect(commentRender.exists()).toBe(true);

        expect(commentRender.text()).toBe('Asdf:notcdawg');

        const emote = wrapper.findComponent(ChatEmote);
        expect(emote.exists()).toBe(true);
        expect(emote.props().emote.name).toBe('LUL');

    })


})