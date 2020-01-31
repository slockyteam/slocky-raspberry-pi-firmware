app.controller('DeviceSettingsController', function($rootScope, $scope, $http, $location, $routeParams, config) {	
	$scope.saveDeviceSettings = function(form) {
		$rootScope.progressBar.start();
		
		$http({
		  	method: 'POST',
		  	url: 'http://' + $location.host() + ':88' + '/device_settings',
		  	data: $scope.deviceSettings
		}).then(function successCallback(response) {
		  	$rootScope.showSuccessAlert($rootScope.languageData.device_settings.save_successful.title, $rootScope.languageData.device_settings.save_successful.message);
		   
		    $rootScope.progressBar.complete();
		    
		    $location.path('/');
		}, function errorCallback(response) {
		    $rootScope.showDangerAlert($rootScope.languageData.device_settings.save_failure.title, $rootScope.languageData.device_settings.save_failure.message);
		   
		    $rootScope.progressBar.complete();
		});
	};

	$scope.loadDeviceSettings = function() {
		$scope.isLoadingDeviceSettings = true;

		$http({
			method: 'GET',
			url: 'http://' + $location.host() + ':88' + '/device_settings'
		}).then(function successCallback(response) {
		    $scope.deviceSettings = response.data;
		    
			$scope.isLoadingDeviceSettings = false;
		}, function errorCallback(response) {
			$scope.deviceSettings = null;
			
			$scope.isLoadingDeviceSettings = false;
		});
	};
	
	$scope.loadDeviceSettings();
});