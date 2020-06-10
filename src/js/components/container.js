/**
 * Builds the widget within the tokenLocation as stored in props
 */
const container = async (currentFilter, props) => {
  removeEl(document.getElementById("ARC_Widget"));
  const widgetContainer = new Element({ tag: "div", id: "ARC_Widget" });
  return {
    el: props.tokenLocation,
    children: [
      {
        el: widgetContainer,
      },
    ],
  };
};

export { container };
