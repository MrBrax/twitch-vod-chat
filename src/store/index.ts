import { VODPlayerSettings } from "@/defs";
import { defineStore } from "pinia";

interface StoreType {
    minimal: boolean;
    automated: boolean;
    settings: VODPlayerSettings;
}

const defaultSettings = {
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
};

export const useStore = defineStore("twitchVodChat", {
    state: function (): StoreType {
        return {
            minimal: false,
            automated: false,
            settings: { ...defaultSettings },
        };
    },
    actions: {
        saveSettings() {
            localStorage.setItem("settings", JSON.stringify(this.settings));
            console.debug("Saved settings");
            alert("Saved settings");
        },
        loadSettings() {
            const v = localStorage.getItem("settings");
            if (v) {
                this.settings = JSON.parse(v);
                console.debug("Loaded settings");
            } else {
                console.debug("No settings to load");
            }
            console.debug("Load settings", this.settings);
        },
        resetSettings() {
            this.settings = { ...defaultSettings };
        },
    },
});