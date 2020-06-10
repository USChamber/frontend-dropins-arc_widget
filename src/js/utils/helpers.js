import { states } from "./states";
/**
 * Returns state object based off given ID
 * @param {string} id - ID of state
 */
const getStateById = (id) => {
  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    if (state.id === id) {
      return state;
    }
  }
  return null;
};
