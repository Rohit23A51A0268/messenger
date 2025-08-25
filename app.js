const VALID_USERS = ["Ayswarya", "Rohit"];
const PASSWORD = "ISUKOTHI";

const loginCard = document.getElementById("loginCard");
const chatSection = document.getElementById("chatSection");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const messagesEl = document.getElementById("messages");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");
const fileBtn = document.getElementById("fileBtn");
const fileInput = document.getElementById("fileInput");
const voiceBtn = document.getElementById("voiceBtn");

const peerNameEl = document.getElementById("peerName");
const statusDot = document.getElementById("statusDot");

let currentUser = null;
let peer, conn, recorder, audioChunks = [];

// -------- LOGIN --------
loginForm.addEventListener("submit", e => {
  e.preventDefault();
  const user = usernameInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!VALID_USERS.includes(user)) {
    loginError.textContent = "Invalid Username";
    return;
  }
  if (pass !== PASSWORD) {
    loginError.textContent = "Invalid Password";
    return;
  }
  currentUser = user;
  localStorage.setItem("chatUser", user);
  loginCard.classList.add("hidden");
  chatSection.classList.remove("hidden");
  initChat();
});

// -------- CHAT --------
function initChat() {
  loadMessages();

  peer = new Peer(currentUser + "_peer");
  peer.on("open", () => {
    if (currentUser === "Ayswarya") {
      peer.on("connection", c => setupConnection(c));
    } else {
      conn = peer.connect("Ayswarya_peer");
      conn.on("open", () => setupConnection(conn));
    }
  });
}

function setupConnection(c) {
  conn = c;
  statusDot.textContent = "Online 🟢";
  peerNameEl.textContent = conn.peer.replace("_peer", "");

  conn.on("data", msg => {
    handleIncoming(msg);
  });
}

// -------- SENDING --------
sendBtn.addEventListener("click", sendMessage);
textInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  if (!textInput.value.trim()) return;
  const msg = { type: "text", user: currentUser, text: textInput.value };
  addMessage(msg, true);
  conn && conn.send(msg);
  textInput.value = "";
}

fileBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const msg = { type: "file", user: currentUser, name: file.name, data: reader.result };
    addMessage(msg, true);
    conn && conn.send(msg);
  };
  reader.readAsDataURL(file);
});

// -------- VOICE --------
voiceBtn.addEventListener("mousedown", startRecording);
voiceBtn.addEventListener("mouseup", stopRecording);

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => audioChunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      const reader = new FileReader();
      reader.onload = () => {
        const msg = { type: "audio", user: currentUser, data: reader.result };
        addMessage(msg, true);
        conn && conn.send(msg);
      };
      reader.readAsDataURL(blob);
    };
    recorder.start();
  });
}
function stopRecording() {
  if (recorder && recorder.state === "recording") recorder.stop();
}

// -------- MESSAGES --------
function handleIncoming(msg) {
  addMessage(msg, true);
}

function addMessage(msg, save = false) {
  const div = document.createElement("div");
  div.className = "msg " + (msg.user === currentUser ? "me" : "you");

  if (msg.type === "text") {
    div.textContent = `${msg.user}: ${msg.text}`;
  } else if (msg.type === "file") {
    if (msg.data.startsWith("data:image")) {
      div.innerHTML = `${msg.user}: <img src="${msg.data}" style="max-width:150px;">`;
    } else {
      div.innerHTML = `${msg.user}: <a href="${msg.data}" download="${msg.name}">📎 ${msg.name}</a>`;
    }
  } else if (msg.type === "audio") {
    div.innerHTML = `${msg.user}: <audio controls src="${msg.data}"></audio>`;
  }

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  if (save) saveMessage(msg);
}

// -------- STORAGE --------
function saveMessage(msg) {
  let history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  history.push(msg);
  localStorage.setItem("chatHistory", JSON.stringify(history));
}
function loadMessages() {
  let history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  history.forEach(m => addMessage(m));
}
