import { useState } from 'react';
import Header from './components/Header';
import Join, { JoinCallback } from "./components/Join";
import Component from "./components/counter";
import './App.css';

import Ably from "ably/promises";
import { AblyProvider } from 'ably/react'

const clientId = Math.floor(Math.random() * 1000000) + "";
const client = new Ably.Realtime.Promise({ authUrl: "/api/ably-token-request?clientId=" + clientId });

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
        <AblyProvider client={client}>
            <div className="App">
                <Header />
                {inLobby && <Join onJoin={joinGame} />}
                {!inLobby && <Component playerName={playerName} channelName={gameName} />}
            </div>
        </AblyProvider>
    )
}
