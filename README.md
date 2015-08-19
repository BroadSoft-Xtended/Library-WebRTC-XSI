# XSI

Request through XSI.

Namespace : bdsft_webrtc.default.xsi

## Configuration
<a name="configuration"></a>

Property                 |Type     |Default                                                              |Description
-------------------------|---------|---------------------------------------------------------------------|------------------------------------------------------------
enabled                  |boolean  |true                                                                 |True if XSI is enabled
domain        			|string  |broadsoftlabs.com 								                   |Domain for the XSI requests
port 					|number  |443																	|Port of the XSP hosts to connect to.
xspHosts        		|array  |['xsp1.broadsoftlabs.com', 'xsp2.broadsoftlabs.com']                    |URLs of the XSP hosts


## Method
<a name="method"></a>

Method   |Parameters  |Description
---------|------------|-----------------------------
connect(user, password)  | user : string, password : string            |Returns a client to trigger the XSI actions requests on. 
userDirectoryEnterprise(params)  | params : object            |Gets the user's enterprise directory and can be filtered through the URL parameters as search criterias. 
userAccessDevices(params)  | params : object            |Gets the user's access devices. 
