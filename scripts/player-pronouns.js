let pp_showPlayerList = false;
let pp_pronounsEnabled = false;
let pp_characterPronounsEnabled = false;
let pp_showCharacterPronoun = false;
let pp_saveToGender = false;
let pp_showPlayerPronounChat = false;
let pp_showCharacterPronounChat = false;
let pp_listOfPronouns = [];
let pp_systemDefinedGenderField = '';

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
    title = `${game.i18n.localize("PPRN.PronounsSetup.Heading")}`;

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
        if (pp_listOfPronouns?.length) {
            input = `<select name="${name}-select" data-dtype="String">`;
            input += `<option value=" " ${(pronoun?.length === 0) ? 'selected' : ''}></option>`;
            for (let pronounItem of pp_listOfPronouns) {
                input += `<option value="${pronounItem}" ${(pronounItem === pronoun) ? 'selected' : ''}>${pronounItem}</option>`;
            }
            input += `</select>`;
        }

        return input;
    },

    onConfigRender(config, html) {
        PlayerPronouns.grabSavedSettings();

        if (pp_pronounsEnabled) {
            const user = game.users.get(config.object.id);
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
        if (pp_characterPronounsEnabled && hasClaimedCharacter?.length) {
            const user = game.users.get(config.object.id);
            const character = user.character;
            const pronoun = PlayerPronouns.getPronoun(character, 'character-pronoun');
            let input = PlayerPronouns.renderSelect('character-pronouns', pronoun);

            let playerGroup = html.find('.entity-name').eq(0);
            if (!playerGroup?.length) {
                playerGroup = html.find('.document-name').eq(0);
            }
            playerGroup.after($(`
                <div class="form-group character-pronoun">
                    <label>${game.i18n.localize("PPRN.CharacterLabel")}</label>
                    ${input}
                </div>
            `));
        }
    },

    async onConfigUpdate(config, html) {
        PlayerPronouns.grabSavedSettings();

        if (pp_pronounsEnabled) {
            let pronoun = "";
            if (pp_listOfPronouns?.length) {
                pronoun = html.find("select[name = 'player-pronouns-select']").children("option:selected").val();
            } else {
                pronoun = html.find("input[name = 'player-pronouns']")[0].value;
            }            

            const user = game.users.get(config.object.id);
            await user.update({'flags.player-pronouns.pronoun': pronoun});            
        }

        const hasClaimedCharacter = html.find("button[name='release']");
        if (pp_characterPronounsEnabled && hasClaimedCharacter?.length) {
            let pronoun = "";
            if (pp_listOfPronouns?.length) {
                pronoun = html.find("select[name = 'character-pronouns-select']").children("option:selected").val();
            } else {
                pronoun = html.find("input[name = 'character-pronouns']")[0].value;
            }            

            const user = game.users.get(config.object.id);
            const character = game.actors.get(user.character.id);
            let data = {'flags.player-pronouns.character-pronoun': pronoun}
            
            if (pp_saveToGender) {
                data[pp_systemDefinedGenderField] = pronoun;
            }
            await character.update(data);
        }
    },

    renderPlayerList(config, html) {
        PlayerPronouns.grabSavedSettings();

        let players = html.find('.player-name');
        
        for (let player of players) {
            let playerCharacterName = player.innerText;
            const playerName = playerCharacterName
                                .substring(0, playerCharacterName.indexOf('['))
                                .trim();                
            
            const userId = game.users.find((x) => x.name === playerName)?.id;
            const user = game.users.get(userId);
            let pronoun = `(${PlayerPronouns.getPronoun(user, 'pronoun')})`;
            let characterPronoun = (user.isGM) ? "" : `(${PlayerPronouns.getPronoun(game.actors.get(user.character.id), 'character-pronoun')})`;
            const charName = (user.isGM) ? "GM" : user.character.name;

            pronoun = (!pronoun || pronoun === "()" || pronoun === "( )") ? "" : pronoun;
            characterPronoun = (!characterPronoun || characterPronoun === "()" || characterPronoun === "( )") ? "" : characterPronoun;

            if (!pp_pronounsEnabled || (pp_pronounsEnabled && !pp_showPlayerList)) {
                pronoun = "";
            }
            if (!pp_characterPronounsEnabled || (pp_characterPronounsEnabled && !pp_showCharacterPronoun)) {
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

    renderChatMessage(chatMessage, html) {
        const sender = html?.[0]?.querySelector(`.message-sender`).innerText;
        let pronoun = '';

        if (sender) {
            if (chatMessage?.speaker?.actor && pp_showCharacterPronounChat) {
                pronoun = `${PlayerPronouns.getPronoun(game.actors.get(chatMessage?.user?.character?.id), 'character-pronoun')}`.trim();
            } else if (pp_showPlayerPronounChat) {
                pronoun = `${PlayerPronouns.getPronoun(chatMessage?.user, 'pronoun')}`.trim();
            }
            
            if (pronoun) {
                pronoun = ` (${pronoun})`;
            }
            html[0].querySelector(`.message-sender`).innerText = `${sender}${pronoun}`;        
        }        
    },

    grabSavedSettings() {
        pp_pronounsEnabled = game.settings.get("player-pronouns", "enabled");
        pp_showPlayerList = game.settings.get("player-pronouns", "showPlayerList");
        pp_characterPronounsEnabled = game.settings.get("player-pronouns", "characterEnabled");
        pp_showCharacterPronoun = game.settings.get("player-pronouns", "showCharacterPronoun");
        pp_saveToGender = game.settings.get("player-pronouns", "saveToGender");
        pp_showPlayerPronounChat = game.settings.get("player-pronouns", "showPlayerPronounChat");
        pp_showCharacterPronounChat = game.settings.get("player-pronouns", "showCharacterPronounChat");

        pp_listOfPronouns = game.settings.get("player-pronouns", "pronounsList");
        if (pp_listOfPronouns?.length === 1) {
            pp_listOfPronouns = pp_listOfPronouns.flat();
        }
    },

    hookupEvents() {
        Hooks.on("renderUserConfig", PlayerPronouns.onConfigRender);
        Hooks.on("closeUserConfig", PlayerPronouns.onConfigUpdate);     
        Hooks.on("renderPlayerList", PlayerPronouns.renderPlayerList);
        Hooks.on("renderChatMessage", PlayerPronouns.renderChatMessage);
    },

    setupGenderVariable() {
        switch (game.system.id) {
            case 'dnd5eJP':
            case 'dnd5e':
            case 'sw5e':
                pp_systemDefinedGenderField = 'system.details.gender';
                break;

            case 'pf2e':
                pp_systemDefinedGenderField = 'system.details.gender.value';
                break;

            default:
                pp_systemDefinedGenderField = 'system.details.gender';
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

    game.settings.register("player-pronouns", "showPlayerPronounChat", {
        name: game.i18n.localize("PPRN.ShowPlayerPronounChat.Name"),
        hint: game.i18n.localize("PPRN.ShowPlayerPronounChat.Hint"),
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

    game.settings.register("player-pronouns", "showCharacterPronounChat", {
        name: game.i18n.localize("PPRN.ShowCharacterPronounChat.Name"),
        hint: game.i18n.localize("PPRN.ShowCharacterPronounChat.Hint"),
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