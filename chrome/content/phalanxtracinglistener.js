function GalaxytoolbarPhalanxTracingListener() {
	this.originalListener = null;
	this.receivedData = [];
}
	
GalaxytoolbarPhalanxTracingListener.prototype = {
	onDataAvailable: function(request, context, inputStream, offset, count) {
		var binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci["nsIBinaryInputStream"]);
		var storageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci["nsIStorageStream"]);
		var binaryOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci["nsIBinaryOutputStream"]);

		binaryInputStream.setInputStream(inputStream);
		storageStream.init(8192, count, null);
		binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));

		// Copy received data as they come.
		var data = binaryInputStream.readBytes(count);
		this.receivedData.push(data);

		// and write the data back again
		binaryOutputStream.writeBytes(data, count);

		this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), offset, count);
	},

	onStartRequest: function(request, context) {
		this.originalListener.onStartRequest(request, context);
	},

	onStopRequest: function(request, context, statusCode) {
		galaxytoolbar.GTPlugin_fleet_movement.save_all_arrival_times(this.receivedData.join(),request.URI.host);
		this.originalListener.onStopRequest(request, context, statusCode);
	},

	QueryInterface: function (aIID) {
		if (aIID.equals(Ci.nsIStreamListener) ||
			aIID.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_NOINTERFACE;
	}
};