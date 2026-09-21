const { Router } = require("express");
const generateCode = require("../lib/utils");
const createRoom = require("../lib/rooms");
const io = require("../lib/socket");

const roomRouter = Router();

roomRouter.get("/check-room/:code", (req, res) => {
    const roomCode = req.params.code;
    const room = io.sockets.adapter.rooms.get(roomCode);
    console.log(`Room code created with ${roomCode}`)

    if (room && room.size > 0) {
        res.json({ exists: true, isFull: room.size >= 2 });
    } else {
        res.json({ exists: false });
    }
});

roomRouter.get("/create-room", (req, res) => {
    const roomCode = generateCode();
    
    createRoom(roomCode);

    res.json({ code: roomCode });
})

module.exports = roomRouter