import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: '' })
  fullName: string;

  @Prop({ enum: ['admin', 'user'], default: 'user' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
