const express = require("express");
const http = require("http");
const app = express();
const server = http.Server(app);
const io = require('socket.io')(server);
//172.20.65.149

const ip = "127.0.0.1";
const port = 4000;
app.use(express.static('public'));
app.get('/',(req,res)=>{
    res.sendFile('index.html',{root:__dirname});
})
// un tableau pour suivre mes utilisateurs actifs
const users = [];
const publicMessages = [];

//......
io.on("connection",(socket)=>{

    socket.emit("init",{message:"bienvenue cher client du chat"})

    // attente de l'emit sendLog
    socket.on("sendLog",(data)=>{
        console.log(socket.id);
        // securisation par authentificator...
        data.id = socket.id;
        users.push(data);
        console.log(users);   
    })
    socket.on("publicMessage",(data)=>{
        data.id = socket.id;
        publicMessages.push(data);
        console.dir(publicMessages);
        socket.broadcast.emit("publicMessageGlobal",data);
    })
    socket.on('disconnect',()=>{
        //socket.id
        let indexDisconnect;
        users.forEach((element,index) => {
            if(element.id === socket.id){
                indexDisconnect = index;
            }
        });
        // splice sert a supprimer une entree de tableau a 
        // partir de son index (indexDisconnect)
        users.splice(indexDisconnect,1);
        console.dir(users);
    })
})
server.listen(port,ip,()=>{
    console.log("Demarer sur http://"+ip+":"+port);
})
