const socket = io();
    const myVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    let myStream;
    let roomName;

    // Função para entrar na sala
    function joinRoom() {
      roomName = document.getElementById('roomName').value.trim();
      if (roomName !== '') {
        // Captura a mídia local e adiciona ao elemento de vídeo local
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            myStream = stream;
            addVideoStream(myVideo, stream);

            // Evento para lidar com a entrada de um novo usuário
            socket.emit('join', roomName);
          })
          .catch((error) => {
            console.log('Erro ao obter a mídia: ', error);
          });
      }
    }

    // Configuração da conexão WebRTC
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const peerConnection = new RTCPeerConnection(configuration);

    // Evento para lidar com a entrada de um novo usuário
    socket.on('other-user', (userID) => {
      connectToNewUser(userID);
    });

    // Evento para lidar com o recebimento de uma oferta
    socket.on('offer', (offer, userID) => {
      peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      peerConnection.createAnswer()
        .then((answer) => {
          peerConnection.setLocalDescription(answer);
          socket.emit('answer', answer, roomName);
        });
      peerConnection.ontrack = (event) => {
        addVideoStream(remoteVideo, event.streams[0]);
      };
    });

    // Evento para lidar com o recebimento de uma resposta
    socket.on('answer', (answer) => {
      peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Evento para lidar com o recebimento de um candidato ICE
    socket.on('ice-candidate', (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Evento para lidar com a desconexão de um usuário
    socket.on('user-disconnected', (userID) => {
      if (userID) {
        const remoteVideoContainer = document.querySelector('.video-box:nth-child(2)');
        remoteVideoContainer.remove();

        peerConnection.close();
        myVideo.srcObject.getTracks().forEach(track => track.stop());
        myVideo.srcObject = null;
        window.location.reload();
      }
    });

    // Função para conectar a um novo usuário
    function connectToNewUser(userID) {
      const stream = myVideo.srcObject;
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
      peerConnection.createOffer()
        .then((offer) => {
          peerConnection.setLocalDescription(offer);
          socket.emit('offer', offer, roomName);
        });
    }

    // Função para adicionar um stream de vídeo a um elemento de vídeo
    function addVideoStream(videoElement, stream) {
      videoElement.srcObject = stream;
      videoElement.addEventListener('loadedmetadata', () => {
        videoElement.play();
      });
    }