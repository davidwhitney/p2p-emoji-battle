import { ChannelParameters, useAbly, usePresence } from 'ably/react'
import { Types } from "ably";
import { useState } from "react";

interface StateEnvelope {
    leader: boolean;
    state: any;
}

const sortByConnectionId = (a: Types.PresenceMessage, b: Types.PresenceMessage) => (a.connectionId as any) - (b.connectionId as any);

type SetStateAction<S> = S | ((prevState: S) => S);

export type ReactUseStateCallback<T> = (arg0: SetStateAction<T>) => void;
export type LeaderStateUpdateFunction<T> = (state: T) => void;
export type LeaderStateUpdateCallback<T> = (arg0: T) => void;
export type UseStateResponse<T> = [T, ReactUseStateCallback<T>, boolean];

export function usePeerSharedState<T = any>(channelNameOrNameAndOptions: ChannelParameters, defaultLeaderState: T, onElection: LeaderStateUpdateCallback<T> = null): UseStateResponse<T> {
    const ably = useAbly();

    const [leaderId, setLeaderId] = useState("");
    const [leaderData, setLeaderData] = useState<T>(defaultLeaderState);

    const [broadcast, setBroadcast] = useState<boolean>(false);
    const [triggerElection, setTriggerElection] = useState<boolean>(false);

    const channelName = typeof channelNameOrNameAndOptions === 'string'
        ? channelNameOrNameAndOptions
        : channelNameOrNameAndOptions.channelName;

    const channel = typeof channelNameOrNameAndOptions === 'string'
        ? ably.channels.get(channelName)
        : ably.channels.get(channelName, channelNameOrNameAndOptions.options);

    const initalState: StateEnvelope = { leader: false, state: null };

    usePresence(channelName, initalState, async (message) => {
        if (message?.data?.leader) {
            setLeaderData(message.data.state);
        }

        const members = await channel.presence.get();
        const leader = members.find(s => s.data.leader === true);

        if (leader) {
            setLeaderId(leader?.clientId + "");
            setLeaderData(leader?.data?.state);
            return;
        }

        const sortedMembers = members.sort(sortByConnectionId);
        const hasBeenElected = sortedMembers[0]?.clientId + "" === ably.auth?.clientId + "";

        if (hasBeenElected) {
            setLeaderId(ably.auth?.clientId + "");
            setTriggerElection(true);
        }
    });


    if (triggerElection) {
        setTriggerElection(false);
        channel.presence.update({ leader: true, state: leaderData });
        onElection?.call(leaderData);
    }

    if (broadcast) {
        setBroadcast(false);
        const isLeader = leaderId === ably.auth?.clientId + "";
        channel.presence.update({ leader: isLeader, state: leaderData });
    }

    const nonLeaderUpdateFunction = (update: SetStateAction<T>) => {
        setLeaderData(update);
    }

    const leaderUpdateFunction = (update: SetStateAction<T>) => {
        setLeaderData(update);
        setBroadcast(true);
    }

    const isHost = leaderId === ably.auth?.clientId + "";
    const updateFunc = isHost ? leaderUpdateFunction : nonLeaderUpdateFunction;

    return [leaderData, updateFunc, isHost];
}
