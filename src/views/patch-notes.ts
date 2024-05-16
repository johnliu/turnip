import { EmbedBuilder, INFO_EMBED_COLOR, ResponseBuilder } from '@/views/base';
import dedent from 'dedent';
import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';

export function injectPatchShort(
  response: APIInteractionResponseChannelMessageWithSource,
): APIInteractionResponseChannelMessageWithSource {
  response.data.embeds = [
    new EmbedBuilder()
      .withColor(INFO_EMBED_COLOR)
      .withDescription(':new: Turnip 1.0.1 is here. See `/patch-notes` for details.')
      .build(),
    ...(response.data.embeds ?? []),
  ];

  return response;
}

export function renderPatchNotes() {
  return new ResponseBuilder()
    .setEphemeral()
    .addEmbed()
    .withColor(INFO_EMBED_COLOR)
    .withDescription(
      dedent`
        ### :new: Turnip 1.0.1 Patch Notes
        - Changed harvesting behaviour slightly so you can harvest from multiple planted turnips. On average you'll get more turnips from each harvest.

        ### Turnip 1.0.0 Patch Notes

        **General Changes**
        - Giving or planting a turnip will now actually use a turnip.
        - There's no longer a cooldown on planting turnips -- you can plant as many turnips as you have!
        - The UI has been updated.
        - Existing planted turnips prior to this patch will yield one turnip each.

        **Foraging**
        - You can now \`/forage\` for turnips in the wild once every 12 hours.
        - If you don't have any turnips, I'm sure you'll be able to find some.

        **Turnip Harvesting**
        - You can now \`/harvest\` turnips after they've been planted.
        - Each planted turnip will grow into ~10 more turnips.
        - You can only harvest every from each server 30 minutes, so save some turnips for others!
      `,
    )
    .complete()
    .build();
}
