interface Message {
  name: string;
  id: string;
  text: string;
}

interface UserRotation {
  _x: number;
  _y: number;
  _z: number;
}

interface UserPosition {
  x: number;
  y: number;
  z: number;
}

interface User {
  name: string;
  id: string;
  position: UserPosition;
  rotation: UserRotation;
}