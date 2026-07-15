const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*" // Prevents browser CORS blocks during local testing
  }
});

// Serve frontend files explicitly using absolute pathing
app.use(express.static(path.join(__dirname, 'public')));
     
// Keep track of who is occupying the slots
let playerX_Id = null;
let playerO_Id = null;

io.on('connection', (socket) => {
  console.log(`User connected to network: ${socket.id}`);

  socket.on('joinGame', (roomName) => {
    socket.join(roomName);

    let assignedSymbol = 'Spectator';

    // Assign slots based on vacancy
    if (!playerX_Id) {
      playerX_Id = socket.id;
      assignedSymbol = 'X';
    } else if (!playerO_Id) {
      playerO_Id = socket.id;
      assignedSymbol = 'O';
    }

    console.log(`User [${socket.id.substring(0,4)}] assigned role: [${assignedSymbol}]`);

    socket.emit('playerAssigned', {
      symbol: assignedSymbol,
      turn: 'X'
    });
  });

  socket.on('makeMove', (data) => {
    socket.to(data.room).emit('moveMade', data);
  });

  // CRITICAL FIX: Clear out the slots when a player disconnects/refreshes
  socket.on('disconnect', () => {
    if (socket.id === playerX_Id) {
      console.log(`Player X (${socket.id.substring(0,4)}) vacated slot.`);
      playerX_Id = null;
    } else if (socket.id === playerO_Id) {
      console.log(`Player O (${socket.id.substring(0,4)}) vacated slot.`);
      playerO_Id = null;
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Game server running cleanly on http://localhost:${PORT}`);
});
