module.exports = require('webrtc-core').bdsft.Model(XSI, {
  config: require('../../js/config')
});

var Utils = require('webrtc-core').utils;
var jQuery = require('jquery');
// Running in NodeJS
if (typeof window === 'undefined') {
  var domino = require('domino');
  jQuery = require('jquery')(domino.createWindow());
  jQuery.ajaxSettings.xhr = function(){
    var XMLHttpRequest = require('xhr2');
    return new XMLHttpRequest();
  };
}

var Q = require('q');
var parseString = require('xml2js').parseString;

function XSI(debug) {
  var self = {};

  self.props = ['xspUrl'];

  var nextXspUrl = function() {
    var nextIndex = 0;

    if(self.xspUrl) {
      for(var i = 0; i < self.xspHosts.length; i++) {
        xspHost = self.xspHosts[i];
        if(self.xspUrl.indexOf(xspHost) !== -1){
          nextIndex = i+1;
          if (nextIndex >= self.xspHosts.length) {
            nextIndex = 0;
          }
          break;
        }
      }
    }

    return self.protocol + '://' + self.xspHosts[nextIndex]+':'+self.port;
  };

  var Request = function(options){
    options = options || {};
    self.xspUrl = self.xspUrl || nextXspUrl();
    var result = {
      url: self.xspUrl,
      path: options.path || '/',
      type: options.type || 'GET',
      data: options.data || {}
    };
    if(options.user && options.password) {
      result.username = options.user;
      result.password = options.password;
      result.headers = {
           'Authorization': 'Basic ' + new Buffer(options.user + ':' + options.password).toString('base64'),
           'content-type': 'text/plain'
      };
    }
    result.abort = function(){
      result.xhr && result.xhr.abort();
    };
    return result;
  };

  var ensureDomain = function(value){
    return value.match(/.*@.*/) || (value + '@' + self.domain);
  };
  var send = function(request){
    if(!self.enabled) {
      return Q.reject('XSI disabled');
    }
    var url = request.url+request.path
    debug.info('requesting... : ' + url+ ' : '+JSON.stringify(request.data));
    var deferred = Q.defer();
    jQuery.support.cors = true;
    try{
      var xhr = jQuery.ajax({
        type: request.type,
        url: url,
        data: request.data,
        dataType: 'text',
        cache: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Authorization", "Basic "+new Buffer(request.username + ':' + request.password).toString('base64'));
        }
      }).done(function(result){
        debug.log(result);
        parseString(result, {explicitArray: false}, function (err, resultJson) {
          debug.log('response json : ' + JSON.stringify(resultJson));
          deferred.resolve(resultJson);
        });
      }).fail(function(err){
        if(err.statusText !== 'abort') {
          console.error("error : " + JSON.stringify(err));
          self.xspUrl = nextXspUrl();
          debug.log('next xsp url : '+self.xspUrl);
          deferred.reject(JSON.stringify(err));
        } else {
          deferred.reject();
        }
      });
      request.xhr = xhr;
    } catch(e) {
      debug.error(JSON.stringify(e));
    }
    return deferred.promise;
  };

  self.connect = function(user, password) {
    var client = {};
    
    user = ensureDomain(user);

    var requests = {};

    var actionRequest = function(opts){
      opts.user = user;
      opts.password = password;
      opts.path = '/com.broadsoft.xsi-actions/v2.0/'+opts.path;
      var request = Request(opts);
      if(requests[opts.path]){
        requests[opts.path].abort();
      }
      requests[opts.path] = request;

      return send(request).then(function(res){
        delete requests[opts.path];
        return res;
      });
    }

    var userRequest = function(opts){
      opts.path = 'user/'+user+'/'+ opts.path;
      return actionRequest(opts);
    }

    var userDirectories = function(opts){
      opts.path = 'directories/' + opts.path;
      return userRequest(opts);
    }
    
    var userProfile = function(opts){
      opts = opts || {};
      opts.path = 'profile' + (opts.path ? '/'+opts.path : '');
      return userRequest(opts);
    }

    client.userDirectoryEnterprise = function(params){
      return userDirectories({path:'Enterprise', data: params}).then(function(res){
        return res.Enterprise;
      });
    };

    client.userProfile = function(params){
      return userProfile().then(function(res){
        return res.Profile;
      });
    };

    client.userAccessDevices = function(params){
      return userProfile({path:'Device', data: params}).then(function(res){
        return res.AccessDevices.accessDevice;
      });
    };

    return client;
  }

  return self;
}