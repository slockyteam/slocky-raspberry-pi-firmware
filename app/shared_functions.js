const { exec, execSync } = require('child_process');
const merge = require('merge');
const fs = require('fs');

const SharedManager = require('./shared_manager.js');
const LteModem = require('./lte_modem.js');
const WebSocket = require('./web_socket.js');
const Lcd = require('./lcd.js');

/*
 * Methods
 */

module.exports.loadNetworkInfo = function(callback) {
	if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
		var results = {};
		
		var promises = [];
		
		try {
			var inet = execSync("ifconfig | grep eth0 -A 1 | grep inet").toString().trim().split(' ');
			
			results['eth0'] = {};
			
			if (inet.includes('inet6') == false && inet.length > 7) {
				var ipv4 = {};
				
				ipv4.ip_address = inet[1];
				ipv4.broadcast = inet[7];
				ipv4.mask = inet[4];
				
				results['eth0'].ipv4 = ipv4;
				
				try {
					var rxString = execSync("ifconfig | grep eth0 -A 8 | grep RX | grep bytes").toString().trim();
					var rxSplited = rxString.split('  ');
					
					results['eth0'].rx_bytes = rxSplited[1].substring(rxSplited[1].indexOf(' ') + 1).toString().replace(/^\n|\n$/g, '');
					
					var txString = execSync("ifconfig | grep eth0 -A 8 | grep TX | grep bytes").toString().trim();
					var txSplited = txString.split('  ');
					
					results['eth0'].tx_bytes = txSplited[1].substring(txSplited[1].indexOf(' ') + 1).toString().replace(/^\n|\n$/g, '');
					
					var file = execSync('cat /etc/dhcpcd.conf').toString();
					
					var ethernetObject = file.substring(file.indexOf('#ETH0_START'), file.indexOf('#ETH0_END') + '#ETH0_END'.length);
					
					var dhcpEnabled = (ethernetObject.includes('#static ip_address') || !ethernetObject.includes('static ip_address')) ? true : false;
					
					results['eth0'].dhcp_enabled = dhcpEnabled;
								
					file = execSync('cat /etc/dnsmasq.conf').toString();
					
					ethernetObject = file.substring(file.indexOf('#ETH0_START'), file.indexOf('#ETH0_END') + '#ETH0_END'.length);
					
					results['eth0'].router_enabled = (!dhcpEnabled && !ethernetObject.includes('#interface=eth0') && ethernetObject.includes('interface=eth0')) ? true : false;
				} catch (error) {
				}
			}
		} catch (error) {
		}
		
		try {
			var inet = execSync("ifconfig | grep wlan0 -A 1 | grep inet").toString().trim().split(' ');
			
			results['wlan0'] = {};
			
			if (inet.includes('inet6') == false && inet.length > 7) {
				var ipv4 = {};
				
				ipv4.ip_address = inet[1];
				ipv4.broadcast = inet[7];
				ipv4.mask = inet[4];
				
				results['wlan0'].ipv4 = ipv4;
				
				try {
					var rxString = execSync("ifconfig | grep wlan0 -A 8 | grep RX | grep bytes").toString().trim();
					var rxSplited = rxString.split('  ');
					
					results['wlan0'].rx_bytes = rxSplited[1].substring(rxSplited[1].indexOf(' ') + 1).toString().replace(/^\n|\n$/g, '');
					
					var txString = execSync("ifconfig | grep wlan0 -A 8 | grep TX | grep bytes").toString().trim();
					var txSplited = txString.split('  ');
					
					results['wlan0'].tx_bytes = txSplited[1].substring(txSplited[1].indexOf(' ') + 1).toString().replace(/^\n|\n$/g, '');
				} catch (error) {
				}
			
				promises.push(new Promise(function(resolve, reject) {
				   	exec("sudo systemctl is-enabled hostapd", (error, stdout, stderr) => {
						if (stdout.includes('enabled') && execSync("cat /etc/hostapd/hostapd.conf | grep interface | cut -d '=' -f 2 | head -n 1").toString().includes('wlan0')) {
							results['wlan0'].access_point = {};
							
							exec("sudo systemctl is-active hostapd", (error, stdout, stderr) => {
								if (stdout.includes('inactive')) {
									results['wlan0'].access_point.active = false;
								} else {
									results['wlan0'].access_point.active = true;
									
									results['wlan0'].access_point.ssid = execSync("cat /etc/hostapd/hostapd.conf | grep ssid | cut -d '=' -f 2 | head -n 1").toString().trim();
								}
								
								resolve();
							});
						} else {
							require('./pi-wifi.js').status('wlan0', function(error, connectedNetwork) {
								if (connectedNetwork != null) {
									if (connectedNetwork.frequency != null) {
										connectedNetwork.frequency = (connectedNetwork.frequency / 1000);
									}
									
									results['wlan0'].connected_network = connectedNetwork;
								}
								
							  	resolve();
							});
						}
					});
				}));
			}
		} catch (error) {
		}
		
		try {
			var inet = execSync('ifconfig | grep ppp0 -A 1 | grep inet').toString().trim().split(' ');
			
			results['ppp0'] = {};
			
			if (inet.includes('inet6') == false && inet.length > 7) {
				var ipv4 = {};
				
				ipv4.ip_address = inet[1];
				ipv4.broadcast = inet[7];
				ipv4.mask = inet[4];
				
				results['ppp0'].ipv4 = ipv4;
				
				try {
					if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true && LteModem.serialPort != null && LteModem.serialPort.isOpen) {
						promises.push(new Promise(function(resolve, reject) {
							LteModem.readOperator(function(value) {
								results['ppp0'].operator = value;
								
								resolve();
							});
						}));
						
						promises.push(new Promise(function(resolve, reject) {
							LteModem.readSubscriberNumber(function(value) {
								results['ppp0'].subscriber_number = value;
								
								resolve();
							});
						}));
						
						promises.push(new Promise(function(resolve, reject) {
							LteModem.readSignalQuality(function(value) {
								results['ppp0'].signal_quality = value;
								
								resolve();
							});
						}));
					}
				
					var rxString = execSync("ifconfig | grep ppp0 -A 8 | grep RX | grep bytes").toString().trim();
					var rxSplited = rxString.split('  ');
					
					results['ppp0'].rx_bytes = rxSplited[1].substring(rxSplited[1].indexOf(' ') + 1).toString().replace(/^\n|\n$/g, '');
					
					var txString = execSync("ifconfig | grep ppp0 -A 8 | grep TX | grep bytes").toString().trim();
					var txSplited = txString.split('  ');
					
					results['ppp0'].tx_bytes = txSplited[1].substring(txSplited[1].indexOf(' ') + 1).toString().replace(/^\n|\n$/g, '');
				} catch (error) {
				}
			}
		} catch (error) {
		}
		
		if (promises.length > 0) {
			Promise.all(promises).then(function(values) {
				return callback(null, results);
			});
		} else {
			return callback(null, results);
		}
	} else {
		return callback('unknown_hardware', null);
	}
};

