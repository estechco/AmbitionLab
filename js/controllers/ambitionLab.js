var http = location.protocol;
var slashes = http.concat("//");
var baseURL = slashes.concat(window.location.hostname).concat("/AmbitionLab/");
//var baseURL = 'http://localhost/AmbitionLab/';
//var baseURL = 'http://ambitionlab.estechco.co.uk/';
//var baseURL = 'http://survey.ambitionlab.co.uk/';

var appOuter = angular.module('ambitionLab', ['ambitionLabInner','LocalStorageModule']);

var app = angular.module('ambitionLabInner', ['ui.bootstrap'], function($routeProvider, $locationProvider) {
  //$routeProvider.when('/:id', {
    //redirectTo: '/'
  //});
  //$routeProvider.otherwise( { redirectTo: '/'} );
  
  // configure html5 to get links working
  // If you don't do this, you URLs will be base.com/#/home rather than base.com/home
  $locationProvider.html5Mode(true);
});


function AlertDemoCtrl($scope) {
  $scope.alerts = [
    { type: 'error', msg: 'Oh snap! Change a few things up and try submitting again.' }, 
    { type: 'success', msg: 'Well done! You successfully read this important alert message.' }
  ];

  $scope.addAlert = function() {
    $scope.alerts.push({msg: "Another alert!"});
  };

  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

}

////////////////////////////////////

app.controller('SurveyOuterCtrl', function ($scope, localStorageService, stageDataFactory, submitDataFactory) {
	$scope.debugOutput = function($scope) {
		myDebug(JSON.stringify("stagenum="+$scope.stagenum));
		myDebug(JSON.stringify("data length="+$scope.data.length));
	}

	$scope.isEverythingReady = function($scope) {
		if (($scope.stagenum != null) && ($scope.data != null) && ($scope.data.length > 0)) {
			$scope.ready = true;
		}
	}

	$scope.amendDataBasedOnStages = function($scope) {
		if (($scope.stagenum != null) && ($scope.data != null)) {
			if ($scope.stagenum == 0) {
				// If this is the "before" case remove the final question
				$scope.data.pop();
			}
		}
		$scope.isEverythingReady($scope);
	}

	$scope.amendDataBasedOnStages2 = function($scope) {
		if (($scope.stagenum != null) && ($scope.data != null)) {
			myDebug(JSON.stringify("stagenum="+$scope.stagenum));
			// Manage the "stages" where the questions should be shown
			data2 = [];
			myDebug(JSON.stringify("data length="+$scope.data.length));
			for (var i=0; i<$scope.data.length; i++) {
				var b = false;
				var x = -1;
				e = $scope.data[i];
				myDebug(JSON.stringify("e="+e));
				// If no stage is present then assume the question should be shown
				if (e["stages"] == null) {
					b = true;
				}
				else
				{
					b = (e["stages"].indexOf($scope.stagenum)!=-1);
					myDebug(JSON.stringify("b="+b));
				}
				if (b) {
					data2.push(e);
				}
			}
			//$scope.data = [];
			//for (var i=0; i<$scope.data.length; i++) {
				//$scope.data.push(data2[i]);
			//}
			$scope.isEverythingReady($scope);
		}
	}

    function init() {
	    $scope.data = [];
		$scope.guid = getQueryVariable('g');
		//$scope.stagenum = 0;
		if ( $scope.guid == null ) {
			$scope.guid = localStorageService.get('ambitionLabGuid');
			if ( $scope.guid == null ) {
				$scope.guid = newId();
			}
		}
        myDebug("Guid: " + JSON.stringify($scope.guid));
	    localStorageService.add('ambitionLabGuid',$scope.guid);
		$scope.hideLoading = true;


		var handleStageSuccess = function(data, status) {
			$scope.extra = "";
			switch(data)
			{
			case "2":
				$scope.stagenum = 2;
				$scope.stage = "done";
			  break;
			case "1":
				$scope.stagenum = 1;
				$scope.stage = "after";
				$scope.extra = "back ";
			  break;
			case "0":
				$scope.stagenum = 0;
				$scope.stage = "before";
			  break;
	   	    }
			$scope.welcomeMsg = "Welcome "+$scope.extra+"to AmbitionLab";
		    myDebug("stageDataFactory - Success: "+JSON.stringify($scope.stage));
			$scope.amendDataBasedOnStages($scope);
			myDebug("Stage loaded");
			$scope.debugOutput($scope);
			//$scope.isEverythingReady($scope);
		};
		var handleStageFailure = function(data, status) {
			$scope.stage = "before";
			$scope.stagenum = 0;
		    myDebug("stageDataFactory - Error: "+JSON.stringify(status));
		};
		stageDataFactory.getData($scope.guid).success(handleStageSuccess).error(handleStageFailure);
    }
    init();

	$scope.welcome = true;
	$scope.finished = false;
	$scope.ready = false;
    $scope.startSurvey=function(){
		//amendDataBasedOnStages($scope);
		$scope.welcome = false;
 	}
	$scope.finishSurvey=function(postdata){
		var handleSubmitSuccess = function(data, status) {
			$scope.finished = true;
		    myDebug("finishSurvey: "+JSON.stringify($scope.data));
		    //$scope.data = [];
		};
		var handleSubmitFailure = function(data, status) {
		    myDebug("submitDataFactory - Error: "+JSON.stringify(status));
		};
		submitDataFactory.submitData($scope.guid, $scope.stagenum, postdata).success(handleSubmitSuccess).error(handleSubmitFailure);
	}
});

