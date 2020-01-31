app.controller('DeviceDetailsController', function($rootScope, $scope, $http, $location, $routeParams, config) {
	$scope.locationHost = $location.host();
	
	$scope.serviceInfoForService = function(service) {
		if ($scope.servicesInfo != null) {
			var selectedServiceInfo = null;
			
			$scope.servicesInfo.forEach(function(serviceInfo) {
				if (service.service_folder == serviceInfo.service_folder) {
					selectedServiceInfo = serviceInfo;
				}
			});
			
			return selectedServiceInfo;
		} else {
			return null;
		}
	};
	
	$scope.loadServicesInfo = function() {
		$scope.servicesInfo = [];
		
		if ($scope.deviceInfo.services != null) {
			$scope.deviceInfo.services.forEach(function(service) {
				$http({
					method: 'GET',
					url: 'http://' + $location.host() + ':' + service.local_api_server_port + '/service_info'
				}).then(function successCallback(response) {
				    $scope.servicesInfo.push(response.data);
				}, function errorCallback(response) {
				});
			});
		}
	};
	
	$scope.rebootDevice = function() {
		$rootScope.progressBar.start();
        
        $http({
            method: 'POST',
            url: 'http://' + $location.host() + ':88' + '/reboot_device'
        }).then(function successCallback(response) {
            $rootScope.showSuccessAlert($rootScope.languageData.device_details.reboot_device_successful.title, $rootScope.languageData.device_details.reboot_device_successful.message);

			$scope.deviceInfo = null;
			$scope.networkInfo = null;
			$scope.deviceSettings = null;
			
            $rootScope.progressBar.complete();
        }, function errorCallback(response) {
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
	
	$scope.loadWifiAccessPointSettings = function() {
		$scope.isLoadingWifiAccessPointSettings = true;

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
	
  	$scope.loadNetworkInfo = function() {
		$scope.isLoadingNetworkInfo = true;

		$http({
			method: 'GET',
			url: 'http://' + $location.host() + ':88' + '/network_info'
		}).then(function successCallback(response) {
		    $scope.networkInfo = response.data;
		    
		    if ($scope.networkInfo != null) {
			    if ($scope.networkInfo.eth0 != null) {
					$scope.selectedNetworkInfoTab = 0;
			    } else if ($scope.networkInfo.wlan0 != null) {
					$scope.selectedNetworkInfoTab = 1;
			    } else if ($scope.deviceSettings != null && $scope.deviceSettings.lte_modem != null) {
					$scope.selectedNetworkInfoTab = 2;
			    }
		    }
		    
			$scope.isLoadingNetworkInfo = false;
		}, function errorCallback(response) {
			$scope.networkInfo = null;
			
			$scope.isLoadingNetworkInfo = false;
		});
	};
	
	$scope.loadDeviceSettings = function() {
		$scope.isLoadingDeviceSettings = true;
		
		$http({
			method: 'GET',
			url: 'http://' + $location.host() + ':88' + '/device_settings'
		}).then(function successCallback(response) {
		    $scope.deviceSettings = response.data;
		    
		    if ($scope.deviceSettings != null) {
			    $scope.loadServicesInfo();
		    }
		    
            $scope.isLoadingDeviceSettings = false;
		}, function errorCallback(response) {
			$scope.deviceSettings = null;
			
			$scope.isLoadingDeviceSettings = false;
		});
	};

	$scope.loadDeviceInfo = function() {
		$scope.isLoadingDeviceInfo = true;
		
		$http({
			method: 'GET',
			url: 'http://' + $location.host() + ':88' + '/device_info'
		}).then(function successCallback(response) {
		    $scope.deviceInfo = response.data;
			
		    $scope.loadNetworkInfo();
		    $scope.loadWifiAccessPointSettings();
		    $scope.loadCellularSettings();
		    $scope.loadServicesInfo();
	    
            $scope.isLoadingDeviceInfo = false;
		}, function errorCallback(response) {
			$scope.deviceInfo = null;
			
			$scope.isLoadingDeviceInfo = false;
		});
	};

	$scope.loadDeviceInfo();
	$scope.loadDeviceSettings();
});