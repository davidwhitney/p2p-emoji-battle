import { useChannel } from "@ably-labs/react-hooks";
import { useState } from "react";
import { usePeerSharedState } from "../../hooks/usePeerSharedState";
import { ScoreBoard } from "./ScoreBoard";
import { GameStatusBar } from "./GameStatusBar";
import { EmojiPanel } from "./EmojiPanel";
import VotingGameServer, { defaultState } from "../../util/VotingGameServer";
import Ably from "ably";

export default function Game({ gameName, playerName }) {
    const [game] = useState<VotingGameServer>(new VotingGameServer());

    const [leaderState, updateNetwork, isHost] = usePeerSharedState(gameName, defaultState, (lastLeaderState) => {
        game.setState(lastLeaderState);

        if (game.isActive && !game.isRunning) {        
            game.start();
        }
    });

    const [channel] = useChannel(gameName, (message: Ably.Types.Message) => {
        game.recordVote(message.data.value);
    }); 

    const vote = (item) => { 
        channel.publish("vote", { value: item.target.innerText }); 
    }

    game.onStateChange((state) => {
        updateNetwork(state);
        state.phase === "finished" && console.log("Game over");
    });

    const hostControls = isHost && !game.isActive && <button onClick={() => { game.resetGame() && game.start() }}>Start Game</button>;
    const emojiUi = leaderState.phase === "playing" && <EmojiPanel onEmojiClick={vote}/>
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
