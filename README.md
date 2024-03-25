turnip
======

An example discord app using user-installed interactions. Install this app to your account [here](https://discord.com/oauth2/authorize?client_id=1214808884687011840).

This app is intended to be deployed to Cloudflare workers, and uses D1 for state.



Development
-----------

This app uses [devbox](https://www.jetpack.io/devbox/docs/) to manage the developer environment. Install devbox and then run `devbox shell`. This will enter the dev environment and install all required dependencies.

```sh
$ devbox shell

Ensuring packages are installed.
[1/4] lefthook@latest
[1/4] lefthook@latest: Success
[2/4] cloudflared@latest
[2/4] cloudflared@latest: Success
[3/4] bun@latest
[3/4] bun@latest: Success
[4/4] nodejs@latest
[4/4] nodejs@latest: Success
✓ Computed the Devbox environment.
Starting a devbox shell...
sync hooks: ✔️ (pre-commit)
```


### Set Up

To get started with this example app, you'll need to first create a Discord application in the [developer portal](https://discord.com/developers/applications).

You'll then need to copy four files and fill out the environment variables:

- `.env.example` -> `.env` -- this contains all environment variables, will contain some duplicates from other files
- `.dev.vars.example` -> `.dev.vars` -- secrets used locally by miniflare during development
- `secrets.example.json` -> `secrets.json` -- used to upload production secrets to cloudflare, this should match what's in `.dev.vars`
- `wrangler.example.toml` -> `wrangler.toml` -- configuration file for the worker, only really contains the D1 database id


### Local Development

To run Turnip locally, first start a tunnel

```sh
$ bun tunnel
...
2024-03-25T12:16:10Z INF +--------------------------------------------------------------------------------------------+
2024-03-25T12:16:10Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2024-03-25T12:16:10Z INF |  https://<generated-url>.trycloudflare.com                                                 |
2024-03-25T12:16:10Z INF +--------------------------------------------------------------------------------------------+
...
```

In another terminal, start the app's webserver:

```sh
$ bun dev
 ⛅️ wrangler 3.34.2 (update available 3.37.0)
-------------------------------------------------------
Using vars defined in .dev.vars
Your worker has access to the following bindings:
- D1 Databases:
  - db: turnip (<database-id>)
- Vars:
  - DISCORD_APPLICATION_ID: "(hidden)"
  - DISCORD_PUBLIC_KEY: "(hidden)"
  - DISCORD_BOT_TOKEN: "(hidden)"
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:3000
```

Copy the address created from the quick tunnel and run in another terminal:

```sh
$ bun scripts update-application https://<generated-url>.trycloudflare.com
...
```

This will update the interaction endpoint url for the app.

When first getting started, you'll need to run migrations to ensure the local database tables exist, by running: `bun migrations`:

```sh
$ bun migrations
 ⛅️ wrangler 3.34.2 (update available 3.37.0)
-------------------------------------------------------
...
```

Now you can install the app and send commands to your local server.


### Deploying to Cloudflare

You can deploy the worker to Cloudflare using `bun run deploy`.

```sh
$ bun run deploy
 ⛅️ wrangler 3.34.2 (update available 3.37.0)
-------------------------------------------------------
Your worker has access to the following bindings:
- D1 Databases:
  - db: turnip (<database-id>)
Total Upload: 367.37 KiB / gzip: 62.49 KiB
Uploaded turnip (1.58 sec)
Published turnip (0.27 sec)
  https://<worker-url>.workers.dev
Current Deployment ID: <deployment-id>
```

After your first deploy, make sure you upload your secrets using `bun wrangler secret:bulk secrets.json`.

```sh
$ bun wrangler secret:bulk secrets.json
 ⛅️ wrangler 3.34.2 (update available 3.37.0)
-------------------------------------------------------
🌀 Creating the secrets for the Worker "turnip"
✨ Successfully created secret for key: DISCORD_APPLICATION_ID
✨ Successfully created secret for key: DISCORD_PUBLIC_KEY
✨ Successfully created secret for key: DISCORD_BOT_TOKEN

Finished processing secrets JSON file:
✨ 3 secrets successfully uploaded
```

Also make sure to apply migrations to the D1 database `bun migrations --remote`.

```sh
$ bun migrations
 ⛅️ wrangler 3.34.2 (update available 3.37.0)
-------------------------------------------------------
...
```

Lastly, you'll want to update your interactions callback url to the deployed url:

```sh
$ bun scripts update-application https://<worker-url>.workers.dev
...
```

Now your interactions will route to the cloudflare worker.
