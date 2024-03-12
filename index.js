// index.js
const express = require('express');
const { createServer } = require('http');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');

const app = express();
const server = createServer(app);

app.use(bodyParser.urlencoded({ extended: true })); // Use body-parser middleware
app.use(bodyParser.json()); // Parse JSON bodies

const supabaseUrl = 'https://zqjmkicfcolipzkqvslv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxam1raWNmY29saXB6a3F2c2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg4NjA2MDYsImV4cCI6MjAyNDQzNjYwNn0.okYMPvmrR8ftOXIyHYIJ2DQ-Tk2ZfVZhHXMM6cBmaVk';
const supabase = createClient(supabaseUrl, supabaseKey);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
const sseClients = [];

app.use((req, res, next) => {
  res.sseSetup = () => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  };

  res.sseSend = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  next();
});

app.get('/sse', (req, res) => {
  res.sseSetup();

  // Add the new client to the clients array
  sseClients.push(res);

  // Remove the client when the connection is closed
  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

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

  try {
    // Fetch the room data for the specified username
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_creator_username', username)
      .single();

    if (roomError) {
      throw new Error(`Error fetching room data: ${roomError.message}`);
    }

    // Render the admin-ui.ejs with the entire room row data
    res.render('admin-ui', { username, roomData });
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.get('/join-ui/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Fetch the room data using the provided username
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_creator_username', username)
      .single();

    if (roomError) {
      throw new Error(`Error fetching room data: ${roomError.message}`);
    }

    // Render the join-ui.ejs with the entire room row data
    res.render('join-ui', { username, roomData });
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}`);
  }
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

    // Check if the username already exists in joinersData
    if (joinersData.hasOwnProperty(username)) {
      // If the username exists, retrieve messages
      const userMessages = joinersData[username].messages;

      // Render the join-ui.ejs with existing user data
      res.render('join-ui', { username, userMessages, roomData });

      // Notify all clients about the new joiner
      // Notify all clients about the new joiner with username and URL

      console.log(url);
      sseClients.forEach(client => {
        client.sseSend({ action: 'newJoiner', username, url });
      });

    } else {
      // If the username doesn't exist, create a new entry
      // Create a unique key for the new joiner
      const joinerKey = `${username}`;

      // Add the new joiner to the joinersData with an empty array for messages
      joinersData[joinerKey] = {
        joined_at: new Date().toISOString(),
        messages: [],
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

      // Render the join-ui.ejs with new user data
      res.render('join-ui', { username, userMessages: [], roomData });

      // Notify all clients about the new joiner
      sseClients.forEach(client => {
        client.sseSend({ action: 'newJoiner', username });
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post('/send-join-message', async (req, res) => {
  try {
    const { username, joinMessage, roomData } = req.body;

    // Parse the roomData JSON string back to an object
    const parsedRoomData = JSON.parse(roomData);

    // Retrieve the existing room data using the room_url
    const { data: roomDataFromSupabase, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_url', parsedRoomData.room_url)
      .single();

    if (roomError) {
      throw new Error(`Error fetching room data from Supabase: ${roomError.message}`);
    }

    // Parse the joiners column data
    const joinersData = JSON.parse(roomDataFromSupabase.joiners);

    // Check if the username already exists in joinersData
    if (joinersData.hasOwnProperty(username)) {
      // Update the messages array for the specific user
      joinersData[username].messages.push(joinMessage);

      // Update the joiners column in the Supabase table using the room_url
      const { data: updatedRoom, updateError } = await supabase
        .from('rooms')
        .update({ joiners: JSON.stringify(joinersData) }) // Update the joiners column
        .eq('room_url', parsedRoomData.room_url)
        .single();

      if (updateError) {
        throw new Error(`Error updating room data in Supabase: ${updateError.message}`);
      }

      // Broadcast the updated joiners structure to all clients
      const updatedJoinersStructure = createJoinersStructure(joinersData);
      broadcastToClients({
        action: 'updateJoiners',
        joinersStructure: updatedJoinersStructure,
        url: parsedRoomData.room_url,
        roomCreator: parsedRoomData.room_creator_username,
      });

      // Render the join-ui.ejs with updated user data
      res.render('join-ui', { username, userMessages: joinersData[username].messages, roomData: parsedRoomData });

    } else {
      throw new Error(`User ${username} not found in joinersData`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing message');
  }
});

app.post('/send-admin-message', async (req, res) => {
  try {
    const { username, sequenceInput } = req.body;

    // Fetch the existing room data
    const { data: existingRoom, error: fetchError } = await supabase
      .from('rooms')
      .select('sequence')
      .eq('room_creator_username', username)
      .single();

    if (fetchError) {
      throw new Error(`Error fetching room data from Supabase: ${fetchError.message}`);
    }

    // Append the new sequence message to the existing sequence
    const updatedSequence = sequenceInput;

    // Update the sequence column in the Supabase table using the room_creator_username
    const { data: updatedRoom, updateError } = await supabase
      .from('rooms')
      .update({ sequence: updatedSequence }) // Update the sequence column
      .eq('room_creator_username', username)
      .single();

    if (updateError) {
      throw new Error(`Error updating room data in Supabase: ${updateError.message}`);
    }

    // Broadcast the updated sequence to all clients
    broadcastToClients({
      action: 'updateSequence',
      sequence: updatedRoom.sequence,
      url: updatedRoom.room_url,
      roomCreator: updatedRoom.room_creator_username,
    });

    // Render the admin-ui.ejs with updated data
    // res.render('admin-ui', { username, roomData: updatedRoom });

    // Broadcast the updated joiners structure to all clients
    const updatedJoinersStructure = createJoinersStructure(JSON.parse(updatedRoom.joiners));
    broadcastToClients({
      action: 'updateJoiners',
      joinersStructure: updatedJoinersStructure,
      url: updatedRoom.room_url,
      roomCreator: updatedRoom.room_creator_username,
    });

    // Return here to avoid the "headers already sent" error
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing admin message');
  }
});



// Helper function to create the desired structure from joinersData
function createJoinersStructure(joinersData) {
  return Object.keys(joinersData).map((joinerKey) => {
    const joiner = joinersData[joinerKey];
    return {
      joinerName: joinerKey,
      joinerId: joinerKey.split('-')[1], // Extracting the joiner ID from the key
      voted: joiner.messages.length > 0, // If messages array is not empty, voted is true
      votedValue: joiner.messages.length > 0 ? joiner.messages[joiner.messages.length - 1] : '', // Latest message as votedValue
    };
  });
}

// Helper function to broadcast data to all connected clients
function broadcastToClients(data) {
  sseClients.forEach(client => {
    client.sseSend(data);
  });
}

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

  res.redirect(`/admin-ui/${username}`);
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});