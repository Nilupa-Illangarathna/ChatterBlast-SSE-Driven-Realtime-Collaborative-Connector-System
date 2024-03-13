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




<table>
  <tr>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/2b577a18-4bed-496a-aa06-9389e85fdc93.jpg" width="100%"></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/f672be63-3c1b-47ca-bcaf-7a33e2171e1f.jpg" width="100%"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/be3ad2b1-3beb-460e-a878-ee8a4a14e2d3.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/ad3f685e-c13e-41ec-a873-66a1e1b610ba.jpg" width=300></td>
  </tr>
  <tr>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/b00f3f66-309d-499f-a9a4-1bb431050de0.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/4e96ee55-c303-4135-8f79-94b083913969.jpg" width=300></td>
  </tr>
  <tr>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/b00f3f66-309d-499f-a9a4-1bb431050de0.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/6e6602e2-ebd1-465b-9456-6217c79fdddf.jpg" width=300></td>
  </tr>
  <tr>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/51cd7aa7-a7e0-44ec-8547-635779d150d6.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/e4f169c6-059b-4e46-aee8-a166c04f151f.jpg" width=300></td>
  </tr>
  <tr>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/51cd7aa7-a7e0-44ec-8547-635779d150d6.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/19218703-bbea-4379-8dd7-32e006f4fef9.jpg" width=300></td>
  </tr>
  <tr>
    <td colspan="2"><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/e4f169c6-059b-4e46-aee8-a166c04f151f.jpg" width=600></td>
  </tr>
</table>


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
