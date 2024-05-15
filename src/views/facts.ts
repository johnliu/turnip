import dedent from 'dedent';

import { DEFAULT_EMBED_COLOR, DEFAULT_THUMBNAIL_URL, ResponseBuilder } from '@/views/base';

export function renderFact(content: string) {
  return new ResponseBuilder()
    .addEmbed()
    .withColor(DEFAULT_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ${content}


        _✨ the more you know ✨_
      `,
    )
    .complete()
    .build();
}
