import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';

import type { SurveyCount } from '@/models/queries/guild-turnip';
import { durationShort } from '@/utils/humanize';
import {
  DEFAULT_EMBED_COLOR,
  DEFAULT_THUMBNAIL_URL,
  type EmbedBuilder,
  ResponseBuilder,
  SAD_THUMBNAIL_URL,
  renderUnexpectedError,
} from '@/views/base';
import dedent from 'dedent';

export function addSurveyCount(builder: EmbedBuilder, surveyCount: SurveyCount | null) {
  if (surveyCount == null) {
    return builder;
  }

  const now = new Date().getTime();

  if (surveyCount.guildPlantedCount > 0) {
    builder.addField({
      name: 'Total Planted',
      value: `:onion: x${surveyCount.guildPlantedCount}`,
      inline: true,
    });
  }

  if (surveyCount.userPlantedCount > 0) {
    builder.addField({
      name: 'You Planted',
      value: `:farmer: x${surveyCount.userPlantedCount}`,
      inline: true,
    });
  }

  if (surveyCount.remainingHarvestsCount > 0) {
    builder.addField({
      name: 'Harvestable Turnips',
      value: `:onion: x${surveyCount.remainingHarvestsCount}`,
      inline: true,
    });
  }

  if (surveyCount.unripeTurnips.length > 0) {
    let unripeCount = surveyCount.unripeTurnips.reduce((c, t) => c + t.harvestsRemaining, 0);

    let i: number;
    for (i = 0; i < Math.min(surveyCount.unripeTurnips.length, 3); i++) {
      const turnip = surveyCount.unripeTurnips[i];
      const remainingHarvestDuration = durationShort(turnip.harvestableAt - now);
      builder.addField({
        name: '',
        value: `:seedling: x${turnip.harvestsRemaining} in **${remainingHarvestDuration}**`,
        inline: false,
      });

      unripeCount -= turnip.harvestsRemaining;
    }

    if (unripeCount > 0) {
      builder.addField({
        name: '',
        value: `:seedling: +${unripeCount} more`,
        inline: false,
      });
    }
  }

  return builder;
}

export function renderSurvey(surveyCount: SurveyCount) {
  const builder = new ResponseBuilder().addEmbed().withColor(DEFAULT_EMBED_COLOR);

  let description = '';
  let thumbnail = DEFAULT_THUMBNAIL_URL;
  if (surveyCount.guildPlantedCount === 0) {
    description = "It's pretty barren. You should plant some turnips here.";
    thumbnail = SAD_THUMBNAIL_URL;
  } else if (surveyCount.guildPlantedCount === surveyCount.userPlantedCount) {
    description = 'You planted all the turnips here. Get some friends to help!';
  } else if (surveyCount.userPlantedCount / surveyCount.guildPlantedCount > 0.5) {
    description = 'You planted most of the turnips here.';
  }

  addSurveyCount(builder, surveyCount);
  return builder
    .withThumbnail(thumbnail)
    .withDescription(
      dedent`
      ### Turnip Crop

      ${description}
    `,
    )
    .complete()
    .build();
}

export function renderError(): APIInteractionResponseChannelMessageWithSource {
  return renderUnexpectedError("I wasn't able to survey for you. Please try again later.");
}
