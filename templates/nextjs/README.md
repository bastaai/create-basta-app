# First steps

```bash
$: pnpm install

$: pnpm dev
```

to see an example with mock data.

## Setting up your own account

Please refer to [basta docs](https://docs.basta.app/) for how to setup/get your account id and api token.

The [BastaJS SDK](https://github.com/bastaai/basta-js) this project uses requires certain headers to be in place to query data relative to your account. For this you need to setup an `.env` file at the root of the project with the following fields:

```yaml
ACCOUNT_ID="<your-account-id-here>"
API_KEY="<your-api-key-key>"
```

Once that's done, the current example project should pick up the env and show results based on your account (if you already have the `dev` script running you might need to restart it).

## About this starter

This project was setup using the latest NextJS app router and our custom built sdk for basta. It's lean and easy to get started with so feel free to keep whatever you like and throw the rest away. Not all of the UI elements might work or do as advertised but you should be able to click through the auctions list all the way down to the lot page as an example of how an auctions experience might look like.

# And finally

Connect this with a repository to keep everything in sync with your colleagues.
Update this readme for whatever needs you might have for it. New commands, explaining deployments etc etc. Good luck 🖖
