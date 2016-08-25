'use strict';
var request = require("request");
var path = process.cwd();

module.exports = function (app, io) {
	var stock_arr = ['AAPL', 'YHOO', "DIS", "TEX", "BAC"];

	io.sockets.on('connection', function(socket) {
	    socket.on('add_stock', function(data) {
	        console.log("on server - add stock", data);
	        io.sockets.emit('broadcast_reload_stocks', data);
	    });
	    
	    socket.on('remove_stock', function(data) {
	        console.log("on server - remove stock", data);
	        io.sockets.emit('broadcast_reload_stocks', data);
	    });
	});

	function getJsonStockDataFromYahoo(res){
		console.log(stock_arr);
		var year = new Date().getFullYear();
		var completed_requests = 0;
		var responses = {};
		for (var i =0; i< stock_arr.length; ++i){
			var stock_url = "http://ichart.finance.yahoo.com/table.csv?s=" + stock_arr[i] + "&a=00&b=01&c=" + year;
			request(stock_url, function(error, response, body) {
				var path = response.request.req.path;
				var stockName = path.substr(13,path.length).split("&")[0]; // extract name again bc losing scope
				responses[stockName] = body;
				completed_requests++;
				if (completed_requests == stock_arr.length){ // Last request done!
					var allStockData = [];
					for (var key in responses){ // loop through keys
						var jsonObject = {};
						var arr = [];
						
						var row_arr = responses[key].split("\n");
						for (var k = 1; k< row_arr.length - 1; ++k){ // -1 because of empty \n at the end
							var csvRow = row_arr[k].split(",");
							arr.push([csvRow[0], csvRow[1]]);
						}
						jsonObject["stock_name"] = key;
						jsonObject["stock_data"] = arr;
						allStockData.push(jsonObject);
					}
					if (res){
						res.json(allStockData);
					} else {
						return allStockData;
					}
				}
			});
		}
	}
	
	function getJsonStockDataFromYahooAndEmit(){
		console.log(stock_arr);
		var year = new Date().getFullYear();
		var completed_requests = 0;
		var responses = {};
		for (var i =0; i< stock_arr.length; ++i){
			var stock_url = "http://ichart.finance.yahoo.com/table.csv?s=" + stock_arr[i] + "&a=00&b=01&c=" + year;
			request(stock_url, function(error, response, body) {
				var path = response.request.req.path;
				var stockName = path.substr(13,path.length).split("&")[0]; // extract name again bc losing scope
				responses[stockName] = body;
				completed_requests++;
				if (completed_requests == stock_arr.length){ // Last request done!
					var allStockData = [];
					for (var key in responses){ // loop through keys
						var jsonObject = {};
						var arr = [];
						
						var row_arr = responses[key].split("\n");
						for (var k = 1; k< row_arr.length - 1; ++k){ // -1 because of empty \n at the end
							var csvRow = row_arr[k].split(",");
							arr.push([csvRow[0], csvRow[1]]);
						}
						jsonObject["stock_name"] = key;
						jsonObject["stock_data"] = arr;
						allStockData.push(jsonObject);
					}

					io.sockets.emit('broadcast_reload_stocks',allStockData);
				}
			});
		}
	}
	
	app.route('/')
		.get(function (req, res) {
			res.sendFile(path + '/public/index.html');
		});
	
	app.route('/api/add_stock/*')
		.get(function(req, res){
			var stockName = req.params[0];
			// 1. Check if it is already in the array
			if (stock_arr.indexOf(stockName) == -1){
				// 2. Check if it exists
				var stock_url = "http://ichart.finance.yahoo.com/table.csv?s=" + stockName;
				request(stock_url, function(error, response, body) {
					if (response.statusCode == 200){
						stock_arr.push(stockName);
						getJsonStockDataFromYahooAndEmit(); // UGLY
						//io.sockets.emit('broadcast_reload_stocks', );
					}
					res.end();
				});
			} else {
				res.end();
			}

		});
		
	app.route('/api/remove_stock/*')
		.get(function(req, res){
			var stockName = req.params[0];
			if (stock_arr.indexOf(stockName) != -1){
				stock_arr.splice(stock_arr.indexOf(stockName),1);
				getJsonStockDataFromYahooAndEmit();
				res.redirect("/../../");
			} else {
				res.redirect("/../../");
			}

		});
	
	app.route('/api/get_stocks/')
		.get(function(req, res){
			getJsonStockDataFromYahoo(res);
		});
};
