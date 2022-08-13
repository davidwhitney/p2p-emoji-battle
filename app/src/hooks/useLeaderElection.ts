import { assertConfiguration, ChannelParameters } from "@ably-labs/react-hooks";
import { usePresence } from "./usePresence";
import { Types } from "ably";
import { useEffect, useState } from "react";

interface ElectionRecord {
    clientId: string;
    leader: boolean;
}

const sortByConnectionId = (a: Types.PresenceMessage, b: Types.PresenceMessage) => (a.connectionId as any) - (b.connectionId as any);

export function useLeaderElection(channelNameOrNameAndOptions: ChannelParameters, onElection: () => void): string {
    const ably = assertConfiguration();

    const [leaderId, setLeaderId] = useState<string | undefined>(undefined);

    let channelName = typeof channelNameOrNameAndOptions === 'string'
        ? channelNameOrNameAndOptions 
        : channelNameOrNameAndOptions.channelName;

    channelName = channelName + ":elections";

    const channel = typeof channelNameOrNameAndOptions === 'string'
        ? ably.channels.get(channelName) 
        : ably.channels.get(channelName, channelNameOrNameAndOptions.options); 

    const initalState: ElectionRecord = { clientId: ably.auth.clientId, leader: false };

    const [_, updateStatus] = usePresence(channelName, initalState, async (presenceData) => {
        const members = await channel.presence.get();        
        const leader = members.find(s => s.data.leader === true);
    
        if (leader) {
            return;
        }

        const sortedMembers = members.sort(sortByConnectionId);
    
        if (sortedMembers[0].clientId === ably.auth.clientId) {
    
            updateStatus({
                clientId: ably.auth.clientId,
                leader: true
            });

            setLeaderId(ably.auth.clientId);            
            onElection();
        }
    });

    useEffect(() => {
        (async () => {
            const members = await channel.presence.get();
            const sortedMembers = members.sort(sortByConnectionId);
            
            if (sortedMembers.length > 0) {
                setLeaderId(sortedMembers[0].clientId);
            }
        })();
    }, []);

    return leaderId;

}
