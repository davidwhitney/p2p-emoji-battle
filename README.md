# P2P Ably Voting Game Example with Leader Election

Create a file in `api/.env` with the following content:

```env
ABLY_API_KEY=<your-api-key>
```

Then to run locally

```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
npm install
npm run start
```

## Code

Read from `app/src/App.tsx` down.

Interesting things:

- Game logic in `app/src/util/VotingGameServer.ts`
- Leader election in `app/src/hooks/useLeaderElection.ts`
- Game UI in `app/src/components/Game.tsx`
