const fs = require('fs');
const { app } = require('electron');
const { join } = require('path');
const { Analytics } = require('../analytics/sentry');
Analytics.init();

exports.LoadCSS = function (path, theme) {
	if (theme) {
		path = join(app.userThemesPath, path.toLowerCase());
	} else {
		path = join(join(__dirname, '../../css/'), path);
	}

	fs.readFile(path, 'utf-8', function (error, data) {
		if (error) {
			console.error(`[LoadCSS] Error while injecting: '${path}' - ${error}`);
			fs.chmodSync(path, fs.constants.S_IRUSR | fs.constants.S_IWUSR);
		} else {
			let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
			app.win.webContents.insertCSS(formattedData).then(() => {
				if (app.preferences.value('advanced.verboseLogging').includes(true)) {
					if (theme) {
						console.log(`[LoadTheme] '${path}' successfully injected.`);
					} else {
						console.log(`[LoadCSS] '${path}' successfully injected.`);
					}
				}
			});
		}
	});
};
