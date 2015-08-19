module.exports = require('webrtc-core').bdsft.Model(XSI, {
  config: require('../../js/config')
});

var Utils = require('webrtc-core').utils;
var http = require('http');
var https = require('https');
var jQuery = require('jquery');
var Q = require('q');
var parseString = require('xml2js').parseString;
var Hashes = require('jshashes');

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

  var requestOpts = function(options){
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
    return result;
  };

  var ensureDomain = function(value){
    return value.match(/.*@.*/) || (value + '@' + self.domain);
  };
  var request = function(opts){
    if(!self.enabled) {
      return Q.reject('XSI disabled');
    }
    var url = 'https://'+opts.host+':'+opts.port+opts.path
    debug.info('requesting... : ' + url+ ' : '+JSON.stringify(opts.data));
    jQuery.support.cors = true;
    var deferred = Q.defer();
    jQuery.ajax({
      type: opts.type,
      url: url,
      data: opts.data,
      dataType: 'text',
      cache: false,
      beforeSend: function (xhr) {
        xhr.setRequestHeader("Authorization", "Basic "+new Buffer(opts.username + ':' + opts.password).toString('base64'));
      }
    }).done(function(result){
      parseString(result, {explicitArray: false}, function (err, resultJson) {
        debug.log('response json : ' + JSON.stringify(resultJson));
        deferred.resolve(resultJson);
      });
    }).fail(function(err){
      console.error("error : " + JSON.stringify(err));
      self.currentHost = getNextHost();
      deferred.reject(err);
    });
    return deferred.promise;
  };

  self.connect = function(user, password) {
    var client = {};
    
    user = ensureDomain(user);

    var actionRequest = function(opts){
      opts.user = user;
      opts.password = password;
      opts.path = '/com.broadsoft.xsi-actions/v2.0/'+opts.path;
      return request(requestOpts(opts));
    }

    var userRequest = function(opts){
      opts.path = 'user/'+user+'/'+ opts.path;
      return actionRequest(opts);
    }

    var userDirectories = function(opts){
      opts.path = 'directories/' + opts.path;
      return userRequest(opts);
    }

    client.userDirectoryEnterprise = function(params){
      return userDirectories({path:'Enterprise', data: params}).then(function(res){
        return res.Enterprise;
      });
    };

    return client;
  }

  return self;
}