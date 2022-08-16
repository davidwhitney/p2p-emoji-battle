import { useChannel } from "../../hooks/useChannel";
import { useState } from "react";
import { useLeaderElection } from "../../hooks/useLeaderElection";
import { ScoreBoard } from "./ScoreBoard";
import { GameStatusBar } from "./GameStatusBar";
import { EmojiPanel } from "./EmojiPanel";
import VotingGameServer, { GameState } from "../../util/VotingGameServer";
import Ably from "ably";

export default function Game({ gameName, playerName }) {
    const [game] = useState<VotingGameServer>(new VotingGameServer());

    const [leaderState, isHost, updateLeaderData] = useLeaderElection(gameName, game.gameState, (lastKnownState) => {
        game.setState(lastKnownState);
    });

    const [channel] = useChannel(gameName, (message: Ably.Types.Message) => {
        isHost && updateLeaderData(game.logVote(message.data.value));
    });
    
    const startGame = () => {  
        game.start((state) => {
            updateLeaderData(state);
            state.phase === "finished" && console.log("Game over");
        });
    }

    const vote = (item) => { 
        channel.publish("vote", { value: item.target.innerText }); 
    }

    if (isHost && game.isActive && !game.isRunning) {
        startGame();
    }    

    const hostControls = isHost && !game.isActive && <button onClick={() => { game.resetGame() && startGame() }}>Start Game</button>;
    const emojiUi = leaderState?.phase === "playing" && <EmojiPanel onEmojiClick={vote}/>
    const scores = leaderState && <ScoreBoard gameState={leaderState} />;

    return (
        <>
            <GameStatusBar gameName={gameName} playerName={playerName} isHost={isHost} game={leaderState} />
            {hostControls}
            {emojiUi}
            {scores}
        </>
    );
}
