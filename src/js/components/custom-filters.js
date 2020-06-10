import * as imgUtils from "./utils/images";
import { selectState, globalVars } from "..index";

function customFilters(props) {
  for (const fid in props.parsedFilters) {
    const filter = props.parsedFilters[fid];
    let filterOptions = [];
    filterOptions.push({
      el: new Element({
        tag: "option",
        innerHTML: "--",
        value: "none",
      }),
    });
    filter.values.sort().forEach((val, index) => {
      filterOptions.push({
        el: new Element({
          tag: "option",
          innerHTML: val,
          value: val.replace(/ /g, "_"),
        }),
      });
    });
    return {
      el: widgetContainer,
      children: [
        {
          el: new Element({
            tag: "div",
            style: {
              display: "inline-block",
              margin: "0 4px",
            },
          }),
          children: [
            {
              el: new Element({
                tag: "label",
                for: `ARC_Filter_${filter.id}`,
                innerHTML: `${filter.name}: `,
              }),
            },
            {
              el: new Element({
                tag: "div",
                className: "selectlist",
                style: {
                  display: "inline-block",
                },
              }),
              children: [
                {
                  el: new Element({
                    tag: "select",
                    id: `ARC_Filter_${filter.id}`,
                    data: {
                      filterSet: filter.id,
                    },
                    onchange: handleFilterSelect,
                    className: "form-select",
                  }),
                  children: filterOptions,
                },
              ],
            },
          ],
        },
      ],
    };
  }
}

const handleFilterSelect = async (ev) => {
  if (document.getElementById("ARC_Search"))
    document.getElementById("ARC_Search").value = "";
  selectState(ev.currentTarget.value);
  // need to get the filter set it came from
  // also need to set the value
  const filterSet = ev.target.dataset.filterSet;
  // Reset other filters
  for (const filterId in globalVars.parsedFilters) {
    if (filterId !== filterSet) {
      selectElement(`ARC_Filter_${filterId}`, "none");
    }
  }
  let searchTerm = document.getElementById("ARC_Search").value;

  // grab images
  await imgUtils.add(
    "General",
    { id: filterSet, name: ev.currentTarget.value || "none", type: "custom" },
    searchTerm
  );
  if (document.getElementById("StateSpecific")) {
    if (ev.currentTarget.value === "none") {
      document.getElementById("StateSpecific").style.display = "block";
      await imgUtils.add(
        "StateSpecific",
        { ...getStateById(globalVars.selectedState), type: "state" },
        searchTerm
      );
    } else {
      document.getElementById("StateSpecific").style.display = "none";
    }
  }
};

function selectElement(id, valueToSelect) {
  let element = document.getElementById(id);
  element.value = valueToSelect;
}

export { customFilters };
