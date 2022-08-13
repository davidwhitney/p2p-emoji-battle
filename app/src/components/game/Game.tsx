import { useChannel } from "../../hooks/useChannel";
import { usePresence } from "@ably-labs/react-hooks";
import { BaseSyntheticEvent, useState } from "react";
import { useLeaderElection } from "../../hooks/useLeaderElection";
import { ScoreBoard } from "./ScoreBoard";
import { GameStatusBar } from "./GameStatusBar";
import { EmojiPanel } from "./EmojiPanel";
import VotingGameServer, { GameState } from "../../util/VotingGameServer";
import Ably from "ably";

export default function Game({ gameName, playerName }) {
    const [isHost, setIsHost] = useState<boolean>(false);
    const [game, setGame] = useState(new VotingGameServer());
    const [presenceData, updatePresence] = usePresence<GameState>(gameName, game.gameState);
   
    const leaderId = useLeaderElection(gameName, () => { 
        setIsHost(true);
        setGame(new VotingGameServer());

        // TODO: Replicate last received state and resume game.
        // At the moment we just reset the game when the leader leaves.
    });

    const [channel] = useChannel(gameName, (message: Ably.Types.Message) => {
        isHost && updatePresence(game.logVote(message.data.value));
    });    

    const vote = (item: BaseSyntheticEvent) => {
        channel.publish("vote", { value: item.target.innerText });
    }
    
    const startGame = () => {  
        game.start((state) => {
            updatePresence(state);

            if (game.gameState.phase === "finished") {
                console.log("Game over");
            }
        });
    }

    console.log("leaderId", leaderId);
    const leaderData = presenceData.find(x => x.clientId === leaderId)?.data;
    const hostControls = isHost && !game.isActive && <button onClick={startGame}>Start Game</button>;
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


