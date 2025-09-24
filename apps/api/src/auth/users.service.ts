import { Injectable, Inject } from '@nestjs/common';
import { users } from 'src/database/schemas/postgresql.schema';
import { eq } from 'drizzle-orm';
import { UserDto } from '@uavos/shared-types';

@Injectable()
export class UsersService {
    constructor(@Inject('DATABASE_CONNECTION') private readonly db: any) {}

    /**
     * Get user by name
     * 
     * @param username 
     * @returns UserDto | null
     */
    async getUserByUsername(username: string): Promise<UserDto | null> {
        const user = await this.db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

        return user[0] ?? null;
    }
}
