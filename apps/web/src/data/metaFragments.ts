export interface MetaFragment {
  id: string;
  title: string;
  body: string;
  source: string; // how it was discovered
}

export const META_FRAGMENTS: Record<string, MetaFragment> = {
  fragment_1: {
    id: "fragment_1",
    title: "The Boats Don't Come Back",
    source: "Overheard from a river trader at Porto Alegre do Rio",
    body:
      "The trader mentioned it without emphasis, the way people mention things they've normalized: boats going up the Rio Marié don't come back on schedule. Some don't come back at all. She attributed it to the current, to the season, to general river unreliability. But she said it three times in the conversation. People repeat things three times when they're trying not to say them.",
  },
  fragment_2: {
    id: "fragment_2",
    title: "The Migration That Didn't Come",
    source: "Told by an elder at Vila Ribeirinha",
    body:
      "Four generations on this stretch of river, and the dolphins have always come upriver in the wet season — predictable as the flood itself. This year they stopped two hundred kilometers short. The elder didn't offer an explanation. He described it the way you describe a thing you've decided isn't your fault: carefully, without blame, watching your face for a reaction.",
  },
  fragment_3: {
    id: "fragment_3",
    title: "Three Buoys Gone Silent",
    source: "From Dr. Ferreira's research camp",
    body:
      "The hydrophone buoys were deployed at twelve-kilometer intervals along the upper Marié. They transmit acoustic data continuously — fish calls, dolphin vocalizations, current noise. Three of the furthest ones stopped transmitting fourteen months ago. Not a gradual degradation. Silence, and then silence. 'Equipment failure doesn't explain all three simultaneously,' Dr. Ferreira said. Then she changed the subject.",
  },
  fragment_4: {
    id: "fragment_4",
    title: "The Quiet Zones",
    source: "Named by Dr. Ferreira",
    body:
      "She called them 'zonas silenciosas' — areas where the acoustic record has dropped to near-zero. No fish sounds. No frog calls. No bird activity audible at the surface. Not reduced — absent. The zones began appearing eighteen months ago in the upper Marié basin, and they are expanding at a rate she described as 'faster than anything I have a biological explanation for.' She said this looking directly at her coffee.",
  },
  fragment_5: {
    id: "fragment_5",
    title: "Dr. Carvalho's Journal",
    source: "Found in the abandoned research facility, Igarapé Sem Nome",
    body:
      "The last entry in Dr. Ana Carvalho's field journal is dated fourteen months ago. Most of it is methodical data notation — temperature readings, GPS coordinates, species counts. The final paragraph is different:\n\n'The silence isn't absence. The water isn't dead — the instruments still register microorganism activity, dissolved oxygen is normal, water chemistry is within range. But there is nothing above a certain complexity threshold. No behavior. No pattern. As if something has removed the capacity for decision-making from every living thing above bacterial scale. I don't have a—'\n\nThe sentence ends there. The next page was torn out.",
  },
  fragment_6: {
    id: "fragment_6",
    title: "The Map With No Name",
    source: "Folded inside a supply purchase at Atracadouro do Comerciante",
    body:
      "The trader said it came off a researcher's boat a few months ago — thrown in with the transaction, like ballast. It's a waterproofed survey map of the upper Marié tributaries, printed on institutional stock. Someone has annotated it in red marker: circles, crosses, one area shaded entirely. In the margin, in different handwriting, a name: Dr. A. Carvalho.\n\nThe shaded area and the area marked PROJETO SILÊNCIO on the facility door cover the same coordinates.",
  },
  fragment_7: {
    id: "fragment_7",
    title: "Zone Number Six",
    source: "Noticed at the logging camp, Acampamento Madeireiro",
    body:
      "The papers were real, mostly. Four concession numbers matched the INCRA registry. The fifth — written smaller than the others, in different ink, as if added after — didn't correspond to any record you knew. The concession area it covered extended north along the Marié corridor, into a zone that the other paperwork carefully avoided naming.\n\nSomeone had registered an operation under a legal concession name specifically chosen to make the zone invisible to standard audits. You noted the number. You did not say you noted it.",
  },
  fragment_8: {
    id: "fragment_8",
    title: "Someone Needs to Go In",
    source: "Estação Científica Várzea — end of the expedition",
    body:
      "The station director listened without interrupting. When you finished, she pulled out the map — the one with the red circle. 'You're the third expedition to bring pieces of this back. The first two didn't make it as far as you.' She tapped the Zona Silenciosa. 'We need someone to go in. Not this season. With the right equipment. With someone who has already made this run.'\n\nShe looked at you for a long time.\n\n'You've made it now.'",
  },
};
