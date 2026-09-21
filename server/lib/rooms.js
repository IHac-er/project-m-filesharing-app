const { pendingRooms } = require("./roomStates");
const io = require("./socket");

function createRoom(roomCode){
    let isUnique = false;

    while (!isUnique) {

        const existingRoom = io.sockets.adapter.rooms.get(roomCode);

        if (!existingRoom && !pendingRooms.has(roomCode)) {
            isUnique = true;
        }
    }

    pendingRooms.add(roomCode);

    setTimeout(() => {
        pendingRooms.delete(roomCode);
    }, 3000);
}

module.exports = createRoom