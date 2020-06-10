import { states } from "./states";

const get = async (props) => {
  console.log("Getting Images. checking localstorage", globalVars.parsedImages);
  if (props.parsedImages) {
    console.log(
      "Reusing %s images from local storage",
      props.parsedImages.length
    );
    return props.parsedImages;
  }
  console.log("pulling a fresh copy");
  try {
    const response = await request(
      "GET",
      `https://uschamber-webassets.s3.amazonaws.com/uschamber.com/arc/${props.directoryName.toLowerCase()}/data.json`,
      { json: true }
    );
    console.log("response from remote image server", response);
    const tmp = parseImages(response);
    console.log("Pulled %s images from dropbox", tmp.parsedImages.length);
    return tmp;
  } catch (err) {
    console.warn("Error getting images", err);
  }
};
const send = async (emailAddress, downloadUrl, previewUrl, message) => {
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

/**
 * Adds the images into the view
 * @param {string} locationId - ID of element to place images within
 * @param {object} currentFilter - An object consisting of the current filter applied. If null, will be replaced by an empty object. Object should include {id: 'stateAbbrev'}
 * @param {string} searchTerm - Optional, if supplied will filter images to match this string (fuzzy match)
 * @returns a promise
 */
const add = async (locationId, currentFilter, searchTerm) => {
  if (globalVars.hiddenElements.includes(locationId)) return;
  const widgetContainer = document.getElementById(locationId);
  try {
    const images = await getImages();
    let imgEls = [];
    filter(images, currentFilter, searchTerm)
      .sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
      .forEach((image) => {
        imgEls.push({
          el: new Element({
            tag: "div",
            className: "arc-image-container",
            onclick: handleImageClick,
            attributes: {
              "download-url": image.downloadUrl,
              "display-url": image.displayUrl,
              name: image.name,
            },
          }),
          children: [
            {
              el: new Element({
                tag: "label",
                className: "arc-image-text",
                innerHTML: "Click to Preview",
              }),
            },
            {
              el: new Element({
                tag: "div",
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
        el: new Element({ tag: "h3", innerHTML: "No images found" }),
      });
    }
    const containerId = `${locationId}_ImageList`;
    removeEl(document.getElementById(containerId));
    const html = {
      el: widgetContainer,
      children: [
        {
          el: new Element({
            tag: "div",
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

const handleImageClick = (ev) => {
  loadOverlay(
    ev.currentTarget.getAttribute("display-url"),
    ev.currentTarget.getAttribute("name"),
    ev.currentTarget.getAttribute("download-url")
  );
};

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
        if (image.name.includes(`${filter.id}|`)) {
          const value = image.name
            .split(".png")[0]
            .split(`${filter.id}|`)[1]
            .split("-")[0]
            // .split(".")[0]
            .replace(/_/g, " ");
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
      if (isStateSpecific(state.id, state.name, image.name, state.excludes)) {
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
const filter = (images, currentFilter = {}, searchTerm = "") => {
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
      return isStateSpecific(
        currentFilter.id,
        currentFilter.name,
        image.name,
        currentFilter.excludes
      );
    } else {
      if (currentFilter.name === "none") {
        return !image.stateSpecific;
        return true;
      }
      return image.name.includes(`${currentFilter.id}|${currentFilter.name}`);
    }
  });
  console.log("Filtered to %s images", filtered.length);
  return filtered;
};

/**
 *
 * @param {array} searchArray - the name of the image, split by - and/or _
 * @param {array} terms - the search terms split by " "
 */
const search = (searchArray, terms) => {
  return terms.every((term) => {
    let present = false;
    searchArray.forEach((word) => {
      if (word.includes(term)) present = true;
    });
    return present;
  });
};

const isStateSpecific = (filterId, filterName, name, excludes) => {
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

export { addImages };