module.exports.loadEthernetSettings = function(callback) {
	try {
		if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
			var results = {};
			
			results['interface'] = 'eth0';
		
			var file = execSync('cat /etc/dhcpcd.conf').toString();
			
			var ethernetObject = file.substring(file.indexOf('#ETH0_START'), file.indexOf('#ETH0_END') + '#ETH0_END'.length);
			
			results.dhcp_enabled = (ethernetObject.includes('#static ip_address') || !ethernetObject.includes('static ip_address')) ? true : false;
		
			var staticObject = {}
			
			if (ethernetObject.includes('static ip_address=')) {
				var start = (ethernetObject.indexOf('static ip_address=') + 'static ip_address='.length);
				
				staticObject.ip_address = ethernetObject.substring(start, ethernetObject.indexOf('\n', start));
			}
			
			if (ethernetObject.includes('static routers=')) {
				var start = (ethernetObject.indexOf('static routers=') + 'static routers='.length);
				
				staticObject.routers = ethernetObject.substring(start, ethernetObject.indexOf('\n', start));
			}
			
			if (ethernetObject.includes('static domain_name_servers=')) {
				var start = (ethernetObject.indexOf('static domain_name_servers=') + 'static domain_name_servers='.length);
				
				staticObject.domain_name_servers = ethernetObject.substring(start, ethernetObject.indexOf('\n', start));
			}
			
			results['static'] = staticObject

			file = execSync('cat /etc/dnsmasq.conf').toString();
			
			ethernetObject = file.substring(file.indexOf('#ETH0_START'), file.indexOf('#ETH0_END') + '#ETH0_END'.length);
			
			results.router_enabled = (!results.dhcp_enabled && !ethernetObject.includes('#interface=eth0') && ethernetObject.includes('interface=eth0')) ? true : false;
		
			if (ethernetObject.includes('dhcp-range=')) {
				var start = (ethernetObject.indexOf('dhcp-range=') + 'dhcp-range='.length);
				
				results.router_dhcp_range = ethernetObject.substring(start, ethernetObject.indexOf('\n', start));
			}
			
			return callback(null, results);
		} else {
			return callback('unknown_hardware', null);
		}
	} catch (error) {
		return callback(error, null);
	}
};

