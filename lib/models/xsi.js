module.exports = require('webrtc-core').bdsft.Model(XSI, {
  config: require('../../js/config')
});

var Utils = require('webrtc-core').utils;
var jQuery = require('jquery');
var Q = require('q');
var parseString = require('xml2js').parseString;

function XSI(debug) {
  var self = {};

  self.currentHost;

  var getNextHost = function() {
    var index = self.xspHosts.indexOf(self.currentHost);
    var nextIndex = index === -1 ? 0 : index + 1;
    if (nextIndex >= self.xspHosts.length) {
      nextIndex = 0;
    }
    return self.xspHosts[nextIndex];
  };

  var Request = function(options){
    options = options || {};
    self.currentHost = self.currentHost || getNextHost();
    var result = {
      host: self.currentHost,
      port: self.port,
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
    var url = 'https://'+request.host+':'+request.port+request.path
    debug.info('requesting... : ' + url+ ' : '+JSON.stringify(request.data));
    jQuery.support.cors = true;
    var deferred = Q.defer();
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
      parseString(result, {explicitArray: false}, function (err, resultJson) {
        debug.log('response json : ' + JSON.stringify(resultJson));
        deferred.resolve(resultJson);
      });
    }).fail(function(err){
      if(err.statusText !== 'abort') {
        console.error("error : " + JSON.stringify(err));
        self.currentHost = getNextHost();
        deferred.reject(err);
      } else {
        deferred.reject();
      }
    });
    request.xhr = xhr;
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