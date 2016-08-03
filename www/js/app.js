// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var smsl = angular.module('smsl', ['ionic',
                                   'pascalprecht.translate',
                                   'ngCordova'])

.config(function($compileProvider){
  //$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|cdvfile|ftp|mailto|file|tel|content):/);
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|cdvfile|ftp|mailto|file|tel|content):|data:image\//);
})

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }

    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

/*----------------Config ----------------*/

/*--------- Config App-------- */
smsl.constant('config', {
                'languages' : [
                  {'id':'fr' , 'language':'BUTTON_LANG_FR'},
                  {'id':'en' , 'language':'BUTTON_LANG_EN'}
                ],
                'PREFERREDLANGUAGE':
                  {'id':'en' , 'language':'BUTTON_LANG_EN'}
});

//Param the translate
smsl.config(function ($translateProvider,config) {

  $translateProvider.useStaticFilesLoader({
    prefix: './language/',
    suffix: '.json'
  });

  $translateProvider.preferredLanguage(config.PREFERREDLANGUAGE.id);
});

smsl.config(function ($stateProvider,$urlRouterProvider) {
  //need to start
  $urlRouterProvider.otherwise('/')


//my template
  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'home.html',
    controller: 'HomeCtrl'
  })

  $stateProvider.state('running', {
    url: '/running',
    templateUrl: 'running.html',
    controller: 'RunningCtrl'
  })

});



/*----------------Controllers ----------------*/

/*controler for menu and navigation*/
smsl.controller('menu', function($ionicPlatform,$scope,$ionicModal,$rootScope,$window,$ionicSideMenuDelegate,$translate,$ionicPopover,$timeout,config,gpsPosition,sendSMS) {



    //load presentation page when initialise apply
    $ionicModal.fromTemplateUrl('presentation.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.PresentationModal = modal;
      //open the modal when ready
      $scope.openModal();
    });

    $scope.openModal = function() {
     $scope.PresentationModal.show();
     $timeout(function() {
       $scope.PresentationModal.hide();
     }, 2000);
    };

    $scope.$on('modal.hidden', function(){
      gpsPosition.checkGps();
    });




    //open the menu left
    $scope.openMenu = function() {
      $ionicSideMenuDelegate.toggleLeft();
    };

    //close the app
    $scope.closeApp = function() {
      ionic.Platform.exitApp();
    };

    //Change language
    $scope.changeLanguage = function (key) {
      $translate.use(key.id);
    };

    //give config to html
    $scope.languagesList=config.languages;
    $scope.preferredLanguage=config.PREFERREDLANGUAGE;

    $ionicPopover.fromTemplateUrl('map.html', {
      scope: $scope,
      animation: 'slide-in-up'
      }).then(function(popover) {
        $scope.popover = popover;
    });

    //open popover map
    $scope.openPopover = function($event) {
      //show the popover
      $scope.popover.show($event)
        .then(function(){

          //start watching Position
          gpsPosition.findPosition();

          //load map
          var mapOptions = {
            center: {lat: -34.397, lng: 150.644},
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };

          //work only when controler is open
          $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

        });
    };

    $scope.closePopover = function() {
       $scope.popover.hide();
    };

    //stop watching when map is close
    $scope.$on('popover.hidden', function() {
      gpsPosition.stopWatching();
      //$scope.popover.remove();
    });
});

