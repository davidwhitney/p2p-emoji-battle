import { assertConfiguration, ChannelParameters } from "@ably-labs/react-hooks";
import { usePresence } from "@ably-labs/react-hooks";
import { Types } from "ably";
import { useState } from "react";

interface StateEnvelope {
    leader: boolean;
    state: any;
}

const sortByConnectionId = (a: Types.PresenceMessage, b: Types.PresenceMessage) => (a.connectionId as any) - (b.connectionId as any);

export type LeaderStateUpdateFunction<T> = (state: T) => void;
export type LeaderStateUpdateCallback<T> = (arg0: T) => void;
export type UseStateResponse<T> = [T, LeaderStateUpdateFunction<T>, boolean];

export function usePeerSharedState<T = any>(channelNameOrNameAndOptions: ChannelParameters, defaultLeaderState: T, onElection: LeaderStateUpdateCallback<T>): UseStateResponse<T> {
    const ably = assertConfiguration();

    const [leaderId, setLeaderId] = useState("");
    const [leaderData, setLeaderData] = useState<T>(defaultLeaderState);
    const [requiresElectionBroadcast, setRequiresElectionBroadcast] = useState(false);

    const channelName = typeof channelNameOrNameAndOptions === 'string'
        ? channelNameOrNameAndOptions
        : channelNameOrNameAndOptions.channelName;

    const channel = typeof channelNameOrNameAndOptions === 'string'
        ? ably.channels.get(channelName)
        : ably.channels.get(channelName, channelNameOrNameAndOptions.options);

    const initalState: StateEnvelope = { leader: false, state: null };

    const [presenceData, updateMyPresence] = usePresence(channelName, initalState, async (message) => {
        if (message?.data?.leader) {
            setLeaderData(message.data.state);
        }

        const members = await channel.presence.get();
        const leader = members.find(s => s.data.leader === true);

        if (leader) {
            setLeaderId(leader?.clientId + "");
            return;
        }

        const sortedMembers = members.sort(sortByConnectionId);
        const hasBeenElected = sortedMembers[0].clientId + "" === ably.auth?.clientId + "";

        if (hasBeenElected) {
            setLeaderId(ably.auth?.clientId + "");
            updateMyPresence({ leader: true, state: leaderData });
            setRequiresElectionBroadcast(true);
        }
    });

    if (requiresElectionBroadcast) {
        setRequiresElectionBroadcast(false);
        onElection(leaderData);
    }

    const leaderUpdateFunction = (state: T) => {
        const isLeader = leaderId === ably.auth?.clientId + "";
        updateMyPresence({ leader: isLeader, state: state });
    }

    const nonLeaderUpdateFunction = (state: T) => {
    }

    const isHost = leaderId === ably.auth?.clientId + "";
    const broadcastIfHost = isHost ? leaderUpdateFunction : (_: T) => { /* NOOP */ };

    return [leaderData, broadcastIfHost, isHost];

}
