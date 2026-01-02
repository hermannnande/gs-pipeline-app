// Centralise les instances Socket.io pour éviter les imports circulaires.
// IMPORTANT: exporter des variables (live bindings) permet aux autres modules
// d'y accéder une fois initialisées dans `server.js`.

export let io;
export let chatIo;

export function setSocketServers(rootIo, chatNamespace) {
  io = rootIo;
  chatIo = chatNamespace;
}


