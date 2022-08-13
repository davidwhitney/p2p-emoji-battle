import { useChannel } from "../../hooks/useChannel";
import { usePresence } from "@ably-labs/react-hooks";
import { useState } from "react";
import { useLeaderElection } from "../../hooks/useLeaderElection";
import { ScoreBoard } from "./ScoreBoard";
import { GameStatusBar } from "./GameStatusBar";
import { EmojiPanel } from "./EmojiPanel";
import VotingGameServer, { GameState } from "../../util/VotingGameServer";
import Ably from "ably";

let lastKnownHostSnapshot: GameState | null = null;

export default function Game({ gameName, playerName }) {
    const [game] = useState<VotingGameServer>(new VotingGameServer());
    const [isHost, setIsHost] = useState<boolean>(false);
    const isHostMigration = isHost && game?.isActive && !game?.isRunning;

    const [presenceData, updatePresence] = usePresence<GameState>(gameName, game.gameState, (updatedData) => {
        lastKnownHostSnapshot = updatedData.data;
    });

    const leaderId = useLeaderElection(gameName, () => {        
        setIsHost(true);
        game.setState(lastKnownHostSnapshot);
    });

    const [channel] = useChannel(gameName, (message: Ably.Types.Message) => {
        isHost && updatePresence(game.logVote(message.data.value));
    });

    const startGame = () => {  
        game.start((state) => {
            updatePresence(state);
            state.phase === "finished" && console.log("Game over");
        });
    }

    const vote = (item) => { 
        channel.publish("vote", { value: item.target.innerText }); 
    }

    isHostMigration && startGame();

    const leaderData = presenceData.find(x => x.clientId === leaderId)?.data;
    const hostControls = isHost && !game.isActive && <button onClick={() => { game.resetGame() && startGame() }}>Start Game</button>;
    const emojiUi = leaderData?.phase === "playing" && <EmojiPanel onEmojiClick={vote}/>
    const scores = leaderData && <ScoreBoard gameState={leaderData} />;

    return (
        <>
            <GameStatusBar gameName={gameName} playerName={playerName} isHost={isHost} game={leaderData} />
            {hostControls}
            {emojiUi}
            {scores}
        </>
    );
}