//home controler
smsl.controller('HomeCtrl', function($scope,$window,$location,$ionicScrollDelegate,$translate,getContact,receiversList) {

  //pass though scope receivers list contact
  $scope.receivers = receiversList;

  //add a contact to list
  $scope.getPhoneNumbers = function() {
    getContact.phoneNumbersList($scope)
      .then(function (contact) {
        if (contact.phones.length>1){
          //display modal and select one number
          $scope.phoneNumbers = contact.phones;
          getContact.selectNumber($scope,contact.photo,contact.contactName).then(
            function(selPhone){
              //insert number in object
              receiversList.add(selPhone.phone,selPhone.photo,selPhone.contactName);
              $scope.displayList();
            }
          );
        }else{
          //insert number in object
          receiversList.add(contact.phones[0].value,contact.photo,contact.contactName);
          $scope.displayList();
        }
      });
  };

  //add a phone to list number
  $scope.addPhoneNumber = function(myinput){
    if (angular.isDefined(myinput)){
        receiversList.add(myinput).then(function (message) {
          //clear the input
          $scope.myInput.inputPhoneNumber = undefined;
        });
        $scope.displayList();

      }else{
        var template = 'this is my pop';
        $scope.popoverMessage = $ionicPopover.fromTemplate(template, {
          scope: $scope
        });
        $scope.popoverMessage.show($event);
    }
  };

  function emptyMyInput (){
    $scope.inputPhoneNumber = 11111111111;
  }

  //display or hide cards
  $scope.displayList = function (){
    if (receiversList.all.length==1){
      $scope.displayCards=true;
    }
    if (receiversList.all.length==0){
      $scope.displayCards=false;
    }
  }

  $scope.StartRunning = function (){
    if (receiversList.all.length > 0){
      $location.path("/running");
    }else{
      numberIsEmpty = $translate.instant('NUMBER_IS_EMPTY');
      alert(numberIsEmpty);
    }
  };

});

//controller for the  list receiver
smsl.controller('receiversListCtrl', function($scope,receiversList) {
  $scope.shouldShowDelete = true;

  $scope.deleteContact = function (index,num){
    receiversList.all.splice(index,num);
    $scope.displayList();
  };

});

//form controller
smsl.controller('formCtrl', function($scope,$cordovaDatePicker,$filter,smsText) {

  //initialise date
  $scope.initialiseTimeInterval = function(minute){
    smsText.timeInterval = minute;
  };

  //V2 minute
  var range = [];
  for(var i=1;i<60;i++) {
      range.push(i);
  }

   $scope.minuteSelect = {
       repeatSelect: null,
       availableOptions:range,
       selectedOption:1
   };


  //save sms Text when edited
  $scope.updateSmsText = function () {
    smsText.Text = $scope.smsText;
  };

});

//ctlr for popover map
smsl.controller('MapCtrl', function($scope,gpsPosition) {

  //key map
  //AIzaSyC_c3-noQAc9vuCjRa3DJzDpnni5skPCBc

  //Wait until the map is loaded
  //See GPS new positions
  $scope.$on('isANewPosition', function (event) {
      //$scope.centerTo();
      lat = gpsPosition.lastPosition.lat;
      lng = gpsPosition.lastPosition.long;
      $scope.map.panTo({lat:lat,lng:lng});
  });

  //center the Map
  $scope.centerTo = function(){
    //doesn't come from angularJs function so use apply to update scope!!
    $scope.$apply(function () {
    });
  };

});

