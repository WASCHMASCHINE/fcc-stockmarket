'use strict';
/* global $,ajaxFunctions, appUrl, io*/

function plotLines(data) {
    // Lines
    $.plot($('#graph-lines'), data, {
        series: {
            points: {
                show: false,
                radius: 5
            },
            lines: {
                show: true
            },
            shadowSize: 0
        },
        grid: {
            color: '#646464',
            borderColor: 'transparent',
            borderWidth: 1,
            hoverable: true
        },
        xaxis: {
          //  tickColor: 'transparent',
            tickDecimals: 0,
            tickSize: 30,
        },
        yaxis: {
            tickSize: 50
        }
    });
}

function showTooltip(x, y, contents) {
   $('<div id="tooltip">' + contents + '</div>').css({
        top: y - 16,
        left: x + 20
    }).appendTo('body').fadeIn();
}

function addGraphInfo(data){
    for (var graphObject in data){
        var jq = $('<a href="api/remove_stock/' + data[graphObject]["name"] + '" class="visitors"></a>').html(data[graphObject]["name"]);
        jq.css("border-bottom", "8px solid " + data[graphObject]["color"]);
        $(".graph-info").append(jq);

    }
}

function rgb2hex(red, green, blue) {
        var rgb = blue | (green << 8) | (red << 16);
        return '#' + (0x1000000 + rgb).toString(16).slice(1)
}
  
function parseStockDataToGraph(stocks){
    var graphData = [];
    
    for (var i=0; i<stocks.length; ++i){
        var stock = stocks[i];
        var graphObject = {};
   
        graphObject["name"] = stock.stock_name;
        graphObject["color"] = rgb2hex(
            stock.stock_name.charCodeAt(0)*53 % 255 + 25,
            stock.stock_name.charCodeAt(1)*17 % 255 + 25, 
            stock.stock_name.charCodeAt(1)*13 % 255 + 25);
        var parsedData = []; 
        var lastDate = Date.parse(stock.stock_data[0][0]);
        for (var j=1; j<stock.stock_data.length; ++j){
            var thisDate = Date.parse(stock.stock_data[j][0]);
            var diffDate = thisDate - lastDate;
            var x = diffDate / (60*60*24*1000); 
            var y = parseFloat(stock.stock_data[j][1]).toFixed(2);
            parsedData.push([x, y]);
        }
        graphObject["data"] = parsedData;
        graphData.push(graphObject);
    }

    console.log(graphData)
    return graphData;
}

function replot(data){
    $(".graph-info").empty();
    var parsedData = parseStockDataToGraph(data);
    addGraphInfo(parsedData);
    plotLines(parsedData);
}

function reloadStocks(){
    // Load stocks
    ajaxFunctions.ajaxRequest('GET', appUrl + "/api/get_stocks/", function(response){
        var jsonData = JSON.parse(response);
        replot(jsonData);
    });
}

(function () {
    var previousPoint = null;
    $('#graph-lines').bind('plothover', function (event, pos, item) {
        if (item) {
            if (previousPoint != item.dataIndex) {
                previousPoint = item.dataIndex;
                $('#tooltip').remove();
                var x = item.datapoint[0];
                var y = item.datapoint[1];
                showTooltip(item.pageX, item.pageY, "Opened at " + y + '$, ' + Math.abs(x) + ' days ago');
            }
        } else {
            $('#tooltip').remove();
            previousPoint = null;
        }
    });
    
    $(document).ready(function () {
        var socket = io.connect();
        
        socket.on('broadcast_reload_stocks', function(data){
            replot(data);
        });
        
        
        $("#addStockBar").focus();
    	$("#addStockBar").on('keydown', function(evt){
            if (evt.which == 13){
                var stockString = $("#addStockBar").val();
                ajaxFunctions.ajaxRequest('GET', appUrl + "/api/add_stock/" + stockString, function(response){ });
                return false;
            }
        });
        
        reloadStocks();
	});
	

})();