module.exports.saveEthernetSettings = function(data, callback) {
	if (data != null) {
		try {
			if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
				var results = {};
				
				var file = execSync('cat /etc/dhcpcd.conf').toString();
				
				var newEthernetObject = "";
				newEthernetObject += "#ETH0_START\n";
				newEthernetObject += (data.dhcp_enabled == false ? "" : "#") + "interface eth0\n";
				newEthernetObject += (data.dhcp_enabled == false ? "" : "#") + "static ip_address=" + ((data['static'] != null && data['static'].ip_address != null) ? data['static'].ip_address :  "192.168.5.2") + "\n";
				newEthernetObject += (data.dhcp_enabled == false ? "" : "#") + "static routers=" + ((data['static'] != null && data['static'].routers != null) ? data['static'].routers :  "192.168.5.1") + "\n";
				newEthernetObject += (data.dhcp_enabled == false ? "" : "#") + "static domain_name_servers=" + ((data['static'] != null && data['static'].domain_name_servers != null) ? data['static'].domain_name_servers :  "192.168.5.1") + "\n";
				newEthernetObject += (data.dhcp_enabled == false ? "" : "#") + "nohook wpa_supplicant\n";
				newEthernetObject += "#ETH0_END";
				
				file = file.replace(file.substring(file.indexOf('#ETH0_START'), file.indexOf('#ETH0_END') + '#ETH0_END'.length), newEthernetObject);
						
				fs.writeFileSync('/etc/dhcpcd.conf', file);
				
				file = execSync('cat /etc/dnsmasq.conf').toString();
				
				newEthernetObject = "";
				newEthernetObject += "#ETH0_START\n";
				newEthernetObject += ((data.dhcp_enabled == false && data.router_enabled == true) ? "" : "#") + "interface=eth0\n";
				newEthernetObject += ((data.dhcp_enabled == false && data.router_enabled == true) ? "" : "#") + "dhcp-range=" + (data.router_dhcp_range ? data.router_dhcp_range : "192.168.5.2,192.168.5.50,255.255.255.0,24h") + "\n";
				newEthernetObject += "#ETH0_END";
				
				file = file.replace(file.substring(file.indexOf('#ETH0_START'), file.indexOf('#ETH0_END') + '#ETH0_END'.length), newEthernetObject);
						
				fs.writeFileSync('/etc/dnsmasq.conf', file);
				
				callback(null, null);
				
				return;
			} else {
				return callback('unknown_hardware', null);
			}
		} catch (error) {
			return callback(error, null);
		}
	} else {
		return callback('missing_parameters', null);
	}
};

module.exports.loadWifiAccessPointSettings = function(callback) {
	try {
		if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
			var results = {};
			
			results['interface'] = execSync("cat /etc/hostapd/hostapd.conf | grep interface | cut -d '=' -f 2 | head -n 1").toString().trim();
			
			var file = execSync('cat /etc/hostapd/hostapd.conf').toString();
				
			var object = file.substring(file.indexOf('#START'), file.indexOf('#END') + '#END'.length);
			
			var start = (object.indexOf('ssid=') + 'ssid='.length);
			var ssid = object.substring(start, object.indexOf('\n', start));
			
			start = (object.indexOf('wpa_passphrase=') + 'wpa_passphrase='.length);
			var password = object.substring(start, object.indexOf('\n', start));
		
			results.ssid = ssid;
			results.password = password;
			
			var promise1 = new Promise(function(resolve, reject) {
			   	exec("sudo systemctl is-enabled hostapd", (error, stdout, stderr) => {
					if (stdout.includes('enabled')) {
						results.enabled = true;
					} else {
						results.enabled = false;
					}
					
					resolve();
				});
			});
			
			var promise2 = new Promise(function(resolve, reject) {
			   	exec("sudo systemctl is-active hostapd", (error, stdout, stderr) => {
					if (stdout.includes('inactive')) {
						results.active = false;
					} else {
						results.active = true;
					}
					
					resolve();
				});
			});
			
			Promise.all([promise1, promise2]).then(function(values) {
				return callback(null, results);
			});
		} else {
			return callback('unknown_hardware', null);
		}
	} catch (error) {
		return callback(error, null);
	}
};

