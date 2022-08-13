import { GameState } from "../../util/VotingGameServer";

export type GameStatusBarProps = {
    gameName: string;
    playerName: string;
    isHost: boolean;
    game: GameState;
}


export function GameStatusBar({ gameName, playerName, isHost, game }: GameStatusBarProps) {
    return (
        <div>
            GameUi: {gameName} {playerName} `{isHost ? "leader" : "not leader"}`<br />
            Time remaining: {game?.timeRemaining}
        </div>
    );
}
