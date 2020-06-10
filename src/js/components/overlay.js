import * as image from "../utils/images";

/**
 *
 * @param {string} displayUrl - URL of image to show in preview
 * @param {string} name - Name of image to show in top bar
 * @param {string} downloadUrl - URL of image for downloading
 */
const overlay = (displayUrl, name, downloadUrl) => {
  const iOS =
    !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  render({
    el: document.body,
    children: [
      {
        el: new Element({
          tag: "div",
          id: "ARC_Overlay",
          style: { display: "block" },
        }),
        children: [
          {
            el: new Element({ tag: "div", id: "ARC_Lightbox" }),
            children: [
              {
                el: new Element({ tag: "div", id: "ARC_LightboxTopBar" }),
                children: [
                  {
                    el: new Element({
                      tag: "button",
                      id: "ARC_LightboxExit",
                      onclick: clickExitButton,
                    }),
                  },
                  {
                    el: new Element({
                      tag: "h4",
                      id: "ARC_LightboxTitle",
                      innerHTML:
                        "Use the buttons below to download or share this graphic",
                    }),
                  },
                ],
              },
              {
                el: new Element({
                  tag: "img",
                  id: "ARC_LightboxImg",
                  src: displayUrl,
                }),
              },
              {
                el: new Element({
                  tag: "div",
                  id: "ARC_LightboxControlPanel",
                }),
                children: [
                  {
                    el: new Element({
                      tag: "input",
                      id: "ARC_EmailAddress",
                      name: "email",
                      type: "email",
                      style: { display: "none" },
                      placeholder: "Enter Email Address",
                    }),
                  },
                  {
                    el: new Element({
                      tag: "button",
                      id: "ARC_EmailSubmitBtn",
                      innerHTML: "Send",
                      className: "control-panel-btn",
                      style: { display: "none" },
                      onclick: clickEmailSubmitButton,
                    }),
                  },
                  {
                    el: new Element({
                      tag: "button",
                      id: "ARC_LightboxEmail",
                      innerHTML: "Email",
                      className: "control-panel-btn",
                      onclick: clickEmailButton,
                    }),
                  },
                  {
                    el: new Element({
                      tag: "a",
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

const clickExitButton = () => {
  removeEl(document.getElementById("ARC_Overlay"));
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
    tag: "div",
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

export { overlay };
