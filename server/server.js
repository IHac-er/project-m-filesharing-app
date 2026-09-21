require("dotenv/config")
const express = require("express")
const http = require("http")
const cors = require("cors")

const app = express()
const PORT = process.env.PORT ?? 5000 

app.use(cors())

app.get('/health', (req, res) => {
    console.log("Server Healthy!")
    res.send({
        message: "Server Healthy"
    })
})

const server = http.createServer(app)

module.exports = server

const roomRoutes = require("./routes/room.route")
app.use(roomRoutes)

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is up running on port ${PORT}`)
})