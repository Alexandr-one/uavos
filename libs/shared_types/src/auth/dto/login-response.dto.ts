import { UserDto } from './user.dto';

export class LoginResponseDto {
    constructor(
        public access_token: string,
        public user: UserDto,
    ) { }
}