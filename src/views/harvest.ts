import dedent from 'dedent';
import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';
import { inflect } from 'inflection';

import type { SurveyCount } from '@/models/queries/guild-turnip';
import { duration } from '@/utils/humanize';
import {
  DEFAULT_EMBED_COLOR,
  DEFAULT_THUMBNAIL_URL,
  ERROR_EMBED_COLOR,
  ResponseBuilder,
  renderUnexpectedError,
} from '@/views/base';
import { addSurveyCount } from '@/views/survey';

export function renderHarvest(
  userId: string,
  harvestedCount: number,
  surveyCount: SurveyCount | null,
) {
  const builder = new ResponseBuilder()
    .addEmbed()
    .withColor(DEFAULT_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ### <@${userId}> harvested ${harvestedCount} ${inflect('turnip', harvestedCount)}

        :farmer: :basket: ${[...Array(harvestedCount)].map(() => ':onion:').join('')}
      `,
    );

  addSurveyCount(builder, surveyCount);
  return builder.complete().build();
}

export function renderHarvestOnCooldown(
  userId: string,
  surveyCount: SurveyCount | null,
  remainingCooldown: number,
): APIInteractionResponseChannelMessageWithSource {
  const builder = new ResponseBuilder()
    .addEmbed()
    .withColor(ERROR_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ### <@${userId}> tried to harvest some turnips
        ...but they already harvested recently

        Don't be too greedy now!
      `,
    );

  addSurveyCount(builder, surveyCount);
  return builder
    .withFooter(`You can harvest again in ${duration(remainingCooldown)}.`)
    .complete()
    .build();
}

export function renderNoTurnips(
  userId: string,
  surveyCount: SurveyCount | null,
): APIInteractionResponseChannelMessageWithSource {
  const builder = new ResponseBuilder()
    .addEmbed()
    .withColor(ERROR_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ### <@${userId}> tried to harvest some turnips

        But there were no turnips to harvest. :(
      `,
    );

  addSurveyCount(builder, surveyCount);
  return builder.withFooter('Try planting some turnips here!').complete().build();
}

export function renderError(): APIInteractionResponseChannelMessageWithSource {
  return renderUnexpectedError(
    "I couldn't harvest turnips for you right now. Please try again later.",
  );
}
