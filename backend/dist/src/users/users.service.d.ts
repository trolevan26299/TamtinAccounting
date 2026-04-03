import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
export declare class UsersService implements OnModuleInit {
    private userModel;
    private readonly logger;
    constructor(userModel: Model<UserDocument>);
    onModuleInit(): Promise<void>;
    private seedDefaultUser;
    findByUsername(username: string): Promise<UserDocument | null>;
    updateLastLogin(id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, User, {}, {}> & User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, User, {}, {}> & User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    findAll(): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, User, {}, {}> & User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createUser(username: string, password: string, fullName?: string): Promise<{
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
    deleteUser(id: string): Promise<void>;
}
