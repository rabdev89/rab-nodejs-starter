import config from "../config";
const mongoose = require('mongoose');

interface DBConfig {
    maxIdleTime: number;
    maxConnections: number;
    connections: string;
    database: string;
    password: string;
    host: string;
    port: number;
    user: string;
}

export class createConnection {

    public static async initConnection() {
        await createConnection.connect(config.db.connections);
    }

    public static async connect(connStr: string) {
        return mongoose.connect(connStr ,{useNewUrlParser: true,  useUnifiedTopology: true})
            .then(() => {
                console.log(`Successfully connected to ${connStr}`);
            })
            .catch((error) => {
                console.error("Error connecting to database: ", error);
                return process.exit(1);
            });
    }

    public static async setAutoReconnect() {
        mongoose.connection.on("disconnected", () => createConnection.connect(config.db.connections));
    }

    public static async disconnect() {
        await mongoose.connection.close();
    }

}

