let showPlayerList = false;
let pronounsEnabled = false;
let listOfPronouns = [];

const defaultPronouns = [
    'She/Her',
    'He/Him',
    'She/They',
    'He/They',
    'They/Them',
]

class PronounsSetup extends FormApplication {
    pronounsList = {};
    clickEvent = false;

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "pronouns-setup";
        options.template = "modules/player-pronouns/handlebars/pronouns-setup.handlebars";
        options.width = 500;
        return options;
    }
  
    /** @override */
    async getData() {
        if (!this.clickEvent) {
            this.pronounsList = game.settings.get("player-pronouns", "pronounsList");        
        } else {
            this.clickEvent = false;
        }

        if (this.pronounsList?.length === 1) {
            this.pronounsList = this.pronounsList.flat();

            if (this.pronounsList?.length === 1) {
                this.pronounsList = defaultPronouns;
            }            
        }        

        const setupConfig = {
            "pronounsList": this.pronounsList,
        };

        return {
            setupConfig: setupConfig,
        };
    }
  
    /** @override */
    async _updateObject(event, formData) {
        event.preventDefault();

        await game.settings.set("player-pronouns", "pronounsList", this.pronounsList);
    }

    keepData() {
        let saveData = [];

        let newPronouns = document.getElementsByClassName(
            "pronouns-input"
        );

        if (newPronouns.length < 1) {
            saveData.push("");
        }
        for (var i = 0; i < newPronouns.length; i++) {
            saveData.push(newPronouns[i].value);
        }

        return saveData;
    }

    activateListeners(html) {
        const addPronouns = "#pronouns-setup-add";
        const delPronouns = "button[class='pronouns-del']";
        const save = "#pronouns-setup-submit";

        html.find(addPronouns).click((ev) => {
            ev.preventDefault();
            
            this.pronounsList = this.keepData();

            this.clickEvent = true;
            this.pronounsList.push("");
            this.render(true);
        });

        html.find(delPronouns).click((ev) => {
            ev.preventDefault();

            this.pronounsList = this.keepData();

            this.clickEvent = true;
            const targetName = ev.currentTarget.name.split("-");
            const index = targetName[targetName.length - 1];
            this.pronounsList.splice(index, 1);
            this.render(true);
        });

        html.find(save).click((ev) => {
            ev.preventDefault();
            
            this.pronounsList = this.keepData();
            this.submit();
        });
    }
}

class PlayerListWithPronoun extends PlayerList {
    forceRender() {
        this.render(true);
    }
}

const PlayerPronouns = {
    // Player Pronoun Renders
    getPronoun(user) {
        let pronoun = user.getFlag('player-pronouns', 'pronoun');
        if (!pronoun) {
            pronoun = '';
        }

        return pronoun;
    },

    onConfigRender(config, html) {
        PlayerPronouns.grabSavedSettings();

        if (pronounsEnabled) {
            const user = game.users.get(config.user.data._id);
            const pronoun = PlayerPronouns.getPronoun(user);
            const playerColourGroup = html.find('.form-group').eq(1);

            let input = `<input type="text" name="player-pronouns" value="${pronoun}" data-dtype="String">`
            if (listOfPronouns?.length) {
                input = `<select name="player-pronouns" data-dtype="String">`;
                input += `<option value="" ${(pronoun?.length === 0) ? 'selected' : ''}></option>`;
                for (let pronounItem of listOfPronouns) {
                    input += `<option value="${pronounItem}" ${(pronounItem === pronoun) ? 'selected' : ''}>${pronounItem}</option>`;
                }
                input += `</select>`;
            }

            playerColourGroup.after($(`
                <div class="form-group pronoun">
                    <label>${game.i18n.localize("PPRN.Label")}</label>
                    ${input}
                </div>
            `));
        }
    },

    onConfigUpdate(config, html) {
        PlayerPronouns.grabSavedSettings();

        if (pronounsEnabled) {
            let pronoun = "";
            if (listOfPronouns?.length) {
                pronoun = html.find("select[name = 'player-pronouns']").children("option:selected").val();
            } else {
                pronoun = html.find("input[name = 'player-pronouns']")[0].value;
            }            

            const user = game.users.get(config.user.data._id);
            user.setFlag('player-pronouns', 'pronoun', pronoun);
        }        
    },

    renderPlayerList(config, html) {
        PlayerPronouns.grabSavedSettings();

        if (pronounsEnabled && showPlayerList) {
            let players = html.find('.player-name');
        
            for (let player of players) {
                let playerCharacterName = player.innerText;
                const playerName = playerCharacterName.substring(0, playerCharacterName.indexOf('[')).trim();

                const userId = game.users.find((x) => x.data.name === playerName).id;
                const user = game.users.get(userId);
                const pronoun = PlayerPronouns.getPronoun(user);

                if (pronoun) {
                    const charName = (user.isGM) ? "GM" : user.charname;
                    player.innerText = `${user.name} (${pronoun}) [${charName}]`;
                }
            }
        }                
    },

    grabSavedSettings() {
        pronounsEnabled = game.settings.get("player-pronouns", "enabled");
        showPlayerList = game.settings.get("player-pronouns", "showPlayerList");
        listOfPronouns = game.settings.get("player-pronouns", "pronounsList");
        if (listOfPronouns?.length === 1) {
            listOfPronouns = listOfPronouns.flat();
        }
    },

    hookupEvents() {
        Hooks.on("renderPlayerConfig", PlayerPronouns.onConfigRender);
        Hooks.on("closePlayerConfig", PlayerPronouns.onConfigUpdate);     
        Hooks.on("renderPlayerList", PlayerPronouns.renderPlayerList);   
    }
}

function playerPronounsInit() {
    console.log("Player Pronouns initialising...");
};

function playerPronounsReady() {
    PlayerPronouns.grabSavedSettings();
    PlayerPronouns.hookupEvents();

    const playerList = new PlayerListWithPronoun();
    playerList.forceRender();
};

function registerPlayerPronounsSettings() {
    game.settings.register("player-pronouns", "enabled", {
        name: game.i18n.localize("PPRN.Enabled.Name"),
        hint: game.i18n.localize("PPRN.Enabled.Hint"),
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
    });

    game.settings.register("player-pronouns", "showPlayerList", {
        name: game.i18n.localize("PPRN.ShowPlayerList.Name"),
        hint: game.i18n.localize("PPRN.ShowPlayerList.Hint"),
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
    });

    game.settings.registerMenu("player-pronouns", "pronounsSetup", {
        name: game.i18n.localize("PPRN.PronounsSetup.Heading"),
        label: game.i18n.localize("PPRN.PronounsSetup.Heading"),
        hint: game.i18n.localize("PPRN.PronounsSetup.Hint"),
        icon: 'fas fa-wrench',
        type: PronounsSetup,
        restricted: true,
    });

    // token directory
    game.settings.register("player-pronouns", "pronounsList", {
        name: game.i18n.localize("PPRN.PronounsSetup.Heading"),
        hint: game.i18n.localize("PPRN.PronounsSetup.Hint"),
        scope: "world",
        config: false,
        type: Array,
        default: defaultPronouns,
    });
}

Hooks.once("init", playerPronounsInit);
Hooks.once("ready", registerPlayerPronounsSettings);
Hooks.on("ready", playerPronounsReady);