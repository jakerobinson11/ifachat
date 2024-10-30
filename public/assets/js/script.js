// Global variable to store open private chat boxes
const privateChats = {};

// declaration of variables
const sendPublic = document.querySelector("#sendPublic");
const messagesPublic = document.getElementById("messagesPublic");
const socket = io();
const query = window.location.search;
const urlParams = new URLSearchParams(query);
const pseudo = urlParams.get("pseudo");
console.log(pseudo);
const pwd = urlParams.get("pwd");
console.log(pwd);
const clientsList = document.getElementById("clientsList");

// Function to display a public message
const displayMessage = (data) => {
  messagesPublic.innerHTML += `
    <div class="newMessage">
      <h2>${data.pseudo}</h2>
      <p class="content">${data.messageContent}</p>
      <p class="date">${data.date}</p>
    </div>`;
};

// Initialize TinyMCE for the public message textarea
tinymce.init({
  selector: '#textPublic',
  plugins: [
    'advlist','autolink','lists','link','image','charmap','preview','anchor','searchreplace','visualblocks',
    'fullscreen','insertdatetime','media','table','help','wordcount'
  ],
  toolbar: 'undo redo | formatpainter casechange blocks | bold italic backcolor | ' +
    'alignleft aligncenter alignright alignjustify | ' +
    'bullist numlist checklist outdent indent | removeformat | a11ycheck code table help'
});

// Initial connection setup
socket.on("init", (data) => {
    console.dir(data);
    socket.emit("sendLog", { pseudo: pseudo, pwd: pwd });
});

// Sending a public message
sendPublic.addEventListener("click", () => {
  let messageContent = tinyMCE.get("textPublic").getContent();
  let date = new Date(); // UTC or use a library like moment.js for formatting
  let data = { pseudo: pseudo, messageContent: messageContent, date: date };
  socket.emit("publicMessage", data);
  displayMessage(data);
});

// Receiving and displaying public messages
socket.on("publicMessageGlobal", (data) => {
  console.dir(data);
  displayMessage(data);
});

// Display connected clients
const displayClients = (users) => {
    clientsList.innerHTML = ""; // Clear the list
    users.forEach(user => {
        const userElement = document.createElement("p");
        userElement.innerHTML = user.pseudo;
        userElement.onclick = () => displayPrivateMessagePopup(user.id, user.pseudo);
        clientsList.appendChild(userElement);
    });
};

socket.on("updateUserList", (users) => {
    displayClients(users);
});

// Function to display or open a private message popup for each user
const displayPrivateMessagePopup = (recipientId, recipientPseudo) => {
  if (privateChats[recipientId]) {
      // If the chat box already exists, show it
      privateChats[recipientId].style.display = "block";
      return;
  }

  // Create a new chat box for private messaging
  const chatBox = document.createElement("div");
  chatBox.className = "private-chat-box";
  chatBox.innerHTML = `
      <h3>Private Chat with ${recipientPseudo}</h3>
      <div class="chat-messages" id="chatMessages-${recipientId}"></div>
      <textarea id="privateMessage-${recipientId}" placeholder="Type your message..."></textarea>
      <button onclick="sendPrivateMessage('${recipientId}')">Send</button>
      <button onclick="closeChatBox('${recipientId}')">Close</button>
  `;
  
  document.body.appendChild(chatBox);
  privateChats[recipientId] = chatBox; // Store the chat box for this recipient

  // Initialize TinyMCE editor for the private message textarea
  tinymce.init({ selector: `#privateMessage-${recipientId}` });
};

// Function to send private messages
const sendPrivateMessage = (recipientId) => {
  // Retrieve content and strip HTML tags
  let messageContent = tinymce.get(`privateMessage-${recipientId}`).getContent();
  messageContent = messageContent.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags

  // Clear the input after sending
  tinymce.get(`privateMessage-${recipientId}`).setContent("");

  // Send the message to the server
  socket.emit("privateMessage", { recipientId, pseudo, messageContent });

  // Display the sent message in the chat box
  const chatMessages = document.getElementById(`chatMessages-${recipientId}`);
  const messageElement = document.createElement("div");
  messageElement.className = "sent-message";
  messageElement.innerText = `${pseudo}: ${messageContent}`; // Use text content
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
};
// Receiving private messages and displaying them in the correct chat box
socket.on("receivePrivateMessage", (data) => {
  const { pseudo: senderPseudo, messageContent, senderId } = data;

  // Open the chat box if it doesn't exist
  if (!privateChats[senderId]) {
      displayPrivateMessagePopup(senderId, senderPseudo);
  }

  // Display the received message in the correct chat box
  const chatMessages = document.getElementById(`chatMessages-${senderId}`);
  const messageElement = document.createElement("div");
  messageElement.className = "received-message";
  messageElement.innerText = `${senderPseudo}: ${messageContent}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Function to close a private chat box
const closeChatBox = (recipientId) => {
  if (privateChats[recipientId]) {
      privateChats[recipientId].style.display = "none";
  }
};