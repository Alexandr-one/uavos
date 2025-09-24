
export class UserDto {
    constructor(
        public username: string,
        public id: number,
        public password?: string,
        public email?: string,
    ) { }
}