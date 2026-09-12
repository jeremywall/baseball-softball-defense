import { MIN_PRESENT_TO_PLAY } from "../models/positions.js";

// HR-7: A game requires a minimum of 7 present players to be played. The
// shortfall (when attendance is below the alignment mode's full
// complement) is absorbed by fielding fewer outfielders, never by leaving
// an infield/battery position empty — except at exactly 7 present, where
// the catcher is dropped in favor of a 2nd outfielder instead (see
// infieldPositionsFor in models/positions.js). That's all already baked
// into how `createGame` computes `outfieldCount` and the position set
// (see models/game.js), so this rule's job is just to flag the case where
// there aren't even enough players to play at all.
export const id = "HR-7";
export const label = "Minimum 7 present players";

export function validate(game) {
  if (game.presentPlayerIds.length < MIN_PRESENT_TO_PLAY) {
    return [
      {
        ruleId: id,
        message: `Only ${game.presentPlayerIds.length} player(s) present; at least 7 are required to play.`,
      },
    ];
  }
  return [];
}
