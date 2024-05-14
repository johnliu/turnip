import {
  type APIInteractionResponseDeferredChannelMessageWithSource,
  type APIMessageApplicationCommandInteraction,
  ButtonStyle,
  ComponentType,
  InteractionResponseType,
  MessageFlags,
  type RESTPostAPICurrentUserCreateDMChannelResult,
  RouteBases,
  Routes,
} from 'discord-api-types/v10';
import type { Context } from 'hono';

import type { Bindings } from '@/constants';
import { assertNotNull } from '@/utils/types';

export async function handleDebugMessage(
  interaction: APIMessageApplicationCommandInteraction,
  c: Context<{ Bindings: Bindings }>,
): Promise<APIInteractionResponseDeferredChannelMessageWithSource> {
  const userId = assertNotNull(interaction.member?.user.id ?? interaction.user?.id);

  const updateWebhook = async () => {
    const resolved = interaction.data.resolved.messages[interaction.data.target_id];

    const createPrivateChannelResponse = await fetch(RouteBases.api + Routes.userChannels(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        recipient_id: userId,
      }),
    });

    const privateChannelData =
      await createPrivateChannelResponse.json<RESTPostAPICurrentUserCreateDMChannelResult>();

    const formData = new FormData();
    formData.append(
      'payload_json',
      JSON.stringify({
        attachments: [{ id: 0, filename: 'message.json' }],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: 'Original Message',
                url: `https://discord.com/channels/${interaction.guild_id ?? '@me'}/${
                  resolved.channel_id
                }/${resolved.id}`,
              },
            ],
          },
        ],
      }),
    );
    formData.append(
      'files[0]',
      new Blob([JSON.stringify(resolved, null, 4)], { type: 'application/json' }),
      'message.json',
    );

    await fetch(RouteBases.api + Routes.channelMessages(privateChannelData.id), {
      method: 'POST',
      headers: {
        Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}`,
      },
      body: formData,
    });

    await fetch(
      RouteBases.api +
        Routes.webhookMessage(c.env.DISCORD_APPLICATION_ID, interaction.token, '@original'),
      {
        method: 'DELETE',
      },
    );
  };

  c.executionCtx.waitUntil(updateWebhook());

  return {
    type: InteractionResponseType.DeferredChannelMessageWithSource,
    data: {
      flags: MessageFlags.Ephemeral,
    },
  };
}
