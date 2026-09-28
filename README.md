<div align="center">

# Project-M

**Real-time, peer-to-peer messaging and file transfer. No signup. No server storage. Just a code.**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Status](https://img.shields.io/badge/Status-Under%20Development-orange?style=for-the-badge)

</div>

---

## Overview

Project-M lets two people connect and share messages or files directly, browser to browser, with nothing in between. One person creates a room and gets a 4-character code; the other joins with it. Once both are in, a direct WebRTC connection carries the chat and files  the server is only ever used to introduce the two browsers to each other, never to see or store what's sent.

No accounts. No login. No database. Close the tab, and the room and everything in it is gone.

## Features

- Instant room creation with a shareable 4-character code  join by typing it, scanning a QR code, or opening a direct link
- Real-time text chat over a P2P WebRTC data channel, with typing indicators and an emoji picker
- Client-side AES message encryption before relay through the signaling server
- Direct P2P file transfer  documents, images, video  chunked in 64KB pieces with backpressure handling, a live progress bar, and a 500MB soft limit
- Send files by picker, drag-and-drop, or clipboard paste
- Inline code formatting and clickable links in chat, rendered XSS-safely (no `dangerouslySetInnerHTML`)
- Independently toggleable join/leave and message sound alerts, plus a master audio switch
- Chat history survives an accidental refresh for the session (`sessionStorage`); username and audio preferences persist across visits (`localStorage`)
- Rooms are capped at 2 participants by design  a third join is rejected as "room full"

## How It Works

1. A user creates a room → server generates a 4-character hex code (e.g. `A3F9`)
2. A second user joins with that code, a QR scan, or a share link
3. The Socket.io server matches the two and relays only the WebRTC offer/answer/ICE-candidate exchange  nothing else
4. A direct `RTCPeerConnection` data channel opens between the two browsers over Google's public STUN server
5. All chat and file data flows peer-to-peer from here; the signaling server is no longer involved

## Tech Stack

**Frontend**  Next.js (App Router), React, CSS Modules, `socket.io-client`, native WebRTC APIs, `crypto-js`, `lucide-react`, `emoji-picker-react`

**Backend**  Node.js + Socket.io, exposing:
- `GET /create-room`  generate and return a new room code
- `GET /check-room/:code`  check whether a room exists and if it's full

Socket.io events handle joining, presence, typing indicators, message relay, and WebRTC signaling. The server never persists messages or files.

**Deployment**  Frontend on Vercel

## Known Limitations

- Only a public STUN server is configured — no TURN fallback, so connections can fail on strict/symmetric NATs or corporate firewalls
- Rooms are hard-capped at 2 participants by design, not a bug
- No persistent chat history beyond the session — leaving a room or clearing storage loses it permanently
- Message encryption uses the room code itself as the AES key: fine for casual privacy from the signaling server, but not strong end-to-end security against an attacker who also has the code

## Contributing

Under active development — issues and PRs are welcome, especially around TURN server support and connection reliability.

## License

No license has been set yet. Until one is added, all rights are reserved by default.

---

<div align="center">

**Tharun R** ([@IHac-er](https://github.com/IHac-er))

</div>