import { GameState } from "../../util/VotingGameServer";

export function ScoreBoard({ gameState }: { gameState: GameState; }) {
    const scoreBoard = gameState.votes.map(voteState => {
        return <li key={voteState.value}>{voteState.value}: {voteState.count}</li>;
    }).reverse();

    return (<>
        <ul>
            {scoreBoard}
        </ul>
    </>);
}
