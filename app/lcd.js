const Lcd = require('lcd');
const { exec, execSync } = require('child_process');

const SharedManager = require('./shared_manager.js');
const LteModem = require('./lte_modem.js');
const WebSocket = require('./web_socket.js');

/*
 * Variables
 */
 
var lcdPrinting = false;
var timer = null;
 
/*
 * Methods
 */

module.exports.initLcd = function(readyCallback) {
	if (SharedManager.deviceSettings.lcd != null) {
		var lcd = new Lcd(SharedManager.deviceSettings.lcd);
		
		lcd.on('ready', function() {
			module.exports.lcd = lcd;
			
			readyCallback();
		});
		
		return true;
	} else {
		return false;
	}
};

module.exports.update = function() {
	if (timer == null) {
		timer = setInterval(function() {
			if (module.exports.lcd != null && lcdPrinting == false) {
				lcdPrinting = true;
				
				if (timer != null) {
					clearInterval(timer);
					timer = null;
				}
				
				module.exports.lcd.setCursor(0, 0);
				module.exports.lcd.noCursor();
				module.exports.lcd.noBlink();
				
				const versionString = "FW " + SharedManager.firmwareSettings.firmware_version;
				const deviceAlias = SharedManager.deviceSettings.device_alias;
				var numberOfSpaces = (SharedManager.deviceSettings.lcd.cols - (deviceAlias.length + versionString.length));
				
				if (numberOfSpaces < 1) {
					numberOfSpaces = 1;
				}
	
				var string = deviceAlias + ' '.repeat(numberOfSpaces) + versionString;
				
				module.exports.lcd.print(string, function(error) {
					var string = '';
					
					module.exports.lcd.setCursor(0, 1);
					
					switch (WebSocket.webSocketStatus) {
						case 'disconnected': {
							string = 'Disconnected';
							break;
						}
						case 'connected': {
							string = 'Connected';
							break;
						}
						case 'no_internet': {
							string = 'No internet';
							break;
						}
						default: {
							string = '';
							break;
						}
					}
					
					module.exports.lcd.print(module.exports.stringWithSpaces(string), function(error) {
						if (LteModem.isSerialPortOpened && LteModem.operator != null && LteModem.signalQuality != null) {
							module.exports.lcd.setCursor(0, 2);
							
							var string = 'Operator: ' + LteModem.operator;
							
							module.exports.lcd.print(string, function(error) {
								module.exports.lcd.setCursor(0, 3);
							
								var string = 'Signal: ' + LteModem.signalQuality + '%';
								
								module.exports.lcd.print(string, function(error) {
									lcdPrinting = false;
								});
							});
						} else {
							lcdPrinting = false;
						}
					});
				});
			}
		}, 50);
	}
};

module.exports.stringWithSpaces = function(string) {
	var stringLength = string.length;

	var stringWithSpaces = string + " ".repeat(SharedManager.deviceSettings.lcd.cols);
	
	return stringWithSpaces;
};