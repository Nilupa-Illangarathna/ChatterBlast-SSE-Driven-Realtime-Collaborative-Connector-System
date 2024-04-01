// index.js
const express = require('express');
const { createServer } = require('http');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = createServer(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const supabaseUrl = 'https://zqjmkicfcolipzkqvslv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxam1raWNmY29saXB6a3F2c2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg4NjA2MDYsImV4cCI6MjAyNDQzNjYwNn0.okYMPvmrR8ftOXIyHYIJ2DQ-Tk2ZfVZhHXMM6cBmaVk';
const supabase = createClient(supabaseUrl, supabaseKey);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
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

  sseClients.push(res);

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
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_creator_username', username)
      .single();

    if (roomError) {
      throw new Error(`Error fetching room data: ${roomError.message}`);
    }

    res.render('admin-ui', { username, roomData });
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.get('/join-ui/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_creator_username', username)
      .single();

    if (roomError) {
      throw new Error(`Error fetching room data: ${roomError.message}`);
    }

    res.render('join-ui', { username, roomData, description: roomData.description });
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Image gets
app.get('/init-background', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'init_background.svg'));
});

app.get('/create-room-background', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'init_background.svg'));
});

app.get('/admin-joiner-leaderboard-background', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-joiner-leaderboard-background.png'));
});

app.get('/admin-joiner-main-background', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-joiner-main-background.png'));
});

// post methods
app.post('/create-room', async (req, res) => {
  const { username } = req.body;

  const roomCreatorId = uuidv4();

  const joinersData = {};
  joinersData[username] = {
    joined_at: new Date().toISOString(),
    messages: [],
    spectator: false,
    isAdmin: true, // Marking the admin as isAdmin
  };

  const roomData = {
    room_url: `http://localhost:3000/join-room?username=${username}&url=${username}`,
    room_creator_username: username,
    room_creator_id: roomCreatorId,
    joiners: JSON.stringify(joinersData),
  };

  const { data: createdRoom, error } = await supabase
    .from('rooms')
    .upsert([roomData], { returning: ['*'] });

  if (error) {
    console.error(error);
    res.status(500).send('Error creating room');
    return;
  }

  res.redirect(`/admin-ui/${username}`);
});

