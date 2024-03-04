// index.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = createServer(app);
const io = new Server(server);

const supabaseUrl = 'https://zqjmkicfcolipzkqvslv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxam1raWNmY29saXB6a3F2c2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg4NjA2MDYsImV4cCI6MjAyNDQzNjYwNn0.okYMPvmrR8ftOXIyHYIJ2DQ-Tk2ZfVZhHXMM6cBmaVk';
const supabase = createClient(supabaseUrl, supabaseKey);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

// gets
app.get('/', (req, res) => {
  res.render('init');
});

app.get('/create-room', (req, res) => {
  res.render('create-room');
});

app.get('/join-room', (req, res) => {
  res.render('join-room');
});

app.get('/admin-ui/:username', async (req, res) => {
  const { username } = req.params;

  // Check if the table exists, if not, create it
  await createTableIfNotExists(username);

  res.render('admin-ui', { username });
});

app.get('/join-ui/:username', async (req, res) => {
  const { username } = req.params;

  // Check if the table exists, if not, redirect to an error page or handle accordingly
  const tableExists = await checkTableExists(username);
  if (!tableExists) {
    // Redirect to an error page or handle accordingly
    res.redirect('/');
    return;
  }

  res.render('join-ui', { username });
});

// posts
// posts
app.post('/create-room', async (req, res) => {
    const { username } = req.body;
  
    // Check if the table exists, if not, create it
    await createTableIfNotExists(username);
  
    // Generate the URL for the created room
    const roomUrl = `http://localhost:3000/join-room?username=${username}&url=${username}`;
  
    // Print the URL to the server-side CLI
    console.log(`Room URL: ${roomUrl}`);
  
    // Redirect to admin UI
    res.redirect(`/admin-ui/${username}`);
  });
  

app.post('/join-room', async (req, res) => {
  const { username, url } = req.body;

  // Check if the table exists, if not, redirect to an error page or handle accordingly
  const tableExists = await checkTableExists(url);
  if (!tableExists) {
    // Redirect to an error page or handle accordingly
    res.redirect('/');
    return;
  }

  // Redirect to join UI
  res.redirect(`/join-ui/${username}`);
});

// Your Socket.IO logic and other routes...

async function createTableIfNotExists(table_name) {
    // Create the query to create a new table with a predefined schema
    const query = `CREATE TABLE IF NOT EXISTS ${table_name} (id SERIAL PRIMARY KEY, username TEXT NOT NULL, message TEXT NOT NULL)`;
  
    // Execute the query
    await supabase.rpc('create_new_table', { table_name: table_name });
  }
  

async function checkTableExists(table_name) {
  // Check if the table exists
  const { data, error } = await supabase
    .from('rooms')
    .select()
    .eq('room_name', table_name)
    .single();

  return data !== null;
}






// Add these lines in index.js
const rooms = {}; // To store room data and socket connections

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle joining room
  socket.on('join-room', (data) => {
    const { room, username } = data;
    socket.join(room);

    // Store room data
    if (!rooms[room]) {
      rooms[room] = [];
    }
    rooms[room].push(username);

    // Broadcast to all clients in the room
    io.to(room).emit('message', `${username} has joined the room`);
  });

  // Handle sending messages
  socket.on('send-message', (data) => {
    const { room, username, message } = data;

    // Broadcast to all clients in the room
    io.to(room).emit('message', `${username}: ${message}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');

    // Remove user from rooms data
    for (const room in rooms) {
      const index = rooms[room].indexOf(socket.username);
      if (index !== -1) {
        rooms[room].splice(index, 1);
        io.to(room).emit('message', `${socket.username} has left the room`);
      }
    }
  });
});

app.post('/send-message', async (req, res) => {
  const { username, message } = req.body;

  // Broadcast the message to all clients in the room
  io.to(username).emit('message', message);

  // You can also store the message in the Superbase table here

  res.redirect(`/admin-ui/${username}`);
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