module.exports.loadCellularSettings = function(callback) {
	try {
		if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
			if (SharedManager.deviceSettings.lte_modem != null) {
				var results = {};
				
				var apn = execSync('cat /etc/chatscripts/apn').toString();
				
				if (apn.includes('AT+CGDCONT=1,"IP","')) {
					const apnStartIndex = apn.indexOf('AT+CGDCONT=1,"IP","') + 'AT+CGDCONT=1,"IP","'.length;
					var apnEndIndex = apn.indexOf('"\n');
					
					if (apnEndIndex < 0) {
						apnEndIndex = apn.length - 1;
					}
					
					results.apn = apn.substring(apnStartIndex, apnEndIndex);
				}
				
				results.dial = execSync("cat /etc/chatscripts/dial").toString().replace(/^\n|\n$/g, '');
				
				var file = execSync('cat /etc/ppp/peers/provider').toString();
				
				var object = file.substring(file.indexOf('#START'), file.indexOf('#END') + '#END'.length);
			
				if (object.includes('#noauth')) {
					results.auth_enabled = true;
				} else {
					results.auth_enabled = false;
				}
				
				if (object.indexOf('user "') > 0) {
					var start = (object.indexOf('user "') + 'user "'.length);
					var username = object.substring(start, object.indexOf('"\n', start));
					
					results.username = username
				}
				
				if (object.indexOf('password "') > 0) {
					var start = (object.indexOf('password "') + 'password "'.length);
					var password = object.substring(start, object.indexOf('"\n', start));
					
					results.password = password
				}
				
				return callback(null, results);
			} else {
				return callback('lte_modem_not_installer', null);
			}
		} else {
			return callback('unknown_hardware', null);
		}
	} catch (error) {
		return callback(error, null);
	}
};

module.exports.saveWifiAccessPointSettings = function(data, callback) {
	if (data != null) {
		try {
			if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
				var file = execSync('cat /etc/hostapd/hostapd.conf').toString();
				
				var object = file.substring(file.indexOf('#START'), file.indexOf('#END') + '#END'.length);
			
				var start = (object.indexOf('ssid=') + 'ssid='.length);
				var ssid = object.substring(start, object.indexOf('\n', start));
				
				start = (object.indexOf('wpa_passphrase=') + 'wpa_passphrase='.length);
				var password = object.substring(start, object.indexOf('\n', start));
				
				if (data.ssid != null) {
					ssid = data.ssid;
				}
				
				if (data.password != null && data.password.length > 0) {
					password = data.password;
				}
				
				var newObject = "";
				newObject += "#START\n";
				newObject += "ssid=" + ssid + "\n";
				newObject += "wpa_passphrase=" + password + "\n";
				newObject += "#END";
				
				file = file.replace(file.substring(file.indexOf('#START'), file.indexOf('#END') + '#END'.length), newObject);
						
				fs.writeFileSync('/etc/hostapd/hostapd.conf', file);
				
				if (data.enabled != null) {
					if (data.enabled == true) {
						var file = execSync('cat /etc/dhcpcd.conf').toString();
						
						var newWlanObject = "";
						newWlanObject += "#WLAN0_START\n";
						newWlanObject += "interface wlan0\n";
						newWlanObject += "static ip_address=192.168.4.1/24\n";
						newWlanObject += "nohook wpa_supplicant\n";
						newWlanObject += "#WLAN0_END";
						
						file = file.replace(file.substring(file.indexOf('#WLAN0_START'), file.indexOf('#WLAN0_END') + '#WLAN0_END'.length), newWlanObject);
						
						fs.writeFileSync('/etc/dhcpcd.conf', file);
						
						exec("sudo systemctl enable hostapd", (error, stdout, stderr) => {
							exec("sudo systemctl daemon-reload", (error, stdout, stderr) => {
								exec("sudo systemctl restart dhcpcd", (error, stdout, stderr) => {
									exec("sudo service hostapd restart", (error, stdout, stderr) => {
									});
								});
							});
						});
					} else {
						exec("sudo service hostapd stop", (error, stdout, stderr) => {
							exec("sudo systemctl disable hostapd", (error, stdout, stderr) => {
								var file = execSync('cat /etc/dhcpcd.conf').toString();
								
								var newWlanObject = "";
								newWlanObject += "#WLAN0_START\n";
								newWlanObject += "#interface wlan0\n";
								newWlanObject += "#static ip_address=192.168.4.1/24\n";
								newWlanObject += "#nohook wpa_supplicant\n";
								newWlanObject += "#WLAN0_END";
								
								file = file.replace(file.substring(file.indexOf('#WLAN0_START'), file.indexOf('#WLAN0_END') + '#WLAN0_END'.length), newWlanObject);
								
								fs.writeFileSync('/etc/dhcpcd.conf', file);
										
								exec("sudo systemctl daemon-reload", (error, stdout, stderr) => {
									exec("sudo systemctl restart dhcpcd", (error, stdout, stderr) => {
									});
								});
							});
						});
					}
					
					return callback(null, null);
				} else {
					exec("sudo service hostapd restart", (error, stdout, stderr) => {
					});
				}
			} else {
				return callback('unknown_hardware', null);
			}
		} catch (error) {
			return callback(error, null);
		}
	} else {
		return callback('missing_parameters', null);
	}
};