smsl.controller('RunningCtrl', function($scope, $stateParams,gpsPosition,$interval,$filter,receiversList,sendSMS,smsText,countdown) {


  //initalise SVG circle object
  circleId = document.querySelector('#circleCountdown');

  //create object for angularJs to play with it and jqlite
  var circleAng = angular.element(circleId);

  //first start
  searchingPosition();

  //interval
  MinuteInMs = smsText.timeInterval*60000;

  $interval(searchingPosition, MinuteInMs);

  //start to search position
  function searchingPosition () {
    //parameter for a circle
    MinuteInS = smsText.timeInterval*60;
    duration = smsText.timeInterval*60000;
    perimeter = 57 * 2 * Math.PI;
    increment = perimeter/MinuteInS;
    increment = increment/10;
    myCircle(increment,perimeter,duration);
  }

  //Start the circle
  function myCircle (increment,perimeter,duration) {

    //Send GPS position
    $scope.sendPosition = true;
    //start  ctheountdown
    countdown.start(duration);

    $scope.oneTour;
    // stop a tour if is set
    if (angular.isDefined($scope.oneTour)){
      $interval.cancel($scope.oneTour);
    }

    //initalise var for circle
    $scope.angle = 0;
    $scope.inc = increment;

    $scope.oneTour = $interval(function () {
        //get time left
        timeLeftCheck = countdown.timeLeft();
        if (countdown.timeLeft() > 60000){

          timeLeft = Math.floor(countdown.timeLeft() / 60000);
          $scope.timeLeft = timeLeft+" min";

        }else{
         timeLeft = Math.floor(countdown.timeLeft() / 1000);
         $scope.timeLeft = timeLeft+" sec";
        }

        //parameter to draw circle
        $scope.angle = $scope.angle + increment;

        //start to search gpsPositions
        if ($scope.sendPosition == true){
          if (timeLeftCheck < 5000){
            $scope.sendPosition = false;
            if (gpsPosition.isWatch==null){
              gpsPosition.findPosition();
            }
          }
        }

        //drawing circle with css
        circleAng.attr('stroke-dasharray', $scope.angle+','+perimeter);
    },100);
  };

  //send sms when a new position is finding
  $scope.$on('isANewPosition', function (event) {
      lat = gpsPosition.lastPosition.lat;
      lng = gpsPosition.lastPosition.long;
      acc = gpsPosition.lastPosition.acc;
      $scope.lat=lat;

      //search until accuracy is under 15m
      if (acc < 15){
        //send sms
        sendSMS.sendingSMS(receiversList.all,smsText);
        //stop watching
        gpsPosition.stopWatching();
      }else{
        //alert(acc+"continue searching new positions");
      }
  });
});

smsl.controller('selectNumberModal', function($scope,icons){
  $scope.icons = icons.phoneTypeIcons;

  //transform to associative array ***May be improve it and add a default value
  $scope.arrayIcons = [];
  angular.forEach(icons.phoneTypeIcons, function(element,key) {
     angular.forEach(element, function (value,key){
       $scope.arrayIcons[key]=value;
     });
  });


});

/*----------------Factory ----------------*/

//the receivers list
smsl.factory('receiversList', function($q,$translate) {
  return {
    all: [],
    add: function(number,photo,contactName) {
      var q = $q.defer();
      //photo is an optional value
      if (typeof photo === 'undefined') { photo = 'img/faceTel.png'; }
      //name is an optional value
      if (typeof contactName === 'undefined') { contactName = ''; }


      //check if number is already in list
      addPhone=true;
      angular.forEach(this.all, function(value, key) {
        if (value.phone===number){
          //FIX IT with an error message in the scope
          PhoneExist = $translate.instant('PHONE_EXIST');
          alert (PhoneExist);

          addPhone=false;
        }
      });
      //open contact
      if (addPhone===true){
        //FIX IT add contact name
        this.all.push({"phone":number,"photo":photo,"contactName":contactName});
        q.resolve("ok");
      }
      return q.promise;
    }
  };
});

//sms Text
smsl.factory('smsText',function($filter){
  return{
    Text:"default message",
    timeInterval:null,
    TimeIntervalFormat:function(date){
      //display format
      this.TimeInterval = $filter('date')(date,'HH:mm');
      //TimeInterval in millisecond
      $filter('date')(smsText.TimeInterval, 'H')*3600000;
      MinInMs = $filter('date')(smsText.TimeInterval, 'm')*60000;
      this.timeIntervalMs = hInMs+MinInMs;
    }
  };
});

//Get Phone number of a contact
smsl.factory('getContact', function($q,$cordovaContacts,$ionicModal) {

    return {
      //get contact
      phoneNumbersList: function($scope) {
        var q = $q.defer();

        $cordovaContacts.pickContact().then(function (contactPicked) {

          if ( contactPicked.photos === null ){
            photo="img/faceTel.png";
          }else{
            photo=contactPicked.photos[0].value;
          }
          var contact = {'phones':contactPicked.phoneNumbers,'photo':photo,'contactName':contactPicked.displayName};

          q.resolve(contact);
        });
        return q.promise;
      },
      //select number for contact with many numbers
      selectNumber: function(thisScope,photoUrl,contactName){
        var q = $q.defer();

        $ionicModal.fromTemplateUrl('selectNum.html', {
          animation: 'slide-in-up',
          scope:thisScope,
        }).then(function(modal) {
          modal.show();

          thisScope.selectedNum = function (number) {
            var selPhone={'phone':number,'photo':photoUrl,'contactName':contactName}
            q.resolve(selPhone);
            modal.remove();
          };
        });
        return q.promise;
      }
    };
});

