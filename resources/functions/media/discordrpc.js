const { app } = require("electron");
const { Client } = require("discord-rpc");
const { Analytics } = require("../analytics/sentry");
Analytics.init();

module.exports = {
  connect: function (clientId) {
    if (!app.preferences.value("general.discordRPC").includes(true)) return;
    app.discord.client = new Client({
      transport: "ipc",
    });

    // Login to Discord
    app.discord.client
      .login({ clientId })
      .then(() => {
        console.log("[DiscordRPC][connect] Successfully Connected to Discord!");
        app.discord.connected = true;

        if (app.discord.activityCache) {
          app.discord.client
            .setActivity(app.discord.activityCache)
            .catch((e) => console.error(e));
          app.discord.activityCache = null;
        }
      })
      .catch((e) => console.error(`[DiscordRPC][connect] ${e}`));

    // Handles Errors
    app.discord.client.on("error", (err) => {
      console.error(`[DiscordRPC][connect] Error: ${err}`);
      console.error(`[DiscordRPC][connect] Disconnecting from Discord.`);
      this.disconnect();
      app.discord.client = false;
    });
  },

  disconnect: function () {
    if (!app.preferences.value("general.discordRPC").includes(true)) return;
    console.log("[DiscordRPC][disconnect] Disconnecting from discord.");
    try {
      app.discord.client
        .destroy()
        .catch((e) => console.error(`[DiscordRPC][disconnect] ${e}`));
    } catch (err) {
      console.error(err);
    }
  },

  updateActivity: function (attributes) {
    if (!app.preferences.value("general.discordRPC").includes(true)) return;

    if (!app.discord.connected) {
      this.connect();
    }

    if (!app.discord.connected) return;

    if (app.preferences.value("advanced.verboseLogging").includes(true)) {
      console.log("[DiscordRPC][updateActivity] Updating Discord Activity.");
    }

    let ActivityObject = {
      details: 'Apple Music',
      state: `by ${attributes.artistName}`,
      startTimestamp: attributes.startTime,
      endTimestamp: attributes.endTime,
      largeImageKey: "apple",
      largeImageText: attributes.albumName,
      smallImageKey: "play",
      smallImageText: "Playing",
      instance: true,
    };

    if (!(new Date(attributes.endTime).getTime() > 0)) {
      delete ActivityObject.startTimestamp;
      delete ActivityObject.endTimestamp;
    }

    if (!attributes.artistName) {
      delete ActivityObject.state;
    }

    if (!attributes.albumName) {
      delete ActivityObject.largeImageText;
    }

    if (attributes.status) {
      if (
        app.preferences
          .value("advanced.discordClearActivityOnPause")
          .includes(true)
      ) {
        delete ActivityObject.smallImageKey;
        delete ActivityObject.smallImageText;
      }
    } else {
      if (
        app.preferences
          .value("advanced.discordClearActivityOnPause")
          .includes(true)
      ) {
        app.discord.client
          .clearActivity()
          .catch((e) => console.error(`[DiscordRPC][clearActivity] ${e}`));
        ActivityObject = null;
      } else {
        delete ActivityObject.startTimestamp;
        delete ActivityObject.endTimestamp;
        ActivityObject.smallImageKey = "pause";
        ActivityObject.smallImageText = "Paused";
      }
    }

    if (ActivityObject) {
      try {
        app.discord.client.setActivity(ActivityObject);
      } catch (err) {
        console.error(`[DiscordRPC][setActivity] ${err}`);
      }
    }
  },
};