module.exports.saveCellularSettings = function(data, callback) {
	if (data != null) {
		try {
			if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
				if (SharedManager.deviceSettings.lte_modem != null) {
					if (data.apn != null) {
						fs.writeFileSync('/etc/chatscripts/apn', 'AT+CGDCONT=1,"IP","' + data.apn + "'");
					}
					
					if (data.dial != null) {
						fs.writeFileSync('/etc/chatscripts/dial', data.dial);
					}
					
					var file = execSync('cat /etc/ppp/peers/provider').toString();
				
					var newObject = "";
					newObject += "#START\n";
					
					if (data.auth_enabled != null && data.auth_enabled == true) {
						newObject += "#noauth\n";
					} else {
						newObject += "noauth\n";
					}
						
					newObject += 'user "' + data.username + '"\n';
					newObject += 'password "' + data.password + '"\n';
					newObject += "#END";
					
					file = file.replace(file.substring(file.indexOf('#START'), file.indexOf('#END') + '#END'.length), newObject);
							
					fs.writeFileSync('/etc/ppp/peers/provider', file);
					
					callback(null, null);
					
					return;
				} else {
					return callback('lte_modem_not_installer', null);
				}
			} else {
				return callback('unknown_hardware', null);
			}
		} catch (error) {
			return callback(error, null);
		}
	} else {
		return callback('missing_parameters', null);
	}
};

module.exports.cellularOn = function() {
	try {
		if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
			if (SharedManager.deviceSettings.lte_modem != null) {
				exec('pon', (error, stdout, stderr) => {
					if (stderr) {
						return callback(stderr, null);
					} else {
						return callback(null, null);
					}
				});
			} else {
				return callback('lte_modem_not_installer', null);
			}
		} else {
			return callback('unknown_hardware', null);
		}
	} catch (error) {
		return callback(error, null);
	}
};

module.exports.cellularOff = function() {
	try {
		if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
			if (SharedManager.deviceSettings.lte_modem != null) {
				exec('poff', (error, stdout, stderr) => {
					if (stderr) {
						return callback(stderr, null);
					} else {
						return callback(null, null);
					}
				});
			} else {
				return callback('lte_modem_not_installer', null);
			}
		} else {
			return callback('unknown_hardware', null);
		}
	} catch (error) {
		return callback(error, null);
	}
};

