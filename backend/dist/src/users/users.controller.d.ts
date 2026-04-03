import { UsersService } from './users.service';
declare class CreateUserDto {
    username: string;
    password: string;
    fullName?: string;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAll(): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/user.schema").User, {}, {}> & import("./schemas/user.schema").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    create(dto: CreateUserDto): Promise<{
        _id: import("mongoose").Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        id?: any;
        isNew: boolean;
        schema: import("mongoose").Schema;
        username: string;
        fullName: string;
        role: string;
        isActive: boolean;
        lastLogin: Date;
        __v: number;
    }>;
    toggleLock(id: string): Promise<{
        id: import("mongoose").Types.ObjectId;
        username: string;
        isActive: boolean;
    }>;
    remove(id: string): Promise<void>;
}
export {};
