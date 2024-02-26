// index.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

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

  // Generate the URL for the created room
  const roomUrl = `http://localhost:3000/join-room?username=${username}&url=${username}`;

  res.render('admin-ui', { username, roomUrl });
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

app.post('/create-room', async (req, res) => {
  const { username } = req.body;

  // Generate a valid UUID for room_creator_id
  const roomCreatorId = uuidv4();

  // Create a row for the room with essential information
  const roomData = {
    room_url: `http://localhost:3000/join-room?username=${username}&url=${username}`,
    room_creator_username: username,
    room_creator_id: roomCreatorId,
    joiners: JSON.stringify({}), // Empty for now, will be updated when joiners join
  };

  // Store the room data in the Supabase table
  const { data: createdRoom, error } = await supabase
    .from('rooms')
    .upsert([roomData], { returning: ['*'] });

  if (error) {
    console.error(error);
    res.status(500).send('Error creating room');
    return;
  }

  // Redirect to admin UI with the generated URL
  res.redirect(`/admin-ui/${username}`);
});





  



app.post('/join-room', async (req, res) => {
  const { username, url } = req.body;

  try {
    // Get the existing room data using the room_url
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_url', url)
      .single();

    if (roomError) {
      throw new Error(`Error fetching room data: ${roomError.message}`);
    }

    // Parse the joiners column data
    const joinersData = JSON.parse(roomData.joiners);

    // Add a dummy joiner to the joinersData
    const dummyJoinerKey = `dummy_${new Date().getTime()}`;
    joinersData[dummyJoinerKey] = {
      joined_at: new Date().toISOString(),
      messages: [`${username} joined the room.`], // Add a message for the dummy joiner
    };

    // Update the joiners column in the Supabase table using the room_url
    const { data: updatedRoom, updateError } = await supabase
      .from('rooms')
      .update({ joiners: JSON.stringify(joinersData) }) // Update the joiners column
      .eq('room_url', url)
      .single();

    if (updateError) {
      throw new Error(`Error updating room data: ${updateError.message}`);
    }

    // Redirect to join UI
    res.redirect(`/join-ui/${username}`);
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}`);
  }
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






const rooms = {}; // To store room data and socket connections

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle joining room
  socket.on('join-room', (data) => {
    const { room, username } = data;
    socket.join(room);

    // Store room data (removed table creation logic)

    // Broadcast to all clients in the room
    io.to(room).emit('message', `${username} has joined the room`);
  });

  // Handle sending messages
  socket.on('send-message', (data) => {
    const { room, username, message } = data;

    // Broadcast to all clients in the room
    io.to(room).emit('message', `${username}: ${message}`);
  });

  // Handle disconnect (removed unnecessary table handling)
});


app.post('/send-join-message', async (req, res) => {
  const { username, joinMessage } = req.body;

  // Store the join message in the Superbase table
  const { data, error } = await supabase
    .from(username)
    .upsert([{ username, message: joinMessage }], { returning: ['*'] });

  if (error) {
    console.error(error);
    res.status(500).send('Error storing join message');
    return;
  }

  // Broadcast the join message to all clients in the room
  io.to(username).emit('join-message', `${username}: ${joinMessage}`);

  res.redirect(`/join-ui/${username}`);
});

app.post('/send-message', async (req, res) => {
  const { username, message } = req.body;

  // Store the message in the Superbase table
  const { data, error } = await supabase
    .from(username)
    .upsert([{ username, message }], { returning: ['*'] });

  if (error) {
    console.error(error);
    res.status(500).send('Error storing message');
    return;
  }

  // Broadcast the message to all clients in the room
  io.to(username).emit('message', `${username}: ${message}`);

  res.redirect(`/admin-ui/${username}`);
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