module.exports.saveDeviceSettings = function(data, callback) {
	if (data != null) {
		var promises = [];
		var responseError = null;
		
		if (data.device_time_zone != null) {
			var timeZone = execSync("sudo timedatectl | grep 'Time zone'").toString().trim().replace(/^\n|\n$/g, '').replace(/  +/g, ' ');
			timeZone = timeZone.split(' ')[2];
			
			if (data.device_time_zone != timeZone) {
				promises.push(new Promise(function(resolve, reject) {
					exec("sudo timedatectl set-timezone '" + data.device_time_zone + "'", (error, stdout, stderr) => {
						if (stderr.includes('Invalid time zone')) {
							responseError = 'invalid_time_zone';
						}
						
						resolve();
					});
				}));
			}
			
			delete data.device_time_zone;
		}
		
		if (responseError == null) {
			SharedManager.writeDeviceSettings(data);
		}
		
		if (promises.length > 0) {
			Promise.all(promises).then(function(values) {
				return callback(responseError, null);
			});
		} else {
			return callback(responseError, null);
		}
	} else {
		return callback('missing_parameters', null);
	}
};

module.exports.rebootDevice = function() {
	function reboot() {
		WebSocket.closeConnection();
		
		execSync('reboot');
	};
	
	if (Lcd.lcd != null) {
		Lcd.lcd.clear(function() {
			reboot();
		});
	} else {
		reboot();
	}
};

module.exports.wifiScan = function(callback) {
	if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
		require('wireless-tools/iwlist').scan({ iface : 'wlan0', show_hidden : true }, function(error, networks) {
			require('./pi-wifi.js').scan(function(err, networks2) {
				require('./pi-wifi.js').status('wlan0', function(error, connectedNetwork) {
					var results = [];
					
					if (networks != null) {
						results = networks.map(function(object) {
							if (object.security == 'open') {
								object.security = null;
							}
							
							function calculateQualityFromRssi(rssi) {
								const min = 0;
								const max = 100;
								
								return parseInt(((Math.abs(rssi) - max)/(min - max)) * 100);
							};
							
							var data =  {
								bssid: object.address,
								ssid: object.ssid,
								frequency: object.frequency,
								channel: object.channel,
								rssi: object.signal,
								quality: calculateQualityFromRssi(object.signal)
							};
							
							if (object.security != null) {
								data.security = object.security.toUpperCase();
							}
							
							if (networks2 != null) {
								networks2.forEach(function(network) {
									if (network.ssid == object.ssid) {
										data.flags = network.flags;
									}
								});
							}
							
							if (connectedNetwork != null && object.ssid == connectedNetwork.ssid) {
								data.connected = true;
							} else {
								data.connected = false;
							}
							
							return data;
						});
					}
					
					return callback(null, results);
				});
			});
		});
	} else if (SharedManager.deviceSettings.hardware.includes('Omega') == true) {
		exec("ubus call onion wifi-scan '{\"device\":\"ra0\"}'", (error, stdout, stderr) => {
			var networks = parse(stdout).results;
			
			function calculateRssiFromQuality(quality) {
				const min = 0;
				const max = 100;
				
				return (((quality / 100) * (min - max)) * -1);
			};
			
			var results = networks.map(function(object) {
				var data =  {
					address: object.bssid,
					ssid: object.ssid,
					channel: object.channel,
					security: object.encryption,
					rssi: object.signalStrength,
					quality: calculateRssiFromQuality(object.signalStrength)
				};

				return data;
			});
			
			return callback(null, results);
		});
	} else {
		return callback('unknown_hardware', null);
	}
};

module.exports.loadWifiConnections = function(callback) {
	if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
		require('./pi-wifi.js').listNetworks(function(error, networks) {
			require('./pi-wifi.js').status('wlan0', function(error, connectedNetwork) {
				var results = [];
				
				if (networks != null) {
					networks.forEach(function(network) {
						network.id = network.network_id;
						delete network.network_id;
						
						if (connectedNetwork != null && network.id == connectedNetwork.id) {
							network.connected = true;
							
							merge(network, connectedNetwork);
							
							network.ip_address = network.ip;
							delete network.ip;
						
							if (network.frequency != null) {
								network.frequency = (network.frequency / 1000);
							}
						} else {
							network.connected = false;
						}
					});
					
					results = networks;
				}
				
				return callback(null, results);
			});
		});
	} else {
		return callback('unknown_hardware', null);
	}
};

