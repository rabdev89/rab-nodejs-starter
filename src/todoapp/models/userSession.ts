const mongoose = require('mongoose');
import {UserRow} from "./user";

export interface UserSessionAttrs {
    currencyId?: number;
    languageId?: number;
    currencyCode?: string;
    languageCode?: string;
    languageName?: string;
    userDetectedIP?: string;
    userDetectedCountryCode?: string;
    userDetectedCurrencyCode?: string;
    rememberMe?: boolean;
    activation?: boolean;
    secondsLeft: number;
}

export interface SessionRow {
    id?: number;
    userId?: number;
    startedAt?: Date;
    expiredAt?: Date;
    sessionAttrs?: UserSessionAttrs;
}
let model;

const UserSessionSchema = mongoose.Schema({
    id: { type: Number, required: true, primaryKey: true, autoIncrement: true, allowNull: false},
    started_at: { type: Date, unique: true,  },
    expired_at: { type: Date,  allowNull: false, },
    user_id: { type: Number, allowNull: false,  },
    session_attrs: { type: String, allowNull: false,  },
});

export function getUserSessionModel() {
    if (!model) {
        model = mongoose.model('UserSession', UserSessionSchema);
    }
    return model;
}
