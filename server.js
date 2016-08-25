'use strict';

var express = require('express');
var routes = require('./app/routes/index.js');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

require('dotenv').load();

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));

routes(app, io);

server.listen(process.env.PORT);
console.log('The server is running with websockets on port ' + process.env.PORT + '...');