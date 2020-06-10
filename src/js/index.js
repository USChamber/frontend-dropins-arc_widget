import "core-js/stable";
import "regenerator-runtime/runtime";
import * as dom from "./dom";
import * as imgUtils from "./utils/images";
import * as doc from "./doc";
import { token } from "./_config";
import { container } from "./components/container";

var arcWidget = (function () {
  const globalVars = {
    directoryName: document.currentScript.getAttribute("filepath"),
    includeSearch: document.currentScript.hasAttribute("search"),
    searchPlaceholder: document.currentScript.getAttribute("search"),
    filters: document.currentScript.getAttribute("filters"),
    hiddenElements:
      document.currentScript.getAttribute("hidden-elements") || "",
    selectedState: "AL",
  };

  console.log("globalVars", globalVars);

  const init = async () => {
    findToken();
    if (!globalVars.tokenLocation) return;
    doc.addCss();
    try {
      const images = await imgUtils.get();
      globalVars = { ...images, globalVars };
      dom.render(container({}, globalVars));
      toggleLoadingGif(widgetContainer);
      if (globalVars.includeSearch) {
        dom.render(searchBox(globalVars));
      }
      if (globalVars.parsedFilters) {
        dom.render(customFilters(globalVars));
      }
      dom.render(section("General"));
      let searchTerm = document.getElementById("ARC_Search").value;
      await imgUtils.add("General", currentFilter, searchTerm);
      if (
        globalVars.containsStateSpecificImages &&
        !globalVars.hiddenElements.includes("StateSpecific")
      ) {
        dom.render(section("StateSpecific", stateSelector(currentFilter.id)));
        await imgUtils.add(
          "StateSpecific",
          { ...getStateById(globalVars.selectedState), type: "state" },
          searchTerm
        );
      }
      toggleLoadingGif(widgetContainer);
    } catch (e) {
      console.warn("A problem occurred building the ARC Photo Widget", e);
    }
  };

  function findToken() {
    const pTags = document.querySelectorAll(".field-item p");
    for (let i = 0; i < pTags.length; i++) {
      if (pTags[i].innerHTML.includes(token)) {
        globalVars.tokenLocation = pTags[i];
        pTags[i].innerHTML = "";
        break;
      }
    }
  }

  function selectState(state) {
    globalVars.selectedState = state;
  }

  doc.ready(init);

  return globalVars;
})();

export { globalVars };
