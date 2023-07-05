const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Rota para servir o arquivo HTML do cliente
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Lista para armazenar os usuários conectados em cada sala
const users = {};

// Evento de conexão do socket.io
io.on('connection', (socket) => {
  console.log('Nova conexão: ' + socket.id);

  // Evento para lidar com a entrada de um novo usuário em uma sala específica
  socket.on('join', (roomName) => {
    socket.join(roomName);

    if (!users[roomName]) {
      users[roomName] = [socket.id];
    } else {
      users[roomName].push(socket.id);
    }

    const otherUser = users[roomName].find(id => id !== socket.id);
    if (otherUser) {
      socket.emit('other-user', otherUser);
      socket.to(otherUser).emit('user-connected', socket.id);
    }
  });

  // Evento para lidar com o envio de sinalização de oferta
  socket.on('offer', (offer, roomName) => {
    socket.to(roomName).emit('offer', offer, socket.id);
  });

  // Evento para lidar com o envio de sinalização de resposta
  socket.on('answer', (answer, roomName) => {
    socket.to(roomName).emit('answer', answer, socket.id);
  });

  // Evento para lidar com o envio de sinalização de candidato ICE
  socket.on('ice-candidate', (candidate, roomName) => {
    socket.to(roomName).emit('ice-candidate', candidate, socket.id);
  });

  // Evento para desconectar o usuário
  socket.on('disconnect', () => {
    for (const roomName in users) {
      const index = users[roomName].indexOf(socket.id);
      if (index !== -1) {
        users[roomName].splice(index, 1);
        const otherUser = users[roomName][0];
        if (otherUser) {
          socket.to(otherUser).emit('user-disconnected', socket.id);
        }
      }
    }
  });
});

// Inicie o servidor
const port = 3000;
server.listen(port, () => {
  console.log('Servidor iniciado na porta ' + port);
});
