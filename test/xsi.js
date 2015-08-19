var test = require('../node_modules/webrtc-core/test/includes/common');
var extend = require('extend');
var chai = require("chai");
chai.use(require("chai-as-promised"));
var should = chai.should();

describe('xsi', function() {

  before(function() {
    test.createModelAndView('xsi', {
        xsi: require('../')
    });
    config = require('./config/default.json');
    try {
      extend(config, require('./config/test.json'));
    } catch(e) {}
  });

  describe('connect', function(){
    before(function(){
      xsi.enabled = true;
      client = xsi.connect(config.user, config.password);
    });

    it('userDirectoryEnterprise', function() {
      return client.userDirectoryEnterprise().should.eventually.have.property('totalAvailableRecords').above(0);
    });

    it('userDirectoryEnterprise with search params', function() {
      return client.userDirectoryEnterprise({impId: '*broadsoftlabs.com*'}).should.eventually.have.property('totalAvailableRecords').above(0);
    });

    it('userDirectoryEnterprise with not matching search params', function() {
      return client.userDirectoryEnterprise({emailAddress: 'notexisting@test.com'}).should.eventually.have.property('totalAvailableRecords').equal('0');
    });
  })
});