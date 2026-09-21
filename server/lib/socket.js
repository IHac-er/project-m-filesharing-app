const Server = require("socket.io");
const server = require("../server");
const { activeRooms, emptyRoomTimers, pendingRooms } = require("./roomStates");

const io = Server(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {

    socket.on("join-room", (data) => {
        if (!data || typeof data.roomCode !== "string") {
            return;
        }

        const { roomCode, create, username } = data;
        const room = io.sockets.adapter.rooms.get(roomCode);
        
        socket.username = username || "Anonymous"; 

        if (create) {

            if (!pendingRooms.has(roomCode) && !activeRooms.has(roomCode)) {
                socket.emit("room-not-found");
                return;
            }
            
            pendingRooms.delete(roomCode);
            activeRooms.add(roomCode);

        } else {
            
            if (!activeRooms.has(roomCode)) {
                socket.emit("room-not-found");
                return;
            }
        }

        if (emptyRoomTimers.has(roomCode)) {
            clearTimeout(emptyRoomTimers.get(roomCode));
            emptyRoomTimers.delete(roomCode);
        }

        const roomSize = room?.size ? room.size : 0;

        if (roomSize >= 2 ) {
            socket.emit("room-full");
            return;
        }
        
        socket.join(roomCode);

        socket.to(roomCode).emit("user-connected", socket.username);

        const updatedRoom = io.sockets.adapter.rooms.get(roomCode);
        io.to(roomCode).emit("room-status", {
            users: updatedRoom.size
        });
    });

    socket.on("send-message", (data) => {
        if (!data || !data.room || !data.message) {
            return; 
        }

        if (typeof data.message.text !== "string") {
            return;
        }

        io.to(data.room).emit("receive-message", data.message);
    });

    socket.on("typing", ({ room, username }) => {
        socket.to(room).emit("user-typing", username);
    });

    socket.on("stop-typing", (room) => {
        socket.to(room).emit("user-stop-typing");
    });

    /**
     * WEBRTC SIGNALING (THE P2P HANDSHAKE)
     * These events act as a middleman to exchange WebRTC connection data 
     * between the two browsers so they can establish a direct Peer-to-Peer link.
     */
    socket.on("webrtc-offer", ({room,offer}) => {
        socket.to(room).emit("webrtc-offer", offer);
    });

    socket.on("webrtc-answer",({room,answer}) => {
        socket.to(room).emit("webrtc-answer", answer);
    });

    socket.on("webrtc-ice-candidate",({room,candidate}) => {
        socket.to(room).emit("webrtc-ice-candidate", candidate);
    });
    
    socket.on("disconnecting", () => {
        socket.rooms.forEach((roomCode) => {
            if (roomCode !== socket.id) {
                socket.to(roomCode).emit("user-disconnected", socket.username);

                const roomData = io.sockets.adapter.rooms.get(roomCode);
                const count = roomData ? roomData.size - 1 : 0;
                socket.to(roomCode).emit("room-status", {
                    users: count
                });

                // If the room is now completely empty, start the 5-second self-destruct timer
                if (count === 0 && activeRooms.has(roomCode)) {
                    const timer = setTimeout(() => {
                        activeRooms.delete(roomCode);
                        emptyRoomTimers.delete(roomCode);
                    }, 5000);

                    emptyRoomTimers.set(roomCode, timer);
                }
            }
        });
    });
});

module.exports = io;