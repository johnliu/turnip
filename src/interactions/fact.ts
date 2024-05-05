import { renderContent } from '@/utils/interactions';
import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';

const TURNIP_FACTS = [
  'Turnips are a root vegetable commonly grown in temperate climates worldwide for their white, bulbous taproot.',
  'They belong to the Brassicaceae family, which also includes broccoli, Brussels sprouts, cabbage, and kale.',
  'Turnips have been cultivated for over 3,000 years, originally in the Near East and now all over the world.',
  'The larger the turnip, the more woody its texture can be, so smaller turnips are often preferred for their tenderness and flavor.',
  'Ancient Romans considered turnips an important food of the working class.',
  'In history, they were often used before the introduction and popularization of the potato.',
  'Nutritionally, turnips are low in calories but high in vitamins and minerals, including vitamin C, fiber, and potassium.',
  "In the United Kingdom, turnip 'lanterns' were hollowed out and carved with faces to create lanterns for Halloween, a precursor to the pumpkin jack-o'-lanterns popular in the United States.",
  'Turnip greens, the top leafy part of the plant, are edible and rich in nutrients, making them popular in southern U.S. cuisine.',
  'The Swedish turnip, also known as rutabaga or swede, is a cross between a turnip and a cabbage.',
  'Animals, particularly livestock like sheep and pigs, are also fans of turnips and can be fed the root and the greens.',
  'Turnips have been used in folk medicine to treat a variety of ailments, from fever to skin conditions.',
  'Farmers often use turnips as a cover crop to reduce soil erosion and improve soil health.',
  'Turnips can be eaten raw, roasted, boiled, mashed, or added to soups and stews.',
  "In Japanese culture, pickled turnips, known as 'sakurazuke,' are often colored purple and served with dishes as a crunchy, tangy accompaniment.",
  'Some varieties of turnips can be grown quickly and harvested in as little as six to eight weeks after planting.',
  "In 2016, a turnip festival in Germany set a record for the world's largest turnip lantern, weighing over 370 pounds.",
  'Turnips have a slightly peppery taste when eaten raw, which mellows and becomes sweeter when cooked.',
  'The town of Eastham, Massachusetts, hosts an annual Turnip Festival, complete with turnip queens, games, and cook-offs.',
  "Despite their name, turnips are not a primary ingredient in the traditional British dish 'turnip cake,' which is actually made from radishes.",
];

export default function handleFact(): APIInteractionResponseChannelMessageWithSource {
  const randomFact = TURNIP_FACTS[Math.floor(Math.random() * TURNIP_FACTS.length)];
  return renderContent(randomFact);
}
