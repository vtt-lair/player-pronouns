let showPlayerList = false;
let pronounsEnabled = false;

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

            playerColourGroup.after($(`
                <div class="form-group pronoun">
                    <label>${game.i18n.localize("PPRN.Label")}</label>
                    <input type="text" name="player-pronouns" value="${pronoun}" data-dtype="String">                    
                </div>
            `));
        }
    },

    onConfigUpdate(config, html) {
        PlayerPronouns.grabSavedSettings();

        if (pronounsEnabled) {
            let pronoun = html.find("input[name = 'player-pronouns']")[0].value;

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
    },

    hookupEvents() {
        Hooks.on("renderPlayerConfig", PlayerPronouns.onConfigRender);
        Hooks.on("closePlayerConfig", PlayerPronouns.onConfigUpdate);
        Hooks.on("renderPlayerList", PlayerPronouns.renderPlayerList);
    }
}

function playerPronounsInit() {
    console.log("Player Pronouns initialising...");
    
    PlayerPronouns.hookupEvents();
};

function playerPronounsReady() {
    PlayerPronouns.grabSavedSettings();
};

function registerPlayerPronounsSettings() {
    game.settings.register("player-pronouns", "enabled", {
        name: game.i18n.localize("PPRN.Enabled.Name"),
        hint: game.i18n.localize("PPRN.Enabled.Hint"),
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
    });

    // show in player list
    game.settings.register("player-pronouns", "showPlayerList", {
        name: game.i18n.localize("PPRN.ShowPlayerList.Name"),
        hint: game.i18n.localize("PPRN.ShowPlayerList.Hint"),
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
    });
}

Hooks.once("init", playerPronounsInit);
Hooks.once("ready", registerPlayerPronounsSettings);
Hooks.on("ready", playerPronounsReady);
