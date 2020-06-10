import { request } from "./request";
import { s3BaseUrl } from "./_config";

const addCss = async () => {
  // TODO: this should be a relative URL that is updated when webpack builds
  const css = await request("GET", `${s3BaseUrl}/css/widget.css`);
  const head = document.head || document.getElementsByTagName("head")[0];
  const style = document.createElement("style");
  style.type = "text/css";
  if (style.styleSheet) {
    // This is required for IE8 and below.
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
};

const ready = (fn) => {
  // see if DOM is already available
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
};
export { addCss, ready };
