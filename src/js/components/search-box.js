import * as imgUtils from "./utils/images";
import { globalVars } from "../index";

const searchBox = (props) => {
  return {
    el: widgetContainer,
    children: [
      {
        el: new Element({
          tag: "input",
          id: "ARC_Search",
          type: "text",
          placeholder: `${props.searchPlaceholder || "Search..."}`,
          onkeyup: handleTextInput,
          style: { width: "575px", "max-width": "100%" },
        }),
      },
    ],
  };
};

const handleTextInput = async (ev) => {
  let searchTerm = document.getElementById("ARC_Search").value;
  console.log("===> adding from handleTextInput");
  await imgUtils.add(
    "General",
    getStateById(ev.currentTarget.value),
    searchTerm
  );
  if (document.getElementById("StateSpecific")) {
    if (searchTerm) {
      console.log("hiding");
      document.getElementById("StateSpecific").style.display = "none";
    } else {
      console.log("showing");
      document.getElementById("StateSpecific").style.display = "block";
      await imgUtils.add(
        "StateSpecific",
        { ...getStateById(globalVars.selectedState), type: "state" },
        searchTerm
      );
    }
  }
};

export { searchBox };
