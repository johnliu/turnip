import dedent from 'dedent';
import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';

import type { SurveyCount } from '@/models/queries/guild-turnip';
import {
  DEFAULT_EMBED_COLOR,
  DEFAULT_THUMBNAIL_URL,
  ERROR_EMBED_COLOR,
  ResponseBuilder,
  SAD_THUMBNAIL_URL,
  renderUnexpectedError,
} from '@/views/base';
import { addSurveyCount } from '@/views/survey';

export function renderPlant(
  userId: string,
  surveyCount: SurveyCount | null,
): APIInteractionResponseChannelMessageWithSource {
  const builder = new ResponseBuilder()
    .addEmbed()
    .withColor(DEFAULT_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL);

  let description = '';
  if (surveyCount != null) {
    if (surveyCount.guildPlantedCount === 1) {
      description =
        "You planted the first turnip here! Some day it'll be a big turnip farm, and it all started with you.";
    } else if (surveyCount.guildPlantedCount === surveyCount.userPlantedCount) {
      description = "You planted all the turnips here. It's your very own little turnip farm.";
    } else if (surveyCount.userPlantedCount / surveyCount.guildPlantedCount > 0.5) {
      description = 'You planted most of the turnips here!';
    }
  }

  if (description === '') {
    description = "It'll harvest in a little while.";
  }

  addSurveyCount(builder, surveyCount);
  return builder
    .withDescription(
      dedent`
      ### <@${userId}> planted a turnip

      ${description}
    `,
    )
    .complete()
    .build();
}

export function renderNoTurnips(userId: string): APIInteractionResponseChannelMessageWithSource {
  return new ResponseBuilder()
    .addEmbed()
    .withColor(ERROR_EMBED_COLOR)
    .withThumbnail(SAD_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ### <@${userId}> tried to plant a turnip

        Silly <@${userId}>, you plant turnips out of thin air!
      `,
    )
    .withFooter('Try foraging or harvesting for some turnips first.')
    .complete()
    .build();
}

export function renderError(): APIInteractionResponseChannelMessageWithSource {
  return renderUnexpectedError("I wasn't able to plant your turnip. Please try again later.");
}
