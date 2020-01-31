app.controller('NetworkSettingsController', function($rootScope, $scope, $http, $location, $routeParams, config) {
    $scope.selectedTab = 0;
	
	$scope.connectWifiConnection = function(network, password) {
		$rootScope.progressBar.start();
        
        if (password != null) {
	        network.password = password;
        }
        
        $http({
            method: 'PUT',
            url: 'http://' + $location.host() + ':88' + '/connect_wifi_connection',
            data: network
        }).then(function successCallback(response) {
			$rootScope.showSuccessAlert($rootScope.languageData.network_settings.wifi.connect_connection_successful.title, $rootScope.languageData.network_settings.wifi.connect_connection_successful.message);
			
            $rootScope.progressBar.complete();
            
            $scope.loadWifiConnections();
        }, function errorCallback(response) {
            $rootScope.showDangerAlert($rootScope.languageData.network_settings.wifi.connect_connection_failure.title, $rootScope.languageData.network_settings.wifi.connect_connection_failure.message);
            
            $rootScope.progressBar.complete();
        });
	};
	
	$scope.deleteWifiConnection = function(network) {
		$rootScope.progressBar.start();
        
        $http({
            method: 'DELETE',
            url: 'http://' + $location.host() + ':88' + '/wifi_connection',
            data: network
        }).then(function successCallback(response) {
            $rootScope.showSuccessAlert($rootScope.languageData.network_settings.wifi.delete_connection_successful.title, $rootScope.languageData.network_settings.wifi.delete_connection_successful.message);

            $rootScope.progressBar.complete();
            
            $scope.loadWifiConnections();
        }, function errorCallback(response) {
            $rootScope.showDangerAlert($rootScope.languageData.network_settings.wifi.delete_connection_failure.title, $rootScope.languageData.network_settings.wifi.delete_connection_failure.message);
            
            $rootScope.progressBar.complete();
        });
	};
	
	$scope.disconnectWifiConnection = function(network) {
		$rootScope.progressBar.start();
        
        $http({
            method: 'PUT',
            url: 'http://' + $location.host() + ':88' + '/disconnect_wifi_connection',
            data: network
        }).then(function successCallback(response) {
            $rootScope.showSuccessAlert($rootScope.languageData.network_settings.wifi.disconnect_connection_successful.title, $rootScope.languageData.network_settings.wifi.disconnect_connection_successful.message);
			
            $rootScope.progressBar.complete();
            
            $scope.loadWifiConnections();
        }, function errorCallback(response) {
            $rootScope.showDangerAlert($rootScope.languageData.network_settings.wifi.disconnect_connection_failure.title, $rootScope.languageData.network_settings.wifi.disconnect_connection_failure.message);
            
            $rootScope.progressBar.complete();
        });
	};
	
	$scope.loadWifiConnections = function() {
		$scope.wifiConnections = null;
		$scope.isLoadingWifiConnections = true;

		$http({
			method: 'GET',
			url: 'http://' + $location.host() + ':88' + '/wifi_connections'
		}).then(function successCallback(response) {
		    $scope.wifiConnections = response.data;
		    
			$scope.isLoadingWifiConnections = false;
		}, function errorCallback(response) {
			$scope.wifiConnections = null;
			
			$scope.isLoadingWifiConnections = false;
		});
	};
	
	$scope.wifiScan = function() {
		$scope.wifiScannedNetworks = null;
		$scope.isLoadingWifiScannedNetworks = true;

		$http({
			method: 'GET',
			url: 'http://' + $location.host() + ':88' + '/wifi_scan'
		}).then(function successCallback(response) {
		    $scope.wifiScannedNetworks = response.data;
		    
			$scope.isLoadingWifiScannedNetworks = false;
		}, function errorCallback(response) {
			$scope.wifiScannedNetworks = null;
			
			$scope.isLoadingWifiScannedNetworks = false;
		});
	};
	
	$scope.saveCellularSettings = function(form) {
		$rootScope.progressBar.start();
        
        $http({
            method: 'POST',
            url: 'http://' + $location.host() + ':88' + '/cellular_settings',
            data: $scope.cellularSettings
        }).then(function successCallback(response) {
            $rootScope.showSuccessAlert($rootScope.languageData.network_settings.cellular.save_successul.title, $rootScope.languageData.network_settings.cellular.save_successul.message);
			
            $rootScope.progressBar.complete();
            
            $location.path('/');
        }, function errorCallback(response) {
            $rootScope.showDangerAlert($rootScope.languageData.network_settings.cellular.save_failure.title, $rootScope.languageData.network_settings.cellular.save_failure.message);
			
            $rootScope.progressBar.complete();
        });
	};
	
	$scope.saveWifiAccessPointSettings = function(form) {
		$rootScope.progressBar.start();
        
        $http({
            method: 'POST',
            url: 'http://' + $location.host() + ':88' + '/wifi_access_point_settings',
            data: $scope.wifiAccessPointSettings
        }).then(function successCallback(response) {
            $rootScope.showSuccessAlert($rootScope.languageData.network_settings.wifi_access_point.save_successul.title, $rootScope.languageData.network_settings.wifi_access_point.save_successul.message);
            
            $rootScope.progressBar.complete();
            
            $location.path('/');
        }, function errorCallback(response) {
			$rootScope.showDangerAlert($rootScope.languageData.network_settings.wifi_access_point.save_failure.title, $rootScope.languageData.network_settings.wifi_access_point.save_failure.message);
			
            $rootScope.progressBar.complete();
        });
	};
	
	$scope.saveEthernetSettings = function(form) {
		$rootScope.progressBar.start();
        
        $http({
            method: 'POST',
            url: 'http://' + $location.host() + ':88' + '/ethernet_settings',
            data: $scope.ethernetSettings
        }).then(function successCallback(response) {
            $rootScope.showSuccessAlert($rootScope.languageData.network_settings.ethernet.save_successul.title, $rootScope.languageData.network_settings.ethernet.save_successul.message);
            
            $rootScope.progressBar.complete();
            
            $location.path('/');
        }, function errorCallback(response) {
			$rootScope.showDangerAlert($rootScope.languageData.network_settings.ethernet.save_failure.title, $rootScope.languageData.network_settings.ethernet.save_failure.message);
			
            $rootScope.progressBar.complete();
        });
	};
	
	$scope.loadCellularSettings = function() {
		$scope.isLoadingCellularSettings = true;

		$http({
			method: 'GET',
			url: 'http://' + $location.host() + ':88' + '/cellular_settings'
		}).then(function successCallback(response) {
		    $scope.cellularSettings = response.data;
		    
			$scope.isLoadingCellularSettings = false;
		}, function errorCallback(response) {
			$scope.cellularSettings = null;
			
			$scope.isLoadingCellularSettings = false;
		});
	};
	
	$scope.loadEthernetSettings = function() {
		$scope.isLoadingEthernetSettings = true;

		$http({
			method: 'GET',
			url: 'http://' + $location.host() + ':88' + '/ethernet_settings'
		}).then(function successCallback(response) {
		    $scope.ethernetSettings = response.data;
		    
			$scope.isLoadingEthernetSettings = false;
		}, function errorCallback(response) {
			$scope.ethernetSettings = null;
			
			$scope.isLoadingEthernetSettings = false;
		});
	};
	
	$scope.loadWifiAccessPointSettings = function() {
		$scope.isLoadingWlanAccessPointSettings = true;

		$http({
			method: 'GET',
			url: 'http://' + $location.host() + ':88' + '/wifi_access_point_settings'
		}).then(function successCallback(response) {
		    $scope.wifiAccessPointSettings = response.data;
		    
			$scope.isLoadingWifiAccessPointSettings = false;
		}, function errorCallback(response) {
			$scope.wifiAccessPointSettings = null;
			
			$scope.isLoadingWifiAccessPointSettings = false;
		});
	};
	
	$scope.loadWifiAccessPointSettings();
	$scope.loadCellularSettings();
	$scope.loadWifiConnections();
	$scope.loadEthernetSettings();
});