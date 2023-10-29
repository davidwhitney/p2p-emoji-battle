import { usePeerSharedState } from "../../hooks/usePeerSharedState";
import { useChannel } from "ably/react";

export default function Index({ channelName, playerName }) {    
    const [state, updateState, isHost] = usePeerSharedState(channelName, 0);
    const { channel } = useChannel(channelName, () => {
        updateState((current) => { return current + 1; });
    });
    
    const increment = () => { 
        channel.publish("vote", { }); 
    }

    return (
        <div>
            GameUi: {channelName} {playerName} `{isHost ? "leader" : "not leader"}`<br />
            Current Value: {state}<br/>
            <button onClick={increment}>Increment</button>
        </div>
    );
}
