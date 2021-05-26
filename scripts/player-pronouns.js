let showPlayerList = false;
let pronounsEnabled = false;

// Player Pronoun Renders
function getPronoun(user) {
    let pronoun = user.getFlag('player-pronouns', 'pronoun');
    if (!pronoun) {
        pronoun = '';
    }

    return pronoun;
}

function onConfigRender(config, html) {
    grabSavedSettings();

    if (pronounsEnabled) {
        const user = game.users.get(config.user.data._id);
        const pronoun = getPronoun(user);
        const playerColourGroup = html.find('.form-group').eq(1);

        playerColourGroup.after($(`
            <div class="form-group pronoun">
                <label>${game.i18n.localize("PPRN.Label")}</label>
                <input type="text" name="player-pronouns" value="${pronoun}" data-dtype="String">                    
            </div>
        `));
    }
}

function onConfigUpdate(config, html) {
    grabSavedSettings();

    if (pronounsEnabled) {
        let pronoun = html.find("input[name = 'player-pronouns']")[0].value;

        const user = game.users.get(config.user.data._id);
        user.setFlag('player-pronouns', 'pronoun', pronoun);
    }        
}

function renderPlayerList(config, html) {
    grabSavedSettings();

    if (pronounsEnabled && showPlayerList) {
        let players = html.find('.player-name');
    
        for (let player of players) {
            let playerCharacterName = player.innerText;
            const playerName = playerCharacterName.substring(0, playerCharacterName.indexOf('[')).trim();

            const userId = game.users.find((x) => x.data.name === playerName).id;
            const user = game.users.get(userId);
            const pronoun = getPronoun(user);

            if (pronoun) {
                const charName = (user.isGM) ? "GM" : user.charname;
                player.innerText = `${user.name} (${pronoun}) [${charName}]`;
            }
        }
    }                
}

function init() {
    console.log("Player Pronouns initialising...");

    hookupEvents();
};

function ready() {
    grabSavedSettings();
};

function registerSettings() {
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

function grabSavedSettings() {
    pronounsEnabled = game.settings.get("player-pronouns", "enabled");
    showPlayerList = game.settings.get("player-pronouns", "showPlayerList");
}

function hookupEvents() {
    Hooks.on("renderPlayerConfig", onConfigRender);
    Hooks.on("closePlayerConfig", onConfigUpdate);
    Hooks.on("renderPlayerList", renderPlayerList);
}

Hooks.once("init", init);
Hooks.once("ready", registerSettings);
Hooks.on("ready", ready);
