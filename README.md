# Voting System

This is a real-time voting system implemented using Server-Sent Events (SSE), Node.js, Express.js, and Supabase as the database.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Node.js](https://img.shields.io/badge/Node.js-v14.17.0-green)
![Express.js](https://img.shields.io/badge/Express.js-v4.17.1-lightgrey)
![Supabase](https://img.shields.io/badge/Supabase-v1.0.0-blue)
![Server-Sent Events (SSE)](https://img.shields.io/badge/SSE-Real--time-red)

## Features

- Allows users to create and join voting rooms.
- Real-time updates using SSE.
- Supports toggling between spectator mode for participants.

## Setup

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Set up Supabase database and replace the credentials in `index.js`.
4. Run the server using `npm start`.

## Usage

- Navigate to `/create-room` to create a new voting room.
- Join a room using `/join-room`.
- Admin can access the admin UI at `/admin-ui/:username`.
- Participants can access the participant UI at `/join-ui/:username`.
- Spectator mode can be toggled by admins for participants.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
