export enum EnumEnvironments {
    local = "local",
    development = "development",
    stage = "staging",
    production = "production",
}


const config = {

    siteBaseUrl: process.env.SITE_BASE_URL || "",

    environment: process.env.NODE_ENV || EnumEnvironments.development, // local, development, stage, production

    region: process.env.SERVER_REGION || "Dev-test cloud",

    server: {
        host: process.env.SERVER_HOST || null,
        port: process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 4000,
    },

    internalServer: {
        port: +process.env.INTERNAL_SERVER_PORT || 4004,
    },
    db: {
        connections: process.env.MONGODB_URL || "mongodb+srv://rabuser89:rkT2Z8khneS28VFo@cluster0-lbc6o.gcp.mongodb.net/todolist?retryWrites=true&w=majority",
        maxIdleTime: +process.env.DB_API_MAX_IDLE_TIME_MS || 30000,
        maxConnections: +process.env.DB_API_MAX_CONNECTIONS || 10,
        database: process.env.DB_API_DATABASE || '',
        user: process.env.DB_API_USER || "",
        password: process.env.DB_API_PASSWORD || "",
        host: process.env.DB_API_HOST || "db",
        port: process.env.DB_API_PORT || 5432,
    },

    cookieSessions: {
        // 1 day default value of session duration
        expiresIn: +process.env.USER_LOGIN_EXPIRES_IN || 24 * 60 * 60,
        // 30 days when user requested to remember him
        expiresInWhenRemember: +process.env.USER_REMEMBER_LOGIN_EXPIRES_IN || 30 * 24 * 60 * 60,
        secret: process.env.USER_LOGIN_SECRET || "YOWQS1r45WXivcD0oZKTW53EK2YnO8b0",
    },

    resetPassword: {
        // 24 hours default value of session duration
        expiresIn: +process.env.RESET_USER_PSW_EXPIRES_IN || 24 * 60 * 60,
    },

    hashids: {
        salt: "Project",
        alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
        alphabetLength: 8,
    },


    emailToken: {
        cronSchedule: process.env.EMAIL_SCHEDULE_CRON || "*/2 * * * * *", // Every 2 seconds
        algorithm: process.env.EMAIL_TOKEN_ALGORITHM || "HS512",
        issuer: process.env.EMAIL_TOKEN_ISSUER || "pif",
        // 1 day by default
        expiresIn: +process.env.EMAIL_TOKEN_ISSUER_EXPIRES_IN || 24 * 60 * 60,
        secret: process.env.EMAIL_TOKEN_SECRET || "",
    },

    smtp: {
        host: process.env.SMTP_HOST || "smtp.mailtrap.io",
        port: process.env.SMTP_PORT || 2525,
        secure: process.env.SMTP_SECURE ? JSON.parse(process.env.SMTP_SECURE) : false,
        requireTLS: process.env.SMTP_REQUIRE_TLS ? JSON.parse(process.env.SMTP_REQUIRE_TLS) : true,
        auth: {
            user: process.env.SMTP_USER || "",
            pass: process.env.SMTP_PASSWORD || "",
        },
    },

    googleAPI: {
        key: process.env.GOOGLE_API_KEY || "",
        uriDetails: "https://maps.googleapis.com/maps/api/place/details/json",
        uriTextSearch: "https://maps.googleapis.com/maps/api/place/textsearch/json",
        uriNearBySearch: "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        uriGeoCode: "https://maps.googleapis.com/maps/api/geocode/json",
        uriAnalyticsReportsBatchGet: "https://analyticsreporting.googleapis.com/v4/reports:batchGet",
        // google auth
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
        // googleapis Google Analytics
        gaViewId: process.env.GOOGLE_GA_VIEW_ID || "", // https://ga-dev-tools.appspot.com/account-explorer/
        serviceAccountClientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || "",
        serviceAccountPrivateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "",
    },

    logLevel: process.env.LOG_LEVEL || "debug",

    awsInfo: {
        baseUrl: process.env.AWS_BASE_URL || "https://{{AWS_BUCKET}}.s3.amazonaws.com",
        bucket: process.env.AWS_BUCKET,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },


    stripe: {
    },

    payPal: {
    },

    expansions: {
        image: [
            "bmp",
            "jpeg",
            "jpg",
            "gif",
            "png",
            "pcx",
            "raw",
            "webp",
            "svg",
            "tif",
            "tiff",
        ],
        docs: [
            "doc",
            "docx",
            "xls",
            "xlsx",
            "pdf",
        ],
        video: [
            "mp4",
            "avi",
            "mov",
            "3gp",
            "swf",
            "wmv",
            "flv",
            "webm",
            "w3c",
            "m4v",
            "vob",
            "m4a",
            "mkv",
            "3g2",
        ],
    },

    maxBigintValue: 9223372036854775807,
    maxIntegerValue: 2147483647,


    cache: {
        ttl: +process.env.CACHE_TTL || 60,
        checkPeriod: +process.env.CACHE_CHECK_PERIOD || 60,
    },

    settingsCache: {
        ttl: +process.env.SETTINGS_CACHE_TTL || 60,
        checkPeriod: +process.env.SETTINGS_CACHE_CHECK_PERIOD || 60,
    },


    countriesCache: {
        ttl: +process.env.COUNTIRES_CACHE_TTL || 3600,
        checkPeriod: +process.env.COUNTIRES_CACHE_CHECK_PERIOD || 3600,
    },

    emailTemplatesCache: {
        ttl: +process.env.EMAIL_TEMPLATES_CACHE_TTL || 600,
        checkPeriod: +process.env.EMAIL_TEMPLATES_CACHE_CHECK_PERIOD || 600,
    },

    notificationTemplatesCache: {
        ttl: +process.env.NOTIFICATION_TEMPLATES_CACHE_TTL || 600,
        checkPeriod: +process.env.NOTIFICATION_TEMPLATES_CACHE_CHECK_PERIOD || 600,
    },

    basicAuthentication: process.env.BASIC_AUTHENTICATION || "",

    resendActivation: {
        // allowed time to resend activation link must be 60 minutes
        allowedTime: 1 * 60 * 60,
    },

};

export default config;
