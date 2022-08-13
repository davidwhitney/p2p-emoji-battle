import { useState } from "react";
import { generateName } from "../util/generateName";

type JoinProps = { onJoin: JoinCallback };
export type JoinCallback = (gameName: string, playerName: string) => void;

export default function Join({ onJoin }: JoinProps) {
    const [playerName, setPlayerName] = useState(generateName(3, "-").toLowerCase());
    const [gameName, setGameName] = useState("test-game");

    const handleJoinClick = () => {
        onJoin(gameName, playerName);
    }

    return (<>
        <div>
            Name: <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} /><br />
            Game: <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} />
        </div>
        <button type="button" className="chakra-button css-1d0ox2v" onClick={handleJoinClick}>Join Game</button>
    </> );
}