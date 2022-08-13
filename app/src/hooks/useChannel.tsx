// This will be removed when https://github.com/ably-labs/react-hooks/pull/17 is merged

import { assertConfiguration } from "@ably-labs/react-hooks";
import { useEffect } from "react";

export function useChannel(channelNameOrNameAndOptions, ...channelSubscriptionArguments): any {
    const ably = assertConfiguration();

    const channelName = typeof channelNameOrNameAndOptions === 'string'
        ? channelNameOrNameAndOptions
        : channelNameOrNameAndOptions.channelName;
    const channel = typeof channelNameOrNameAndOptions === 'string'
        ? ably.channels.get(channelName)
        : ably.channels.get(channelName, channelNameOrNameAndOptions.options);

    const onMount = async () => {
        await channel.subscribe.apply(channel, channelSubscriptionArguments);
    };

    const onUnmount = async () => {
        await channel.unsubscribe.apply(channel, channelSubscriptionArguments);

        setTimeout(async () => {
            // If we're "really" unmounted, and have no more listeners
            // then detach the channel.
            // This copes with the fact that react frequently mounts/unmounts components.
            if (channel.listeners.length === 0) {
                await channel.detach();
            }
        }, 2500);
    };

    const useEffectHook = () => {
        onMount();
        return () => { onUnmount(); };
    };

    useEffect(useEffectHook, [channelName, ...channelSubscriptionArguments]);
    return [channel, ably];
}
