import { VODPlayerSettings } from "@/defs";
import { defineStore } from "pinia";

interface StoreType {
    minimal: boolean;
    settings: VODPlayerSettings;
}

export const useStore = defineStore("twitchVodChat", {
    state: function (): StoreType {
        return {
            minimal: false,
            settings: {
                twitchClientId: "",
                twitchSecret: "",
                twitchToken: "",
                emotesEnabled: true,
                timestampsEnabled: false,
                badgesEnabled: true,
                smallEmotes: false,
                showVODComments: false,
                chatTop: 0,
                chatBottom: 0,
                chatWidth: 25,
                chatStroke: true,
                chatStyle: "has-gradient",
                chatAlign: "left",
                chatTextAlign: "left",
                chatOverlay: true,
                fontSize: 12,
                fontName: "Inter",
                ultrawide: false,
            }
        };
    }
});