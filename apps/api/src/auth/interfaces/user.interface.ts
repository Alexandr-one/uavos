export interface User {
    id: number;
    username: string;
    password: string;
    email: string;
  }
  
  export interface UserPayload {
    userId: number;
    username: string;
  }