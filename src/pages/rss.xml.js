import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const briefs = await getCollection('briefs');
  const sorted = briefs.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'AI Daily Brief',
    description: '每日AI行业值得关心的新闻摘要',
    site: context.site,
    items: sorted.map((brief) => ({
      title: brief.data.title,
      pubDate: brief.data.date,
      description: brief.data.summary,
      link: `/briefs/${brief.slug}/`,
    })),
  });
}
