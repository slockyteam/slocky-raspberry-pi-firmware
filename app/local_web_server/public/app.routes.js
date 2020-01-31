app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider
		.when('/', {
			'templateUrl': 'sections/device_details/device_details.html',
			controller: 'DeviceDetailsController'
		})
		.when('/device_settings', {
			'templateUrl': 'sections/device_settings/device_settings.html',
			controller: 'DeviceSettingsController'
		})
		.when('/network_settings', {
			'templateUrl': 'sections/network_settings/network_settings.html',
			controller: 'NetworkSettingsController'
		})
		.otherwise({
	        'redirectTo': '/'
	    });

	$locationProvider.html5Mode({
	  	'enabled': true,
	  	'requireBase': false
	});
}]);