//GPS service
smsl.factory('gpsPosition',function($cordovaGeolocation,$rootScope,$ionicPlatform){
  return {
    lastPosition:"defaultpos",
    CallbackPositionCount:0, //how many position return
    minAccuracy:5, //accuracy min in meter,
    isWatch:null,
    findPosition: function(){
      //In var to use object into functions
      thisObject=this;

      //start watching with cordovaGeolocation
      var posOptions = {enableHighAccuracy: true};

      //check already searching
      if (this.isWatch!=null){
        //continue
        watchId=this.isWatch;
      }else{
        //create new ID
        var watchId = $cordovaGeolocation.watchPosition(posOptions);
      }
        watchId.then(
          null,
          function(err) {
          },
          function(position) {
            geolocationSuccess(position,thisObject);
          });

      this.isWatch = watchId;

      function geolocationSuccess(position,thisObject){
        lat = position.coords.latitude;
        long = position.coords.longitude;
        acc = position.coords.accuracy;
        Position={"lat":lat,"long":long,"acc":acc};
        //Update GPS last position
        thisObject.lastPosition = Position;
        //event for the resultat thought $rootScope
        $rootScope.$broadcast('isANewPosition');
      }

    },
    stopWatching:function(){
      this.isWatch.clearWatch();
      this.isWatch = null;
    },
    checkGps:function(){
      $ionicPlatform.ready(function() {
        cordova.plugins.locationAccuracy.request(function (success){

        }, function (error){
          alert("Accuracy request failed: error code="+error.code+"; error message="+error.message);
          if(error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED){
            if(window.confirm("Failed to automatically set Location Mode to 'High Accuracy'. Would you like to switch to the Location Settings page and do this manually?")){
              cordova.plugins.diagnostic.switchToLocationSettings();
            }
          }
        }, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
      });
    }
  };

});

//sending sms
smsl.factory('sendSMS',function($cordovaSms,gpsPosition){
  return{
    urlPosition : "http://tiny.cc/hereim",
    sendingSMS : function(receiversList,smsText){

      //sending options
      var options = {
            replaceLineBreaks: false, // true to replace \n by a new line, false by default
            android: {
                intent: ''  // send SMS with the native android SMS messaging
            }
        };

      var text = smsText.Text;
      var url = this.urlPosition+"?lat="+gpsPosition.lastPosition.lat+"?long="+gpsPosition.lastPosition.long;
      //loop the phone users
      angular.forEach(receiversList, function(value, key){
        var number = value.phone;

        //who is the receivers
        $cordovaSms.send(number, text, options)
         .then(function() {
           //alert("great sms is sending to "+number+smsText.Text);
         }, function(error) {
           alert("sms dont send");
        });
      });
    }
  };
});

//icons configuration
smsl.factory('icons',function(){
  return{
    phoneTypeIcons:[{'home':'ion-home'},
                     {'mobile':'ion-iphone'}]
  }
});

//coutdown
smsl.factory ('countdown', function(){
  return{
    endDate : null,
    start : function(duration){
      this.endDate = new Date().getTime()+duration;
    },
    timeLeft : function (){
      //check if the countdown is running
      if (this.endDate==null){
        alert("start countdown first");
      }
      //timeLeft
      timeLeft = this.endDate - new Date().getTime();
      //getTimeLeft
      if (timeLeft < 0 ){
        this.endDate === null;
      }else{
        return timeLeft;
      }
    }
  }
});