app.controller('EndingCtrl', function ($scope) {
	$scope.endingurl = "partials/ending.html";
	$scope.other = false;
});

app.controller('LandingCtrl', function ($scope) {
	$scope.landingurl = "partials/landing.html";
});

app.controller('MainCtrl', function ($scope) {
});

app.controller('HeaderCtrl', function ($scope) {
	$scope.headerurl = "partials/header.html";
});

app.controller('FooterCtrl', function ($scope) {
	$scope.footerurl = "partials/footer.html";
});

app.controller('SurveyCtrl', function ($scope, surveyDataFactory) {
    $scope.currentPage = 0;
    $scope.pageSize = 1;

    function init() {
		var handleSuccess = function(data, status) {
			var e;
			for (var i=0; i<data.length; i++) {
				e = data[i];
				if (e["chance"] == null) {
					e["chance"] = false;
				}
				if (e["result"] == null) {
					e["result"] = null;
				}
				if (e["notes"] == null) {
					e["notes"] = null;
				}
				//data[i] = e;
				$scope.data.push(e);
			}
			//$scope.data = data;
			$scope.amendDataBasedOnStages($scope);
		    $scope.currentPage = 0;
			$scope.pageType = $scope.data[$scope.currentPage].type;
			$scope.template = $scope.templates[$scope.pageType];
		    myDebug(JSON.stringify($scope.data));
			myDebug("Data loaded");
			$scope.debugOutput($scope);
			//$scope.isEverythingReady($scope);
		};

        surveyDataFactory.getData().success(handleSuccess);
        //$scope.data = surveyDataFactory.getDataAlt();
    }

    init();

    $scope.templates = [
		{
			name: 'rating',
			url: 'partials/rating.html'},
		{
			name: 'plaintext',
			url: 'partials/plaintext.html'},
		{
			name: 'dropdown',
			url: 'partials/dropdown.html'},
		{
			name: 'boolean',
			url: 'partials/boolean.html'}
    ];
	//$scope.url = "partials/main.html";
    $scope.template = $scope.templates[0];
    $scope.getPartialX=function(){
	    //myDebug("getPartial("+$scope.currentPage+")");
        //return "partials/main.html";
    }
    $scope.numberOfPages=function(){
        return Math.ceil($scope.data.length/$scope.pageSize);                
    }
    $scope.percentComplete=function(){
        return Math.ceil(100.0*$scope.currentPage/$scope.numberOfPages());                
    }
    $scope.getNextPage=function(){
        $scope.currentPage = $scope.currentPage + 1;                
		$scope.pageType = $scope.data[$scope.currentPage].type;
	    $scope.template = $scope.templates[$scope.pageType];
	    myDebug(JSON.stringify($scope.data));
    }
    $scope.getPrevPage=function(){
        $scope.currentPage = $scope.currentPage - 1;                
		$scope.pageType = $scope.data[$scope.currentPage].type;
	    $scope.template = $scope.templates[$scope.pageType];
	    //myDebug(JSON.stringify($scope.data));
    }
	$scope.hideLoading = true;
});

//We already have a limitTo filter built-in to angular,
//let's make a startFrom filter
app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});

app.factory('stageDataFactory', function($http) { 
    var factory = {};

    factory.getData = function (g) {
	    return $http.get(baseURL+'REST/RestService.svc/Stage/'+g);
    };

	return factory;
});

app.factory('submitDataFactory', function($http) { 
    var factory = {};

    factory.submitData = function (g, stage, postdata) {
		var resultdata = [];

		var d;
		for (var i=0; i<postdata.length; i++) {
			d = postdata[i];
			if (d.notes==null) {
			    resultdata.push({id: d.id, ans: d.result});
			}
			else {
			    resultdata.push({id: d.id, ans: d.result, notes: d.notes});
			}
		}

	    return $http.post(baseURL+'REST/RestService.svc/Submit/'+g+'/'+stage, resultdata);
    };

	return factory;
});

