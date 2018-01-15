require('dotenv').config();

import express from 'express';
import SocketIO from 'socket.io';
import { Server } from 'http';
const port = process.env.PORT;
const app = express();
const server = Server(app);
const io = new SocketIO(server);


let users = [];

io.on('connection', (socket) => {
	const { userId } = socket.handshake.query;
	
	socket.emit('USER_LIST_UPDATED', users);
	
	socket.on('disconnect', () => {
		users = [ ...users.filter(user => user.id !== userId) ];
		socket.broadcast.emit('USER_LIST_UPDATED', users);
	});

	socket.on('USER_CONNECTED', (payload) => {
		users = [ ...users.filter(user => user.id !== payload.user.id), payload.user ];
		socket.broadcast.emit('USER_LIST_UPDATED', users);
	});

	socket.on('USER_NICK_UPDATED', (payload) => {
		const updatedUserList = users.map(user => {
			if (user.id === userId) {
				return { id: userId, nick: payload.newNick };
			}
			return user;
		});
		
		socket.broadcast.emit('USER_LIST_UPDATED', updatedUserList);
	});

	socket.on('USER_THINKED', (user) => {
		socket.broadcast.emit('USER_THINKED', user);
	});
	socket.on('USER_OOPSED', (user) => {
		socket.broadcast.emit('USER_OOPSED', user);
	});

	socket.on('USER_SENT_MESSAGE', (message) => {
		socket.broadcast.emit('USER_RECEIVED_MESSAGE', message);
	});
	
	socket.on('IS_TYPING', () => {
		socket.broadcast.emit('IS_TYPING_SIGNAL_RECEIVED', userId);
	});
	socket.on('TYPING_STOPPED', () => {
		socket.broadcast.emit('IS_NOT_TYPING_SIGNAL_RECEIVED', userId);
	});
});

server.listen(port, () => {
    console.log('[INFO] Listening on *:' + port);
});
