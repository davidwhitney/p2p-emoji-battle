import { assertConfiguration, ChannelParameters } from "@ably-labs/react-hooks";
import { usePresence } from "./usePresence";
import { Types } from "ably";
import { useState } from "react";

interface StateEnvelope {
    leader: boolean;
    state: any;
}

const sortByConnectionId = (a: Types.PresenceMessage, b: Types.PresenceMessage) => (a.connectionId as any) - (b.connectionId as any);

export type LeaderStateUpdateFunction<T> = (state: T) => void;
export type LeaderStateUpdateCallback<T> = (arg0: T) => void;
export type UseStateResponse<T> = [T, boolean, LeaderStateUpdateFunction<T>];

export function useLeaderElection<T = any>(channelNameOrNameAndOptions: ChannelParameters, defaultLeaderState: T, onElection: LeaderStateUpdateCallback<T>): UseStateResponse<T> {
    const ably = assertConfiguration();

    const [leaderId, setLeaderId] = useState<string | undefined>(undefined);
    const [lastKnownLeaderData, setLastKnownLeaderData] = useState<T>(null);
    const [newLeaderWasElected, setNewLeaderWasElected] = useState(false);

    let channelName = typeof channelNameOrNameAndOptions === 'string'
        ? channelNameOrNameAndOptions 
        : channelNameOrNameAndOptions.channelName;

    channelName = channelName + ":elections";

    const channel = typeof channelNameOrNameAndOptions === 'string'
        ? ably.channels.get(channelName) 
        : ably.channels.get(channelName, channelNameOrNameAndOptions.options);        
    
    const initalState: StateEnvelope = { leader: false, state: null };

    const [presenceData, updateStatus] = usePresence(channelName, initalState, async (message, presenceAction) => {
        if (message?.data?.leader) {
            setLastKnownLeaderData(message.data.state);
        }

        const members = await channel.presence.get();
        const leader = members.find(s => s.data.leader === true);  
        
        if (leader) {
            return;
        }

        const sortedMembers = members.sort(sortByConnectionId);
        const hasBeenElected = sortedMembers[0].clientId === ably.auth.clientId;
    
        if (hasBeenElected) {
            setLeaderId(ably.auth.clientId);
            setNewLeaderWasElected(true);         
        }
    });

    if (newLeaderWasElected) {
        setNewLeaderWasElected(false);
        updateStatus({ leader: true, state: lastKnownLeaderData });
        onElection(lastKnownLeaderData);
    }
    
    const leaderUpdateFunction = (state: T) => {
        updateStatus({ leader: true, state: state });
    }

    const notLeaderUpdateFunction = (state: T) => {
        console.log("Updated attempted by non-leader.");
    }

    const isHost = leaderId == ably.auth.clientId;
    const dataToReturn = lastKnownLeaderData;// || presenceData.find(s => s.data.leader === true)?.data.state; 
    const updateFunction = isHost ? leaderUpdateFunction : notLeaderUpdateFunction;
    return [ dataToReturn, isHost, updateFunction ];

}
