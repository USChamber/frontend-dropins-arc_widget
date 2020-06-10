import { render } from "../dom";

const section = (locationId, children = []) => {
  return {
    el: widgetContainer,
    children: [
      ...children,
      [
        {
          el: new Element({
            tag: "div",
            id: locationId,
          }),
        },
      ],
    ],
  };
};

export { section };
