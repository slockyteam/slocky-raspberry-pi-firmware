const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const SharedManager = require('./../shared_manager.js');

/*
 * Methods
 */

module.exports.init = function() {
	const appExpress = express();
	appExpress.set('port', SharedManager.deviceSettings.local_web_server_port);
	
	appExpress.use(function(req, res, next) {
	    res.header('Access-Control-Allow-Origin', '*');
	    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
	    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	    next();
	});
	
	appExpress.use(express.static(path.join(__dirname, '/public')));
	
	appExpress.use(bodyParser.urlencoded({ extended: true }));
	appExpress.use(bodyParser.json({ limit: '50mb' }));
	
	appExpress.get('*', function(request, response) {
	    response.sendFile(path.join(__dirname, '/public', 'index.html'));
	});
	
	const httpServer = http.createServer(appExpress);
	
	httpServer.listen(SharedManager.deviceSettings.local_web_server_port, function () {
	    console.log('WEB server is running on PORT: ' + SharedManager.deviceSettings.local_web_server_port);
	});
};