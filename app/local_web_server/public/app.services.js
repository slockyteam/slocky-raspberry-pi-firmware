app.factory('LanguageManager', function($rootScope, $window, $cookies, $http, $route, config) {
	const browserLanguage = $window.navigator.languages ? $window.navigator.languages[0] : ($window.navigator.language || $window.navigator.userLanguage);
	const defaultLanguage = config.defaultLanguage
	
	function loadLanguageCode() {
		var language = $cookies.get('language');
		
		if (language != null) {
			if (config.languages.indexOf(language)  > -1) {
				$rootScope.language = language;
			} else {
				if (config.languages.indexOf(browserLanguage)  > -1) {
					$rootScope.language = browserLanguage;
				} else {
					$rootScope.language = defaultLanguage;
				}
			}
		} else {
			if (config.languages.indexOf(browserLanguage)  > -1) {
				$rootScope.language = browserLanguage;
			} else {
				$rootScope.language = defaultLanguage;
			}
		}
		
		$http.defaults.headers.common['Accept-Language'] = $rootScope.language;
	};
		
	function loadLanguageData() {
		$http({
		  	method: 'GET',
			url: 'languages/' + $rootScope.language + '.json'
		}).then(function successCallback(response) {
		    const data = response.data;
			
		    $rootScope.languageData = response.data;
		}, function errorCallback(response) {
			$rootScope.languageData = null;
		});
	};
		
	function changeLanguage(countryCode) {
		if (config.languages.indexOf(countryCode)  > -1) {
			$rootScope.language = countryCode;
			
			$cookies.put('language', countryCode);
		} else {
			if (config.languages.indexOf(browserLanguage)  > -1) {
				$rootScope.language = browserLanguage;
			} else {
				$rootScope.language = defaultLanguage;
			}
			
			$cookies.remove('language');
		}
		
		$http.defaults.headers.common['Accept-Language'] = $rootScope.language;
		
		loadLanguageData();
		
		$route.reload();
	};
	
	return {
		loadLanguageCode,
		loadLanguageData,
		changeLanguage
	};
});