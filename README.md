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
    <td><img src="https://user-images.githubusercontent.com/95247831/202404619-90a20e87-9c9e-42f6-9749-dc21b60e30a2.jpg" width="100%"></td>
    <td><img src="https://user-images.githubusercontent.com/95247831/202404483-0999cac6-2d80-4e38-914a-b109d3400336.jpg" width="100%"></td>
  </tr>
  <tr>
    <td><img src="https://user-images.githubusercontent.com/95247831/202404908-3e44a6cb-c601-4050-b8fd-fcc9ede73171.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/f672be63-3c1b-47ca-bcaf-7a33e2171e1f.jpg" width=300></td>
  </tr>
  <tr>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/be3ad2b1-3beb-460e-a878-ee8a4a14e2d3.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/56c8b3d2-5787-4b23-b861-ccc595c8abb9.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/a743311d-2dba-4cc4-8f0c-fb1488f224e3.jpg" width=300></td>
  </tr>
  <tr>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/b00f3f66-309d-499f-a9a4-1bb431050de0.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/4e96ee55-c303-4135-8f79-94b083913969.jpg" width=300></td>
  </tr>
  <tr>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/b37153c6-6223-402c-91ee-332ce13f2537.jpg" width=300></td>
    <td><img src="https://github.com/Nilupa-Illangarathna/ChatterBlast-SSE-Driven-Realtime-Collaborative-Connector-System/assets/95247831/6e6602e2-ebd1-465b-9456-6217c79fdddf.jpg" width=300></td>
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
