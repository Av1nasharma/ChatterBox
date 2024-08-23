const path = require('path')
// require('dotenv').config({path:path.resolve(__dirname,'./.env')})
const express= require("express");
const dotenv= require("dotenv");
const { chats } = require("./data/data");
const colors = require("colors");  
const connectDB = require("./config/db")
const userRoutes=require("./routes/userRoutes")
const chatRoutes=require("./routes/chatRoutes")
const messageRoutes= require("./routes/messageRoutes")
const {notFound, errorHandler} = require('./middleware/errorMiddleware')
const cors = require('cors');
const app= express();
dotenv.config();
connectDB()

app.use(express.json());
app.use(cors());
app.get('/', (req, res)=>{
    res.send("API is Running Successfully");
})

app.use('/api/user', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/message', messageRoutes);



// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

app.use(notFound)
app.use(errorHandler)


const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server Started on PORT ${PORT}`.yellow.bold));

// const io = require("socket.io")(server, {
//   pingTimeout: 60000,
//   cors: {
//     origin: "https://chatterbox-3.onrender.com/",
//     // credentials: true,
//   },
// });

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://chatterbox-3.onrender.com",
        "https://66c8a7eb9d7767b7e1ca990f--musical-moxie-b04297.netlify.app"
        // "https://another-allowed-origin.com" // Add more origins as needed
      ];

      // Check if the origin is in the allowed origins list
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true); // Allow the request
      } else {
        callback(new Error("Not allowed by CORS")); // Block the request
      }
    },
    credentials: true, // Optional: If you need to send cookies or HTTP authentication
  },
});


io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
  

});

