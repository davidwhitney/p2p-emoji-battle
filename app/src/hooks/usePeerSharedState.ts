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

    const [leaderId, setLeaderId] = useState<string | undefined>(undefined);
    const [lastKnownLeaderData, setLastKnownLeaderData] = useState<T>(defaultLeaderState);
    const [newLeaderWasElected, setNewLeaderWasElected] = useState(false);

    const channelName = typeof channelNameOrNameAndOptions === 'string'
        ? channelNameOrNameAndOptions
        : channelNameOrNameAndOptions.channelName;

    const channel = typeof channelNameOrNameAndOptions === 'string'
        ? ably.channels.get(channelName)
        : ably.channels.get(channelName, channelNameOrNameAndOptions.options);

    const initalState: StateEnvelope = { leader: false, state: null };

    const [presenceData, updateStatus] = usePresence(channelName, initalState, async (message) => {
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
        console.info("This peer is now the leader.");

        setNewLeaderWasElected(false);
        updateStatus({ leader: true, state: lastKnownLeaderData });
        onElection(lastKnownLeaderData);
    }

    const leaderUpdateFunction = (state: T) => {
        updateStatus({ leader: true, state: state });
    }

    const notLeaderUpdateFunction = (state: T) => {
        // NOOP
        // Perhaps in dev mode...
        // console.info("Updated invoked by non-leader, skipped. You can supress this message by checking isHost before invocation.");
    }

    const isHost = leaderId == ably.auth.clientId;
    const sharedState = lastKnownLeaderData;
    const broadcastIfHost = isHost ? leaderUpdateFunction : notLeaderUpdateFunction;
    return [sharedState, broadcastIfHost, isHost];

}
