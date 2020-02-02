const fs = require('fs');
const { exec, execSync } = require('child_process');
const checkInternetConnected = require('check-internet-connected');
const merge = require('merge');
const ds18x20 = require('ds18x20');

/*
 * Constants
 */

module.exports.deviceSettingsFilePath = '/root/device_settings.json';
module.exports.bootloaderSettingsFilePath = '/root/bootloader/settings.json';
module.exports.firmwareSettingsFilePath = 'settings.json';

module.exports.newFirmwareFolderPath = '/root/new_firmware';
module.exports.firmwareFolderPath = '/root/firmware';
module.exports.firmwareZipFilePath = '/root/firmware.zip';
module.exports.firmwareBinFilePath = '/root/firmware.bin';

module.exports.newBootloaderFolderPath = '/root/new_bootloader';
module.exports.bootloaderFolderPath = '/root/bootloader';
module.exports.bootloaderZipFilePath = '/root/bootloader.zip';
module.exports.bootloaderBinFilePath = '/root/bootloader.bin';

module.exports.servicesFolderPath = '/root/services';

/*
 * Variables
 */

var hardwareInfo = {};

module.exports.hardwareInfo = hardwareInfo;

/*
 * Methods
 */

module.exports.checkInternetConnection = function(callback) {
    const config = {
    	timeout: 2000,
		retries: 3,
		domain: 'google.com'
	};
	
    checkInternetConnected(config).then(() => {
		callback();        
    }).catch((error) => {
		callback(error);
    });
};

module.exports.readDeviceSettings = function() {
	if (fs.existsSync(module.exports.deviceSettingsFilePath)) {
		try {
			const rawdata = fs.readFileSync(module.exports.deviceSettingsFilePath, 'utf8');
			module.exports.deviceSettings = (rawdata != null) ? JSON.parse(rawdata) : null;
		} catch (exception) {
		}
	}

	if (module.exports.deviceSettings == null) {
		throw new Error('Error reading device settings!');
	}
};

module.exports.readBootloaderSettings = function() {
	if (fs.existsSync(module.exports.bootloaderSettingsFilePath)) {
		try {
			const rawdata = fs.readFileSync(module.exports.bootloaderSettingsFilePath, 'utf8');
			module.exports.bootloaderSettings = (rawdata != null) ? JSON.parse(rawdata) : null;
		} catch (exception) {
		}
	}

	if (module.exports.bootloaderSettings == null) {
		throw new Error('Error reading bootloader settings!');
	}
};

module.exports.readFirmwareSettings = function() {
	if (fs.existsSync(module.exports.firmwareSettingsFilePath)) {
		try {
			const rawdata = fs.readFileSync(module.exports.firmwareSettingsFilePath, 'utf8');
			module.exports.firmwareSettings = (rawdata != null) ? JSON.parse(rawdata) : null;
		} catch (exception) {
		}
	}

	if (module.exports.firmwareSettings == null) {
		throw new Error('Error reading firmware settings!');
	}
};

module.exports.writeDeviceSettings = function(data) {
	module.exports.deviceSettings = merge(module.exports.deviceSettings, data);
	
	fs.writeFile(module.exports.deviceSettingsFilePath, JSON.stringify(module.exports.deviceSettings), function(error) {
		execSync('sync');
	});
};

module.exports.writeServiceSettings = function(data) {
	var deviceSettings = module.exports.deviceSettings;
		
	var newService = module.exports.service;
	newService.settings = merge(module.exports.service.settings, data);
	
	var services = deviceSettings.services;
	var index = null;
	
	for (var i = 0; i < services.length; i++) {
		if (services[i].service_folder == module.exports.service.service_folder) {
			index = i;
			break;
		}
	}
	
	if (index != null) {
		services.splice(index, 1);
		
		services.push(newService);
		
		deviceSettings.services = services;
		
		module.exports.writeDeviceSettings(deviceSettings);
	}
};

