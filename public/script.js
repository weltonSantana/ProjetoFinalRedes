const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const MeuVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".EntrarSala");
const text = document.querySelector("#chat_message");
const send = document.getElementById("send");
const messages = document.querySelector(".messages");
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

MeuVideo.muted = true;

backBtn.addEventListener("click", AlternarDisplay);
showChat.addEventListener("click", AlternarDisplay);

const Usuario = prompt("Digite seu nome");

const peer = new Peer();

navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then((stream) => {
    addVideoStream(MeuVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      conectarNovoUsuario(userId, stream);
    });
  });

peer.on("open", (id) => {
  socket.emit("join-room", IDsala, id, Usuario);
});



function conectarNovoUsuario(userId, stream) {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.appendChild(video);
  });
}

socket.on("createMessage", (message, userName) => {
  const sender = (userName === Usuario) ? "Eu" : userName;
  const messageElement = CriarElementoMensagem(sender, message);
  messages.appendChild(messageElement);
});

function EnviarMensagem() {
  const message = text.value.trim();
  if (message.length === 0) return;
  socket.emit("message", message);
  text.value = "";
}

send.addEventListener("click", EnviarMensagem);
text.addEventListener("keydown", (e) => {
  if (e.key === "Enter") EnviarMensagem();
});

muteButton.addEventListener("click", AlternarAudio);
stopVideo.addEventListener("click", AlternarVideo);

inviteButton.addEventListener("click", () => {
  prompt("Link para entrar na chamada", window.location.href);
});



function AlternarDisplay() {
  const cardPrincipal = document.querySelector(".cardPrincipal");
  const cardSecundario = document.querySelector(".cardSecundario");
  cardPrincipal.style.display = (cardPrincipal.style.display === "flex") ? "none" : "flex";
  cardSecundario.style.display = (cardSecundario.style.display === "flex") ? "none" : "flex";
  backBtn.style.display = (backBtn.style.display === "none") ? "block" : "none";
}


function AlternarAudio() {
  const audioTrack = MeuVideo.srcObject.getAudioTracks()[0];
  if (audioTrack.enabled) {
    audioTrack.enabled = false;
    muteButton.innerHTML = `<i class="fas fa-microphone-slash" style="color: #ffffff;"></i>`;
  } else {
    audioTrack.enabled = true;
    muteButton.innerHTML = `<i class="fas fa-microphone" style="color: #ffffff;"></i>`;
  }
}

function AlternarVideo() {
  const videoTrack = MeuVideo.srcObject.getVideoTracks()[0];
  if (videoTrack.enabled) {
    videoTrack.enabled = false;
    stopVideo.innerHTML = `<i class="fas fa-video-slash" style="color: #ffffff;"></i>`;
  } else {
    videoTrack.enabled = true;
    stopVideo.innerHTML = `<i class="fas fa-video" style="color: #ffffff;"></i>`;
  }
}


function CriarElementoMensagem(sender, message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `
    <b><i class="fa-solid fa-circle-user"></i> <span>${sender}</span></b>
    <span>${message}</span>`;
  return messageElement;
}
