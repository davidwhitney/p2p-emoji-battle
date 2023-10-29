import { useReducer, useState } from "react";
import { usePeerSharedState } from "../../hooks/usePeerSharedState";
import { useChannel } from "@ably-labs/react-hooks";
import Ably from "ably";

export default function Index({ channelName, playerName }) {
    
    const [hostValue, updateCounter] = useState(0);
    const [broadcastRequired, setBroadcastRequired] = useState(false);

    const [sharedState, updateIfHost, isHost] = usePeerSharedState(channelName, hostValue, (lastLeaderState) => {
        updateCounter(lastLeaderState);
    });

    const [channel] = useChannel(channelName, (message: Ably.Types.Message) => {
        updateCounter((current) => {
            return current + 1;
        });

        setBroadcastRequired(true);
    });

    if (broadcastRequired) {
        setBroadcastRequired(false);
        updateIfHost(hostValue);
    }

    const increment = () => { 
        channel.publish("vote", { }); 
    }

    return (
        <div>
            GameUi: {channelName} {playerName} `{isHost ? "leader" : "not leader"}`<br />
            Current Value: {sharedState}<br/>
            <button onClick={increment}>Increment</button>
        </div>
    );
}
