const mongoose = require('mongoose');
import {UserAttrs} from "../entities/user";

export function mapUserAttrs(userAttrs?: UserAttrs): UserAttrs {
    userAttrs = userAttrs || {} as UserAttrs;

    return {
        isPrivateProfile: ("isPrivateProfile" in userAttrs ? !!userAttrs.isPrivateProfile : false),
        userEmail: ("userEmail" in userAttrs ? userAttrs.userEmail : false),
        passResetAttempts: ("passResetAttempts" in userAttrs && Array.isArray(userAttrs.passResetAttempts)
            ? userAttrs.passResetAttempts : []),
        passUpdateAttempts: ("passUpdateAttempts" in userAttrs && Array.isArray(userAttrs.passUpdateAttempts)
            ? userAttrs.passUpdateAttempts : []),
        activationAttempts: ("activationAttempts" in userAttrs && Array.isArray(userAttrs.activationAttempts)
            ? userAttrs.activationAttempts : []),
        facebookId: ("facebookId" in userAttrs ? userAttrs.facebookId : null),
        googleId: ("googleId" in userAttrs ? userAttrs.googleId : null),
        activation: ("activation" in userAttrs ? userAttrs.activation === true : false),
    } as UserAttrs;
}

export interface UserRowUpdate {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    birthDay?: string;
    phone?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isActive?: boolean;
    userAttrs?: UserAttrs;
}

export interface UserRow {
    _id?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDay: string;
    phone: string;
    male: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    userAttrs?: UserAttrs;
}

// let model: mongoose.Model<UserRow>;

export enum UsersTable {
    id = "id",
    email = "email",
    password = "password",
    first_name = "first_name",
    last_name = "last_name",
    created_at = "created_at",
    updated_at = "updated_at",
    is_active = "is_active",
    birth_day = "birth_day",
    phone = "phone",
    user_attrs = "user_attrs",
    is_anonymous = "is_anonymous",
}

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, allowNull: false },
    firstName: { type: String, required: true, allowNull: false, primaryKey: false },
    lastName: { type: String, required: true, allowNull: false, primaryKey: false },
    password: { type: String, required: true, allowNull: false, primaryKey: false },
    phone: { type: String, required: true, allowNull: true, primaryKey: false },
    isActive: { type: Boolean, required: true, allowNull: true, primaryKey: false },
    userAttrs: { type: mongoose.Schema.Types.Mixed, allowNull: true },
});

// export function getUserModel(): mongoose.Model<UserRow, UserRow> {
//     if (!model) {
//         model = mongoose.Model<UserRow>('User', UserSchema);
//     }
//     return model;
// }

export const User =  mongoose.model('User', UserSchema);
