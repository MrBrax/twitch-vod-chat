import { VODPlayerSettings } from "@/defs";
import { Ref, ref } from "vue";

interface StoreType {
    minimal: boolean;
    automated: boolean;
    unlockedWidth: boolean;
    settings: VODPlayerSettings;
}

const defaultSettings: VODPlayerSettings = {
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
    chatSelectable: false,
    chatTransition: true,
    chatPositionX: 0,
    chatPositionY: 0,
};

/*
export const useStore = defineStore("twitchVodChat", {
    state: function (): StoreType {
        return {
            minimal: false,
            automated: false,
            unlockedWidth: false,
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
*/

export function useTVC() {

    const minimal = ref<boolean>(false);
    const automated = ref<boolean>(false);
    const unlockedWidth = ref<boolean>(false);
    const settings = ref<VODPlayerSettings>({ ...defaultSettings });

    function saveSettings(): void {
        localStorage.setItem("settings", JSON.stringify(settings.value));
        console.debug("Saved settings");
        alert("Saved settings");
    }

    function loadSettings(): void {
        const v = localStorage.getItem("settings");
        if (v) {
            settings.value = JSON.parse(v);
            console.debug("Loaded settings");
        } else {
            console.debug("No settings to load");
        }
        console.debug("Load settings", settings.value);
    }

    function resetSettings(): void {
        settings.value = { ...defaultSettings };
    }

    return {
        minimal,
        automated,
        unlockedWidth,
        settings,
        saveSettings,
        loadSettings,
        resetSettings,
    };
}