app.post('/join-room', async (req, res) => {
  const { username, url } = req.body;

  try {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_url', url)
      .single();

    if (roomError) {
      throw new Error(`Error fetching room data: ${roomError.message}`);
    }

    const joinersData = JSON.parse(roomData.joiners);

    if (joinersData.hasOwnProperty(username)) {
      const userMessages = joinersData[username].messages;

      res.render('join-ui', { username, userMessages, roomData });

      broadcastToClients({
        action: 'updateSequence',
        sequence: roomData.sequence,
        url: roomData.room_url,
        roomCreator: roomData.room_creator_username,
      });

      // console.log(url);
      sseClients.forEach(client => {
        client.sseSend({
          action: 'newJoiner',
          username,
          url,
          spectator: joinersData[joinerKey].spectator,
        });
      });

    } else {
      const joinerKey = `${username}`;

      joinersData[joinerKey] = {
        joined_at: new Date().toISOString(),
        messages: [],
        spectator: false,
      };


      const { data: updatedRoom, updateError } = await supabase
        .from('rooms')
        .update({ joiners: JSON.stringify(joinersData) })
        .eq('room_url', url)
        .single();

      if (updateError) {
        throw new Error(`Error updating room data: ${updateError.message}`);
      }

      const updatedJoinersStructure = createJoinersStructure(joinersData);
      broadcastToClients({
        action: 'updateJoiners',
        joinersStructure: updatedJoinersStructure,
        url: url,
        roomCreator: joinersData.room_creator_username,
        isTimerEnabled: true,
      });


      res.render('join-ui', { username, userMessages: [], roomData });

      sseClients.forEach(client => {
        client.sseSend({
          action: 'newJoiner',
          username,
          url,
          spectator: joinersData[joinerKey].spectator,
        });
      });



    }
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post('/send-join-message', async (req, res) => {
  try {
    const { username, joinMessage, roomData, isAdmin } = req.body;

    const parsedRoomData = JSON.parse(roomData);
    const { data: roomDataFromSupabase, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_url', parsedRoomData.room_url)
      .single();

    if (roomError || !roomDataFromSupabase) {
      throw new Error(`Error fetching room data from Supabase: ${roomError?.message || 'Data not found'}`);
    }

    const joinersData = JSON.parse(roomDataFromSupabase.joiners);
    const isTimerEnabled = roomDataFromSupabase.timer_enabled;

    console.log("isTimerEnabled : ", isTimerEnabled);

    if (isAdmin === "true") {
      console.log("admin");
      // Admin is sending message
      const adminUsername = Object.keys(joinersData).find(key => joinersData[key].isAdmin);
      if (!adminUsername) {
        throw new Error(`Admin not found in joinersData`);
      }
      joinersData[adminUsername].messages[0] = joinMessage;
    } else {
      console.log("joiner");
      // Joiner is sending message
      if (!joinersData.hasOwnProperty(username)) {
        throw new Error(`User ${username} not found in joinersData`);
      }
      joinersData[username].messages[0] = joinMessage;
    }

    const { data: updatedRoom, updateError } = await supabase
      .from('rooms')
      .update({ joiners: JSON.stringify(joinersData) })
      .eq('room_url', parsedRoomData.room_url)
      .single();

    if (updateError) {
      throw new Error(`Error updating room data in Supabase: ${updateError.message}`);
    }

    const updatedJoinersStructure = createJoinersStructure(joinersData);
    broadcastToClients({
      action: 'updateJoiners',
      joinersStructure: updatedJoinersStructure,
      url: parsedRoomData.room_url,
      roomCreator: parsedRoomData.room_creator_username,
      isTimerEnabled: isTimerEnabled,
    });

    res.render('join-ui', { username, userMessages: joinersData[username].messages, roomData: parsedRoomData });

  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}`);
  }
});


app.post('/send-admin-message', async (req, res) => {
  try {
    const { username, sequenceInput } = req.body;
    const description = req.body.description;
    const timerEnabled = req.body.timerEnabled;
    const timestamp = req.body.timestamp;
    const timerValue = req.body.timerValue;

    const isEnabled = timerEnabled == 'true' ? true : false;

    const parsedTimestamp = parseInt(timestamp);

    const parsedTimerValue = parseInt(timerValue);

    // console.log("send-admin-message : ", timerEnabled);
    // console.log("send-admin-message : ", parsedTimestamp);
    // console.log("send-admin-message : ", parsedTimerValue);

    // const { data: existingRoom, error: fetchError } = await supabase
    //   .from('rooms')
    //   .select('sequence')
    //   .eq('room_creator_username', username)
    //   .single();

    // if (fetchError) {
    //   throw new Error(`Error fetching room data from Supabase: ${fetchError.message}`);
    // }

    const updatedSequence = sequenceInput;

    const { data: updatedRoom, updateError } = await supabase
      .from('rooms')
      .update({ sequence: updatedSequence, description: description, timer_enabled: timerEnabled, timestamp: parsedTimestamp, timer_value: parsedTimerValue })
      .eq('room_creator_username', username)
      .single();

    if (updateError) {
      throw new Error(`Error updating room data in Supabase: ${updateError.message}`);
    }

    broadcastToClients({
      action: 'updateSequence',
      sequence: updatedRoom.sequence,
      url: updatedRoom.room_url,
      roomCreator: updatedRoom.room_creator_username,
    });

    const updatedJoinersStructure = createJoinersStructure(JSON.parse(updatedRoom.joiners));
    broadcastToClients({
      action: 'updateJoiners',
      joinersStructure: updatedJoinersStructure,
      url: updatedRoom.room_url,
      roomCreator: updatedRoom.room_creator_username,
      isTimerEnabled: timerEnabled,
    });

    return res.status(200).send('Data received successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing admin message');
  }
});

// Add a new route to handle updating timerEnabled state
app.post('/update-timer-enabled', async (req, res) => {
  try {
    const { roomData, timerEnabled, username } = req.body;

    const roomURL = roomData;
    const userName = username;
    console.log(userName);

    const { data: updatedRoom, updateError } = await supabase
      .from('rooms')
      .update({ timer_enabled: timerEnabled })
      .eq('room_url', roomURL)
      .single();

    if (updateError) {
      throw new Error(`Error updating timer state in Supabase: ${updateError.message}`);
    }



    const { data: roomDataFromSupabase, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_url', roomURL)
      .single();

    if (roomError || !roomDataFromSupabase) {
      throw new Error(`Error fetching room data from Supabase: ${roomError?.message || 'Data not found'}`);
    }


    res.status(200).send('Timer state updated successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating timer state.');
  }
});


app.post('/toggle-spectator', async (req, res) => {
  const { joiner_Name, is_Checked, roomUrl } = req.body;
  joiner_Name
  // console.log(`Received toggle-spectator message from joiner_Name: ${joiner_Name}`);
  // console.log(`Received toggle-spectator message from is_Checked: ${is_Checked}`);
  // console.log(`Received toggle-spectator message from roomUrl: ${roomUrl}`);

  try {
    const { data: roomDataFromSupabase, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_url', roomUrl)
      .single();

    if (roomError || !roomDataFromSupabase) {
      throw new Error(`Error fetching room data from Supabase: ${roomError?.message || 'Data not found'}`);
    }

    const joinersData = JSON.parse(roomDataFromSupabase.joiners);
    const isTimerEnabled = roomDataFromSupabase.timer_enabled;

    console.log("isTimerEnabled : ", isTimerEnabled);

    if (joinersData.hasOwnProperty(joiner_Name)) {
      joinersData[joiner_Name].spectator = is_Checked;
      if (is_Checked) {
        joinersData[joiner_Name].messages = "SpectatorEntity";
      }

      const { data: updatedRoom, updateError } = await supabase
        .from('rooms')
        .update({ joiners: JSON.stringify(joinersData) })
        .eq('room_url', roomUrl)
        .single();

      if (updateError) {
        throw new Error(`Error updating room data in Supabase: ${updateError.message}`);
      }

      const updatedJoinersStructure = createJoinersStructure(joinersData);
      broadcastToClients({
        action: 'updateJoiners',
        joinersStructure: updatedJoinersStructure,
        url: roomDataFromSupabase.room_url,
        roomCreator: roomDataFromSupabase.room_creator_username,
        isTimerEnabled: isTimerEnabled,
      });

      res.render('join-ui', { username, userMessages: joinersData[username].messages, roomData: roomDataFromSupabase });

    } else {
      throw new Error(`User ${joiner_Name} not found in joinersData`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error toggling spectator state');
  }
});

app.post('/broadcast-data', async (req, res) => {

  try {
    const { randomNumber, roomData, joinedPeople } = req.body;

    const { data: roomDataFromSupabase, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('room_url', roomData)
      .single();

    if (roomError || !roomDataFromSupabase) {
      throw new Error(`Error fetching room data from Supabase: ${roomError?.message || 'Data not found'}`);
    }

    const joinersData = JSON.parse(roomDataFromSupabase.joiners);

    // console.log("roomDataFromSupabase : ", joinersData);

    // console.log(`Received message from admin: ${randomNumber}`);
    // console.log('Received room data:', roomData);
    // console.log('Received joined people data:', joinersData);

    const updatedJoinersStructure = createJoinersStructure(joinersData);
    // console.log('Created joined people data:', updatedJoinersStructure);
    broadcastToClients({
      action: 'adminEvent',
      randomNumber: randomNumber,
      roomData: roomData,
      joinedPeople: updatedJoinersStructure,
    });
    console.log('adminEvent Broadcassted');

    res.status(200).send('Data received successfully.');


        //TODO: Simulate data to be sent via SSE
        const dummySequenceData = "1, 2, 3, 4, 5";
        const dummyJoinedPeopleData = [
          { joinerName: "John", voted: true, votedValue: "A" },
          { joinerName: "Alice", voted: false, votedValue: "B" },
          { joinerName: "Nick", voted: false, votedValue: "C" },
        ];
    
        // Simulate delay with setTimeout
        setTimeout(() => {
          // Trigger SSE event "newSession" with dummy data
          broadcastToClients({
            action: 'newSession',
            roomData: roomData,
            sequenceData: dummySequenceData,
            joinedPeopleData: dummyJoinedPeopleData
          });
        }, 8000); // 8 seconds delay
        //TODO:

  } catch (error) {
    console.error('Error handling /broadcast-data:', error);
    res.status(500).send('Internal server error.');
  }
});


// Functions
function createJoinersStructure(joinersData) {
  return Object.keys(joinersData).map((joinerKey) => {
    const joiner = joinersData[joinerKey];
    // console.log(joiner.messages[joiner.messages.length - 1]);
    return {
      joinerName: joinerKey,
      joinerId: joinerKey.split('-')[1],
      voted: joiner.messages.length > 0,
      votedValue: joiner.messages.length > 0 ? joiner.messages : '',
      spectator: joiner.spectator,

    };
  });
}

function broadcastToClients(data) {
  sseClients.forEach(client => {
    client.sseSend(data);
  });
}



server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