module.exports.deleteWifiConnection = function(data, callback) {
	if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
		if (data.id != null) {
			exec("sudo wpa_cli remove_network " + data.id.toString(), (error, stdout, stderr) => {
				exec("sudo wpa_cli -i wlan0 remove_network " + data.id.toString(), (error, stdout, stderr) => {
					if (stderr) {
						return callback(stderr, null);
					} else {
						exec("sudo wpa_cli save_config", (error, stdout, stderr) => {
							return callback(null, null);
						});
					}
				});
			});
		} else {
			return callback('missing_parameters', null);
		}
	} else {
		return callback('unknown_hardware', null);
	}
};

module.exports.connectWifiConnection = function(data, callback) {
	if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
		if (data != null) {
			function disableWifiAccessPoint(callback) {
				exec("sudo systemctl is-enabled hostapd", (error, stdout, stderr) => {
					if (stdout.includes('enabled') && execSync("cat /etc/hostapd/hostapd.conf | grep interface | cut -d '=' -f 2 | head -n 1").toString().includes('wlan0')) {
						exec("sudo service hostapd stop", (error, stdout, stderr) => {
							exec("sudo systemctl disable hostapd", (error, stdout, stderr) => {
								var file = execSync('cat /etc/dhcpcd.conf').toString();
								
								var newWlanObject = "";
								newWlanObject += "#WLAN0_START\n";
								newWlanObject += "#interface wlan0\n";
								newWlanObject += "#static ip_address=192.168.4.1/24\n";
								newWlanObject += "#nohook wpa_supplicant\n";
								newWlanObject += "#WLAN0_END";
								
								file = file.replace(file.substring(file.indexOf('#WLAN0_START'), file.indexOf('#WLAN0_END') + '#WLAN0_END'.length), newWlanObject);
								
								fs.writeFileSync('/etc/dhcpcd.conf', file);
										
								exec("sudo systemctl daemon-reload", (error, stdout, stderr) => {
									exec("sudo systemctl restart dhcpcd", (error, stdout, stderr) => {
										callback();
									});
								});
							});
						});
					}
				});
			}
		
			if (data.id != null) {
				disableWifiAccessPoint(function() {
					require('./pi-wifi.js').connectToId(data.id, function(error) {
						if (error) {
							return callback(error.message, null);
						} else {
							disableAccessPoint();
							
							return callback(null, null);
						}
					});
				});
			} else if (data.ssid != null && data.password != null && data.username == null) {
				disableWifiAccessPoint(function() {
					require('./pi-wifi.js').connect(data.ssid, data.password, function(error) {
						if (error) {
							return callback(error.message, null);
						} else {
							return callback(null, null);
						}
					});
				});
			} else if (data.ssid != null && data.password != null && data.username != null) {
				disableWifiAccessPoint(function() {
					require('./pi-wifi.js').connectEAP(data.ssid, data.username, data.password, function(error) {
						if (error) {
							return callback(error.message, null);
						} else {
							return callback(null, null);
						}
					});
				});
			} else if (data.ssid != null) {
				disableWifiAccessPoint(function() {
					require('./pi-wifi.js').connectOpen(data.ssid, function(error) {
						if (error) {
							return callback(error.message, null);
						} else {
							return callback(null, null);
						}
					});
				});
			} else {
				return callback('missing_parameters', null);
			}
		} else {
			return callback('missing_parameters', null);
		}
	} else {
		return callback('unknown_hardware', null);
	}
};

module.exports.disconnectWifiConnection = function(data, callback) {
	if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
		exec("sudo wpa_cli -i wlan0 disable_network " + json.data.id.toString(), (error, stdout, stderr) => {
			if (stderr) {
				return callback(stderr, null);
			} else {
				exec("sudo wpa_cli save_config", (error, stdout, stderr) => {
					return callback(null, null);
				});
			}
		});
	} else {
		return callback('unknown_hardware', null);
	}
};

module.exports.loadDeviceSettings = function(callback) {
	var deviceSettings = SharedManager.deviceSettings;
	
	if (SharedManager.deviceSettings.hardware.includes('Raspberry') == true) {
		var timeZone = execSync("sudo timedatectl | grep 'Time zone'").toString().trim().replace(/^\n|\n$/g, '').replace(/  +/g, ' ');
		
		timeZone = timeZone.split(' ')[2];

		deviceSettings.device_time_zone = timeZone;
	}
	
	callback(null, deviceSettings);
};
