/**
 * Toggles the loading gif within the given widgetContainer
 * @param {element} widgetContainer - HTML element where gif should appear
 */
const toggleLoadingGif = (container) => {
  const loadingGif = document.getElementById("ARC_LoadingGif");
  if (!loadingGif) {
    render({
      el: container,
      children: [
        {
          el: new Element({
            tag: "div",
            id: "ARC_LoadingGif",
            style: { textAlign: "center", padding: "1em" },
          }),
          children: [
            {
              el: new Element({
                tag: "img",
                src: `${s3BaseUrl}/img/loading.gif`,
              }),
            },
          ],
        },
      ],
    });
  } else {
    removeEl(loadingGif);
  }
};

export { toggleLoadingGif };
