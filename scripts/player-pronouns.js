let showPlayerList = false;
let pronounsEnabled = false;
let characterPronounsEnabled = false;
let showCharacterPronoun = false;
let saveToGender = false;
let listOfPronouns = [];
let systemDefinedGenderField = '';

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

const PlayerPronouns = {
    // Player Pronoun Renders
    getPronoun(obj, type) {
        if (!obj) {
            return '';
        }

        let pronoun = obj.getFlag('player-pronouns', type);
        if (!pronoun) {
            pronoun = '';
        }

        return pronoun;
    },

    renderSelect(name, pronoun) {
        let input = `<input type="text" name="${name}" value="${pronoun}" data-dtype="String">`
        if (listOfPronouns?.length) {
            input = `<select name="${name}-select" data-dtype="String">`;
            input += `<option value=" " ${(pronoun?.length === 0) ? 'selected' : ''}></option>`;
            for (let pronounItem of listOfPronouns) {
                input += `<option value="${pronounItem}" ${(pronounItem === pronoun) ? 'selected' : ''}>${pronounItem}</option>`;
            }
            input += `</select>`;
        }

        return input;
    },

    onConfigRender(config, html) {
        PlayerPronouns.grabSavedSettings();

        if (pronounsEnabled) {
            const user = game.users.get(config.object.data._id);
            const pronoun = PlayerPronouns.getPronoun(user, 'pronoun');
            let input = PlayerPronouns.renderSelect('player-pronouns', pronoun);

            const playerColourGroup = html.find('.form-group').eq(1);
            playerColourGroup.after($(`
                <div class="form-group pronoun">
                    <label>${game.i18n.localize("PPRN.Label")}</label>
                    ${input}
                </div>
            `));
        }

        const hasClaimedCharacter = html.find("button[name='release']");
        if (characterPronounsEnabled && hasClaimedCharacter?.length) {
            const user = game.users.get(config.object.data._id);
            const character = user.character;
            const pronoun = PlayerPronouns.getPronoun(character, 'character-pronoun');
            let input = PlayerPronouns.renderSelect('character-pronouns', pronoun);

            const playerColourGroup = html.find('.entity-name').eq(0);
            playerColourGroup.after($(`
                <div class="form-group character-pronoun">
                    <label>${game.i18n.localize("PPRN.CharacterLabel")}</label>
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
                pronoun = html.find("select[name = 'player-pronouns-select']").children("option:selected").val();
            } else {
                pronoun = html.find("input[name = 'player-pronouns']")[0].value;
            }            

            const user = game.users.get(config.object.data._id);
            user.update({'flags.player-pronouns.pronoun': pronoun});            
        }

        const hasClaimedCharacter = html.find("button[name='release']");
        if (characterPronounsEnabled && hasClaimedCharacter?.length) {
            let pronoun = "";
            if (listOfPronouns?.length) {
                pronoun = html.find("select[name = 'character-pronouns-select']").children("option:selected").val();
            } else {
                pronoun = html.find("input[name = 'character-pronouns']")[0].value;
            }            

            const user = game.users.get(config.object.data._id);
            const character = game.actors.get(user.data.character);
            let data = {'flags.player-pronouns.character-pronoun': pronoun}
            
            if (saveToGender) {
                data[systemDefinedGenderField] = pronoun;
            }
            character.update(data);
        }
    },

    renderPlayerList(config, html) {
        PlayerPronouns.grabSavedSettings();

        let players = html.find('.player-name');
        
        for (let player of players) {
            let playerCharacterName = player.innerText;
            const playerName = playerCharacterName.substring(0, playerCharacterName.indexOf('[')).trim();
            
            const userId = game.users.find((x) => x.data.name === playerName)?.id;
            const user = game.users.get(userId);
            let pronoun = `(${PlayerPronouns.getPronoun(user, 'pronoun')})`;
            let characterPronoun = (user.isGM) ? "" : `(${PlayerPronouns.getPronoun(game.actors.get(user.data.character), 'character-pronoun')})`;
            const charName = (user.isGM) ? "GM" : user.charname;

            pronoun = (!pronoun || pronoun === "()" || pronoun === "( )") ? "" : pronoun;
            characterPronoun = (!characterPronoun || characterPronoun === "()" || characterPronoun === "( )") ? "" : characterPronoun;

            if (!pronounsEnabled || (pronounsEnabled && !showPlayerList)) {
                pronoun = "";
            }
            if (!characterPronounsEnabled || (characterPronounsEnabled && !showCharacterPronoun)) {
                characterPronoun = "";
            }
            
            if (pronoun.length) {
                pronoun = ` ${pronoun.trim()}`;
            }
            if (characterPronoun.length) {
                characterPronoun = ` ${characterPronoun.trim()}`;
            }

            player.innerText = `${user.name}${pronoun} [${charName}${characterPronoun}]`;
        }
    },

    grabSavedSettings() {
        pronounsEnabled = game.settings.get("player-pronouns", "enabled");
        showPlayerList = game.settings.get("player-pronouns", "showPlayerList");
        characterPronounsEnabled = game.settings.get("player-pronouns", "characterEnabled");
        showCharacterPronoun = game.settings.get("player-pronouns", "showCharacterPronoun");
        saveToGender = game.settings.get("player-pronouns", "saveToGender");

        listOfPronouns = game.settings.get("player-pronouns", "pronounsList");
        if (listOfPronouns?.length === 1) {
            listOfPronouns = listOfPronouns.flat();
        }
    },

    hookupEvents() {
        Hooks.on("renderUserConfig", PlayerPronouns.onConfigRender);
        Hooks.on("closeUserConfig", PlayerPronouns.onConfigUpdate);     
        Hooks.on("renderPlayerList", PlayerPronouns.renderPlayerList);
    },

    setupGenderVariable() {
        switch (game.system.id) {
            case 'dnd5eJP':
            case 'dnd5e':
            case 'sw5e':
                systemDefinedGenderField = 'data.details.gender';
                break;

            case 'pf2e':
                systemDefinedGenderField = 'data.details.gender.value';
                break;

            default:
                systemDefinedGenderField = 'data.details.gender';
        }
    }
}

function playerPronounsInit() {
    console.log("Player Pronouns initialising...");
};

function playerPronounsReady() {
    PlayerPronouns.setupGenderVariable();
    PlayerPronouns.grabSavedSettings();
    PlayerPronouns.hookupEvents();    

    const playerList = new PlayerList();
    playerList.render(true);
};

function registerPlayerPronounsSettings() {
    game.settings.registerMenu("player-pronouns", "pronounsSetup", {
        name: game.i18n.localize("PPRN.PronounsSetup.Heading"),
        label: game.i18n.localize("PPRN.PronounsSetup.Heading"),
        hint: game.i18n.localize("PPRN.PronounsSetup.Hint"),
        icon: 'fas fa-wrench',
        type: PronounsSetup,
        restricted: true,
    });
    game.settings.register("player-pronouns", "pronounsList", {
        name: game.i18n.localize("PPRN.PronounsSetup.Heading"),
        hint: game.i18n.localize("PPRN.PronounsSetup.Hint"),
        scope: "world",
        config: false,
        type: Array,
        default: defaultPronouns,
    });

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

    game.settings.register("player-pronouns", "characterEnabled", {
        name: game.i18n.localize("PPRN.CharacterEnabled.Name"),
        hint: game.i18n.localize("PPRN.CharacterEnabled.Hint"),
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
    });

    game.settings.register("player-pronouns", "showCharacterPronoun", {
        name: game.i18n.localize("PPRN.ShowCharacterPronoun.Name"),
        hint: game.i18n.localize("PPRN.ShowCharacterPronoun.Hint"),
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
    });

    game.settings.register("player-pronouns", "saveToGender", {
        name: game.i18n.localize("PPRN.SavePronounToGenderField.Name"),
        hint: game.i18n.localize("PPRN.SavePronounToGenderField.Hint"),
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
    });  
}

Hooks.once("init", playerPronounsInit);
Hooks.once("ready", registerPlayerPronounsSettings);
Hooks.on("ready", playerPronounsReady);