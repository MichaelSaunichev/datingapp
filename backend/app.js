var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();
const port = 3000;
const ip = '192.168.1.19';


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');


var app = express();
app.use(cors());

const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);

// socket
io.on('connection', (socket) => {

  socket.on('sendMessage', ({ theUserId }) => {
    io.emit('message', { theUserId });
  });

  socket.on('updateChats', ({ theUserId1, theUserId2, func }) => {
    io.emit('updateTheChats', { theUserId1, theUserId2, func });
  });

  socket.on('newMessage', ({ senderId, recipientId }) => {
    io.emit('theNewMessage', { senderId, recipientId });
  });

  socket.on('sendLike', ({ updatedMessage, theUserId }) => {
    io.emit('like', { updatedMessage, theUserId });
  });

  socket.on('disconnect', () => {
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

server.listen(port, ip, () => {
  console.log(`Server is running at http://${ip}:${port}`);
});


module.exports = app;