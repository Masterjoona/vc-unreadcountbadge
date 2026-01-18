/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findComponentByCodeLazy, findStoreLazy } from "@webpack";
import { ReadStateStore, useStateFromStores } from "@webpack/common";
import typingIndicator from "plugins/typingIndicator";

const UserGuildSettingsStore = findStoreLazy("UserGuildSettingsStore");
const JoinedThreadsStore = findStoreLazy("JoinedThreadsStore");
const NumberBadge = findComponentByCodeLazy("numberBadge", "renderBadgeCount");

const settings = definePluginSettings({
    showOnMutedChannels: {
        description: "Show unread count on muted channels",
        type: OptionType.BOOLEAN,
        default: false,
    },
    notificationCountLimit: {
        description: "Show +100 instead of the true unread count when it exceeds 100",
        type: OptionType.BOOLEAN,
        default: false,
    },
});

export default definePlugin({
    name: "UnreadCountBadge",
    authors: [Devs.Joona],
    description: "Shows unread message count badges on channels in the channel list",
    settings,

    patches: typingIndicator.patches.map(p => ({
        find: p.find,
        replacement: {
            match: p.replacement.match,
            replace: p.replacement.replace.replaceAll("TypingIndicator", "UnreadCountBadge")
        }
    })),

    UnreadCountBadge: (channelId: string, guildId: string) => {
        const unreadCount = useStateFromStores([ReadStateStore], () => ReadStateStore.getUnreadCount(channelId), []);
        if (!unreadCount) return null;

        if (!settings.store.showOnMutedChannels && (UserGuildSettingsStore.isChannelMuted(guildId, channelId) || JoinedThreadsStore.isMuted(channelId)))
            return null;

        return (
            <ErrorBoundary noop>
                <NumberBadge
                    color="var(--control-primary-background-default)"
                    className="vc-unreadcountbadge"
                    count={
                        unreadCount > 100 && settings.store.notificationCountLimit
                            ? "+100"
                            : unreadCount
                    }
                />
            </ErrorBoundary>
        );
    },
});
