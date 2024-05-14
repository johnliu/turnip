import dedent from 'dedent';
import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';
import { inflect } from 'inflection';

import type { TurnipCount } from '@/models/queries/turnip';
import { DEFAULT_EMBED_COLOR, DEFAULT_THUMBNAIL_URL, ResponseBuilder } from '@/views/base';

export function renderInventory(
  userId: string,
  turnipCounts: TurnipCount[],
): APIInteractionResponseChannelMessageWithSource {
  const total = turnipCounts.reduce((total, count) => total + count.count, 0);

  const embedBuilder = new ResponseBuilder()
    .addEmbed()
    .withColor(DEFAULT_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL);

  const header = `### <@${userId}>'s Inventory`;

  if (total <= 1) {
    embedBuilder.withFooter('Try foraging or harvesting for some turnips.');

    if (total === 0) {
      embedBuilder.withDescription(
        dedent`
          ${header}

          ...There's nothing here :grimacing:
        `,
      );
    }

    if (total === 1) {
      embedBuilder.withDescription(
        dedent`
          ${header}

          You have a single turnip. Just enough for today's meal.
        `,
      );
    }
  } else {
    embedBuilder.withDescription(
      dedent`
        ${header}

        You have ${total} ${inflect('turnips', total)}.
      `,
    );
  }

  if (turnipCounts.length > 1) {
    for (const turnipCount of turnipCounts) {
      embedBuilder.addField({
        name: 'Standard',
        value: `🧅 x${turnipCount.count}`,
        inline: turnipCounts.length > 1,
      });
    }
  }

  return embedBuilder.complete().build();
}
