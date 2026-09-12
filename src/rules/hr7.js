import { REQUIRED_INFIELD_COUNT } from "../models/positions.js";

// HR-7: A game requires a minimum of 7 present players to be played. The
// shortfall (when attendance is below the alignment mode's full
// complement) is absorbed by fielding fewer outfielders, never by leaving
// an infield/battery position empty — that reduction is already baked
// into how `createGame` computes `outfieldCount` (see models/game.js), so
// this rule's job is just to flag the case where there aren't even enough
// players to fill the 6 required infield/battery positions.
export const id = "HR-7";
export const label = "Minimum 7 present players";

export function validate(game) {
  if (game.presentPlayerIds.length < REQUIRED_INFIELD_COUNT + 1) {
    return [
      {
        ruleId: id,
        message: `Only ${game.presentPlayerIds.length} player(s) present; at least 7 are required to play.`,
      },
    ];
  }
  return [];
}
