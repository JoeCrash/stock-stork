import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    } | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null } as any;
}

export const connectToDatabase = async () => {
    /* Ensure we don't constantly make new connections, vital for 'next.js' development (which reloads on every change) */

    if (cached!.conn) return cached!.conn;
    if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined in .env file");

    if (!cached!.promise) {
        cached!.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (err) {
        cached!.promise = null as any;
        throw err;
    }

    if (process.env.NODE_ENV !== "test") {
        console.log(`Connected to MongoDB - ${process.env.NODE_ENV} \n ${MONGODB_URI}`);
    }

    return cached!.conn;
};

export default connectToDatabase;