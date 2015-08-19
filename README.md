# XSI

Request through XSI.

Namespace : bdsft_webrtc.default.xsi

## Configuration
<a name="configuration"></a>

Property                 |Type     |Default                                                              |Description
-------------------------|---------|---------------------------------------------------------------------|------------------------------------------------------------
enabled                  |boolean  |true                                                                 |True if XSI is enabled
domain        			|string  |broadsoftlabs.com 								                   |Domain for the XSI requests
xspHosts        		|array  |['xsp1.broadsoftlabs.com', 'xsp2.broadsoftlabs.com']                    |URLs of the XSP hosts


## Method
<a name="method"></a>

Method   |Parameters  |Description
---------|------------|-----------------------------
request(xsiUser, xsiPassword)  | xsiUser : string, xsiPassword : string            |Sends a XSI actions request. 
