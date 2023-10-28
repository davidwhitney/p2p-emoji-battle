import { useState } from 'react';
import Header from './components/Header';
import Join, { JoinCallback } from "./components/Join";
import VotingComponent from "./components/game";
import { configureAbly } from "@ably-labs/react-hooks";
import './App.css';

const clientId = Math.floor(Math.random() * 1000000) + "";

configureAbly({ authUrl: "/api/ably-token-request?clientId=" + clientId, clientId: clientId });

export default function App() {

    const [inLobby, setInLobby] = useState(true);
    const [gameName, setGameName] = useState("");
    const [playerName, setPlayerName] = useState("");

    const joinGame: JoinCallback = (gameName: string, playerName: string) => {
        console.log(`Joining game ${gameName} as ${playerName}`);
        setGameName(gameName);
        setPlayerName(playerName);
        setInLobby(false);
    };

    return (
        <div className="App">
            <Header />
            {inLobby && <Join onJoin={joinGame} />}
            {!inLobby && <VotingComponent playerName={playerName} gameName={gameName} />}
        </div>
    )
}
