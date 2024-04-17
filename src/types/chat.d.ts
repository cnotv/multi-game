interface Message {
  name: string;
  id: string;
  text: string;
}

interface User {
  name: string;
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  }
}