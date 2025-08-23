const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// Store todos and connected users
let todos = []
let connectedUsers = new Set()

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Send current todos to newly connected user
  socket.emit('todoUpdate', todos)

  // Handle user joining
  socket.on('userJoin', (username) => {
    socket.username = username
    connectedUsers.add(username)
    io.emit('usersUpdate', Array.from(connectedUsers))
    console.log(`${username} joined the todo list`)
  })

  // Handle todos update
  socket.on('todosUpdate', (updatedTodos) => {
    todos = updatedTodos
    // Broadcast to all other clients
    socket.broadcast.emit('todoUpdate', todos)
    console.log('Todos updated:', todos.length, 'items')
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.username) {
      connectedUsers.delete(socket.username)
      io.emit('usersUpdate', Array.from(connectedUsers))
      console.log(`${socket.username} left the todo list`)
    }
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Todo sync server running on port ${PORT}`)
  console.log(`📝 Connect your React app to http://localhost:${PORT}`)
})
