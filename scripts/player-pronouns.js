let showPlayerList = false;
let pronounsEnabled = false;

// Player Pronoun Renders
const PlayerPronounSetup = {
    getPronoun: function(user) {
        let pronoun = user.getFlag('player-pronoun', 'pronoun');
        if (!pronoun) {
            pronoun = '';
        }

        return pronoun;
    },

    onConfigRender: function(config, html) {
        if (pronounsEnabled) {
            const user = game.users.get(config.user.data._id);
            const pronoun = PronounSetup.getPronoun(user);
            const playerColourGroup = html.find('.form-group').eq(1);

            playerColourGroup.after($(`
                <div class="form-group pronoun">
                    <label>${game.i18n.localize("PPRN.Enabled.Name")}</label>
                    <input type="text" name="player-pronoun" value="${pronoun}" data-dtype="String">                    
                </div>
            `));
        }
	},

    onConfigUpdate: function(config, html) {
        if (pronounsEnabled) {
            let pronoun = html.find("input[name = 'player-pronoun']")[0].value;

            const user = game.users.get(config.user.data._id);
            user.setFlag('player-pronoun', 'pronoun', pronoun);
        }        
    },

    renderPlayerList: function(config, html) {
        if (pronounsEnabled && showPlayerList) {
            let players = html.find('.player-name');
        
            for (let player of players) {
                let playerCharacterName = player.innerText;
                const playerName = playerCharacterName.substring(0, playerCharacterName.indexOf('[')).trim();

                const userId = game.users.find((x) => x.data.name === playerName).id;
                const user = game.users.get(userId);
                const pronoun = PronounSetup.getPronoun(user);

                if (pronoun) {
                    const charName = (user.isGM) ? "GM" : user.charname;
                    player.innerText = `${user.name} (${pronoun}) [${charName}]`;
                }
            }
        }                
    }
}

function init() {
    console.log("Player Pronoun initialising...");

    hookupEvents();
};

function ready() {
    grabSavedSettings();
};

function registerSettings() {
    game.settings.register("player-pronoun", "enabled", {
        name: game.i18n.localize("PPRN.Enabled.Name"),
        hint: game.i18n.localize("PPRN.Enabled.Hint"),
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
    });

    // show in player list
    game.settings.register("player-pronoun", "showPlayerList", {
        name: game.i18n.localize("PPRN.ShowPlayerList.Name"),
        hint: game.i18n.localize("PPRN.ShowPlayerList.Hint"),
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
    });
}

function grabSavedSettings() {
    pronounsEnabled = game.settings.get("player-pronoun", "enabled");
    showPlayerList = game.settings.get("player-pronoun", "showPlayerList");
}

function hookupEvents() {
    Hooks.on("renderPlayerConfig", PlayerPronounSetup.onConfigRender);
    Hooks.on("closePlayerConfig", PlayerPronounSetup.onConfigUpdate);
    Hooks.on("renderPlayerList", PlayerPronounSetup.renderPlayerList);
}

Hooks.once("init", init);
Hooks.once("ready", registerSettings);
Hooks.on("ready", ready);
