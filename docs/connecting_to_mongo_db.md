### Here’s where the step‑by‑step DB connection instructions are
- They’re in my previous reply (the one that added the health-check endpoint). For convenience, I’ve copied them below so you don’t have to hunt for them.

### Step-by-step: Test your MongoDB connection
1) Set your environment variable
    - Open `D:\Apps\tickerpilot\.env` and ensure you have a line like:
      ```
      MONGODB_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>/<DB_NAME>?retryWrites=true&w=majority&appName=<APP_NAME>
      ```
    - Replace placeholders with your real credentials and confirm your IP is allowed in MongoDB Atlas.

2) Start the dev server
    - From a terminal in `D:\Apps\tickerpilot` run:
      ```
      npm run dev
      ```
    - Wait until Next.js reports it’s ready at `http://localhost:3000`.

3) Call the DB health endpoint
    - Browser: open `http://localhost:3000/api/db`
    - Or PowerShell:
      ```
      curl http://localhost:3000/api/db
      ```
    - Expected success example:
      ```
      { "ok": true, "driver": "mongoose", "host": "ac-xyz.mongodb.net", "name": "your_db", "readyState": 1 }
      ```
      Note: `readyState: 1` means connected.

4) Troubleshooting common errors
    - `MONGODB_URI is not defined in .env file` → Add `MONGODB_URI` to `.env`, then restart the dev server.
    - Authentication failed → Check username/password and that the user has access to the specified database.
    - `getaddrinfo ENOTFOUND` / DNS errors → Verify your SRV connection string and internet/DNS.
    - `ECONNREFUSED` / `ETIMEDOUT` → Ensure your IP is in the Atlas IP Access List and no firewall is blocking.
    - TLS/SSL errors → Use the SRV URI from Atlas with default TLS settings.

5) Optional: Production check
    - Build and start:
      ```
      npm run build
      npm run start
      ```
    - Then visit the same endpoint: `http://localhost:3000/api/db`

### Where this lives in your codebase
- Connection helper: `D:\Apps\tickerpilot\database\mongoose.ts` (exports `connectToDatabase` with a safe global cache for Mongoose)
- Health-check API route: `D:\Apps\tickerpilot\app\api\db\route.ts` (responds with `ok`, `host`, `name`, and `readyState`)

If you’d like, I can also outline a quick UI page that pings `/api/db` and shows the status on load.