module.exports.loadHardwareInfo = function() {
	if (module.exports.deviceSettings.hardware.includes('Raspberry') == true) {
		exec("cat /proc/cpuinfo | grep Hardware | cut -d ' ' -f 2", (error, stdout, stderr) => {
			if (error == null && stdout != null) {
				module.exports.hardwareInfo.cpu = stdout.toString().replace(/^\n|\n$/g, '');
			} else {
				module.exports.hardwareInfo.cpu = null;
			}
		});
		
		exec("vcgencmd measure_temp | cut -d '=' -f 2", (error, stdout, stderr) => {
			if (error == null && stdout != null) {
				module.exports.hardwareInfo.cpu_temp = stdout.toString().replace(/^\n|\n$/g, '');
			} else {
				module.exports.hardwareInfo.cpu_temp = null;
			}
		});
		
		exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
			if (error == null && stdout != null) {
				module.exports.hardwareInfo.model = stdout.toString().replace(/^\n|\n$/g, '');
			} else {
				module.exports.hardwareInfo.model = null;
			}
		});
		
		exec("cat /proc/cpuinfo | grep Revision | cut -d ' ' -f 2", (error, stdout, stderr) => {
			if (error == null && stdout != null) {
				module.exports.hardwareInfo.revision = stdout.toString().replace(/^\n|\n$/g, '');
			} else {
				module.exports.hardwareInfo.revision = null;
			}
		});
		
		exec("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (error, stdout, stderr) => {
			if (error == null && stdout != null) {
				module.exports.hardwareInfo.serial = stdout.toString().replace(/^\n|\n$/g, '');
			} else {
				module.exports.hardwareInfo.serial = null;
			}
		});
		
		exec("free | grep 'Mem:'", (error, stdout, stderr) => {
			if (error == null && stdout != null) {
				const array = stdout.toString().replace(/^\n|\n$/g, '').replace(/ +(?= )/g,'').split(' ');
				
				module.exports.hardwareInfo.ram_memory_raw = {
					'total': array[1],
					'used': array[2],
					'available': array[3]
				};
			} else {
				module.exports.hardwareInfo.ram_memory_raw = null;
			}
		});
		
		exec("free -h | grep 'Mem:'", (error, stdout, stderr) => {
			if (error == null && stdout != null) {
				const array = stdout.toString().replace(/^\n|\n$/g, '').replace(/ +(?= )/g,'').split(' ');
				
				module.exports.hardwareInfo.ram_memory = {
					'total': array[1],
					'used': array[2],
					'available': array[3]
				};
			} else {
				module.exports.hardwareInfo.ram_memory = null;
			}
		});
		
		exec("df | grep '/dev/root'", (error, stdout, stderr) => {
			if (error == null && stdout != null) {
				const array = stdout.toString().replace(/^\n|\n$/g, '').replace(/ +(?= )/g,'').split(' ');
				
				module.exports.hardwareInfo.disk_memory_raw = {
					'size': array[1],
					'used': array[2],
					'available': array[3]
				};
			} else {
				module.exports.hardwareInfo.disk_memory_raw = null;
			}
		});
		
		exec("df -h | grep '/dev/root'", (error, stdout, stderr) => {
			if (error == null && stdout != null) {
				const array = stdout.toString().replace(/^\n|\n$/g, '').replace(/ +(?= )/g,'').split(' ');
				
				module.exports.hardwareInfo.disk_memory = {
					'size': array[1],
					'used': array[2],
					'available': array[3]
				};
			} else {
				module.exports.hardwareInfo.disk_memory = null;
			}
		});
		
		ds18x20.isDriverLoaded(function (error, isLoaded) {
		    if (isLoaded == true) {
			    ds18x20.getAll(function (error, tempObj) {
				    if (tempObj != null && Object.keys(tempObj).length > 0) {
					    module.exports.hardwareInfo.temp = tempObj[Object.keys(tempObj)[0]];
				    }
				});
		    }
		});
	}
};