import { useChannel } from "ably/react";
import { useState } from "react";
import { usePeerSharedState } from "../../hooks/usePeerSharedState";
import VotingGameServer, { GameState } from "./VotingGameServer";
import Ably from "ably";

export default function Index({ channelName, playerName }) {
    const [game] = useState(new VotingGameServer());

    const [sharedState, updateState, isHost] = usePeerSharedState(channelName, game.gameState);
    const { channel } = useChannel(channelName, (message: Ably.Types.Message) => {
        game.recordVote(message.data.value);
    });
    
    game.onStateChange((state) => { 
        updateState(state);
    });

    const vote = (item) => { 
        channel.publish("vote", { value: item.target.innerText }); 
    }

    const voteItems = [ "Item 1", "Item 2", "Item 3", "Item 4" ];

    const hostControls = isHost && !game.isActive && <button onClick={() => { game.resetGame() && game.start() }}>Start Game</button>;
    const voteUi = sharedState.phase === "playing" && <VotePanel onVoteClick={vote} items={voteItems}/>
    const scores = sharedState && <ScoreBoard gameState={sharedState} />;

    return (
        <>
            <GameStatusBar gameName={channelName} playerName={playerName} isHost={isHost} game={sharedState} />
            {hostControls}
            {voteUi}
            {scores}
        </>
    );
}

type GameStatusBarProps = { gameName: string; playerName: string; isHost: boolean; game: GameState; }

function GameStatusBar({ gameName, playerName, isHost, game }: GameStatusBarProps) {
    return (
        <div>
            GameUi: {gameName} {playerName} `{isHost ? "leader" : "not leader"}`<br />
            Time remaining: {game?.timeRemaining}
        </div>
    );
}

function VotePanel({ onVoteClick, items }) {
    return (
        <div>
            {items.map((i: any) => (<button key={i} onClick={onVoteClick}>{i}</button>))}
        </div>
    );
}

function ScoreBoard({ gameState }: { gameState: GameState; }) {
    const scoreBoard = gameState.votes.map(voteState => {
        return <li key={voteState.value}>{voteState.value}: {voteState.count}</li>;
    }).reverse();

    return (<>
        <h2>Scores</h2>
        <ul>
            {scoreBoard}
        </ul>
    </>);
}
