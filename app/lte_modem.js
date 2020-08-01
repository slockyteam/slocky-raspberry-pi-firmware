const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const { exec, execSync } = require('child_process');

const SharedManager = require('./shared_manager.js');
const WebSocket = require('./web_socket.js');
const Lcd = require('./lcd.js');

/*
 * Variables
 */

var parser;
var globalResolve = {};
var receivedData = [];
var receivedCommand;
var waitingResponse = false;

module.exports.operator = null;
module.exports.signalQuality = null;

/*
 * Methods
 */

module.exports.init = function(openCallback) {
	if (SharedManager.deviceSettings.lte_modem != null && SharedManager.deviceSettings.lte_modem.ttyUSB2 != null) {
		module.exports.serialPort = new SerialPort(SharedManager.deviceSettings.lte_modem.ttyUSB2, { baudRate: SharedManager.deviceSettings.lte_modem.baud_rate }, function (error) {
			if (error) {
				console.log(error);
			} else {
				console.log("Serial port '" + SharedManager.deviceSettings.lte_modem.ttyUSB2 + "' opened.");
				
				openCallback();
			}
		});
		
		const parser = module.exports.serialPort.pipe(new Readline({ delimiter: '\r\n' }));
		
		parser.on('data', function(data) {
			console.log(data);
			
			const command = data.substring(0, data.indexOf(':'));
			
			if (globalResolve[command] != null) {
				receivedCommand = command;
				
				receivedData.push(data.replace(command + ': ', '').trim());
			} else {
				if (globalResolve[receivedCommand] != null) {
					globalResolve[receivedCommand](JSON.parse(JSON.stringify(receivedData)));
				}
				
				receivedCommand = null;
				receivedData.splice(0, receivedData.length);
			}
			
			waitingResponse = false;
		});
		
		return true;
	} else {
		return false;
	}
};

module.exports.readValue = function(command, callback) {
	if (module.exports.isSerialPortOpened()) {
		var waitTimer = setInterval(function() {
			if (waitingResponse == false) {
				waitingResponse = true;
				
				clearInterval(waitTimer);
				
				const requestId = command.replace('AT', '').replace('?', '');
				
				var promiseTimeout;
				var intervalTimer;
				
				var promise = new Promise((resolve, reject) => {
					promiseTimeout = setTimeout(function() {
			            if (promiseTimeout != null) {
							clearTimeout(promiseTimeout);
						}
						
						if (intervalTimer != null) {
							clearTimeout(intervalTimer);
						}
			            
			            resolve();
			        }, 5000);
			        
			        intervalTimer = setInterval(function() {
				        if (Object.keys(globalResolve).length == 0) {
				        	if (intervalTimer != null) {
								clearTimeout(intervalTimer);
							}
							
							globalResolve[requestId] = resolve;
					        module.exports.serialPort.write(command + '\r');
				        }
			        }, 100);
				});
				
				promise.then(function(value) {
					if (globalResolve[requestId] != null) {
				    	delete globalResolve[requestId];
				    }
				    
				    if (promiseTimeout != null) {
						clearTimeout(promiseTimeout);
					}
					
					if (intervalTimer != null) {
						clearTimeout(intervalTimer);
					}
						
					callback(value);
				});
			}
		}, 100);
		
		/*const requestId = command.replace('AT', '').replace('?', '');
		
		var promiseTimeout;
		var intervalTimer;
		
		var promise = new Promise((resolve, reject) => {
			promiseTimeout = setTimeout(function() {
	            if (promiseTimeout != null) {
					clearTimeout(promiseTimeout);
				}
				
				if (intervalTimer != null) {
					clearTimeout(intervalTimer);
				}
	            
	            resolve();
	        }, 5000);
	        
	        intervalTimer = setInterval(function() {
		        if (Object.keys(globalResolve).length == 0) {
		        	if (intervalTimer != null) {
						clearTimeout(intervalTimer);
					}
					
					globalResolve[requestId] = resolve;
			        module.exports.serialPort.write(command + '\r');
		        }
	        }, 100);
		});
		
		promise.then(function(value) {
			if (globalResolve[requestId] != null) {
		    	delete globalResolve[requestId];
		    }
		    
		    if (promiseTimeout != null) {
				clearTimeout(promiseTimeout);
			}
			
			if (intervalTimer != null) {
				clearTimeout(intervalTimer);
			}
				
			callback(value);
		});*/
		
		return true;
	} else {
		return false;
	}
};

module.exports.readSubscriberNumber = function(callback) {
	module.exports.readValue('AT+CNUM', function(data) {
		var value = null;
		
		if (data != null) {
			data.forEach(function(line) {
				if (line.startsWith('"My Number","')) {
					value = line.replace('"My Number","', '');
					value = value.substring(0, value.indexOf('"'));
				}
			});
		}
		
		callback(value);
	});
};

module.exports.readSignalQuality = function(callback) {
	module.exports.readValue('AT+CSQ', function(data) {
		var value = null;
		
		if (data != null) {
			data.forEach(function(line) {
				value = parseInt(line.substring(0, line.indexOf(',')));
			});
		}
		
		function calculateQualityFromValue(value) {
			const min = 0;
			var max = 30;
			
			if (value > 30) {
				max = value;
			}
			
			return (((value - min) * 100) / (max - min));
		};
		
		value = parseInt(calculateQualityFromValue(value));
		
		callback(value);
		
		if (module.exports.signalQuality != value) {
			module.exports.signalQuality = value;
			
			Lcd.update();
		}
	});
};

module.exports.readOperator = function(callback) {
	module.exports.readValue('AT+COPS?', function(data) {
		var value = null;
		
		if (data != null) {
			data.forEach(function(line) {
				value = line.substring(line.indexOf('"') + 1, line.lastIndexOf('"'));
				
				//value = value.substring(0, value.indexOf(' '));
			});
		}
		
		callback(value);
		
		if (module.exports.operator != value) {
			module.exports.operator = value;
			
			Lcd.update();
		}
	});
};

module.exports.isSerialPortOpened = function() {
	if (module.exports.serialPort != undefined && module.exports.serialPort != null && module.exports.serialPort.isOpen == true) {
		return true;
	} else {
		return false;
	}
};