app.factory('surveyDataFactory', function($http) { 
    var factory = {};

    factory.getData = function () {
	    return $http.get('data.json', { cache: false} );
    };

    factory.getDataAlt = function () {
		factory.data = [];
		for (var i=1; i<=30; i++) {
		    factory.data.push({id: i, title: "Question "+i, type: (i % 2)});
		}
	    myDebug(JSON.stringify(factory.data));
	    return factory.data;
    };

	return factory;
});


var getCommonHint = function(value, list) {
	    //myDebug(value);
		switch(value)
		{
		case 1:
			return value + " - "+list[0];
		  break;
		case 2:
		case 3:
			return value + " - "+list[1];
		  break;
		case 4:
		case 5:
			return value + " - "+list[2];
		  break;
		case 6:
		case 7:
			return value + " - "+list[3];
		  break;
		case 8:
		case 9:
			return value + " - "+list[4];
		  break;
		default:
			return "";
	  }
	};

var getCommonHint1 = function(value) {
	var list1 = ['Not at all', 'A little', 'Moderately', 'Very', 'Extremely'];
	return getCommonHint(value, list1);
}

var getCommonHint2 = function(value) {
	var list2 = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];
	return getCommonHint(value, list2);
}

var newId = function () {
        "use strict";
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
}
    
var getQueryVariable = function(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  } 
  //myDebug('Query Variable ' + variable + ' not found');
}

var myDebug = function (msg) {
		console.log(msg);
}
    
app.controller('RatingCtrl', function($scope, $window) {
	//$scope.list = list2;

    $scope.clear = function () {
		$scope.rating = -1;
		$scope.over = 1;
		$scope.show = false;
		$scope.hoverhint = "";
		$scope.current = "";
    }

    $scope.reset = function () {
	    $scope.item.result = null;
	    $scope.clear();
    }

    $scope.clear();

	if ($scope.item.result != null) {
		$scope.rating = $scope.item.result;
	}

	$scope.getHint = function(value) {
		if ($scope.item.chance) {
			return getCommonHint1(value)
		}
		else {
			return getCommonHint2(value);
		}
	};

    $scope.saveRatingToServer = function(rating) {
	  $scope.item.result = rating;
	  $scope.current = $scope.getHint(rating);
    };
  });

app.directive('starRating', function () {
    return {
      restrict: 'A',
      template: '<ul class="rating">' +
                  '<li ng-repeat="star in stars" ng-class="star" ng-click="toggle($index)" ng-mouseover="hovering($index)">' +
                    '\u2605' +
                  '</li>' +
                '</ul>',
      scope: {
        ratingValue: '=',
        chanceValue: '=',
        hoverHint: '=',
        max: '=',
        readonly: '@',
        onRatingSelected: '&',
        onGetHint: '&'
      },
      link: function (scope, elem, attrs) {

		var getHint = function(value) {
			if (scope.chanceValue) {
				return getCommonHint1(value)
			}
			else {
				return getCommonHint2(value);
			}
		};

        var updateStars = function() {
          scope.stars = [];
          for (var  i = 0; i < scope.max; i++) {
            scope.stars.push({filled: i < scope.ratingValue});
          }
        };

        scope.toggle = function(index) {
          if (scope.readonly && scope.readonly === 'true') {
            return;
          }
          scope.ratingValue = index + 1;
          scope.onRatingSelected({rating: index + 1});
        };

        scope.hovering = function(index) {
		    scope.hoverHint = getHint(index + 1);
        };

        scope.$watch('ratingValue', function(oldVal, newVal) {
          if (newVal) {
            updateStars();
          }
        });
      }
    }
});

app.directive('buttonsRadio', function () {
    return {
            restrict: 'E',
            scope: { model: '=', options:'='},
            controller: function($scope){
                $scope.activate = function(option){
                    $scope.model = option;
                };      
            },
            template: "<button type='button' class='btn' "+
                        "ng-class='{active: option == model}'"+
                        "ng-repeat='option in options' "+
                        "ng-click='activate(option)'>{{option}} "+
                      "</button>"
    };
});

app.controller('PlainTextCtrl', function($scope, $window) {
  //$scope.item.result = null;
  //$scope.isCollapsed = false;
});

app.controller('DropdownCtrl', function($scope, $window) {
});

app.controller('BooleanCtrl', function($scope, $window) {
	if ( $scope.item.result == null ) {
	    $scope.item.result = null;
	}
	$scope.boolOptions = ["Yes", "No"];
    $scope.$watch('item.result', function(v){
        //myDebug('changed', v);
    });
});

