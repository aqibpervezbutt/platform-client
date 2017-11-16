require('angular');
require('@uirouter/angularjs');
require('angular-resource');
require('angular-translate');
require('angular-translate-loader-static-files');
require('angular-ui-bootstrap');
require('angular-datepicker/build/angular-datepicker');
require('angular-sanitize');
require('angular-elastic');
require('angular-filter');
require('angular-local-storage');
require('checklist-model');
require('ngGeolocation/ngGeolocation');
require('ng-showdown');
window.d3 = require('d3'); // Required for nvd3
require('./common/wrapper/nvd3-wrapper');
require('angular-nvd3/src/angular-nvd3');
require('angular-cache');

// Load ushahidi modules
require('./common/common-module.js');
require('./main/main-module.js');
require('./settings/settings.module.js');

// Load platform-pattern-library CSS
require('ushahidi-platform-pattern-library/assets/fonts/Lato/css/fonts.css');
require('ushahidi-platform-pattern-library/assets/css/style.min.css');
require('../sass/vendor.scss');

// Stub ngRaven module incase its not configured
angular.module('ngRaven', []);

// Make sure we have a window.ushahidi object
window.ushahidi = window.ushahidi || {};

// this 'environment variable' will be set within the gulpfile
var backendUrl = window.ushahidi.backendUrl = (window.ushahidi.backendUrl || BACKEND_URL).replace(/\/$/, ''),
    intercomAppId = window.ushahidi.intercomAppId = window.ushahidi.intercomAppId || '',
    appStoreId = window.ushahidi.appStoreId = window.ushahidi.appStoreId || '',
    apiUrl = window.ushahidi.apiUrl = backendUrl + '/api/v3',
    platform_websocket_redis_adapter_url = window.ushahidi.platform_websocket_redis_adapter_url || '',
    claimedAnonymousScopes = [
        'posts',
        'media',
        'forms',
        'api',
        'tags',
        'savedsearches',
        'sets',
        'users',
        'stats',
        'layers',
        'config',
        'messages',
        'notifications',
        'webhooks',
        'contacts',
        'roles',
        'permissions',
        'csv',
        'tos'
    ];

angular.module('app',
    [
        'checklist-model',
        'monospaced.elastic',
        'ui.router',
        'ngResource',
        'LocalStorageModule',
        'pascalprecht.translate',
        'ui.bootstrap.pagination',
        'angular-datepicker',
        'angular.filter',
        'ng-showdown',
        'ngGeolocation',
        'nvd3',
        'angular-cache',
        'ngRaven',
        'ushahidi.common',
        'ushahidi.main',
        'ushahidi.settings',
        'ui.bootstrap.dropdown'
    ])

    .constant('CONST', {
        BACKEND_URL              : backendUrl,
        API_URL                  : apiUrl,
        INTERCOM_APP_ID          : intercomAppId,
        APP_STORE_ID             : appStoreId,
        DEFAULT_LOCALE           : 'en_US',
        OAUTH_CLIENT_ID          : 'ushahidiui',
        OAUTH_CLIENT_SECRET      : '35e7f0bca957836d05ca0492211b0ac707671261',
        CLAIMED_ANONYMOUS_SCOPES : claimedAnonymousScopes,
        CLAIMED_USER_SCOPES      : claimedAnonymousScopes.concat('dataproviders'),
        MAPBOX_API_KEY           : window.ushahidi.mapboxApiKey || 'pk.eyJ1IjoidXNoYWhpZGkiLCJhIjoiY2lxaXUzeHBvMDdndmZ0bmVmOWoyMzN6NiJ9.CX56ZmZJv0aUsxvH5huJBw', // Default OSS mapbox api key
        TOS_RELEASE_DATE         : new Date(window.ushahidi.tosReleaseDate).toJSON() ? new Date(window.ushahidi.tosReleaseDate) : false, // Date in UTC
        PLATFORM_WEBSOCKET_REDIS_ADAPTER_URL : platform_websocket_redis_adapter_url
    })
    .config(['$compileProvider', function ($compileProvider) {
        $compileProvider.debugInfoEnabled(false);
    }])
    .config(['$locationProvider', function ($locationProvider) {
        $locationProvider.html5Mode(true).hashPrefix('!');
    }])
    .config(function ($urlRouterProvider, $urlMatcherFactoryProvider) {
        $urlRouterProvider.when('', '/views/map');
        $urlRouterProvider.when('/', '/views/map');
        // if the path doesn't match any of the urls you configured
        // otherwise will take care of routing the user to the specified url
        $urlRouterProvider.otherwise('/404');

        $urlMatcherFactoryProvider.strictMode(false);
    })
    .factory('_', function () {
        return require('underscore/underscore');
    })
    .factory('d3', function () {
        return window.d3;
    })
    .factory('URI', function () {
        return require('URIjs/src/URI.js');
    })
    .factory('Leaflet', function () {
        var L = require('leaflet');
        // Load leaflet plugins here too
        require('imports-loader?L=leaflet!leaflet.markercluster');
        require('imports-loader?L=leaflet!leaflet.locatecontrol/src/L.Control.Locate');
        return L;
    })
    .factory('moment', function () {
        return require('moment');
    })
    .factory('io', function () {
        return require('socket.io-client');
    })
    .factory('BootstrapConfig', ['_', function (_) {
        return window.ushahidi.bootstrapConfig ?
            _.indexBy(window.ushahidi.bootstrapConfig, 'id') :
            { map: {}, site: {}, features: {} };
    }])
    .factory('loading', function (LoadingProgress, $q, $injector) {
        /* an interceptor that triggers loading-state in the beginning of
        * a http-request and remove it when all requests are done */

        return {
            request: function (config) {
                if (LoadingProgress.getLoadingState() !== true) {
                    LoadingProgress.setLoadingState(true);
                }
                // we want this to trigger isSaving everytime except when a lock-updates
                if (config.method === 'PUT' && config.url.indexOf('lock') === -1) {
                    LoadingProgress.setSavingState(true);
                }
                return config;
            },
            response: function (response) {
                var httpService = $injector.get('$http');
                if (httpService.pendingRequests.length === 0) {
                    LoadingProgress.setLoadingState(false);
                    LoadingProgress.setSavingState(false);
                }
                return response || $q.when(response);
            }
        };
    })
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('loading');
    })
    // inject the router instance into a `run` block by name
    .run(function ($uiRouter, $trace, $location) {
        /** uncomment this to enable the visualizer
        var pluginInstance = $uiRouter.plugin(Visualizer);**/
        // $trace.enable('TRANSITION');
    }).run(function ($rootScope, LoadingProgress) {
        $rootScope.$on('$stateChangeError', console.log.bind(console));
        // this handles the loading-state app-wide
        LoadingProgress.watchTransitions();
    })
    .run(function ($rootScope) {
        $rootScope.$on('$stateChangeError', console.log.bind(console));
    })
    .run(function () {
        angular.element(document.getElementById('bootstrap-app')).removeClass('hidden');
        angular.element(document.getElementById('bootstrap-loading')).addClass('hidden');
    });
