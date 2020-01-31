var app = angular.module('Slocky', ['ngRoute', 'ngProgress', 'ngCookies']);

app.constant('config', {
	defaultLanguage: 'en',
	languages: [
		'en'
	],
    apiUrl: 'http://localhost:88'
});

app.run(function($rootScope, $location, $http, $window, ngProgressFactory, config, LanguageManager) {
	$rootScope.config = config;
	$rootScope.alerts = new Array();
	
	// Functions
	
    $rootScope.isActiveLocationPath = function(path, which) {
    	if (which != null) {
    		const array = $location.$$path.split("/");
    		
    		if (which < 0) {
    			if (path == null) {
		    		return undefined === array[array.length + which]; 
	    		} else {
	    			return path === '/' + array[array.length + which];
	    		}
	    	} else {
	    		if (path == null) {
		    		return undefined === array[which]; 
	    		} else {
		    		return path === '/' + array[which];
		    	}
	    	}
    	} else {
        	return path === $location.$$path;
        }
    };
	
	$rootScope.showAlert = function(data, timeout) {    
		const id = Math.floor(Math.random() * 1000);
		
		data.id = id;
		
		$rootScope.alerts.push(data);
		//if ($rootScope.$root.$$phase != '$apply' && $rootScope.$root.$$phase != '$digest') {
			$rootScope.$applyAsync();
		//}
		
		setTimeout(function() {
			for(var i = 0; i < $rootScope.alerts.length; i++) {
			    if($rootScope.alerts[i].id == id) {
			       $rootScope.alerts.splice(i, 1);
			       
			       //if ($rootScope.$root.$$phase != '$apply' && $rootScope.$root.$$phase != '$digest') {
						$rootScope.$applyAsync();
					//}
			    }
			}
		}, (timeout ? timeout : 3000));
	};
	
    $rootScope.showSuccessAlert = function(title, message, timeout) {
    	$rootScope.showAlert({
	    	type: 'success',
	    	title: title,
	    	message: message
    	});
	};

	$rootScope.showWarningAlert = function(title, message, timeout) {
	    $rootScope.showAlert({
	    	type: 'warning',
	    	title: title,
	    	message: message
    	});
	};
	
	$rootScope.showDangerAlert = function(title, message, errors, error, missingParameters, timeout) {
	    $rootScope.showAlert({
	    	type: 'danger',
	    	title: title,
	    	message: message,
	    	errors: errors,
	    	error: error,
	    	missing_parameters: missingParameters
    	});
	};
	
	// Language
	
	LanguageManager.loadLanguageCode();
	LanguageManager.loadLanguageData();
	
    // Progress bar

	$rootScope.progressBar = ngProgressFactory.createInstance();
	$rootScope.progressBar.setColor("#28a745");
	$rootScope.progressBar.setHeight('4px');
});