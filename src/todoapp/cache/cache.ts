// import * as redis from "../storage/redis";
// import { Redis as RedisClient } from "ioredis";
import config from "../config";
import NodeCache = require("node-cache");

interface CacheConfig {
    stdTTL?: number;
    checkperiod?: number;
    useClones?: boolean;
}

export class Cache<ID, T> {

    private cache: any;
    private channel: string;
    // private sub: RedisClient;
    // private pub: RedisClient;
    // private connected: boolean = false;

    constructor(name: string, private search: (...args) => void, options?: CacheConfig) {
        this.channel = "cache:" + name;
        // this.sub = redis.create();
        // this.pub = redis.create();
    }

    public jsonCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            return value;
        };
    }

    public async find(id: any, ...args): Promise<T> {
        id = JSON.stringify(id, this.jsonCircularReplacer());
        if (this.cache/* && this.connected*/) {
            let value: T = this.cache.get(id);

            if (!value) {
                value = await this.search.call(this.search, id, ...args);
                if (value) {
                    this.cache.set(id, value);
                } else {
                    this.cache.del(id);
                }
            }

            return value;
        } else {
            return this.search.call(this.search, id, ...args);
        }
    }

    public reset(id?: any) {
        id = JSON.stringify(id, this.jsonCircularReplacer());
        if (this.cache) {
            if (id) {
                this.cache.del(id);
            } else {
                this.cache.flushAll();
            }
        }
    }

}
