/**
 * GENERIC FUNCTIONS FOR DOM MANIPULATION
 */

/**
 * Creates a new HTML element and returns it
 * @param {object} args - An object containing options for the HTML element
 */
function Element(args) {
  if (!args.tag) throw new Error("Must supply element tag");
  const element = document.createElement(args.tag);
  if (args.innerHTML) element.innerHTML = args.innerHTML || "";
  if (args.id) element.id = args.id || "";
  if (args.className) element.className = args.className || "";
  if (args.name) element.name = args.name || "";
  if (args.type) element.type = args.type || "";
  if (args.style) element.style = args.style;
  if (args.onclick) element.onclick = args.onclick;
  if (args.onchange) element.onchange = args.onchange;
  if (args.onkeyup) element.onkeyup = args.onkeyup;
  if (args.src) element.src = args.src || "";
  if (args.href) element.href = args.href || "";
  if (args.value) element.value = args.value || "";
  if (args.placeholder) element.placeholder = args.placeholder || "";
  if (args.selected) element.selected = args.selected || null;
  for (const name in args.style) {
    element.style[name] = args.style[name];
  }
  for (const name in args.attributes) {
    element.setAttribute(name, args.attributes[name]);
  }
  for (const name in args.data) {
    element.dataset[name] = args.data[name];
  }
  return element;
}

/**
 * A recursive function to build an HTML structure based off a series of objects/arrays
 * @param {object} curr - The structure to follow: {el: children: [{el}]}. Appends all `children` in the array to the `el`, repeats for all children.
 */
function render(curr) {
  if (!curr.el) return;
  if (!curr.children) return;
  for (let i = 0; i < curr.children.length; i++) {
    curr.el.appendChild(curr.children[i].el);
    if (curr.children[i].children) {
      render(curr.children[i]);
    }
  }
}

/**
 * Applies css of `display: none` to an HTML element
 * @param {HTML Element} el - The element to hide
 */
const hideEl = (el) => {
  if (el) el.style.display = "none";
};

/**
 * Applies css of `display: block` to an HTML element
 * @param {HTML Element} el - The element to show
 * @param {string,optional} style - Optional value to use for `display` instead of `block`
 */
const showEl = (el, style) => {
  if (el) el.style.display = style || "block";
};

/**
 * Removes an HTML element from the DOM
 * @param {HTML Element} el - HTML element to remove
 */
const removeEl = (el) => {
  if (el) el.parentNode.removeChild(el);
};

export { Element, render, hideEl, showEl, removeEl };
