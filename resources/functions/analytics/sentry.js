const { app } = require('electron');
const ElectronSentry = require('@sentry/electron');

exports.Analytics = {
	init: function () {
		if (app.preferences.value('general.analyticsEnabled').includes(true)) {
			ElectronSentry.init({
				dsn: 'https://97b36dfbc44040caac26012e32d3da01@o615014.ingest.sentry.io/5936255'
			});
		}
	}
};
