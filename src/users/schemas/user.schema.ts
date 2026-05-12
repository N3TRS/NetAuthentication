import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {

    @Prop()
    name!: string;

    @Prop({ unique: true, required: true })
    email!: string;

    @Prop({ required: false })
    password?: string;

    @Prop({ default: 'user' })
    role!: string;

    @Prop({ default: 'local' })
    authProvider!: string;

    @Prop({ required: false })
    githubId?: string;

    @Prop({ required: false })
    githubAccessToken?: string;

    @Prop({ required: false })
    githubUsername?: string;

    @Prop({ required: false })
    avatarUrl?: string;

    @Prop({ required: false, select: false })
    passwordResetToken?: string;

    @Prop({ required: false, select: false })
    passwordResetExpires?: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);