// This will be removed when https://github.com/ably-labs/react-hooks/pull/17 is merged

import { Types } from "ably";
import { useEffect, useState } from 'react';
import { assertConfiguration, ChannelParameters } from "@ably-labs/react-hooks";

export type PresenceDataAndPresenceUpdateFunction<T> = [
    presenceData: PresenceMessage<T>[],
    updateStatus: (messageOrPresenceObject: T) => void
];

export type PresenceAction = "enter" | "leave" | "update";
export type OnPresenceMessageReceived<T> = (presenceData: PresenceMessage<T>, presenceAction?: PresenceAction) => void;
export type UseStatePresenceUpdate = (presenceData: Types.PresenceMessage[]) => void;

export function usePresence<T = any>(channelNameOrNameAndOptions: ChannelParameters, messageOrPresenceObject?: T, onPresenceUpdated?: OnPresenceMessageReceived<T>): PresenceDataAndPresenceUpdateFunction<T> {
    const ably = assertConfiguration();

    const channelName = typeof channelNameOrNameAndOptions === 'string'
        ? channelNameOrNameAndOptions 
        : channelNameOrNameAndOptions.channelName;

    const channel = typeof channelNameOrNameAndOptions === 'string'
        ? ably.channels.get(channelName) 
        : ably.channels.get(channelName, channelNameOrNameAndOptions.options);

    const [presenceData, updatePresenceData] = useState([]) as [Array<PresenceMessage<T>>, UseStatePresenceUpdate];

    const updatePresence = async (message: Types.PresenceMessage, presenceAction: string) => {
        const snapshot = await channel.presence.get();
        updatePresenceData(snapshot);
        
        onPresenceUpdated?.call(this, message, presenceAction);
    }

    const onMount = async () => {
        channel.presence.subscribe('enter', (e) => { updatePresence(e, "enter"); });
        channel.presence.subscribe('leave', (e) => { updatePresence(e, "leave"); });
        channel.presence.subscribe('update', (e) => { updatePresence(e, "update"); });

        await channel.presence.enter(messageOrPresenceObject);

        const snapshot = await channel.presence.get();
        updatePresenceData(snapshot);
    }

    const onUnmount = () => {
        channel.presence.leave();
        channel.presence.unsubscribe('enter');
        channel.presence.unsubscribe('leave');
        channel.presence.unsubscribe('update');
    }

    const useEffectHook = () => {
        onMount();
        return () => { onUnmount(); };
    };

    useEffect(useEffectHook, []);
    
    const updateStatus = (messageOrPresenceObject: T) => {
        channel.presence.update(messageOrPresenceObject);
    };

    return [presenceData, updateStatus];
}

interface PresenceMessage<T = any> {
    action: Types.PresenceAction;
    clientId: string;
    connectionId: string;
    data: T;
    encoding: string;
    id: string;
    timestamp: number;
}
