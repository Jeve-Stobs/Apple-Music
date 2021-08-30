const { app, ipcMain } = require('electron');
const { GetLocale } = require('../GetLocale');
const { LoadJS } = require('./LoadJS');
const { Analytics } = require('../analytics/sentry');
Analytics.init();

exports.LoadWebsite = function () {
	const [region, language] = GetLocale();
	app.locale = [region, language];
	const urlBase = app.preferences.value('advanced.useBetaSite').includes(true)
		? `https://beta.music.apple.com/${region}`
		: `https://music.apple.com/${region}`;
	const urlFallback = `https://music.apple.com/${region}?l=${language}`;
	const urlLanguage = `${urlBase}?l=${language}`;
	console.log(`[LoadWebsite] Attempting to load '${urlLanguage}'`);

	app.win
		.loadURL(urlLanguage)
		.then(() => {
			if (app.preferences.value('general.startupPage') !== 'browse') {
				LoadJS('CheckAuth.js');
				ipcMain.once('authorized', (e, args) => {
					app.win.webContents.clearHistory();
					console.log(
						`[LoadWebsite] User is authenticated. Loading '${app.preferences.value(
							'general.startupPage'
						)}'. (${args}).`
					);
				});
			} else {
				console.log(`[LoadWebsite] Loaded '${urlLanguage}'`);
			}
		})
		.catch((err) => {
			app.win
				.loadURL(urlFallback)
				.then(() =>
					console.error(
						`[LoadWebsite] '${urlLanguage}' was unavailable, falling back to '${urlFallback}' | ${err}`
					)
				);
		});
};
