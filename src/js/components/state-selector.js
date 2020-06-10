import { states } from "./states";
import * as imgUtils from "./utils/images";
/**
 * Builds the HTML `select` element and fills it with states
 * @param {string} stateId - A valid state abbreviation
 * @returns HTML Select Element
 */
const stateSelector = (stateId) => {
  const container = new Element({ tag: "div", id: "StateSpecific" });
  const header = new Element({
    tag: "h2",
    className: "block-lined",
    style: { paddingBottom: ".1em" },
  });
  // const headerText = new Element({ el: 'span', innerHTML: 'State-specific Images' });
  const selectList = new Element({
    tag: "div",
    className: "selectlist",
    id: "ARC_SelectContainer",
  });
  const select = new Element({
    tag: "select",
    id: "ARC_Select",
    className: "form-select",
    onchange: handleStateDropdownChange,
  });
  const options = [];
  states.forEach((state) => {
    const option = new Element({
      tag: "option",
      innerHTML: state.name,
      value: state.id,
      selected: state.id === stateId,
    });
    options.push({ el: option });
  });
  return {
    el: container,
    children: [
      {
        el: header,
      },
      {
        el: selectList,
        children: [
          {
            el: select,
            children: options,
          },
        ],
      },
    ],
  };
};

const handleStateDropdownChange = async (ev) => {
  if (document.getElementById("ARC_(Search)"))
    document.getElementById("ARC_Search").value = "";
  globalVars.selectedState = ev.currentTarget.value;
  await imgUtils.add(
    "StateSpecific",
    { ...getStateById(ev.currentTarget.value), type: "state" },
    ""
  );
};

export { stateSelector };
