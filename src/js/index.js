import "core-js/stable";
import "regenerator-runtime/runtime";
var arcWidget = (function () {
  const token = "__INSERT_PHOTO_WIDGET__";
  const s3BaseUrl =
    "https://uschamber-webassets.s3.amazonaws.com/uschamber.com/interactives/arc";
  // const s3BaseUrl = "./";

  const globalVars = {};

  globalVars.directoryName = document.currentScript.getAttribute("filepath");
  globalVars.includeSearch = document.currentScript.hasAttribute("search");
  globalVars.searchPlaceholder = document.currentScript.getAttribute("search");
  globalVars.filters = document.currentScript.getAttribute("filters");
  globalVars.hideStateSpecific = document.currentScript.hasAttribute(
    "hideStateSpecific"
  );
  console.log("globalVars", globalVars);

  const init = async () => {
    const pTags = document.querySelectorAll(".field-item p");
    for (let i = 0; i < pTags.length; i++) {
      if (pTags[i].innerHTML.includes(token)) {
        globalVars.tokenLocation = pTags[i];
        pTags[i].innerHTML = "";
        break;
      }
    }
    if (globalVars.tokenLocation) {
      addCss();
      try {
        await getImages();
        await buildWidget({});
      } catch (e) {
        console.warn("A problem occurred building the ARC Photo Widget", e);
      }
      // setupLazyLoading();
    }
  };

  /**
   * Builds the widget within the tokenLocation as stored in globalVars
   */
  const buildWidget = async (currentFilter) => {
    console.log("building widget");
    remove(document.getElementById("ARC_Widget"));
    const widgetContainer = new Element({ el: "div", id: "ARC_Widget" });
    render({
      el: globalVars.tokenLocation,
      children: [
        {
          el: widgetContainer,
        },
      ],
    });
    if (globalVars.includeSearch) {
      render({
        el: widgetContainer,
        children: [
          {
            el: new Element({
              el: "input",
              id: "ARC_Search",
              type: "text",
              placeholder: `${globalVars.searchPlaceholder || "Search..."}`,
              onkeyup: handleTextInput,
              style: { width: "575px", "max-width": "100%" },
            }),
          },
        ],
      });
    }
    if (globalVars.parsedFilters) {
      console.log("need to deal with filters", globalVars.parsedFilters);
      for (const fid in globalVars.parsedFilters) {
        const filter = globalVars.parsedFilters[fid];
        let filterOptions = [];
        filterOptions.push({
          el: new Element({
            el: "option",
            innerHTML: "All",
            value: "none",
          }),
        });
        filter.values.sort().forEach((val, index) => {
          filterOptions.push({
            el: new Element({
              el: "option",
              innerHTML: val,
              value: val.replace(" ", "_"),
            }),
          });
        });
        console.log("filterOptions", filterOptions);
        render({
          el: widgetContainer,
          children: [
            {
              el: new Element({
                el: "div",
                style: {
                  display: "inline-block",
                },
              }),
              children: [
                {
                  el: new Element({
                    el: "label",
                    for: `ARC_Filter_${filter.id}`,
                    innerHTML: `${filter.name}: `,
                  }),
                },
                {
                  el: new Element({
                    el: "select",
                    id: `ARC_Filter_${filter.id}`,
                    data: {
                      filterSet: filter.id,
                    },
                    onchange: handleFilterSelect,
                  }),
                  children: filterOptions,
                },
              ],
            },
          ],
        });
      }
    }
    render({
      el: widgetContainer,
      children: [
        {
          el: new Element({
            el: "div",
            id: "General",
          }),
        },
      ],
    });
    toggleLoadingGif(widgetContainer);
    const images = await addImages(
      "General",
      currentFilter,
      globalVars.searchTerm
    );
    if (
      globalVars.containsStateSpecificImages &&
      !globalVars.hideStateSpecific
    ) {
      render({
        el: widgetContainer,
        children: [buildSelector(currentFilter.id)],
      });
      console.log("===> adding from buildWidget");
      globalVars.selectedState = "AL";
      await addImages(
        "StateSpecific",
        { ...getStateById(globalVars.selectedState), type: "state" },
        globalVars.searchTerm
      );
    }
    toggleLoadingGif(widgetContainer);
    return images;
  };

  /**
   * Adds the images into the view
   * @param {string} locationId - ID of element to place images within
   * @param {*} currentFilter - An object consisting of the current filter applied. If null, will be replaced by an empty object. Object should include {id: 'stateAbbrev'}
   * @returns a promise
   */
  const addImages = async (locationId, currentFilter, searchTerm) => {
    const widgetContainer = document.getElementById(locationId);
    try {
      const images = await getImages();
      let imgEls = [];
      filterImages(images, currentFilter, searchTerm)
        .sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        .forEach((image) => {
          imgEls.push({
            el: new Element({
              el: "div",
              className: "arc-image-container",
              onclick: clickImage,
              attributes: {
                "download-url": image.downloadUrl,
                "display-url": image.displayUrl,
                name: image.name,
              },
            }),
            children: [
              {
                el: new Element({
                  el: "label",
                  className: "arc-image-text",
                  innerHTML: "Click to Preview",
                }),
              },
              {
                el: new Element({
                  el: "div",
                  id: image.id,
                  className: "arc-image lazy",
                  title: image.name,
                  style: { backgroundImage: `url(${image.displayUrl})` },
                  attributes: {
                    "data-background-image": `url(${image.displayUrl})`,
                  },
                }),
              },
            ],
          });
        });
      if (!imgEls.length && (locationId != "General" || searchTerm)) {
        imgEls.push({
          el: new Element({ el: "h3", innerHTML: "No images found" }),
        });
      }
      const containerId = `${locationId}_ImageList`;
      remove(document.getElementById(containerId));
      const html = {
        el: widgetContainer,
        children: [
          {
            el: new Element({
              el: "div",
              className: "arc-images-list",
              id: containerId,
            }),
            children: imgEls,
          },
        ],
      };
      render(html);
    } catch (e) {
      console.log("error adding images", e);
    }
  };

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
              el: "div",
              id: "ARC_LoadingGif",
              style: { textAlign: "center", padding: "1em" },
            }),
            children: [
              {
                el: new Element({
                  el: "img",
                  src: `${s3BaseUrl}/img/loading.gif`,
                }),
              },
            ],
          },
        ],
      });
    } else {
      remove(loadingGif);
    }
  };

  /**
   * Builds the HTML `select` element and fills it with states
   * @param {string} stateId - A valid state abbreviation
   * @returns HTML Select Element
   */
  const buildSelector = (stateId) => {
    const container = new Element({ el: "div", id: "StateSpecific" });
    const header = new Element({
      el: "h2",
      className: "block-lined",
      style: { paddingBottom: ".1em" },
    });
    // const headerText = new Element({ el: 'span', innerHTML: 'State-specific Images' });
    const selectList = new Element({
      el: "div",
      className: "selectlist",
      id: "ARC_SelectContainer",
    });
    const select = new Element({
      el: "select",
      id: "ARC_Select",
      className: "form-select",
      onchange: handleStateDropdownChange,
    });
    const options = [];
    states.forEach((state) => {
      const option = new Element({
        el: "option",
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

  /**
   * GENERIC FUNCTIONS FOR DOM MANIPULATION
   */

  /**
   * Creates a new HTML element and returns it
   * @param {object} args - An object containing options for the HTML element
   */
  function Element(args) {
    if (!args.el) throw new Error("Must supply element classification");
    const element = document.createElement(args.el);
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
  const remove = (el) => {
    if (el) el.parentNode.removeChild(el);
  };

  /**
   *
   * @param {string} displayUrl - URL of image to show in preview
   * @param {string} name - Name of image to show in top bar
   * @param {string} downloadUrl - URL of image for downloading
   */
  const loadOverlay = (displayUrl, name, downloadUrl) => {
    const iOS =
      !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    render({
      el: document.body,
      children: [
        {
          el: new Element({
            el: "div",
            id: "ARC_Overlay",
            style: { display: "block" },
          }),
          children: [
            {
              el: new Element({ el: "div", id: "ARC_Lightbox" }),
              children: [
                {
                  el: new Element({ el: "div", id: "ARC_LightboxTopBar" }),
                  children: [
                    {
                      el: new Element({
                        el: "button",
                        id: "ARC_LightboxExit",
                        onclick: clickExitButton,
                      }),
                    },
                    {
                      el: new Element({
                        el: "h4",
                        id: "ARC_LightboxTitle",
                        innerHTML:
                          "Use the buttons below to download or share this graphic",
                      }),
                    },
                  ],
                },
                {
                  el: new Element({
                    el: "img",
                    id: "ARC_LightboxImg",
                    src: displayUrl,
                  }),
                },
                {
                  el: new Element({
                    el: "div",
                    id: "ARC_LightboxControlPanel",
                  }),
                  children: [
                    {
                      el: new Element({
                        el: "input",
                        id: "ARC_EmailAddress",
                        name: "email",
                        type: "email",
                        style: { display: "none" },
                        placeholder: "Enter Email Address",
                      }),
                    },
                    {
                      el: new Element({
                        el: "button",
                        id: "ARC_EmailSubmitBtn",
                        innerHTML: "Send",
                        className: "control-panel-btn",
                        style: { display: "none" },
                        onclick: clickEmailSubmitButton,
                      }),
                    },
                    {
                      el: new Element({
                        el: "button",
                        id: "ARC_LightboxEmail",
                        innerHTML: "Email",
                        className: "control-panel-btn",
                        onclick: clickEmailButton,
                      }),
                    },
                    {
                      el: new Element({
                        el: "a",
                        id: "ARC_LightboxDownload",
                        innerHTML: "Download",
                        className: "control-panel-btn",
                        href: iOS ? displayUrl : downloadUrl,
                      }),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  };

  /**
   * DATA PARSING
   */

  /**
   * Looks at all images and finds & identifies any state-specific images.
   *
   * State specific images are determined based off containing the whole name of a state or _stateAbbreviation_
   * @param {array} images - An array of image objects {id: '', downloadUrl: '', displayUrl: '', name: ''}
   * @returns an object `{containsStateSpecificImages: Bool, parsedImages: Array}`
   */
  const parseImages = (images) => {
    let contains = false;
    const parsedImages = images.map((image) => {
      if (!image) {
        image = {};
      }
      if (globalVars.filters && typeof globalVars.filters !== "object") {
        console.log("looking at filters", globalVars.filters);
        let filters = [];
        globalVars.filters.split(",").forEach((filter) => {
          filters.push({
            id: filter,
            name: filter.replace(/_/g, " "),
            values: [],
          });
        });
        globalVars.filters = filters;
      }
      // prepare image to be searched
      image.searchArray = image.name
        .toLowerCase()
        .replace(/(-|_)/g, " ")
        .split(" ");
      // populate filter values
      if (globalVars.filters) {
        globalVars.parsedFilters = {};
        globalVars.filters.forEach((filter) => {
          console.log("filter...", filter.id);
          if (image.name.includes(filter.id + "|")) {
            console.log("image.name", image.name);
            const value = image.name
              .split(`${filter.id}|`)[1]
              .split("-")[0]
              .split(".")[0]
              .replace("_", " ");
            if (!filter.values.includes(value)) {
              filter.values.push(value);
            }
          }
          console.log("filterVals", filter.values);
          globalVars.parsedFilters[filter.id] = filter;
        });
      }
      // decide if state specific images exist
      states.forEach((state) => {
        if (
          isStateSpecificImage(state.id, state.name, image.name, state.excludes)
        ) {
          contains = true;
          image.stateSpecific = true;
        }
      });
      return image;
    });
    console.log("parsedImages", parsedImages);
    console.log("filters", JSON.stringify(globalVars.parsedFilters));
    return {
      containsStateSpecificImages: contains,
      parsedImages: parsedImages,
    };
  };

  /**
   * Returns an array of images filtered by the currentFilter
   * @param {array} images - Array of objects as returned from parseImages function
   * @param {object, optional} currentFilter - if no filter is given will return only non-state-specific images. Expects an object like {id: 'stateAbbrev', name: 'StateName'}
   */
  const filterImages = (images, currentFilter = {}, searchTerm = "") => {
    console.log("currentFilter", currentFilter);
    const filtered = images.filter((image) => {
      if (!image) {
        return false;
      }
      if (searchTerm) {
        return search(image.searchArray, searchTerm.toLowerCase().split(" "));
      }
      if (!currentFilter || !currentFilter.id) {
        return !image.stateSpecific;
      }

      if (currentFilter.type === "state") {
        if (currentFilter.id === "None") {
          currentFilter = states[1];
        }
        return isStateSpecificImage(
          currentFilter.id,
          currentFilter.name,
          image.name,
          currentFilter.excludes
        );
      } else {
        if (currentFilter.name === "none") {
          console.log("show all");
          return true;
        }
        return image.name.includes(`${currentFilter.id}|${currentFilter.name}`);
      }
    });
    console.log("Filtered to %s images", filtered.length);
    return filtered;
  };

  const search = (imageName, terms) => {
    return terms.every((term) => {
      let present = false;
      imageName.forEach((word) => {
        if (word.includes(term)) present = true;
      });
      return present;
    });
  };

  const isStateSpecificImage = (filterId, filterName, name, excludes) => {
    let included = false;
    name = name.toLowerCase();
    filterId = `_${filterId.toLowerCase()}_`;
    filterName = filterName.toLowerCase();
    const filterNameUnderscored = filterName.split(" ").join("_");
    if (name.includes(filterId)) {
      return true;
    }
    if (name.includes(filterName) || name.includes(filterNameUnderscored)) {
      // this is a fuzzy match. Don't want to include arkanasas with kansas or virginia for west virginia
      included = true;
      if (excludes) {
        excludes = excludes.split(",");
        excludes.forEach((exclude) => {
          if (name.includes(exclude)) included = false;
        });
      }
    }
    return included;
  };

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

  /**
   * EVENT HANDLER FUNCTIONS
   */

  const handleStateDropdownChange = async (ev) => {
    if (document.getElementById("ARC_Search"))
      document.getElementById("ARC_Search").value = "";
    globalVars.searchTerm = "";
    globalVars.selectedState = ev.currentTarget.value;
    console.log("===> adding from handleStateDropdownChange");
    await addImages(
      "StateSpecific",
      { ...getStateById(ev.currentTarget.value), type: "state" },
      globalVars.searchTerm
    );
  };

  const handleFilterSelect = async (ev) => {
    if (document.getElementById("ARC_Search"))
      document.getElementById("ARC_Search").value = "";
    globalVars.searchTerm = "";
    globalVars.selectedState = ev.currentTarget.value;
    // need to get the filter set it came from
    // also need to set the value
    const filterSet = ev.target.dataset.filterSet;
    // Reset other filters
    for (const filterId in globalVars.parsedFilters) {
      if (filterId !== filterSet) {
        selectElement(`ARC_Filter_${filterId}`, "none");
      }
    }
    // grab images
    await addImages(
      "General",
      { id: filterSet, name: ev.currentTarget.value || "none", type: "custom" },
      globalVars.searchTerm
    );
  };

  const handleTextInput = async (ev) => {
    globalVars.searchTerm = document.getElementById("ARC_Search").value;
    console.log("===> adding from handleTextInput");
    await addImages(
      "General",
      getStateById(ev.currentTarget.value),
      globalVars.searchTerm
    );
    if (document.getElementById("StateSpecific")) {
      if (globalVars.searchTerm) {
        console.log("hiding");
        document.getElementById("StateSpecific").style.display = "none";
      } else {
        console.log("showing");
        document.getElementById("StateSpecific").style.display = "block";
        await addImages(
          "StateSpecific",
          { ...getStateById(globalVars.selectedState), type: "state" },
          globalVars.searchTerm
        );
      }
    }
  };

  const clickImage = (ev) => {
    loadOverlay(
      ev.currentTarget.getAttribute("display-url"),
      ev.currentTarget.getAttribute("name"),
      ev.currentTarget.getAttribute("download-url")
    );
  };

  const clickExitButton = () => {
    remove(document.getElementById("ARC_Overlay"));
  };

  const clickEmailButton = () => {
    showEl(document.getElementById("ARC_EmailAddress"), "inline-block");
    showEl(document.getElementById("ARC_EmailSubmitBtn"), "inline-block");
    hideEl(document.getElementById("ARC_LightboxEmail"));
  };

  const clickEmailSubmitButton = async () => {
    const downloadUrl = document.getElementById("ARC_LightboxDownload").href;
    const previewUrl = document.getElementById("ARC_LightboxImg").src;
    const emailInput = document.getElementById("ARC_EmailAddress");
    const message = document.getElementById("ARC_EmailMessage"); // doesn't exist yet
    const response = await sendImageViaEmail(
      emailInput.value,
      downloadUrl,
      previewUrl,
      message
    );
    if (!response) {
      alert(
        "A problem occurred while attempting to send the email. Please try again later"
      );
      return;
    }
    console.log("email send response", response);
    emailInput.value = "";
    hideEl(document.getElementById("ARC_EmailSubmitBtn"));
    hideEl(emailInput);
    showEl(document.getElementById("ARC_LightboxEmail"), "inline-block");
    const successMessage = new Element({
      el: "div",
      id: "ARC_SuccessMessage",
      innerHTML: "Sent!",
      style: { display: "inline-block", verticalAlign: "middle" },
    });
    document.getElementById("ARC_LightboxControlPanel").prepend(successMessage);
    window.setTimeout(() => {
      const successMessage = document.getElementById("ARC_SuccessMessage");
      successMessage.parentNode.removeChild(successMessage);
    }, 5000);
  };

  /**
   * API INTERACTIONS
   */

  /**
   *
   * @param {string} requestType - The HTTP verb to use (GET, POST)
   * @param {string} url - The URL to use for the request
   * @param {object} options - Object to modify. Currently only accepts a `json` param which will parse response to JSON
   * @returns a promise
   */
  const request = (requestType, url, options = {}) => {
    return new Promise((resolve, reject) => {
      if (options.params) {
        for (const param in options.params) {
          if (url.includes("?")) {
            url += `&${param}=${options.params[param]}`;
          } else {
            url += `?${param}=${options.params[param]}`;
          }
        }
      }
      const xhr = new XMLHttpRequest();
      xhr.open(requestType, url);
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            if (options.json) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              resolve(xhr.responseText);
            }
          } catch (e) {
            reject(e);
          }
        } else {
          reject(xhr.status);
        }
      };
      if (requestType == "POST" && options.body) {
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify(options.body));
      } else {
        xhr.send();
      }
    });
  };

  const getImages = async () => {
    console.log("Getting Images. checking localstorage", globalVars.images);
    if (globalVars.images) {
      console.log(
        "Reusing %s images from local storage",
        globalVars.images.length
      );
      return globalVars.images;
    }
    console.log("pulling a fresh copy");
    try {
      const response = await request(
        "GET",
        `https://uschamber-webassets.s3.amazonaws.com/uschamber.com/arc/${globalVars.directoryName.toLowerCase()}/data.json`,
        { json: true }
      );
      console.log("response from remote image server", response);
      const tmp = parseImages(response);
      globalVars.images = tmp.parsedImages;
      globalVars.containsStateSpecificImages = tmp.containsStateSpecificImages;
      console.log("Pulled %s images from dropbox", globalVars.images.length);
      return globalVars.images;
    } catch (err) {
      console.warn("Error getting images", err);
    }
  };

  const sendImageViaEmail = async (
    emailAddress,
    downloadUrl,
    previewUrl,
    message
  ) => {
    try {
      const baseUrl =
        "https://a8qh996lbb.execute-api.us-east-1.amazonaws.com/stage/dropbox";
      const response = await request("POST", `${baseUrl}/email`, {
        body: {
          emailAddress: emailAddress,
          downloadUrl: downloadUrl,
          previewUrl: previewUrl,
          message: message,
        },
      });
      console.log("Successful Send", response);
      return response;
    } catch (err) {
      console.log("Error sending mail", err);
    }
  };

  function selectElement(id, valueToSelect) {
    let element = document.getElementById(id);
    element.value = valueToSelect;
  }

  /**
   * BULKY CRAP
   */

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

  const states = [
    {
      name: "Select a State",
      id: "None",
    },
    {
      name: "Alabama",
      id: "AL",
    },
    {
      name: "Alaska",
      id: "AK",
    },
    {
      name: "Arizona",
      id: "AZ",
    },
    {
      name: "Arkansas",
      id: "AR",
    },
    {
      name: "California",
      id: "CA",
    },
    {
      name: "Colorado",
      id: "CO",
    },
    {
      name: "Connecticut",
      id: "CT",
    },
    {
      name: "Delaware",
      id: "DE",
    },
    {
      name: "District of Columbia",
      id: "DC",
    },
    {
      name: "Florida",
      id: "FL",
    },
    {
      name: "Georgia",
      id: "GA",
    },
    {
      name: "Hawaii",
      id: "HI",
    },
    {
      name: "Idaho",
      id: "ID",
    },
    {
      name: "Illinois",
      id: "IL",
    },
    {
      name: "Indiana",
      id: "IN",
    },
    {
      name: "Iowa",
      id: "IA",
    },
    {
      name: "Kansas",
      id: "KS",
      excludes: "arkansas",
    },
    {
      name: "Kentucky",
      id: "KY",
    },
    {
      name: "Louisiana",
      id: "LA",
    },
    {
      name: "Maine",
      id: "ME",
    },
    {
      name: "Maryland",
      id: "MD",
    },
    {
      name: "Massachusetts",
      id: "MA",
    },
    {
      name: "Michigan",
      id: "MI",
    },
    {
      name: "Minnesota",
      id: "MN",
    },
    {
      name: "Mississippi",
      id: "MS",
    },
    {
      name: "Missouri",
      id: "MO",
    },
    {
      name: "Montana",
      id: "MT",
    },
    {
      name: "Nebraska",
      id: "NE",
    },
    {
      name: "Nevada",
      id: "NV",
    },
    {
      name: "New Hampshire",
      id: "NH",
    },
    {
      name: "New Jersey",
      id: "NJ",
    },
    {
      name: "New Mexico",
      id: "NM",
    },
    {
      name: "New York",
      id: "NY",
    },
    {
      name: "North Carolina",
      id: "NC",
    },
    {
      name: "North Dakota",
      id: "ND",
    },
    {
      name: "Ohio",
      id: "OH",
    },
    {
      name: "Oklahoma",
      id: "OK",
    },
    {
      name: "Oregon",
      id: "OR",
    },
    {
      name: "Pennsylvania",
      id: "PA",
    },
    {
      name: "Puerto Rico",
      id: "PR",
    },
    {
      name: "Rhode Island",
      id: "RI",
    },
    {
      name: "South Carolina",
      id: "SC",
    },
    {
      name: "South Dakota",
      id: "SD",
    },
    {
      name: "Tennessee",
      id: "TN",
    },
    {
      name: "Texas",
      id: "TX",
    },
    {
      name: "Utah",
      id: "UT",
    },
    {
      name: "Vermont",
      id: "VT",
    },
    {
      name: "Virginia",
      id: "VA",
      excludes: "west virginia,west_virginia",
    },
    {
      name: "Washington",
      id: "WA",
    },
    {
      name: "West Virginia",
      id: "WV",
    },
    {
      name: "Wisconsin",
      id: "WI",
    },
    {
      name: "Wyoming",
      id: "WY",
    },
  ];

  function docReady(fn) {
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
  }

  docReady(init);

  return globalVars;
})();
